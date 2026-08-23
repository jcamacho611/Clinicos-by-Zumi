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
import {
  evaluateSmsQuietHours,
  patientSmsTemplate,
  type PatientSmsTemplateId,
} from "@/lib/communications/sms-templates";
import { getTwilioSmsRoutingConfig } from "@/lib/communications/twilio-integration";
import {
  tenantVariableSpendFundingReady,
  variableCostRailPolicy,
} from "@/lib/commercial/variable-cost-rail-registry";

type StaffEditableSmsMessageClass = Exclude<SmsMessageClass, "clinical">;
type StaffSmsEvidenceSource = "patient_verbal" | "staff_documented";

function json(value: unknown) {
  return value as Prisma.InputJsonValue;
}

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
      patientId: input.patientId,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
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

/**
 * Staff may document limited consent evidence, but cannot create clinical permission or
 * self-authorize marketing. A staff-created "written evidence reference" is not proof
 * that the underlying patient artifact exists, so this route does not accept one as a
 * grant authority. Future patient-controlled/e-sign consent needs its own verified
 * evidence ceremony and can call a separate governed service.
 */
export async function recordPatientSmsPermission(input: {
  organizationId: string;
  patientId: string;
  actorId?: string | null;
  messageClass: StaffEditableSmsMessageClass;
  status: Exclude<SmsPermissionStatus, "unknown">;
  source: StaffSmsEvidenceSource;
  policyVersion?: string | null;
}) {
  if (input.status === "granted" && input.source !== "patient_verbal") {
    return { ok: false as const, reason: "invalid_evidence" as const };
  }
  if (input.messageClass === "marketing" && input.status === "granted") {
    return { ok: false as const, reason: "invalid_evidence" as const };
  }

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
        patientId: patient.id,
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

/** Record phone possession only from a successful patient-controlled Twilio Verify ceremony. */
export async function recordPatientPhoneVerification(input: {
  organizationId: string;
  patientId: string;
  actorId: string;
  actorType: "patient";
  source: "twilio_verify";
  providerReference: string;
  verifiedAt?: string;
}) {
  if (!/^VE[0-9a-fA-F]{32}$/.test(input.providerReference)) {
    return { ok: false as const, reason: "invalid_provider_evidence" as const };
  }

  const patient = await patientForSms(input.organizationId, input.patientId);
  if (!patient) return { ok: false as const, reason: "patient_not_found" as const };
  const normalizedPhone = patient.phone ? normalizeSmsPhone(patient.phone) : null;
  if (!normalizedPhone) return { ok: false as const, reason: "invalid_phone" as const };

  const current = readSmsPreferences(patient.communicationPrefs);
  const next = writeSmsPreferences(patient.communicationPrefs, {
    ...current,
    endpoint: {
      normalizedPhone,
      verifiedAt: input.verifiedAt ?? new Date().toISOString(),
      verificationSource: input.source,
      verificationProviderReference: input.providerReference,
    },
  });

  await db.$transaction([
    db.patient.update({ where: { id: patient.id }, data: { communicationPrefs: json(next) } }),
    db.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId,
        actorType: input.actorType,
        action: "communications.sms.phone.verified",
        resourceType: "patient",
        resourceId: patient.id,
        patientId: patient.id,
        metadata: {
          channel: "sms",
          source: input.source,
          providerReference: input.providerReference,
          phoneLast4: normalizedPhone.slice(-4),
          consentGranted: false,
        },
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
        patientId: patient.id,
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
        | "template_not_allowed"
        | "phone_not_verified"
        | "production_disabled"
        | "routing_not_configured"
        | "routing_not_provider_verified"
        | "invalid_timezone"
        | "quiet_hours"
        | "commercial_funding_not_ready"
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

/**
 * Canonical patient SMS send. The caller chooses only a server-owned template ID; every
 * consequential authority remains server-side and fail-closed.
 */
export async function sendAuthorizedPatientSmsTemplate(input: {
  organizationId: string;
  patientId: string;
  actorId?: string | null;
  templateId: PatientSmsTemplateId;
  now?: Date;
  env?: OutboundEnv;
}): Promise<PatientSmsSendResult> {
  const template = patientSmsTemplate(input.templateId);
  if (!template || template.phiApproved !== false) {
    return { ok: false, reason: "template_not_allowed", detail: "SMS template is not approved for the fixed non-PHI patient rail." };
  }

  const patient = await patientForSms(input.organizationId, input.patientId);
  if (!patient) return { ok: false, reason: "patient_not_found", detail: "Patient was not found in this organization." };
  if (!patient.phone) return { ok: false, reason: "missing_phone", detail: "Patient has no phone number." };

  const decision = evaluateSmsPermission({
    communicationPrefs: patient.communicationPrefs,
    phone: patient.phone,
    messageClass: template.messageClass,
    containsPhi: false,
  });
  if (!decision.allowed) {
    await audit({
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: "communications.sms.send.blocked",
      patientId: patient.id,
      metadata: { channel: "sms", templateId: template.id, messageClass: template.messageClass, reason: decision.reason, containsPhi: false },
    });
    return { ok: false as const, reason: decision.reason, detail: decision.detail };
  }

  const smsState = readSmsPreferences(patient.communicationPrefs);
  const verification = smsState.endpoint;
  if (
    !verification?.verifiedAt
    || verification.normalizedPhone !== decision.normalizedPhone
    || verification.verificationSource !== "twilio_verify"
    || !verification.verificationProviderReference
    || !/^VE[0-9a-fA-F]{32}$/.test(verification.verificationProviderReference)
  ) {
    await audit({
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: "communications.sms.send.blocked",
      patientId: patient.id,
      metadata: { channel: "sms", templateId: template.id, messageClass: template.messageClass, reason: "phone_not_verified" },
    });
    return { ok: false, reason: "phone_not_verified", detail: "The patient's current phone number must be verified through the patient-controlled verification flow before SMS can send." };
  }

  const env = input.env ?? process.env;
  if (env.KLINIKOS_SMS_PRODUCTION_ENABLED?.trim().toLowerCase() !== "true") {
    await audit({
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: "communications.sms.send.blocked",
      patientId: patient.id,
      metadata: { channel: "sms", templateId: template.id, messageClass: template.messageClass, reason: "production_disabled" },
    });
    return { ok: false, reason: "production_disabled", detail: "Production patient SMS remains disabled until controlled live proof is complete." };
  }

  const integration = await getTwilioSmsRoutingConfig(input.organizationId);
  const routing = integration?.routing;
  if (!routing?.senderPhone || !routing.messagingServiceSid || !routing.inboundEnabled || !routing.timeZone) {
    await audit({
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: "communications.sms.send.blocked",
      patientId: patient.id,
      metadata: { channel: "sms", templateId: template.id, messageClass: template.messageClass, reason: "routing_not_configured" },
    });
    return { ok: false, reason: "routing_not_configured", detail: "Tenant sender, Messaging Service, inbound STOP routing, and timezone must be configured before patient SMS." };
  }

  if (
    !routing.providerVerifiedAt
    || !routing.providerPhoneNumberSid
    || !/^PN[0-9a-fA-F]{32}$/.test(routing.providerPhoneNumberSid)
    || !routing.providerMessagingServiceSid
    || routing.providerMessagingServiceSid !== routing.messagingServiceSid
  ) {
    await audit({
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: "communications.sms.send.blocked",
      patientId: patient.id,
      metadata: { channel: "sms", templateId: template.id, messageClass: template.messageClass, reason: "routing_not_provider_verified" },
    });
    return { ok: false, reason: "routing_not_provider_verified", detail: "Twilio must verify the tenant sender and Messaging Service relationship before patient SMS can send." };
  }

  const quietHours = evaluateSmsQuietHours({ timeZone: routing.timeZone, now: input.now });
  if (!quietHours.allowed) {
    const reason = quietHours.reason === "quiet_hours" ? "quiet_hours" : "invalid_timezone";
    await audit({
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: "communications.sms.send.blocked",
      patientId: patient.id,
      metadata: { channel: "sms", templateId: template.id, messageClass: template.messageClass, reason },
    });
    return {
      ok: false,
      reason,
      detail: reason === "quiet_hours"
        ? "Ordinary patient SMS is held outside 09:00-20:00 recipient-local time."
        : "Tenant SMS timezone is invalid.",
    };
  }

  const economicPolicy = variableCostRailPolicy("patient_sms");
  if (!economicPolicy || !tenantVariableSpendFundingReady(economicPolicy)) {
    await audit({
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: "communications.sms.send.blocked",
      patientId: patient.id,
      metadata: {
        channel: "sms",
        templateId: template.id,
        messageClass: template.messageClass,
        reason: "commercial_funding_not_ready",
        economicPolicy: economicPolicy?.economicReadiness ?? "missing",
      },
    });
    return {
      ok: false,
      reason: "commercial_funding_not_ready",
      detail: "Patient SMS remains disabled until the durable tenant micro-funding reservation and reconciliation authority is live.",
    };
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
      ? {
          channel: "sms",
          templateId: template.id,
          messageClass: template.messageClass,
          provider: result.provider,
          providerReference: result.providerReference,
          routingProviderVerified: true,
        }
      : { channel: "sms", templateId: template.id, messageClass: template.messageClass, reason: result.reason },
  });

  return result;
}
