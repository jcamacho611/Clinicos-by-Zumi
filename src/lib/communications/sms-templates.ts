import "server-only";

import type { SmsMessageClass } from "@/lib/communications/sms-policy";

export const patientSmsTemplateIds = ["secure_account_update", "transaction_receipt_ready"] as const;
export type PatientSmsTemplateId = (typeof patientSmsTemplateIds)[number];

export type PatientSmsTemplate = {
  id: PatientSmsTemplateId;
  messageClass: Exclude<SmsMessageClass, "marketing" | "clinical">;
  subject: string;
  body: string;
  phiApproved: false;
};

const templates: Record<PatientSmsTemplateId, PatientSmsTemplate> = {
  secure_account_update: {
    id: "secure_account_update",
    messageClass: "operational",
    subject: "Klinikos secure update",
    body: "Klinikos has a secure account update for you. Sign in to Klinikos to view details. Reply STOP to opt out.",
    phiApproved: false,
  },
  transaction_receipt_ready: {
    id: "transaction_receipt_ready",
    messageClass: "transactional",
    subject: "Klinikos account update",
    body: "A secure Klinikos account update is ready. Sign in to Klinikos to view details. Reply STOP to opt out.",
    phiApproved: false,
  },
};

export function patientSmsTemplate(id: string): PatientSmsTemplate | null {
  return Object.prototype.hasOwnProperty.call(templates, id) ? templates[id as PatientSmsTemplateId] : null;
}

export function isIanaTimeZone(value: string) {
  const timeZone = value.trim();
  if (!timeZone || timeZone.length > 80) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export type QuietHoursDecision =
  | { allowed: true; localHour: number }
  | { allowed: false; reason: "invalid_timezone" | "quiet_hours"; localHour?: number };

/**
 * Klinikos product policy for ordinary non-clinical SMS: 09:00 through 19:59 local.
 * This intentionally does not claim to encode every jurisdiction's legal rules. It is
 * a conservative product guardrail; jurisdiction-specific policy can only narrow it.
 */
export function evaluateSmsQuietHours(input: { timeZone: string; now?: Date }): QuietHoursDecision {
  if (!isIanaTimeZone(input.timeZone)) return { allowed: false, reason: "invalid_timezone" };
  const hourPart = new Intl.DateTimeFormat("en-US", {
    timeZone: input.timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(input.now ?? new Date()).find((part) => part.type === "hour")?.value;
  const localHour = Number(hourPart);
  if (!Number.isInteger(localHour)) return { allowed: false, reason: "invalid_timezone" };
  if (localHour < 9 || localHour >= 20) return { allowed: false, reason: "quiet_hours", localHour };
  return { allowed: true, localHour };
}
