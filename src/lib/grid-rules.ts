import { z } from "zod";

export const gridProviderTypes = [
  "Nurse Injector",
  "Registered Nurse",
  "Nurse Practitioner",
  "Physician Assistant",
  "Physician",
  "Medical Director",
  "Esthetician",
  "Laser Technician",
  "IV Therapy Provider",
  "Weight Loss Provider",
  "Physical Therapist",
  "Chiropractor",
  "Acupuncturist",
  "Imaging Facility",
  "MRI Facility",
  "CT Facility",
  "X-ray Facility",
  "Specialist Office",
  "Pain Management",
  "Orthopedics",
  "Hand Specialist",
  "Billing Partner",
  "Legal/Attorney Partner",
  "Transport Partner",
  "Rental Room / Chair Host",
] as const;

export const gridVerificationStatuses = ["draft", "submitted", "needs_review", "verified", "rejected", "expired", "suspended"] as const;
export const gridExperienceLevels = ["Entry", "Intermediate", "Experienced", "OG / Master Provider"] as const;
export const gridRequestStatuses = ["draft", "requested", "accepted", "countered", "provider_review", "location_review", "credential_check", "pending_deposit", "confirmed", "completed", "cancelled", "declined", "escalated"] as const;
export const gridLocationTypes = ["clinic_location", "rental_room", "chair_rental", "mobile", "at_home", "virtual"] as const;
/**
 * Suggestions for public professional enrollment, not an eligibility allow-list.
 *
 * Grid accepts future healthcare professions into a pending human-review state.
 * Opportunity-specific policy and credential checks decide whether that person may
 * receive regulated work; adding a new profession must not require rebuilding the
 * enrollment engine.
 */
export const gridContractorProviderTypes = [
  "Registered Nurse",
  "Nurse Practitioner",
  "Physician Assistant",
  "Physician",
  "Licensed Practical Nurse",
  "Nurse Injector",
  "Physical Therapist",
  "Occupational Therapist",
  "Speech Therapist",
  "Behavioral Health Professional",
  "Dentist",
  "Dental Hygienist",
  "Pharmacist",
  "Paramedic",
  "Home Health Professional",
  "Imaging Professional",
  "Laboratory Professional",
  "Healthcare Technician",
  "Other Healthcare Professional",
] as const;
export const gridPayoutStatuses = ["estimated", "approved", "paid", "hold", "void"] as const;

/**
 * The payment condition on a Grid request.
 *
 * Klinikos does not move money for Grid — payouts are recorded manually and carry no
 * processor transfer. "Verified" therefore means a person recorded that the condition is
 * satisfied, against an audit trail, and the vocabulary says so rather than implying an
 * authorization that no processor produced.
 */
export const gridPaymentStatuses = [
  "not_required",
  "not_started",
  "authorized",
  "recorded",
  "waived",
  "failed",
] as const;
export type GridPaymentStatus = (typeof gridPaymentStatuses)[number];

/** Payment conditions that permit a booking to be confirmed. */
const SETTLED_PAYMENT_STATUSES: readonly string[] = ["not_required", "authorized", "recorded", "waived"];

/**
 * Whether the payment condition for this booking is satisfied.
 *
 * The public product page says the payment condition is verified before a booking is
 * confirmed. Nothing read `paymentStatus` — it was written once at creation and never
 * looked at again — so the claim was untrue. This is what makes it true.
 *
 * Deposit and payment are separate conditions and both bind: a listing requiring a
 * deposit needs the deposit recorded or waived *and* the payment condition settled.
 */
export function gridPaymentConditionSatisfied(input: {
  listing: { requiresDeposit: boolean };
  paymentStatus: string;
  depositStatus: string;
}): { ok: true } | { ok: false; reason: string } {
  if (input.listing.requiresDeposit && !["recorded", "waived"].includes(input.depositStatus)) {
    return { ok: false, reason: "A reviewed deposit record or waiver is required before confirmation." };
  }
  if (input.paymentStatus === "failed") {
    return { ok: false, reason: "The recorded payment condition for this booking failed and has not been resolved." };
  }
  if (!SETTLED_PAYMENT_STATUSES.includes(input.paymentStatus)) {
    return {
      ok: false,
      reason: "The payment condition for this booking has not been verified. Record it as authorized, recorded, or waived before confirming.",
    };
  }
  return { ok: true };
}

const optionalUrl = z.union([z.literal(""), z.string().url()]).optional().nullable();
const optionalDateTime = z.string().datetime({ offset: true }).optional().nullable();

