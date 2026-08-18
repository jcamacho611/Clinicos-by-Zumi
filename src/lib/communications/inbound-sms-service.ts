import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  hasProcessedInboundSmsEvent,
  normalizeSmsPhone,
  readSmsPreferences,
  resumeSms,
  suppressSms,
  writeSmsPreferences,
} from "@/lib/communications/sms-policy";
import { classifySignedTwilioOptOut } from "@/lib/communications/twilio-webhook";

function json(value: unknown) {
  return value as Prisma.InputJsonValue;
}

async function auditIntegrationEvent(input: {
  organizationId: string;
  integrationId: string;
  action: string;
  patientId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: null,
      actorType: "system",
      action: input.action,
      resourceType: input.patientId ? "patient" : "integration",
      resourceId: input.patientId ?? input.integrationId,
      patientId: input.patientId ?? undefined,
      metadata: input.metadata ?? {},
    },
  });
}

async function resolvePatientByInboundPhone(organizationId: string, from: string) {
  const normalizedPhone = normalizeSmsPhone(from);
  if (!normalizedPhone) return { ok: false as const, reason: "invalid_source" as const };

  // Match the same conservative normalization rule used by the product policy without
  // requiring a new indexed column in this slice. Limit 2 is deliberate: duplicates
  // fail closed rather than choosing a patient by query order.
  const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
      FROM "patients"
     WHERE "organizationId" = ${organizationId}
       AND "phone" IS NOT NULL
       AND (
         CASE
           WHEN LEFT(TRIM("phone"), 1) = '+' THEN
             '+' || regexp_replace(SUBSTRING(TRIM("phone") FROM 2), '[^0-9]', '', 'g')
           WHEN regexp_replace(TRIM("phone"), '[^0-9]', '', 'g') ~ '^[0-9]{10}$' THEN
             '+1' || regexp_replace(TRIM("phone"), '[^0-9]', '', 'g')
           ELSE NULL
         END
       ) = ${normalizedPhone}
     LIMIT 2
  `);

  if (rows.length === 0) return { ok: false as const, reason: "patient_not_found" as const };
  if (rows.length !== 1) return { ok: false as const, reason: "ambiguous_patient" as const };
  return { ok: true as const, patientId: rows[0].id, normalizedPhone };
}

export async function processInboundPatientSms(input: {
  organizationId: string;
  integrationId: string;
  from: string;
  messageSid: string;
  body: string;
  optOutType?: string | null;
}) {
  const resolved = await resolvePatientByInboundPhone(input.organizationId, input.from);
  if (!resolved.ok) {
    await auditIntegrationEvent({
      organizationId: input.organizationId,
      integrationId: input.integrationId,
      action: `communications.sms.inbound.${resolved.reason}`,
      metadata: { provider: "twilio", providerEventId: input.messageSid, bodyStored: false },
    });
    return resolved;
  }

  const command = classifySignedTwilioOptOut({ optOutType: input.optOutType, body: input.body });

  return db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{ id: string; communicationPrefs: Prisma.JsonValue | null }>>(Prisma.sql`
      SELECT "id", "communicationPrefs"
        FROM "patients"
       WHERE "id" = ${resolved.patientId}
         AND "organizationId" = ${input.organizationId}
       LIMIT 1
       FOR UPDATE
    `);
    const patient = locked[0];
    if (!patient) return { ok: false as const, reason: "patient_not_found" as const };

    const durableReplay = await tx.integrationEvent.findFirst({
      where: {
        organizationId: input.organizationId,
        integrationId: input.integrationId,
        resourceType: "twilio_message",
        resourceId: input.messageSid,
        eventType: "sms.inbound",
      },
      select: { id: true },
    });
    if (durableReplay || hasProcessedInboundSmsEvent(patient.communicationPrefs, input.messageSid)) {
      return { ok: true as const, state: "duplicate" as const, command };
    }

    let nextPrefs: unknown;
    if (command === "stop") {
      nextPrefs = suppressSms({
        communicationPrefs: patient.communicationPrefs,
        reason: "recipient_opt_out",
        eventId: input.messageSid,
      });
    } else if (command === "start") {
      // START removes the suppression state only. It does not invent transactional,
      // operational, marketing or clinical consent that is not already recorded.
      nextPrefs = resumeSms({ communicationPrefs: patient.communicationPrefs, eventId: input.messageSid });
    } else {
      const sms = readSmsPreferences(patient.communicationPrefs);
      const recent = new Set(sms.recentInboundEventIds ?? []);
      recent.add(input.messageSid);
      nextPrefs = writeSmsPreferences(patient.communicationPrefs, {
        ...sms,
        recentInboundEventIds: Array.from(recent).slice(-50),
      });
    }

    await tx.patient.update({ where: { id: patient.id }, data: { communicationPrefs: json(nextPrefs) } });
    await tx.integrationEvent.create({
      data: {
        organizationId: input.organizationId,
        integrationId: input.integrationId,
        resourceType: "twilio_message",
        resourceId: input.messageSid,
        direction: "inbound",
        eventType: "sms.inbound",
        status: "processed",
        metadata: {
          provider: "twilio",
          patientId: patient.id,
          command,
          bodyStored: false,
          consentGranted: false,
        },
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: null,
        actorType: "system",
        action: `communications.sms.inbound.${command}`,
        resourceType: "patient",
        resourceId: patient.id,
        patientId: patient.id,
        metadata: {
          provider: "twilio",
          providerEventId: input.messageSid,
          command,
          suppressionApplied: command === "stop",
          suppressionRemoved: command === "start",
          consentGranted: false,
          bodyStored: false,
          integrationId: input.integrationId,
        },
      },
    });

    return {
      ok: true as const,
      state: command === "stop" ? "suppressed" as const : command === "start" ? "resumed" as const : "recorded" as const,
      command,
    };
  });
}
