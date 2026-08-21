export const costRateEvidenceKinds = ["published_reference", "contracted", "invoice", "measured"] as const;
export type CostRateEvidenceKind = (typeof costRateEvidenceKinds)[number];

export const costRateShapes = ["per_unit", "tiered_per_unit", "percent_plus_fixed", "fixed_plus_overage"] as const;
export type CostRateShape = (typeof costRateShapes)[number];

export type CostRateTier = {
  readonly minMonthlyUnits: number;
  readonly maxMonthlyUnits: number | null;
  readonly microUsdPerUnit: number;
};

export type CostRateEvidence = {
  readonly costLineKey: string;
  readonly provider: string;
  readonly evidence: CostRateEvidenceKind;
  readonly rateShape: CostRateShape;
  readonly display: string;
  readonly billingUnit: string;
  readonly source: string;
  readonly asOf: string;
  readonly scope: string;
  readonly caveats: readonly string[];
  readonly normalized?: {
    readonly microUsdPerUnit?: number;
    readonly fixedMonthlyCents?: number;
    readonly includedUnitsPerMonth?: number;
    readonly overageMicroUsdPerUnit?: number;
    readonly billingIncrementUnits?: number;
    readonly basisPoints?: number;
    readonly fixedCentsPerTransaction?: number;
    readonly tiers?: readonly CostRateTier[];
  };
};

/**
 * Public rate cards are evidence about a provider's unit economics, not proof of what
 * Klinikos currently pays and not proof of one clinic's monthly cost-to-serve.
 *
 * Every entry below is therefore `published_reference`. A production contract, invoice,
 * or provider billing export may supersede it. `calculateClinicEconomics` must not use
 * these values as `monthlyCentsPerClinic` without measured usage + applicable contract.
 */
export const PUBLISHED_COST_RATE_EVIDENCE: readonly CostRateEvidence[] = [
  {
    costLineKey: "sms",
    provider: "Twilio",
    evidence: "published_reference",
    rateShape: "per_unit",
    display: "$0.0083 per outbound U.S. SMS segment base rate",
    billingUnit: "outbound SMS segment",
    source: "https://www.twilio.com/en-us/sms/pricing/us",
    asOf: "2026-08-20",
    scope: "United States long code, toll-free, and short-code outbound SMS base price on the public pay-as-you-go rate card.",
    caveats: [
      "Carrier fees are additional and vary by destination/carrier.",
      "A2P registration and other number/compliance costs can apply.",
      "Twilio states prices may change without notice.",
      "This is not evidence of Klinikos's contracted rate or monthly SMS volume.",
    ],
    normalized: { microUsdPerUnit: 8_300 },
  },
  {
    costLineKey: "email",
    provider: "Resend",
    evidence: "published_reference",
    rateShape: "fixed_plus_overage",
    display: "Pro $20/month includes 50,000 emails; extra emails $0.90 per 1,000",
    billingUnit: "monthly plan + 1,000-email overage bucket",
    source: "https://resend.com/pricing/",
    asOf: "2026-08-20",
    scope: "Public Resend Pro transactional-email pricing.",
    caveats: [
      "Actual Klinikos plan is not inferred from repository credentials.",
      "Overage is billed in buckets of 1,000, so $0.0009/email is a normalized marginal reference rather than the invoice increment.",
      "Fixed monthly plan cost is shared platform spend until an allocation policy attributes it to tenants.",
    ],
    normalized: {
      fixedMonthlyCents: 2_000,
      includedUnitsPerMonth: 50_000,
      overageMicroUsdPerUnit: 900,
      billingIncrementUnits: 1_000,
    },
  },
  {
    costLineKey: "payment_processing",
    provider: "Stripe",
    evidence: "published_reference",
    rateShape: "percent_plus_fixed",
    display: "2.9% + $0.30 per successful domestic card transaction",
    billingUnit: "successful domestic card transaction",
    source: "https://stripe.com/pricing",
    asOf: "2026-08-20",
    scope: "Stripe U.S. standard pricing for domestic online card transactions.",
    caveats: [
      "Custom pricing may differ.",
      "International cards, currency conversion, manually entered cards, disputes, and other payment methods can add separate fees.",
      "Payment-processor economics belong to transaction economics and should not be confused with optional feature-usage allowance accounting.",
    ],
    normalized: { basisPoints: 290, fixedCentsPerTransaction: 30 },
  },
  {
    costLineKey: "eligibility",
    provider: "Stedi",
    evidence: "published_reference",
    rateShape: "tiered_per_unit",
    display: "$0.30/check at 1-250 monthly; $0.15 at 251-3,500; $0.10 at 3,501-10,000; $0.08 at 10,001+",
    billingUnit: "270/271 eligibility check",
    source: "https://www.stedi.com/pricing",
    asOf: "2026-08-20",
    scope: "Stedi public pay-as-you-go eligibility-check tiers.",
    caveats: [
      "Actual production contract/custom pricing may differ.",
      "Monthly tenant eligibility volume is not yet inferred from this rate card.",
      "Stedi documents some non-billable failures/test-mode transactions; raw request count is not automatically billable count.",
      "Production eligibility remains separately gated by credentials, enrollment, BAA/security posture, and payer requirements.",
    ],
    normalized: {
      tiers: [
        { minMonthlyUnits: 1, maxMonthlyUnits: 250, microUsdPerUnit: 300_000 },
        { minMonthlyUnits: 251, maxMonthlyUnits: 3_500, microUsdPerUnit: 150_000 },
        { minMonthlyUnits: 3_501, maxMonthlyUnits: 10_000, microUsdPerUnit: 100_000 },
        { minMonthlyUnits: 10_001, maxMonthlyUnits: null, microUsdPerUnit: 80_000 },
      ],
    },
  },
] as const;

export function publishedCostRateEvidenceFor(costLineKey: string) {
  return PUBLISHED_COST_RATE_EVIDENCE.find((entry) => entry.costLineKey === costLineKey) ?? null;
}
