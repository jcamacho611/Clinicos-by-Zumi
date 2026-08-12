import { z } from "zod";

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
  score: z.number().int().min(0).max(100),
  status: z.enum(["QUALIFIED", "MORE INFORMATION REQUIRED", "DO NOT SELL AUDIT YET"]),
  auditPrice: z.number().int().min(0).max(100_000),
});

export type SalesAuditQualification = z.infer<typeof salesAuditQualificationSchema>;

export function buildSalesAuditNotes(input: SalesAuditQualification) {
  return [
    "Klinikos Operational Audit qualification",
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
    `Recommended audit price: $${input.auditPrice.toLocaleString()}`,
    "Checkout uses the official Klinikos GoDaddy payment connector. Checkout launch is not payment proof; payment must be independently reconciled before the audit is marked paid.",
  ].join("\n");
}
