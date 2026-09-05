import "server-only";

import { clinicPlans } from "@/lib/commercial/klinikos-commercial";
import {
  commercialProducts,
  getCommercialProduct,
  type CommercialProduct,
  type CommercialProductKey,
} from "@/lib/commercial/product-catalog";

export const STRIPE_PRICING_VERSION = "2026-09-02.fabric-v2" as const;

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

const serviceProjections: readonly ProjectionInput[] = [
  "deep_operating_audit",
  "proof_sprint",
  "optimization_retainer",
  "integration_launch",
  "data_migration_go_live",
  "enterprise_architecture_workshop",
].map((offerKey) => ({
  offerKey: offerKey as CommercialProductKey,
  treatment: "private_quoted" as const,
  cadence: offerKey === "optimization_retainer" ? ("month" as const) : ("one_time" as const),
  amountCents: getCommercialProduct(offerKey)?.priceCents ?? null,
  // Qualified services are scoped before payment. A Stripe lookup key can be added
  // only when the corresponding server-owned product/price is actually provisioned.
  lookupKey: null,
  publicLinkEligible: false,
  automaticCollection: false,
}));

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

const enterpriseProjection: readonly ProjectionInput[] = [
  {
    offerKey: "clinic_enterprise",
    treatment: "private_quoted",
    cadence: "one_time",
    amountCents: null,
    lookupKey: null,
    publicLinkEligible: false,
    automaticCollection: false,
  },
];

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
  ...serviceProjections.map(project),
  ...clinicSubscriptionProjections.map(project),
  ...enterpriseProjection.map(project),
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
