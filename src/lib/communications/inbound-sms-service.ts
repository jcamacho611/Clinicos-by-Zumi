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

type LockedPatientSmsRow = {
  id: string;
  communicationPrefs: Prisma.JsonValue | null;
};

async function lockPatientsByPhone(
  tx: Prisma.TransactionClient,
  organizationId: string,
  normalizedPhone: string,
) {
  return tx.$queryRaw<Array<LockedPatientSmsRow>>(Prisma.sql`
    SELECT "id", "communicationPrefs"
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
     ORDER BY "id"
     FOR UPDATE
  `);
}

export async function processInboundPatientSms(input: {
  organizationId: string;
  integrationId: string;
  from: string;
  messageSid: string;
  body: string;
  optOutType?: string | null;
}) {
  const normalizedPhone = normalizeSmsPhone(input.from);
  const command = classifySignedTwilioOptOut({ optOutType: input.optOutType, body: input.body });

  return db.$transaction(async (tx) => {
    // MessageSid is the provider event identity. Serialize the whole event before the
    // replay check so concurrent retries cannot both mutate patient state.
    await tx.$queryRaw<Array<{ pg_advisory_xact_lock: unknown }>>(Prisma.sql`
      SELECT pg_advisory_xact_lock(hashtextextended(${input.messageSid}, 0))
    `);

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
    if (durableReplay) return { ok: true as const, state: "duplicate" as const, command };

    if (!normalizedPhone) {
      await tx.integrationEvent.create({
        data: {
          organizationId: input.organizationId,
          integrationId: input.integrationId,
          resourceType: "twilio_message",
          resourceId: input.messageSid,
          direction: "inbound",
          eventType: "sms.inbound",
          status: "ignored",
          metadata: { provider: "twilio", command, reason: "invalid_source", bodyStored: false, consentGranted: false },
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          actorId: null,
          actorType: "system",
          action: "communications.sms.inbound.invalid_source",
          resourceType: "integration",
          resourceId: input.integrationId,
          metadata: { provider: "twilio", providerEventId: input.messageSid, bodyStored: false },
        },
      });
      return { ok: false as const, reason: "invalid_source" as const };
    }

    const patients = await lockPatientsByPhone(tx, input.organizationId, normalizedPhone);

    if (patients.length === 0) {
      await tx.integrationEvent.create({
        data: {
          organizationId: input.organizationId,
          integrationId: input.integrationId,
          resourceType: "twilio_message",
          resourceId: input.messageSid,
          direction: "inbound",
          eventType: "sms.inbound",
          status: "ignored",
          metadata: { provider: "twilio", command, reason: "patient_not_found", bodyStored: false, consentGranted: false },
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          actorId: null,
          actorType: "system",
          action: "communications.sms.inbound.patient_not_found",
          resourceType: "integration",
          resourceId: input.integrationId,
          metadata: { provider: "twilio", providerEventId: input.messageSid, bodyStored: false },
        },
      });
      return { ok: false as const, reason: "patient_not_found" as const };
    }

    // STOP and START are endpoint-level suppression events, not patient-identity claims.
    // A shared family phone must never let Klinikos route around an opt-out through a
    // second chart. Apply suppression/resume to every matching patient in this tenant.
    if (command === "stop" || command === "start") {
      for (const patient of patients) {
        const nextPrefs = command === "stop"
          ? suppressSms({ communicationPrefs: patient.communicationPrefs, reason: "recipient_opt_out", eventId: input.messageSid })
          : resumeSms({ communicationPrefs: patient.communicationPrefs, eventId: input.messageSid });
        await tx.patient.update({ where: { id: patient.id }, data: { communicationPrefs: json(nextPrefs) } });
      }

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
            command,
            affectedPatientCount: patients.length,
            endpointScoped: true,
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
          resourceType: "integration",
          resourceId: input.integrationId,
          metadata: {
            provider: "twilio",
            providerEventId: input.messageSid,
            command,
            affectedPatientCount: patients.length,
            endpointScoped: true,
            suppressionApplied: command === "stop",
            suppressionRemoved: command === "start",
            consentGranted: false,
            bodyStored: false,
          },
        },
      });

      return {
        ok: true as const,
        state: command === "stop" ? "suppressed" as const : "resumed" as const,
        command,
        affectedPatientCount: patients.length,
      };
    }

    // Ordinary inbound text still requires exact patient identity. Shared numbers are
    // intentionally ambiguous for message attachment and therefore cause no chart mutation.
    if (patients.length !== 1) {
      await tx.integrationEvent.create({
        data: {
          organizationId: input.organizationId,
          integrationId: input.integrationId,
          resourceType: "twilio_message",
          resourceId: input.messageSid,
          direction: "inbound",
          eventType: "sms.inbound",
          status: "ignored",
          metadata: {
            provider: "twilio",
            command,
            reason: "ambiguous_patient",
            matchingPatientCount: patients.length,
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
          action: "communications.sms.inbound.ambiguous_patient",
          resourceType: "integration",
          resourceId: input.integrationId,
          metadata: { provider: "twilio", providerEventId: input.messageSid, matchingPatientCount: patients.length, bodyStored: false },
        },
      });
      return { ok: false as const, reason: "ambiguous_patient" as const };
    }

    const patient = patients[0];
    if (hasProcessedInboundSmsEvent(patient.communicationPrefs, input.messageSid)) {
      // The bounded patient cache is secondary defense for historical events whose
      // IntegrationEvent record may predate this durable replay path.
      await tx.integrationEvent.create({
        data: {
          organizationId: input.organizationId,
          integrationId: input.integrationId,
          resourceType: "twilio_message",
          resourceId: input.messageSid,
          direction: "inbound",
          eventType: "sms.inbound",
          status: "duplicate",
          metadata: { provider: "twilio", command, patientCacheReplay: true, bodyStored: false, consentGranted: false },
        },
      });
      return { ok: true as const, state: "duplicate" as const, command };
    }

    const sms = readSmsPreferences(patient.communicationPrefs);
    const recent = new Set(sms.recentInboundEventIds ?? []);
    recent.add(input.messageSid);
    const nextPrefs = writeSmsPreferences(patient.communicationPrefs, {
      ...sms,
      recentInboundEventIds: Array.from(recent).slice(-50),
    });
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
        metadata: { provider: "twilio", patientId: patient.id, command, bodyStored: false, consentGranted: false },
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
          consentGranted: false,
          bodyStored: false,
          integrationId: input.integrationId,
        },
      },
    });

    return { ok: true as const, state: "recorded" as const, command };
  });
}