export const gridProviderProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  legalName: z.string().trim().min(2).max(160),
  providerType: z.enum(gridProviderTypes),
  credential: z.string().trim().min(2).max(40),
  specialty: z.string().trim().max(120).optional().nullable(),
  subspecialty: z.string().trim().max(120).optional().nullable(),
  npi: z.string().trim().max(40).optional().nullable(),
  dea: z.string().trim().max(80).optional().nullable(),
  licenseType: z.string().trim().min(2).max(80),
  licenseNumber: z.string().trim().min(2).max(120),
  licenseState: z.string().trim().min(2).max(40),
  licenseExpiration: optionalDateTime,
  malpracticeCarrier: z.string().trim().min(2).max(160),
  malpracticePolicyNumber: z.string().trim().min(2).max(120),
  malpracticeExpiration: z.string().datetime({ offset: true }),
  certifications: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  servicesOffered: z.array(z.string().trim().min(1).max(120)).min(1).max(40),
  experienceLevel: z.enum(gridExperienceLevels),
  bio: z.string().trim().min(20).max(1200),
  profilePhoto: optionalUrl,
  serviceLocations: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  mobileServiceAllowed: z.boolean().default(false),
  chairRentalAllowed: z.boolean().default(false),
  atHomeAllowed: z.boolean().default(false),
  travelRadiusMiles: z.number().int().min(0).max(500).default(0),
});

export const gridProviderTransitionSchema = z.object({
  targetStatus: z.enum(gridVerificationStatuses),
  note: z.string().trim().min(12).max(800),
});

export const gridContractorEnrollmentSchema = z.object({
  organizationSlug: z.string().trim().min(2).max(80).default("luxe-medi"),
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7).max(40),
  password: z.string().min(12).max(256)
    .regex(/[a-z]/, "Password must include a lowercase letter.")
    .regex(/[A-Z]/, "Password must include an uppercase letter.")
    .regex(/[0-9]/, "Password must include a number.")
    .regex(/[^A-Za-z0-9]/, "Password must include a symbol.")
    .optional()
    .default(""),
  providerType: z.string().trim().min(2).max(120),
  credential: z.string().trim().min(2).max(40),
  specialty: z.string().trim().min(2).max(120),
  licenseType: z.string().trim().min(2).max(80).default("STATE_LICENSE"),
  licenseNumber: z.string().trim().min(2).max(120),
  licenseState: z.string().trim().min(2).max(40),
  licenseExpiration: z.string().datetime({ offset: true }),
  licenseEvidenceReference: z.string().trim().min(2).max(240),
  malpracticeCarrier: z.string().trim().min(2).max(160),
  malpracticePolicyNumber: z.string().trim().min(2).max(120),
  malpracticeExpiration: z.string().datetime({ offset: true }),
  malpracticeCoverageAmountCents: z.number().int().min(0).max(1_000_000_000),
  malpracticeEvidenceReference: z.string().trim().min(2).max(240),
  certifications: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  servicesOffered: z.array(z.string().trim().min(1).max(120)).min(1).max(40),
  experienceLevel: z.enum(gridExperienceLevels),
  bio: z.string().trim().min(20).max(1200),
  serviceArea: z.string().trim().min(2).max(160),
  travelRadiusMiles: z.number().int().min(0).max(500),
  mobileServiceAllowed: z.boolean().default(false),
  chairRentalAllowed: z.boolean().default(false),
  partnerLocationAllowed: z.boolean().default(false),
  atHomeAllowed: z.boolean().default(false),
  onCallNow: z.boolean().default(false),
  availability: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    locationType: z.enum(gridLocationTypes),
  }).refine((value) => value.endTime > value.startTime, { path: ["endTime"], message: "End time must be after start time." })).min(1).max(14),
}).refine((value) => value.mobileServiceAllowed || value.chairRentalAllowed || value.partnerLocationAllowed || value.atHomeAllowed, {
  path: ["mobileServiceAllowed"], message: "Select at least one work setting.",
});

export const gridContractorPreferencesSchema = z.object({
  serviceArea: z.string().trim().min(2).max(160),
  travelRadiusMiles: z.number().int().min(0).max(500),
  mobileServiceAllowed: z.boolean(),
  chairRentalAllowed: z.boolean(),
  partnerLocationAllowed: z.boolean(),
  atHomeAllowed: z.boolean(),
  onCallNow: z.boolean(),
}).refine((value) => value.mobileServiceAllowed || value.chairRentalAllowed || value.partnerLocationAllowed || value.atHomeAllowed, {
  path: ["mobileServiceAllowed"], message: "Select at least one work setting.",
});

