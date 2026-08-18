import { z } from "zod";
import {
  clinicTypeOptions,
  painPointSchema,
  salesIntakeSchema,
  type SalesIntake,
  type SalesPainPoint,
} from "@/lib/sales-demo-rules";

/**
 * The paid Clinic Operating Analysis should not make a ready buyer repeat discovery
 * before checkout. This schema accepts only identity, the safe categories already
 * carried from the Zumi operating map, and the synthetic-data boundary.
 *
 * It intentionally does not accept tenant IDs, client-controlled prices, payment
 * state, entitlements, provider counts, locations, vendor names, or spend data.
 */
export const paidAnalysisCheckoutSchema = z.object({
  clinicName: z.string().trim().min(2).max(140),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(180),
  clinicType: z.enum(clinicTypeOptions).default("Other independent clinic"),
  biggestPainPoint: painPointSchema.default("follow_ups"),
  painPoints: z.array(painPointSchema).min(1).max(15).default(["follow_ups"]),
  acknowledgesSyntheticData: z.literal(true),
  website: z.string().max(0).optional(),
}).strict();

export type PaidAnalysisCheckoutInput = z.infer<typeof paidAnalysisCheckoutSchema>;

function normalizePainPoints(biggestPainPoint: SalesPainPoint, painPoints: readonly SalesPainPoint[]) {
  return [...new Set([biggestPainPoint, ...painPoints])];
}

/**
 * Keeps the existing complete sales-intake contract compatible while allowing the
 * public paid-analysis path to submit the minimum safe pre-payment payload.
 *
 * `0` for provider/location count means "not collected before purchase". Those
 * qualification details belong in post-payment discovery, not checkout friction.
 */
export function normalizePublicSalesReservationInput(rawInput: unknown): SalesIntake {
  const legacy = salesIntakeSchema.safeParse(rawInput);
  if (legacy.success) return legacy.data;

  const input = paidAnalysisCheckoutSchema.parse(rawInput);
  const painPoints = normalizePainPoints(input.biggestPainPoint, input.painPoints);

  return salesIntakeSchema.parse({
    clinicName: input.clinicName,
    contactName: input.contactName,
    contactRole: "Not collected before purchase",
    contactEmail: input.contactEmail,
    contactPhone: "Not collected before purchase",
    clinicType: input.clinicType,
    providerCount: 0,
    locationCount: 0,
    currentSystems: {
      ehr: "",
      scheduling: "",
      billing: "",
      crm: "",
      patientMessaging: "",
    },
    estimatedSoftwareSpendDollars: null,
    biggestPainPoint: input.biggestPainPoint,
    painPoints,
    selectedOffer: "private_workflow_demo",
    wantsFreeIntro: false,
    wantsPaidDemo: true,
    wantsFoundingEvaluation: false,
    wantsFoundingProgram: false,
    acknowledgesSyntheticData: true,
    website: input.website,
  });
}
