import { z } from "zod";
import { findCopyViolations } from "@/lib/design/command-system";

/**
 * Prospect capture and lifecycle.
 *
 * The lead form is a public surface, so the hard rule from the platform constitution
 * applies without exception: **public routes must not solicit protected health
 * information.** Every field below asks about a business — its name, its size, the
 * software it runs. There is no field for a patient, a condition, a record, or a
 * free-text description that would invite one.
 *
 * Pure module. No database, no network.
 */

export const clinicTypes = [
  "medical_spa",
  "primary_care",
  "independent_clinic",
  "dental",
  "behavioral_health",
  "specialty",
  "other",
] as const;
export type ClinicType = (typeof clinicTypes)[number];

export const clinicTypeLabels: Record<ClinicType, string> = {
  medical_spa: "Medical spa / aesthetics",
  primary_care: "Primary care",
  independent_clinic: "Independent clinic",
  dental: "Dental",
  behavioral_health: "Behavioral health",
  specialty: "Specialty practice",
  other: "Other",
};

export const scaleBands = ["1", "2_5", "6_15", "16_30", "30_plus"] as const;
export type ScaleBand = (typeof scaleBands)[number];

export const scaleBandLabels: Record<ScaleBand, string> = {
  "1": "1",
  "2_5": "2–5",
  "6_15": "6–15",
  "16_30": "16–30",
  "30_plus": "30+",
};

/**
 * The capture form.
 *
 * Phone is optional on purpose. Making it mandatory costs more leads than it gains
 * calls, and a prospect who wants to be phoned will give a number.
 */
export const prospectCaptureSchema = z.object({
  contactName: z.string().trim().min(2).max(120),
  clinicName: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(40).optional(),
  website: z.string().trim().max(200).optional(),
  clinicType: z.enum(clinicTypes),
  locationCount: z.enum(scaleBands),
  providerCount: z.enum(scaleBands),
  /** Referral code from /referral/:code, when the visit was attributed. */
  referralCode: z.string().trim().max(40).optional(),
  /** What brought them in. Constrained, so it cannot become a free-text note. */
  interest: z.enum(["overview", "pricing", "operational_audit", "demo", "grid", "other"]).default("overview"),
});

export type ProspectCapture = z.infer<typeof prospectCaptureSchema>;

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export const prospectStatuses = [
  "NEW",
  "ENGAGED",
  "PRICING_VIEWED",
  "AUDIT_INTEREST",
  "CHECKOUT_STARTED",
  "PAID",
  "ONBOARDING",
  "ACTIVE",
  "LOST",
] as const;
export type ProspectStatus = (typeof prospectStatuses)[number];

/**
 * How far along each status is.
 *
 * Used to decide whether an observed event should advance a prospect. The rule is
 * that behaviour only ever moves someone *forward*: a paying customer who browses the
 * pricing page again has not reverted to a lead.
 */
const STATUS_RANK: Record<ProspectStatus, number> = {
  NEW: 0,
  ENGAGED: 1,
  PRICING_VIEWED: 2,
  AUDIT_INTEREST: 3,
  CHECKOUT_STARTED: 4,
  PAID: 5,
  ONBOARDING: 6,
  ACTIVE: 7,
  LOST: -1,
};

export function statusRank(status: ProspectStatus) {
  return STATUS_RANK[status];
}

/**
 * The status an event implies, or null when it implies nothing.
 *
 * `payment_completed` is deliberately absent: nothing a visitor does on a marketing
 * page may mark them as PAID. That transition belongs to a verified payment event and
 * is applied by the provisioning path, never inferred from browsing.
 */
const EVENT_STATUS: Record<string, ProspectStatus> = {
  homepage_viewed: "ENGAGED",
  how_it_works_viewed: "ENGAGED",
  solution_viewed: "ENGAGED",
  zumi_page_viewed: "ENGAGED",
  demo_started: "ENGAGED",
  demo_completed: "ENGAGED",
  referral_visit: "ENGAGED",
  overview_requested: "ENGAGED",
  contact_submitted: "ENGAGED",
  pricing_viewed: "PRICING_VIEWED",
  audit_viewed: "AUDIT_INTEREST",
  audit_checkout_clicked: "CHECKOUT_STARTED",
  checkout_started: "CHECKOUT_STARTED",
};

/**
 * Advance a prospect's status from an observed event.
 *
 * Never regresses, and never reaches PAID. A lost prospect who comes back is picked
 * up again, because returning after going quiet is exactly the behaviour worth
 * noticing.
 */
export function advanceStatus(current: ProspectStatus, eventType: string): ProspectStatus {
  const implied = EVENT_STATUS[eventType];
  if (!implied) return current;
  if (current === "LOST") return implied;
  return STATUS_RANK[implied] > STATUS_RANK[current] ? implied : current;
}

/** Statuses that mean the prospect has bought. Growth outreach stops here. */
const CUSTOMER_STATUSES: readonly ProspectStatus[] = ["PAID", "ONBOARDING", "ACTIVE"];

export function isCustomer(status: ProspectStatus) {
  return CUSTOMER_STATUSES.includes(status);
}

// ---------------------------------------------------------------------------
// Outbound copy safety
// ---------------------------------------------------------------------------

/**
 * Whether a piece of outbound marketing copy may be sent.
 *
 * Automated follow-up email reaches people who never visited a governed page, so it
 * needs the same copy law the public site is held to — otherwise the one channel
 * nobody reviews becomes the one that promises a free trial or a certified EHR.
 */
export function outboundCopyProblems(subject: string, body: string): string[] {
  return findCopyViolations(`${subject}\n${body}`);
}

export const LEAD_CAPTURE_NO_PHI_NOTICE =
  "This form collects clinic and software information only. Do not enter patient names, records, or any other protected health information.";
