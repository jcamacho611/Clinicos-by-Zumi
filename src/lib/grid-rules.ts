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
export const gridRequestStatuses = ["draft", "requested", "provider_review", "location_review", "credential_check", "pending_deposit", "confirmed", "completed", "cancelled", "declined", "escalated"] as const;
export const gridLocationTypes = ["clinic_location", "rental_room", "chair_rental", "mobile", "at_home", "virtual"] as const;

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
  requested: ["provider_review", "declined", "cancelled", "escalated"],
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
  credentials: { verificationStatus: string; expiresAt: Date | null }[];
}, now = new Date()) {
  return input.verificationStatus === "verified"
    && Boolean(input.malpracticeExpiration && input.malpracticeExpiration > now)
    && input.credentials.some((credential) => credentialIsCurrent(credential.verificationStatus, credential.expiresAt, now));
}
