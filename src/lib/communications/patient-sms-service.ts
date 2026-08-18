import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { deliverOutbound, type OutboundEnv } from "@/lib/communications/outbound";
import {
  evaluateSmsPermission,
  normalizeSmsPhone,
  readSmsPreferences,
  setSmsPermission,
  suppressSms,
  writeSmsPreferences,
  type SmsMessageClass,
  type SmsPermissionStatus,
} from "@/lib/communications/sms-policy";
import { evaluateSmsQuietHours, patientSmsTemplate, type PatientSmsTemplateId } from "@/lib/communications/sms-templates";
import { getTwilioSmsRoutingConfig } from "@/lib/communications/twilio-integration";

function json(value: unknown) {
  return value as Prisma.InputJsonValue;
}

type EditableSmsMessageClass = Exclude<SmsMessageClass, "clinical">;
type StaffConsentSource = "patient_verbal" | "staff_documented";

async function patientForSms(organizationId: string, patientId: string) {
  return db.patient.findFirst({
    where: { id: patientId, organizationId },
    select: { id: true, phone: true, communicationPrefs: true },
  });
}

async function audit(input: {
  organizationId: string;
  actorId?: string | null;
  action: string;
  patientId: string;
  metadata?: Record<string, unknown>;
}) {
  await db.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.actorId ?? null,
      actorType: input.actorId ? "user" : "system",
      action: input.action,
      resourceType: "patient",
      resourceId: input.patientId,
      metadata: input.metadata ?? {},
    },
  });
}

export async function getPatientSmsState(input: { organizationId: string; patientId: string }) {
  const patient = await patientForSms(input.organizationId, input.patientId);
  if (!patient) return null;
  return {
    patientId: patient.id,
    normalizedPhone: patient.phone ? normalizeSmsPhone(patient.phone) : null,
    sms: readSmsPreferences(patient.communicationPrefs),
  };
}

export async function recordPatientSmsPermission(input: {
  organizationId: string;
  patientId: string;
  actorId?: string | null;
  messageClass: EditableSmsMessageClass;
  status: Exclude<SmsPermissionStatus, "unknown">;
  source: StaffConsentSource;
  policyVersion?: string | null;
}) {
  if (input.status === "granted" && input.source !== "patient_verbal") return { ok: false as const, reason: "invalid_evidence" as const };
  if (input.messageClass === "marketing" && input.status === "granted") return { ok: false as const, reason: "invalid_evidence" as const };

  const patient = await patientForSms(input.organizationId, input.patientId);
  if (!patient) return { ok: false as const, reason: "patient_not_found" as const };
  const next = setSmsPermission({
    communicationPrefs: patient.communicationPrefs,
    messageClass: input.messageClass,
    status: input.status,
    source: input.source,
    actorId: input.actorId ?? null,
    policyVersion: input.policyVersion ?? null,
    evidenceReference: null,
  });

  await db.$transaction([
    db.patient.update({ where: { id: patient.id }, data: { communicationPrefs: json(next), updatedBy: input.actorId ?? undefined } }),
    db.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId ?? null,
        actorType: input.actorId ? "user" : "system",
        action: "communications.sms.permission.changed",
        resourceType: "patient",
        resourceId: patient.id,
        metadata: {
          channel: "sms",
          messageClass: input.messageClass,
          status: input.status,
          source: input.source,
          policyVersion: input.policyVersion ?? null,
          evidenceReferenceAccepted: false,
        },
      },
    }),
  ]);
  return { ok: true as const, sms: readSmsPreferences(next) };
}

export async function recordPatientPhoneVerification(input: {
  organizationId: string;
  patientId: string;
  actorId?: string | null;
  source: "twilio_verify" | "patient_portal_verified";
  verifiedAt?: string;
}) {
  const patient = await patientForSms(input.organizationId, input.patientId);
  if (!patient) return { ok: false as const, reason: "patient_not_found" as const };
  const normalizedPhone = patient.phone ? normalizeSmsPhone(patient.phone) : null;
  if (!normalizedPhone) return { ok: false as const, reason: "invalid_phone" as const };
  const current = readSmsPreferences(patient.communicationPrefs);
  const next = writeSmsPreferences(patient.communicationPrefs, {
    ...current,
    endpoint: { normalizedPhone, verifiedAt: input.verifiedAt ?? new Date().toISOString(), verificationSource: input.source },
  });
  await db.$transaction([
    db.patient.update({ where: { id: patient.id }, data: { communicationPrefs: json(next), updatedBy: input.actorId ?? undefined } }),
    db.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId ?? null,
        actorType: input.actorId ? "user" : "system",
        action: "communications.sms.phone.verified",
        resourceType: "patient",
        resourceId: patient.id,
        metadata: { channel: "sms", source: input.source, consentGranted: false },
      },
    }),
  ]);
  return { ok: true as const, normalizedPhone };
}

export async function suppressPatientSms(input: {
  organizationId: string;
  patientId: string;
  actorId?: string | null;
  reason: string;
  eventId?: string | null;
}) {
  const patient = await patientForSms(input.organizationId, input.patientId);
  if (!patient) return { ok: false as const, reason: "patient_not_found" as const };
  const next = suppressSms({ communicationPrefs: patient.communicationPrefs, reason: input.reason, eventId: input.eventId ?? null });
  await db.$transaction([
    db.patient.update({ where: { id: patient.id }, data: { communicationPrefs: json(next), updatedBy: input.actorId ?? undefined } }),
    db.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId ?? null,
        actorType: input.actorId ? "user" : "system",
        action: "communications.sms.suppressed",
        resourceType: "patient",
        resourceId: patient.id,
        metadata: { channel: "sms", reason: input.reason, providerEventId: input.eventId ?? null },
      },
    }),
  ]);
  return { ok: true as const };
}

