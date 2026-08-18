import { z } from "zod";
import { clinicCommercialOffers } from "@/lib/commercial/klinikos-commercial";

export const CLINIC_OPERATING_ANALYSIS_PRICE_DOLLARS = clinicCommercialOffers.privateWorkflowReview.priceCents / 100;

export const salesAuditQualificationSchema = z.object({
  clinic: z.string().trim().min(2).max(160),
  decisionMaker: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().email().max(254),
  locations: z.number().int().min(1).max(500),
  providers: z.number().int().min(1).max(5000),
  staff: z.number().int().min(1).max(10000),
  encounters: z.number().int().min(0).max(10_000_000),
  revenueBand: z.enum(["unknown", "under-500k", "500k-1m", "1m+"]),
  insuranceMix: z.enum(["mixed", "insurance", "cash"]),
  billing: z.string().trim().max(160),
  monthlyTech: z.number().min(0).max(100_000_000),
  knownLeakage: z.number().min(0).max(100_000_000),
  ehr: z.string().trim().max(160),
  biggestPain: z.string().trim().max(2000),
  afterHours: z.number().min(0).max(744),
  referrals: z.boolean(),
  labs: z.boolean(),
  claims: z.boolean(),
  multiLocation: z.boolean(),
});

export type SalesAuditQualificationInput = z.infer<typeof salesAuditQualificationSchema>;
export type SalesAuditStatus = "QUALIFIED" | "MORE INFORMATION REQUIRED" | "DO NOT SELL AUDIT YET";
export type SalesAuditQualification = SalesAuditQualificationInput & {
  score: number;
  status: SalesAuditStatus;
  auditPrice: number;
};

export function calculateSalesAuditScore(input: SalesAuditQualificationInput) {
  let score = 0;
  score += Math.min(20, input.providers * 3 + input.locations * 4);
  score += input.decisionMaker ? 15 : 0;
  score += Math.min(15, (input.referrals ? 5 : 0) + (input.labs ? 5 : 0) + (input.claims ? 5 : 0));
  score += input.insuranceMix !== "cash" ? 10 : 3;
  score += Math.min(10, input.monthlyTech >= 5000 ? 10 : input.monthlyTech >= 2000 ? 7 : input.monthlyTech > 0 ? 4 : 0);
  score += Math.min(10, input.knownLeakage >= 5000 ? 10 : input.knownLeakage > 0 ? 6 : 0);
  score += input.locations > 1 || input.multiLocation ? 10 : input.providers >= 3 ? 6 : 2;
  score += input.afterHours >= 10 ? 5 : input.afterHours > 0 ? 3 : 0;
  score += input.revenueBand === "1m+" ? 5 : input.revenueBand === "500k-1m" ? 3 : 0;
  return Math.min(100, score);
}

export function salesAuditStatusForScore(score: number): SalesAuditStatus {
  if (score >= 70) return "QUALIFIED";
  if (score >= 45) return "MORE INFORMATION REQUIRED";
  return "DO NOT SELL AUDIT YET";
}

export function calculateSalesAuditPrice(_input: SalesAuditQualificationInput) {
  return CLINIC_OPERATING_ANALYSIS_PRICE_DOLLARS;
}

export function evaluateSalesAuditQualification(input: SalesAuditQualificationInput): SalesAuditQualification {
  const score = calculateSalesAuditScore(input);
  return {
    ...input,
    score,
    status: salesAuditStatusForScore(score),
    auditPrice: calculateSalesAuditPrice(input),
  };
}

export function buildSalesAuditNotes(input: SalesAuditQualification) {
  return [
    "Klinikos Clinic Operating Analysis qualification",
    `Decision maker: ${input.decisionMaker}`,
    `Buyer email: ${input.email}`,
    `Locations: ${input.locations}; providers: ${input.providers}; staff: ${input.staff}; encounters/month: ${input.encounters}`,
    `Revenue band: ${input.revenueBand}; insurance mix: ${input.insuranceMix}; billing: ${input.billing || "unknown"}; EHR/PM: ${input.ehr || "unknown"}`,
    `Reported monthly technology spend: $${input.monthlyTech.toLocaleString()}`,
    `Reported monthly leakage: $${input.knownLeakage.toLocaleString()}`,
    `Owner/admin after-hours: ${input.afterHours}`,
    `Workflow flags: referrals=${input.referrals}; labs=${input.labs}; claims=${input.claims}; multi-location=${input.multiLocation}`,
    `Biggest operating frustration: ${input.biggestPain || "not recorded"}`,
    `Qualification score: ${input.score}/100; status: ${input.status}`,
    `Clinic Operating Analysis price: $${input.auditPrice.toLocaleString()}`,
    "Qualification score and status are derived server-side from the saved prospect inputs. The analysis price comes from the canonical commercial offer and must match the official Klinikos GoDaddy paylink. Checkout launch is not payment proof; payment must be independently reconciled before the analysis is marked paid.",
  ].join("\n");
}
