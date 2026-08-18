import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeSmsPhone } from "@/lib/communications/sms-policy";

export type TwilioSmsRoutingConfig = {
  senderPhone: string;
  messagingServiceSid?: string | null;
  inboundEnabled: boolean;
  configuredAt?: string | null;
  configuredBy?: string | null;
};

type IntegrationConfigRecord = Record<string, unknown> & {
  sms?: Partial<TwilioSmsRoutingConfig>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseConfig(value: unknown): IntegrationConfigRecord {
  return isRecord(value) ? value : {};
}

export function readTwilioSmsRoutingConfig(value: unknown): TwilioSmsRoutingConfig | null {
  const config = parseConfig(value);
  if (!isRecord(config.sms)) return null;
  const senderPhone = typeof config.sms.senderPhone === "string" ? normalizeSmsPhone(config.sms.senderPhone) : null;
  if (!senderPhone) return null;
  const sid = typeof config.sms.messagingServiceSid === "string" ? config.sms.messagingServiceSid.trim() : "";
  if (sid && !/^MG[A-Za-z0-9]{8,}$/.test(sid)) return null;
  return {
    senderPhone,
    messagingServiceSid: sid || null,
    inboundEnabled: config.sms.inboundEnabled === true,
    configuredAt: typeof config.sms.configuredAt === "string" ? config.sms.configuredAt : null,
    configuredBy: typeof config.sms.configuredBy === "string" ? config.sms.configuredBy : null,
  };
}

export async function getTwilioSmsRoutingConfig(organizationId: string) {
  const integration = await db.integration.findFirst({
    where: { organizationId, type: "communications", vendor: "Twilio" },
    select: { id: true, status: true, config: true },
  });
  if (!integration) return null;
  return { integrationId: integration.id, integrationStatus: integration.status, routing: readTwilioSmsRoutingConfig(integration.config) };
}

export async function configureTwilioSmsRouting(input: {
  organizationId: string;
  actorId: string;
  senderPhone: string;
  messagingServiceSid?: string | null;
  inboundEnabled: boolean;
}) {
  const senderPhone = normalizeSmsPhone(input.senderPhone);
  if (!senderPhone) return { ok: false as const, reason: "invalid_sender" as const };
  const messagingServiceSid = input.messagingServiceSid?.trim() || null;
  if (messagingServiceSid && !/^MG[A-Za-z0-9]{8,}$/.test(messagingServiceSid)) {
    return { ok: false as const, reason: "invalid_messaging_service_sid" as const };
  }

  // The sender is a tenancy boundary. Refuse to assign the same normalized destination
  // to a second organization. The webhook resolver repeats this uniqueness check and
  // fails closed if legacy/manual data ever violates the rule.
  const conflict = await db.$queryRaw<Array<{ organizationId: string }>>(Prisma.sql`
    SELECT "organizationId"
      FROM "integrations"
     WHERE "type" = 'communications'
       AND "vendor" = 'Twilio'
       AND "organizationId" <> ${input.organizationId}
       AND "config"->'sms'->>'senderPhone' = ${senderPhone}
     LIMIT 1
  `);
  if (conflict[0]) return { ok: false as const, reason: "sender_already_assigned" as const };

  const configuredAt = new Date().toISOString();
  return db.$transaction(async (tx) => {
    const current = await tx.integration.findFirst({
      where: { organizationId: input.organizationId, type: "communications", vendor: "Twilio" },
      select: { id: true, config: true },
    });
    const currentConfig = parseConfig(current?.config);
    const nextConfig = {
      ...currentConfig,
      sms: {
        senderPhone,
        messagingServiceSid,
        inboundEnabled: input.inboundEnabled,
        configuredAt,
        configuredBy: input.actorId,
      },
    } as Prisma.InputJsonValue;

    const integration = current
      ? await tx.integration.update({ where: { id: current.id }, data: { config: nextConfig } })
      : await tx.integration.create({
          data: {
            organizationId: input.organizationId,
            type: "communications",
            vendor: "Twilio",
            status: "pending_connection",
            riskLevel: "high",
            baaRequired: true,
            phase: "Routing configured; credentials, policy, BAA and live verification remain separate gates",
            config: nextConfig,
          },
        });

    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId,
        actorType: "user",
        action: "communications.twilio.sms_routing.configured",
        resourceType: "integration",
        resourceId: integration.id,
        metadata: {
          inboundEnabled: input.inboundEnabled,
          hasMessagingServiceSid: Boolean(messagingServiceSid),
          senderLast4: senderPhone.slice(-4),
          credentialsChanged: false,
          consentPolicyChanged: false,
        },
      },
    });

    return { ok: true as const, integrationId: integration.id, routing: readTwilioSmsRoutingConfig(nextConfig) };
  });
}

export async function resolveInboundTwilioOrganization(input: {
  to: string;
  messagingServiceSid?: string | null;
}) {
  const senderPhone = normalizeSmsPhone(input.to);
  if (!senderPhone) return { ok: false as const, reason: "invalid_destination" as const };
  const serviceSid = input.messagingServiceSid?.trim() || null;

  const rows = await db.$queryRaw<Array<{ id: string; organizationId: string; config: Prisma.JsonValue | null }>>(Prisma.sql`
    SELECT "id", "organizationId", "config"
      FROM "integrations"
     WHERE "type" = 'communications'
       AND "vendor" = 'Twilio'
       AND "config"->'sms'->>'senderPhone' = ${senderPhone}
       AND COALESCE("config"->'sms'->>'inboundEnabled', 'false') = 'true'
     LIMIT 2
  `);

  if (rows.length === 0) return { ok: false as const, reason: "unmapped_destination" as const };
  if (rows.length !== 1) return { ok: false as const, reason: "ambiguous_destination" as const };

  const routing = readTwilioSmsRoutingConfig(rows[0].config);
  if (!routing?.inboundEnabled) return { ok: false as const, reason: "unmapped_destination" as const };
  if (routing.messagingServiceSid && routing.messagingServiceSid !== serviceSid) {
    return { ok: false as const, reason: "messaging_service_mismatch" as const };
  }

  return { ok: true as const, organizationId: rows[0].organizationId, integrationId: rows[0].id, senderPhone };
}
