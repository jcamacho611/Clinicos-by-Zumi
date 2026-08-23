import type { SmsMessageClass } from "@/lib/communications/sms-policy";

export interface PatientSmsTemplate {
  id: PatientSmsTemplateId;
  subject: string;
  body: string;
  messageClass: SmsMessageClass;
  phiApproved: false;
}

export const PATIENT_SMS_TEMPLATES = [
  {
    id: "secure_account_update",
    subject: "Klinikos secure account update",
    body: "Klinikos: Your secure account has an update. Sign in to your portal to review it. Reply STOP to opt out.",
    messageClass: "transactional",
    phiApproved: false,
  },
  {
    id: "secure_action_required",
    subject: "Klinikos secure action required",
    body: "Klinikos: An action is waiting in your secure portal. Sign in to review it. Reply STOP to opt out.",
    messageClass: "operational",
    phiApproved: false,
  },
] as const satisfies readonly PatientSmsTemplate[];

export type PatientSmsTemplateId = (typeof PATIENT_SMS_TEMPLATES)[number]["id"];

export function patientSmsTemplate(id: string): PatientSmsTemplate | null {
  return PATIENT_SMS_TEMPLATES.find((template) => template.id === id) ?? null;
}

export function isIanaTimeZone(value: string) {
  const zone = value.trim();
  if (!zone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

export type SmsQuietHoursDecision =
  | { allowed: true; localHour: number; localMinute: number }
  | { allowed: false; reason: "invalid_timezone" }
  | { allowed: false; reason: "quiet_hours"; localHour: number; localMinute: number };

/** Ordinary patient SMS may send from 09:00 inclusive until 20:00 exclusive, recipient-local. */
export function evaluateSmsQuietHours(input: {
  timeZone: string;
  now?: Date;
}): SmsQuietHoursDecision {
  const timeZone = input.timeZone.trim();
  if (!isIanaTimeZone(timeZone)) return { allowed: false, reason: "invalid_timezone" };

  const now = input.now ?? new Date();
  const parts = new Intl.DateTimeFormat("en-US-u-hc-h23", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const localHour = Number(parts.find((part) => part.type === "hour")?.value ?? Number.NaN);
  const localMinute = Number(parts.find((part) => part.type === "minute")?.value ?? Number.NaN);

  if (!Number.isInteger(localHour) || !Number.isInteger(localMinute)) {
    return { allowed: false, reason: "invalid_timezone" };
  }

  const allowed = localHour >= 9 && localHour < 20;
  return allowed
    ? { allowed: true, localHour, localMinute }
    : { allowed: false, reason: "quiet_hours", localHour, localMinute };
}