export const gridCredentialReviewSchema = z.object({
  decision: z.enum(["verified", "rejected"]),
  note: z.string().trim().min(12).max(800),
  verificationSource: z.string().trim().min(4).max(240),
});

export const gridMalpracticeReviewSchema = z.object({
  decision: z.enum(["verified", "rejected"]),
  note: z.string().trim().min(12).max(800),
});

export const gridPayoutTransitionSchema = z.object({
  targetStatus: z.enum(gridPayoutStatuses),
  note: z.string().trim().min(8).max(800),
  externalReference: z.string().trim().min(2).max(160).optional().nullable(),
});

export const gridServiceListingSchema = z.object({
  providerId: z.string().min(1),
  serviceName: z.string().trim().min(2).max(140),
  category: z.string().trim().min(2).max(100),
  description: z.string().trim().min(20).max(1200),
  priceLowCents: z.number().int().min(0).max(100_000_000),
  priceHighCents: z.number().int().min(0).max(100_000_000),
  requiresMedicalReview: z.boolean().default(false),
  requiresConsent: z.boolean().default(true),
  requiresDeposit: z.boolean().default(false),
  mobileAllowed: z.boolean().default(false),
  clinicLocationAllowed: z.boolean().default(true),
  chairRentalAllowed: z.boolean().default(false),
  status: z.enum(["draft", "active"]).default("draft"),
}).refine((value) => value.priceHighCents >= value.priceLowCents, { path: ["priceHighCents"], message: "The high price must be at least the low price." });

