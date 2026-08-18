import "server-only";

export const smsMessageClasses = ["transactional", "operational", "marketing", "clinical"] as const;
export type SmsMessageClass = (typeof smsMessageClasses)[number];
export type SmsPermissionStatus = "unknown" | "granted" | "denied" | "revoked";

export type SmsPermissionEvidence = {
  status: SmsPermissionStatus;
  source: string;
  capturedAt: string;
  actorId?: string | null;
  policyVersion?: string | null;
  evidenceReference?: string | null;
};

export type SmsPreferenceEnvelope = {
  version: 1;
  endpoint?: {
    normalizedPhone?: string | null;
    verifiedAt?: string | null;
    verificationSource?: string | null;
  };
  suppressedAt?: string | null;
  suppressionReason?: string | null;
  permissions: Partial<Record<SmsMessageClass, SmsPermissionEvidence>>;
  recentInboundEventIds?: string[];
};

export type CommunicationPrefsRecord = Record<string, unknown> & {
  klinikosSms?: SmsPreferenceEnvelope;
};

export type SmsPermissionDecision =
  | { allowed: true; normalizedPhone: string; evidence: SmsPermissionEvidence }
  | {
      allowed: false;
      reason:
        | "invalid_recipient"
        | "permission_missing"
        | "permission_denied"
        | "suppressed"
        | "clinical_sms_blocked";
      detail: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeSmsPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/[^0-9]/g, "");
    const normalized = `+${digits}`;
    return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null;
  }

  // Klinikos is currently US-first. A bare 10-digit number is normalized to +1.
  // Anything else must arrive in explicit E.164 form rather than guessing a country.
  const digits = trimmed.replace(/[^0-9]/g, "");
  if (/^\d{10}$/.test(digits)) return `+1${digits}`;
  return null;
}

export function readSmsPreferences(value: unknown): SmsPreferenceEnvelope {
  if (!isRecord(value) || !isRecord(value.klinikosSms) || value.klinikosSms.version !== 1) {
    return { version: 1, permissions: {}, recentInboundEventIds: [] };
  }

  const envelope = value.klinikosSms as unknown as SmsPreferenceEnvelope;
  return {
    version: 1,
    endpoint: envelope.endpoint,
    suppressedAt: envelope.suppressedAt ?? null,
    suppressionReason: envelope.suppressionReason ?? null,
    permissions: isRecord(envelope.permissions) ? envelope.permissions : {},
    recentInboundEventIds: Array.isArray(envelope.recentInboundEventIds)
      ? envelope.recentInboundEventIds.filter((item): item is string => typeof item === "string").slice(-50)
      : [],
  };
}

export function writeSmsPreferences(existing: unknown, sms: SmsPreferenceEnvelope): CommunicationPrefsRecord {
  const base = isRecord(existing) ? existing : {};
  return { ...base, klinikosSms: sms };
}

export function evaluateSmsPermission(input: {
  communicationPrefs: unknown;
  phone: string;
  messageClass: SmsMessageClass;
  containsPhi?: boolean;
}): SmsPermissionDecision {
  const normalizedPhone = normalizeSmsPhone(input.phone);
  if (!normalizedPhone) {
    return { allowed: false, reason: "invalid_recipient", detail: "SMS recipient must resolve to a valid E.164 phone number." };
  }

  // Clinical/PHI-bearing SMS remains independently fail-closed until the dedicated
  // BAA/security/minimum-necessary content gate is approved and implemented.
  if (input.containsPhi || input.messageClass === "clinical") {
    return { allowed: false, reason: "clinical_sms_blocked", detail: "Clinical or PHI-bearing SMS is not authorized by this communications policy." };
  }

  const sms = readSmsPreferences(input.communicationPrefs);
  if (sms.suppressedAt) {
    return { allowed: false, reason: "suppressed", detail: "This recipient is suppressed from ordinary product SMS." };
  }

  const evidence = sms.permissions[input.messageClass];
  if (!evidence || evidence.status === "unknown") {
    return { allowed: false, reason: "permission_missing", detail: `No explicit ${input.messageClass} SMS permission is recorded.` };
  }
  if (evidence.status !== "granted") {
    return { allowed: false, reason: "permission_denied", detail: `${input.messageClass} SMS permission is ${evidence.status}.` };
  }

  // Verification is intentionally separate from permission. A verified phone can be
  // useful evidence of possession but never creates operational or marketing consent.
  return { allowed: true, normalizedPhone, evidence };
}

export function setSmsPermission(input: {
  communicationPrefs: unknown;
  messageClass: SmsMessageClass;
  status: Exclude<SmsPermissionStatus, "unknown">;
  source: string;
  capturedAt?: string;
  actorId?: string | null;
  policyVersion?: string | null;
  evidenceReference?: string | null;
}) {
  const sms = readSmsPreferences(input.communicationPrefs);
  const capturedAt = input.capturedAt ?? new Date().toISOString();
  const next: SmsPreferenceEnvelope = {
    ...sms,
    permissions: {
      ...sms.permissions,
      [input.messageClass]: {
        status: input.status,
        source: input.source,
        capturedAt,
        actorId: input.actorId ?? null,
        policyVersion: input.policyVersion ?? null,
        evidenceReference: input.evidenceReference ?? null,
      },
    },
  };
  return writeSmsPreferences(input.communicationPrefs, next);
}

export function suppressSms(input: {
  communicationPrefs: unknown;
  reason: string;
  eventId?: string | null;
  at?: string;
}) {
  const sms = readSmsPreferences(input.communicationPrefs);
  const recent = new Set(sms.recentInboundEventIds ?? []);
  if (input.eventId) recent.add(input.eventId);
  const next: SmsPreferenceEnvelope = {
    ...sms,
    suppressedAt: input.at ?? new Date().toISOString(),
    suppressionReason: input.reason,
    recentInboundEventIds: Array.from(recent).slice(-50),
  };
  return writeSmsPreferences(input.communicationPrefs, next);
}

export function resumeSms(input: {
  communicationPrefs: unknown;
  eventId?: string | null;
}) {
  const sms = readSmsPreferences(input.communicationPrefs);
  const recent = new Set(sms.recentInboundEventIds ?? []);
  if (input.eventId) recent.add(input.eventId);
  return writeSmsPreferences(input.communicationPrefs, {
    ...sms,
    suppressedAt: null,
    suppressionReason: null,
    recentInboundEventIds: Array.from(recent).slice(-50),
  });
}

export function hasProcessedInboundSmsEvent(communicationPrefs: unknown, eventId: string) {
  return readSmsPreferences(communicationPrefs).recentInboundEventIds?.includes(eventId) ?? false;
}
