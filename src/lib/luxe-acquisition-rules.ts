import { z } from "zod";
import { canonicalizeLuxeServiceInterest } from "@/lib/luxe-service-interest";

const boundedText = (max: number) => z.string().trim().max(max).optional().nullable();

export const luxeAttributionSchema = z.object({
  firstTouchSource: boundedText(120),
  firstTouchMedium: boundedText(120),
  firstTouchCampaign: boundedText(160),
  firstTouchTerm: boundedText(160),
  firstTouchContent: boundedText(160),
  firstTouchLandingPage: boundedText(500),
  firstTouchReferrer: boundedText(500),
  lastTouchSource: boundedText(120),
  lastTouchCampaign: boundedText(160),
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
  serviceInterest: boundedText(160).transform((value) => canonicalizeLuxeServiceInterest(value)),
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

export type LuxeIdentityCandidate = {
  id: string;
  email: string | null;
  phone: string | null;
};

export type LuxeIdentityMatchDecision =
  | { kind: "none" }
  | { kind: "matched"; id: string }
  | { kind: "ambiguous"; candidateIds: string[] };

export function decideLuxeOpenLeadIdentityMatch(
  candidates: LuxeIdentityCandidate[],
  email: string | null,
  phone: string | null,
): LuxeIdentityMatchDecision {
  const matchingIds = new Set<string>();
  for (const candidate of candidates) {
    const emailMatches = Boolean(email && normalizeLuxeEmail(candidate.email) === email);
    const phoneMatches = Boolean(phone && normalizeLuxePhone(candidate.phone) === phone);
    if (emailMatches || phoneMatches) matchingIds.add(candidate.id);
  }

  const ids = [...matchingIds];
  if (ids.length === 0) return { kind: "none" };
  if (ids.length === 1) return { kind: "matched", id: ids[0] };
  return { kind: "ambiguous", candidateIds: ids.sort() };
}

export function normalizeAttribution(value: LuxeAttribution) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === "string" && item.trim().length > 0));
}

export function campaignSourceFromAttribution(attribution: LuxeAttribution) {
  return attribution.firstTouchCampaign
    ?? attribution.utmCampaign
    ?? attribution.firstTouchSource
    ?? attribution.utmSource
    ?? attribution.lastTouchSource
    ?? "luxe-medi.com";
}

export function leadResponsePriority(input: Pick<PublicLuxeLeadInput, "appointmentInterest" | "preferredTiming" | "attribution">) {
  if (input.appointmentInterest || input.preferredTiming) return "high" as const;
  const cta = input.attribution.cta?.toLowerCase() ?? "";
  if (cta.includes("book") || cta.includes("consult") || cta.includes("availability")) return "high" as const;
  return "normal" as const;
}