export type PatientSmsSendResult =
  | { ok: true; provider: string; providerReference: string }
  | {
      ok: false;
      reason:
        | "patient_not_found"
        | "missing_phone"
        | "phone_not_verified"
        | "template_not_allowed"
        | "production_disabled"
        | "routing_not_configured"
        | "routing_not_provider_verified"
        | "invalid_timezone"
        | "quiet_hours"
        | "invalid_recipient"
        | "permission_missing"
        | "permission_denied"
        | "suppressed"
        | "clinical_sms_blocked"
        | "no_connector"
        | "no_sender"
        | "provider_error";
      detail: string;
    };

export async function sendAuthorizedPatientSmsTemplate(input: {
  organizationId: string;
  patientId: string;
  actorId?: string | null;
  templateId: PatientSmsTemplateId;
  now?: Date;
  env?: OutboundEnv;
}): Promise<PatientSmsSendResult> {
  const template = patientSmsTemplate(input.templateId);
  if (!template || template.phiApproved !== false) return { ok: false, reason: "template_not_allowed", detail: "SMS template is not approved for the non-PHI patient rail." };

  const patient = await patientForSms(input.organizationId, input.patientId);
  if (!patient) return { ok: false, reason: "patient_not_found", detail: "Patient was not found in this organization." };
  if (!patient.phone) return { ok: false, reason: "missing_phone", detail: "Patient has no phone number." };

  const decision = evaluateSmsPermission({ communicationPrefs: patient.communicationPrefs, phone: patient.phone, messageClass: template.messageClass, containsPhi: false });
  if (!decision.allowed) {
    await audit({ organizationId: input.organizationId, actorId: input.actorId, action: "communications.sms.send.blocked", patientId: patient.id, metadata: { channel: "sms", messageClass: template.messageClass, templateId: template.id, reason: decision.reason } });
    return decision;
  }

  const smsState = readSmsPreferences(patient.communicationPrefs);
  const verification = smsState.endpoint;
  if (!verification?.verifiedAt || verification.normalizedPhone !== decision.normalizedPhone) {
    await audit({ organizationId: input.organizationId, actorId: input.actorId, action: "communications.sms.send.blocked", patientId: patient.id, metadata: { channel: "sms", messageClass: template.messageClass, templateId: template.id, reason: "phone_not_verified" } });
    return { ok: false, reason: "phone_not_verified", detail: "The patient's current phone number must be verified before Klinikos can send SMS." };
  }

  const env = input.env ?? process.env;
  if (env.KLINIKOS_SMS_PRODUCTION_ENABLED?.trim().toLowerCase() !== "true") {
    await audit({ organizationId: input.organizationId, actorId: input.actorId, action: "communications.sms.send.blocked", patientId: patient.id, metadata: { channel: "sms", messageClass: template.messageClass, templateId: template.id, reason: "production_disabled" } });
    return { ok: false, reason: "production_disabled", detail: "Production SMS is disabled until controlled live proof is complete." };
  }

  const integration = await getTwilioSmsRoutingConfig(input.organizationId);
  const routing = integration?.routing;
  if (!routing?.senderPhone || !routing.messagingServiceSid || !routing.inboundEnabled || !routing.timeZone) {
    return { ok: false, reason: "routing_not_configured", detail: "Tenant sender, Messaging Service, inbound STOP routing, and timezone must be configured before outbound patient SMS." };
  }
  if (!routing.providerVerifiedAt || !routing.providerPhoneNumberSid || routing.providerMessagingServiceSid !== routing.messagingServiceSid) {
    return { ok: false, reason: "routing_not_provider_verified", detail: "Twilio must verify that the tenant sender is owned by the platform account and belongs to the configured Messaging Service before patient SMS can send." };
  }

  const quietHours = evaluateSmsQuietHours({ timeZone: routing.timeZone, now: input.now });
  if (!quietHours.allowed) {
    const reason = quietHours.reason === "quiet_hours" ? "quiet_hours" : "invalid_timezone";
    await audit({ organizationId: input.organizationId, actorId: input.actorId, action: "communications.sms.send.blocked", patientId: patient.id, metadata: { channel: "sms", messageClass: template.messageClass, templateId: template.id, reason } });
    return { ok: false, reason, detail: reason === "quiet_hours" ? "Klinikos ordinary SMS is held outside 09:00-20:00 recipient-local time." : "Tenant SMS timezone is invalid." };
  }

  const result = await deliverOutbound({
    channel: "sms",
    to: decision.normalizedPhone,
    sender: routing.senderPhone,
    messagingServiceSid: routing.messagingServiceSid,
    subject: template.subject,
    body: template.body,
  }, env);

  await audit({
    organizationId: input.organizationId,
    actorId: input.actorId,
    action: result.ok ? "communications.sms.send.accepted" : "communications.sms.send.failed",
    patientId: patient.id,
    metadata: result.ok
      ? { channel: "sms", messageClass: template.messageClass, templateId: template.id, provider: result.provider, providerReference: result.providerReference, messagingServiceSid: routing.messagingServiceSid }
      : { channel: "sms", messageClass: template.messageClass, templateId: template.id, reason: result.reason },
  });
  return result;
}
