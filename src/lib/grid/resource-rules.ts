import { z } from "zod";

export const gridResourceTypes = [
  "space",
  "product",
  "equipment",
  "service",
  "organization_capacity",
  "education",
  "referral",
] as const;

export const gridResourcePolicyClasses = [
  "healthcare_space",
  "general_supply",
  "regulated_product",
  "equipment_capacity",
  "business_service",
  "clinical_service",
  "organization_capacity",
  "education_capacity",
  "referral_capacity",
] as const;

export const gridResourceVisibility = ["public", "network", "matched_only", "organization", "invite_only", "private"] as const;
export const gridResourcePricingModels = ["quote", "fixed", "hourly", "daily", "per_unit", "per_seat"] as const;

const availabilitySchema = z.object({
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  capacity: z.number().int().min(1).max(10_000).default(1),
}).refine((value) => value.endsAt > value.startsAt, {
  path: ["endsAt"],
  message: "Availability end time must be after its start time.",
});

export const gridResourceCreateSchema = z.object({
  resourceType: z.enum(gridResourceTypes),
  policyClass: z.enum(gridResourcePolicyClasses),
  subtype: z.string().trim().min(2).max(100).optional().nullable(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(12).max(2_000),
  visibility: z.enum(gridResourceVisibility).default("matched_only"),
  city: z.string().trim().min(2).max(120).optional().nullable(),
  state: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional().nullable(),
  timezone: z.string().trim().min(3).max(80).default("America/New_York"),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  pricingModel: z.enum(gridResourcePricingModels).default("quote"),
  priceCents: z.number().int().min(0).max(100_000_000).optional().nullable(),
  capacity: z.number().int().min(1).max(100_000).default(1),
  credentialRequirements: z.array(z.string().trim().min(2).max(120)).max(30).default([]),
  insuranceRequirements: z.array(z.string().trim().min(2).max(120)).max(30).default([]),
  operatorRequirements: z.array(z.string().trim().min(2).max(120)).max(30).default([]),
  usageRestrictions: z.array(z.string().trim().min(2).max(180)).max(30).default([]),
  availability: z.array(availabilitySchema).max(200).default([]),
}).superRefine((value, ctx) => {
  const expectedPolicyClasses: Record<(typeof gridResourceTypes)[number], readonly (typeof gridResourcePolicyClasses)[number][]> = {
    space: ["healthcare_space"],
    product: ["general_supply", "regulated_product"],
    equipment: ["equipment_capacity"],
    service: ["business_service", "clinical_service"],
    organization_capacity: ["organization_capacity"],
    education: ["education_capacity"],
    referral: ["referral_capacity"],
  };
  if (!expectedPolicyClasses[value.resourceType].includes(value.policyClass)) {
    ctx.addIssue({ code: "custom", path: ["policyClass"], message: "Policy class does not match this Grid resource type." });
  }
  if (value.pricingModel !== "quote" && value.priceCents == null) {
    ctx.addIssue({ code: "custom", path: ["priceCents"], message: "A priced resource requires an integer-cent price." });
  }
  if ((value.latitude == null) !== (value.longitude == null)) {
    ctx.addIssue({ code: "custom", path: ["latitude"], message: "Latitude and longitude must be supplied together." });
  }
  if (["healthcare_space", "equipment_capacity", "education_capacity", "referral_capacity"].includes(value.policyClass) && value.availability.length === 0) {
    ctx.addIssue({ code: "custom", path: ["availability"], message: "This capacity class requires at least one availability window." });
  }
  if (value.policyClass === "referral_capacity" && value.visibility === "public") {
    ctx.addIssue({ code: "custom", path: ["visibility"], message: "Referral capacity cannot be published as an unrestricted public listing." });
  }
});

export const gridResourceOwnerTransitionSchema = z.object({
  targetStatus: z.enum(["pending_review", "paused"]),
  note: z.string().trim().min(8).max(1_000),
});

export const gridResourceReviewSchema = z.object({
  decision: z.enum(["approved", "rejected", "suspended"]),
  note: z.string().trim().min(12).max(1_500),
});

export type GridResourceCreateInput = z.infer<typeof gridResourceCreateSchema>;
export type GridResourceReviewInput = z.infer<typeof gridResourceReviewSchema>;

export type GridResourcePolicyResult = {
  eligibleForTransaction: boolean;
  requiresHumanReview: boolean;
  reasons: string[];
};

export function evaluateGridResourcePolicy(input: {
  policyClass: (typeof gridResourcePolicyClasses)[number];
  status: string;
  reviewStatus: string;
  visibility?: string | null;
  availabilityCount?: number;
}) : GridResourcePolicyResult {
  const reasons: string[] = [];
  const requiresHumanReview = true;

  if (input.status !== "active") reasons.push("Resource is not active.");
  if (input.reviewStatus !== "approved") reasons.push("Resource has not completed human review.");

  if (input.policyClass === "regulated_product") {
    reasons.push("Regulated products require a dedicated transfer, custody, storage, and participant-eligibility policy before Grid transactions can proceed.");
  }
  if (input.policyClass === "clinical_service") {
    reasons.push("Clinical services must use the verified clinician/service-listing pathway rather than generic resource eligibility.");
  }
  if (["healthcare_space", "equipment_capacity", "education_capacity", "referral_capacity"].includes(input.policyClass) && (input.availabilityCount ?? 0) < 1) {
    reasons.push("This capacity resource has no active availability window.");
  }
  if (input.policyClass === "referral_capacity" && input.visibility === "public") {
    reasons.push("Referral capacity cannot transact as an unrestricted public resource.");
  }

  return { eligibleForTransaction: reasons.length === 0, requiresHumanReview, reasons };
}