export const gridAvailabilitySchema = z.object({
  providerId: z.string().min(1),
  locationId: z.string().min(1).optional().nullable(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  locationType: z.enum(gridLocationTypes),
  mobileRadius: z.number().int().min(0).max(500).default(0),
  onCall: z.boolean().default(false),
}).refine((value) => value.endTime > value.startTime, { path: ["endTime"], message: "End time must be after start time." });

export const gridLocationSchema = z.object({
  locationName: z.string().trim().min(2).max(160),
  locationType: z.string().trim().min(2).max(80),
  address: z.string().trim().min(4).max(240),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(40),
  zip: z.string().trim().min(3).max(20),
  roomTypes: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  chairRentalAvailable: z.boolean().default(false),
  hourlyRateCents: z.number().int().min(0).max(10_000_000).optional().nullable(),
  dailyRateCents: z.number().int().min(0).max(100_000_000).optional().nullable(),
  servicesAllowed: z.array(z.string().trim().min(1).max(120)).max(50).default([]),
  credentialRequirements: z.array(z.string().trim().min(1).max(160)).max(30).default([]),
  insuranceRequirements: z.array(z.string().trim().min(1).max(160)).max(30).default([]),
  marketplaceVisible: z.boolean().default(false),
});

export const gridRequestSchema = z.object({
  patientId: z.string().min(1).optional().nullable(),
  syntheticClientLabel: z.string().trim().min(2).max(120),
  syntheticClientReference: z.string().trim().min(2).max(80),
  serviceListingId: z.string().min(1),
  providerId: z.string().min(1),
  locationId: z.string().min(1).optional().nullable(),
  requestedStartAt: z.string().datetime({ offset: true }),
  requestedEndAt: optionalDateTime,
  locationType: z.enum(gridLocationTypes),
  /**
   * Where the work happens, when no Klinikos location supplies it.
   *
   * Mobile, at-home and virtual work has a jurisdiction the location table cannot answer
   * for, and eligibility refuses an unknown one rather than assuming it matches.
   */
  serviceJurisdiction: z.string().trim().length(2).toUpperCase().optional().nullable(),
  safetyFlags: z.array(z.string().trim().min(1).max(160)).max(20).default([]),
  requiredDocuments: z.array(z.string().trim().min(1).max(160)).max(30).default([]),
  consentStatus: z.enum(["not_required", "pending", "confirmed", "blocked"]).default("pending"),
  notes: z.string().trim().min(12).max(1000),
}).refine((value) => !value.requestedEndAt || value.requestedEndAt > value.requestedStartAt, { path: ["requestedEndAt"], message: "End time must be after start time." });

export const gridRequestTransitionSchema = z.object({
  targetStatus: z.enum(gridRequestStatuses),
  note: z.string().trim().min(12).max(1000),
  consentStatus: z.enum(["not_required", "pending", "confirmed", "blocked"]).optional(),
  depositStatus: z.enum(["not_required", "not_started", "manual_link_required", "pending", "recorded", "waived", "refunded"]).optional(),
  paymentStatus: z.enum(gridPaymentStatuses).optional(),
  counterStartAt: optionalDateTime,
});

const providerTransitions: Record<(typeof gridVerificationStatuses)[number], readonly (typeof gridVerificationStatuses)[number][]> = {
  draft: ["submitted"],
  submitted: ["needs_review", "rejected"],
  needs_review: ["verified", "rejected"],
  verified: ["suspended", "expired"],
  rejected: ["submitted"],
  expired: ["submitted"],
  suspended: ["needs_review"],
};

const requestTransitions: Record<(typeof gridRequestStatuses)[number], readonly (typeof gridRequestStatuses)[number][]> = {
  draft: ["requested", "cancelled"],
  requested: ["accepted", "countered", "provider_review", "declined", "cancelled", "escalated"],
  accepted: ["location_review", "declined", "cancelled", "escalated"],
  countered: ["accepted", "declined", "cancelled", "escalated"],
  provider_review: ["location_review", "declined", "cancelled", "escalated"],
  location_review: ["credential_check", "declined", "cancelled", "escalated"],
  credential_check: ["pending_deposit", "confirmed", "declined", "cancelled", "escalated"],
  pending_deposit: ["confirmed", "declined", "cancelled", "escalated"],
  confirmed: ["completed", "cancelled", "escalated"],
  completed: [],
  cancelled: [],
  declined: [],
  escalated: ["provider_review", "declined", "cancelled"],
};

export function canTransitionGridProvider(from: string, to: string) {
  const parsedFrom = z.enum(gridVerificationStatuses).safeParse(from);
  const parsedTo = z.enum(gridVerificationStatuses).safeParse(to);
  return Boolean(parsedFrom.success && parsedTo.success && providerTransitions[parsedFrom.data].includes(parsedTo.data));
}

export function canTransitionGridRequest(from: string, to: string) {
  const parsedFrom = z.enum(gridRequestStatuses).safeParse(from);
  const parsedTo = z.enum(gridRequestStatuses).safeParse(to);
  return Boolean(parsedFrom.success && parsedTo.success && requestTransitions[parsedFrom.data].includes(parsedTo.data));
}

export function credentialIsCurrent(status: string, expiresAt: Date | null, now = new Date()) {
  return status === "verified" && (!expiresAt || expiresAt > now);
}

export function providerReadyForGrid(input: {
  verificationStatus: string;
  malpracticeExpiration: Date | null;
  malpracticeVerificationStatus: string;
  credentials: { verificationStatus: string; expiresAt: Date | null }[];
}, now = new Date()) {
  return input.verificationStatus === "verified"
    && input.malpracticeVerificationStatus === "verified"
    && Boolean(input.malpracticeExpiration && input.malpracticeExpiration > now)
    && input.credentials.some((credential) => credentialIsCurrent(credential.verificationStatus, credential.expiresAt, now));
}

export function buildZumiGridGuidance(input: {
  verificationStatus: string;
  malpracticeVerificationStatus: string;
  currentCredentials: number;
  availabilitySlots: number;
  openRequests: number;
  estimatedPayoutCents: number;
}) {
  const nextSteps: string[] = [];
  if (input.currentCredentials === 0) nextSteps.push("Wait for the credentialing team to verify your current license evidence.");
  if (input.malpracticeVerificationStatus !== "verified") nextSteps.push("Wait for human review of your malpractice policy and evidence.");
  if (input.availabilitySlots === 0) nextSteps.push("Add at least one availability window and work setting.");
  if (input.verificationStatus === "verified" && input.openRequests === 0) nextSteps.push("Keep availability current so clinics can send an eligible request.");
  if (input.openRequests > 0) nextSteps.push(`Review ${input.openRequests} open request${input.openRequests === 1 ? "" : "s"} and record an accept, counter, or decline decision.`);
  if (input.estimatedPayoutCents > 0) nextSteps.push("Review payout estimates; payment is recorded manually only after administrator confirmation.");
  if (!nextSteps.length) nextSteps.push("Your GRID setup is current. Keep credentials and availability up to date.");
  return {
    title: input.verificationStatus === "verified" ? "You are approved for governed GRID requests" : "Your contractor application is in human review",
    nextSteps,
    guardrail: "Zumi provides administrative guidance only. It does not verify credentials, determine clinical scope, or guarantee work or payment.",
  };
}