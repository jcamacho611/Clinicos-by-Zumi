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

  // Routing metadata is not a secret, but the sender is a tenancy boundary. Refuse to
  // configure one public sender for two organizations. This is checked again at webhook
  // resolution time, which also fails closed if legacy data contains a duplicate.
  const existingTwilio = await db.integration.findMany({
    where: { type: "communications", vendor: "Twilio", NOT: { organizationId: input.organizationId } },
    select: { organizationId: true, config: true },
  });
  const conflict = existingTwilio.find((row) => readTwilioSmsRoutingConfig(row.config)?.senderPhone === senderPhone);
  if (conflict) return { ok: false as const, reason: "sender_already_assigned" as const };

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

  const rows = await db.integration.findMany({
    where: { type: "communications", vendor: "Twilio" },
    select: { id: true, organizationId: true, config: true },
  });
  const matches = rows.filter((row) => {
    const routing = readTwilioSmsRoutingConfig(row.config);
    if (!routing?.inboundEnabled || routing.senderPhone !== senderPhone) return false;
    if (routing.messagingServiceSid && serviceSid && routing.messagingServiceSid !== serviceSid) return false;
    if (routing.messagingServiceSid && !serviceSid) return false;
    return true;
  });

  if (matches.length === 0) return { ok: false as const, reason: "unmapped_destination" as const };
  if (matches.length !== 1) return { ok: false as const, reason: "ambiguous_destination" as const };
  return { ok: true as const, organizationId: matches[0].organizationId, integrationId: matches[0].id, senderPhone };
}
