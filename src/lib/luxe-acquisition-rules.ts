import { z } from "zod";

const boundedText = (max: number) => z.string().trim().max(max).optional().nullable();

export const luxeAttributionSchema = z.object({
  firstTouchSource: boundedText(120),
  lastTouchSource: boundedText(120),
  landingPage: boundedText(500),
  referrer: boundedText(500),
  utmSource: boundedText(120),
  utmMedium: boundedText(120),
  utmCampaign: boundedText(160),
  utmTerm: boundedText(160),
  utmContent: boundedText(160),
  campaignId: boundedText(160),
  originatingPage: boundedText(500),
  cta: boundedText(160),
  bookingSource: boundedText(120),
  referralSource: boundedText(160),
  socialSource: boundedText(120),
  qrSource: boundedText(160),
}).strict().default({});

export const publicLuxeLeadSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254).optional().nullable(),
  phone: z.string().trim().min(7).max(40).optional().nullable(),
  serviceInterest: boundedText(160),
  appointmentInterest: boundedText(160),
  preferredContactMethod: z.enum(["phone", "sms", "email", "either"]).optional().nullable(),
  preferredTiming: boundedText(160),
  message: boundedText(1200),
  contactConsent: z.boolean().optional().default(false),
  marketingConsent: z.boolean().optional().default(false),
  attribution: luxeAttributionSchema,
  website: z.string().trim().max(0).optional().default(""),
}).strict().superRefine((value, ctx) => {
  if (!value.email && !value.phone) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["email"], message: "Email or phone is required." });
  }
});

export type PublicLuxeLeadInput = z.infer<typeof publicLuxeLeadSchema>;
export type LuxeAttribution = z.infer<typeof luxeAttributionSchema>;

export function normalizeLuxeEmail(value?: string | null) {
  return value?.trim().toLowerCase() || null;
}

export function normalizeLuxePhone(value?: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 7 && digits.length <= 15) return `+${digits}`;
  return null;
}

export function normalizeAttribution(value: LuxeAttribution) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === "string" && item.trim().length > 0));
}

export function campaignSourceFromAttribution(attribution: LuxeAttribution) {
  return attribution.utmCampaign
    ?? attribution.utmSource
    ?? attribution.lastTouchSource
    ?? attribution.firstTouchSource
    ?? "luxe-medi.com";
}

export function leadResponsePriority(input: Pick<PublicLuxeLeadInput, "appointmentInterest" | "preferredTiming" | "attribution">) {
  if (input.appointmentInterest || input.preferredTiming) return "high" as const;
  const cta = input.attribution.cta?.toLowerCase() ?? "";
  if (cta.includes("book") || cta.includes("consult") || cta.includes("availability")) return "high" as const;
  return "normal" as const;
}
