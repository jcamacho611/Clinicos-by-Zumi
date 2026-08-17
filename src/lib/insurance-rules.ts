import { z } from "zod";

const optionalDate = z.string().date().optional().nullable();
const optionalMoneyCents = z.number().int().min(0).max(100_000_000).optional().nullable();

export const insuranceEligibilityStatuses = ["active", "inactive", "unknown", "needs_review"] as const;

export const recordInsuranceVerificationSchema = z.object({
  insuranceId: z.string().trim().min(1).max(128),
  eligibilityStatus: z.enum(insuranceEligibilityStatuses),
  copayCents: optionalMoneyCents,
  deductibleCents: optionalMoneyCents,
  coinsurancePercent: z.number().min(0).max(100).optional().nullable(),
  effectiveDate: optionalDate,
  terminationDate: optionalDate,
  source: z.string().trim().min(3).max(160),
  notes: z.string().trim().max(2000).optional().nullable(),
}).superRefine((value, context) => {
  if (value.effectiveDate && value.terminationDate && value.terminationDate < value.effectiveDate) {
    context.addIssue({ code: "custom", path: ["terminationDate"], message: "Termination date cannot be before the effective date." });
  }
});

export type RecordInsuranceVerificationInput = z.infer<typeof recordInsuranceVerificationSchema>;
