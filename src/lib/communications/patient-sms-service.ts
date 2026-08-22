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
  source: string;
  verifiedAt?: string;
}) {
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
    },
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

export async function sendAuthorizedPatientSms(input: {
  organizationId: string;
  patientId: string;
  actorId?: string | null;
  messageClass: SmsMessageClass;
  subject?: string;
  body: string;
  containsPhi?: boolean;
  env?: OutboundEnv;
}): Promise<PatientSmsSendResult> {
  const patient = await patientForSms(input.organizationId, input.patientId);
  if (!patient) return { ok: false, reason: "patient_not_found", detail: "Patient was not found in this organization." };
  if (!patient.phone) return { ok: false, reason: "missing_phone", detail: "Patient has no phone number." };

  const decision = evaluateSmsPermission({
    communicationPrefs: patient.communicationPrefs,
    phone: patient.phone,
    messageClass: input.messageClass,
    containsPhi: input.containsPhi,
  });

  if (!decision.allowed) {
    await audit({
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: "communications.sms.send.blocked",
      patientId: patient.id,
      metadata: { channel: "sms", messageClass: input.messageClass, reason: decision.reason, containsPhi: Boolean(input.containsPhi) },
    });
    return { ok: false as const, reason: decision.reason, detail: decision.detail };
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
        messageClass: input.messageClass,
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
    subject: input.subject ?? "Klinikos notification",
    body: input.body,
  }, input.env);

  await audit({
    organizationId: input.organizationId,
    actorId: input.actorId,
    action: result.ok ? "communications.sms.send.accepted" : "communications.sms.send.failed",
    patientId: patient.id,
    metadata: result.ok
      ? { channel: "sms", messageClass: input.messageClass, provider: result.provider, providerReference: result.providerReference }
      : { channel: "sms", messageClass: input.messageClass, reason: result.reason },
  });

  return result;
}
