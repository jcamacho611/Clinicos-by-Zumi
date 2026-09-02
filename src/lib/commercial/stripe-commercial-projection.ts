import "server-only";

import { clinicPlans } from "@/lib/commercial/klinikos-commercial";
import {
  commercialProducts,
  getCommercialProduct,
  type CommercialProduct,
  type CommercialProductKey,
} from "@/lib/commercial/product-catalog";

export const STRIPE_PRICING_VERSION = "2026-09-01.v1" as const;

export type StripeCommercialTreatment =
  | "public_self_serve"
  | "public_subscribe"
  | "private_quoted"
  | "prepaid_usage"
  | "not_directly_purchasable";

export type StripeCommercialCadence = "one_time" | "month" | "year";

export type StripeCommercialProjection = {
  offerKey: CommercialProductKey;
  pricingVersion: typeof STRIPE_PRICING_VERSION;
  treatment: StripeCommercialTreatment;
  cadence: StripeCommercialCadence;
  currency: "usd";
  amountCents: number | null;
  lookupKey: string | null;
  publicLinkEligible: boolean;
  automaticCollection: boolean;
  qualificationRequired: boolean;
  commercialRoute: CommercialProduct["commercialRoute"];
  entitlementBoundary: string;
};

type ProjectionInput = Omit<
  StripeCommercialProjection,
  | "pricingVersion"
  | "currency"
  | "qualificationRequired"
  | "commercialRoute"
  | "entitlementBoundary"
>;

function project(input: ProjectionInput): StripeCommercialProjection {
  const offer = getCommercialProduct(input.offerKey);
  if (!offer) throw new Error(`Stripe projection references unknown commercial offer ${input.offerKey}.`);

  return Object.freeze({
    ...input,
    pricingVersion: STRIPE_PRICING_VERSION,
    currency: "usd" as const,
    qualificationRequired: offer.qualificationRequired,
    commercialRoute: offer.commercialRoute,
    entitlementBoundary: offer.postPurchaseBoundary,
  });
}

const fixedProjections: readonly ProjectionInput[] = [
  {
    offerKey: "operational_audit",
    treatment: "public_self_serve",
    cadence: "one_time",
    amountCents: getCommercialProduct("operational_audit")?.priceCents ?? null,
    lookupKey: "klinikos_operational_audit_one_time_v1",
    publicLinkEligible: true,
    automaticCollection: true,
  },
  {
    offerKey: "implementation_blueprint",
    treatment: "private_quoted",
    cadence: "one_time",
    amountCents: getCommercialProduct("implementation_blueprint")?.priceCents ?? null,
    lookupKey: "klinikos_implementation_blueprint_one_time_v1",
    publicLinkEligible: false,
    automaticCollection: true,
  },
  {
    offerKey: "founding_clinic_implementation",
    treatment: "private_quoted",
    cadence: "one_time",
    amountCents: null,
    lookupKey: "klinikos_founding_implementation_starting_v1",
    publicLinkEligible: false,
    automaticCollection: true,
  },
  {
    offerKey: "clinic_enterprise",
    treatment: "private_quoted",
    cadence: "one_time",
    amountCents: null,
    lookupKey: null,
    publicLinkEligible: false,
    automaticCollection: false,
  },
] as const;

const clinicSubscriptionProjections: readonly ProjectionInput[] = [
  ["clinic_core", "core", clinicPlans.core.monthlyPriceCents, clinicPlans.core.annualPriceCents],
  ["clinic_growth", "growth", clinicPlans.growth.monthlyPriceCents, clinicPlans.growth.annualPriceCents],
  ["clinic_scale", "scale", clinicPlans.scale.monthlyPriceCents, clinicPlans.scale.annualPriceCents],
].flatMap(([offerKey, slug, monthlyAmountCents, annualAmountCents]) => [
  {
    offerKey: offerKey as CommercialProductKey,
    treatment: "public_subscribe" as const,
    cadence: "month" as const,
    amountCents: monthlyAmountCents as number,
    lookupKey: `klinikos_clinic_${slug}_monthly_v1`,
    publicLinkEligible: false,
    automaticCollection: true,
  },
  {
    offerKey: offerKey as CommercialProductKey,
    treatment: "public_subscribe" as const,
    cadence: "year" as const,
    amountCents: annualAmountCents as number,
    lookupKey: `klinikos_clinic_${slug}_annual_v1`,
    publicLinkEligible: false,
    automaticCollection: true,
  },
]);

const historicalProjections: readonly ProjectionInput[] = commercialProducts
  .filter((offer) => offer.lifecycle === "legacy_evidence_only")
  .map((offer) => ({
    offerKey: offer.key,
    treatment: "not_directly_purchasable" as const,
    cadence: "one_time" as const,
    amountCents: null,
    lookupKey: null,
    publicLinkEligible: false,
    automaticCollection: false,
  }));

export const stripeCommercialProjections: readonly StripeCommercialProjection[] = Object.freeze([
  ...fixedProjections.map(project),
  ...clinicSubscriptionProjections.map(project),
  ...historicalProjections.map(project),
]);

export function getStripeCommercialProjection(
  offerKey: CommercialProductKey,
  cadence: StripeCommercialCadence,
) {
  return stripeCommercialProjections.find(
    (projection) => projection.offerKey === offerKey && projection.cadence === cadence,
  );
}
