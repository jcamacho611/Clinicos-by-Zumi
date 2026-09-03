import { clinicCommercialOffers, clinicPlans } from "@/lib/commercial/klinikos-commercial";
import { GRID_MEMBERSHIP } from "@/lib/commercial/grid-economics";

export type UniverseCommercialClassification = "ACTIVE_PUBLIC" | "ACTIVE_PRIVATE" | "TARGET";
export type UniverseBilling = "one_time" | "month" | "year";

export type StripeCatalogOffer = {
  key: string;
  name: string;
  priceCents: number;
  billing: UniverseBilling;
  classification: UniverseCommercialClassification;
  stripeLookupKey: string;
  publicSelfServe: boolean;
  audience: "clinic" | "professional" | "organization" | "learner" | "institution" | "existing_customer";
  note?: string;
};

export const nonPurchasableUniverseClasses = [
  "person_identity",
  "credential_truth",
  "clinical_authority",
  "patient_referral",
  "phi_permission",
] as const;

const professionalPricing = {
  business: {
    key: "professional_business",
    name: "Klinikos Professional Business",
    monthlyPriceCents: 24_900,
    priceLabel: "$249/mo",
    classification: "ACTIVE_PRIVATE" as const,
  },
  launchSetup: {
    key: "professional_launch_setup",
    name: "Professional Launch Setup",
    priceCents: 49_900,
    priceLabel: "$499",
    classification: "ACTIVE_PRIVATE" as const,
  },
};

const eduPricing = {
  free: {
    key: "edu_free",
    name: "Klinikos EDU",
    monthlyPriceCents: 0,
    priceLabel: "Free",
  },
  plus: {
    key: "edu_plus",
    name: "EDU Plus",
    monthlyPriceCents: 2_900,
    priceLabel: "$29/mo",
    classification: "ACTIVE_PUBLIC" as const,
  },
  course: {
    key: "edu_course",
    name: "Courses",
    minPriceCents: 4_900,
    maxPriceCents: 19_900,
    priceLabel: "$49–199/course",
    note: "Each published course receives its own versioned Stripe Price; the range itself is not a charge.",
  },
  pathway: {
    key: "edu_pathway",
    name: "Klinikos Pathway",
    priceCents: 29_900,
    priceLabel: "$299",
    classification: "ACTIVE_PUBLIC" as const,
  },
  institutionalSeat: {
    key: "edu_institutional_seat",
    name: "EDU Institutional Cohort Seat",
    priceCents: 20_000,
    priceLabel: "$200/learner",
    classification: "ACTIVE_PRIVATE" as const,
  },
};

const usagePacks = [
  { key: "usage_pack_250", name: "$250 usage pack", priceCents: 25_000 },
  { key: "usage_pack_500", name: "$500 usage pack", priceCents: 50_000 },
  { key: "usage_pack_1000", name: "$1,000 usage pack", priceCents: 100_000 },
  { key: "usage_pack_2500", name: "$2,500 usage pack", priceCents: 250_000 },
] as const;

export const universePricingFabric = {
  clinic: {
    core: clinicPlans.core,
    growth: clinicPlans.growth,
    scale: clinicPlans.scale,
    enterprise: clinicPlans.enterprise,
    analysis: clinicCommercialOffers.privateWorkflowReview,
    blueprint: clinicCommercialOffers.foundingEvaluation,
    implementation: clinicCommercialOffers.foundingImplementation,
  },
  grid: {
    individualFree: GRID_MEMBERSHIP.individualFree,
    individualPro: GRID_MEMBERSHIP.individualPro,
    individualProPlus: {
      ...GRID_MEMBERSHIP.individualProPlus,
      monthlyPriceCents: 12_900,
      priceLabel: "$129/mo",
    },
    organizationFree: GRID_MEMBERSHIP.organizationFree,
    organizationPro: GRID_MEMBERSHIP.organizationPro,
    organizationScale: {
      key: "grid_organization_scale",
      name: "Grid for organizations · Scale",
      monthlyPriceCents: 99_900,
      priceLabel: "$999/mo",
      classification: "TARGET" as const,
      audience: "Multi-location and higher-volume Grid organizations",
    },
  },
  professional: professionalPricing,
  edu: eduPricing,
  usage: {
    packs: usagePacks,
    rule:
      "Prepaid packs fund approved variable-cost buckets after included allowances; they are not unrestricted stored value and never override entitlement or policy.",
  },
} as const;

export const stripeCatalogOffers: readonly StripeCatalogOffer[] = [
  {
    key: "operational_audit",
    name: clinicCommercialOffers.privateWorkflowReview.name,
    priceCents: clinicCommercialOffers.privateWorkflowReview.priceCents,
    billing: "one_time",
    classification: "ACTIVE_PUBLIC",
    stripeLookupKey: "klinikos_operational_audit_one_time_v1",
    publicSelfServe: true,
    audience: "clinic",
  },
  {
    key: "implementation_blueprint",
    name: clinicCommercialOffers.foundingEvaluation.name,
    priceCents: clinicCommercialOffers.foundingEvaluation.priceCents,
    billing: "one_time",
    classification: "ACTIVE_PUBLIC",
    stripeLookupKey: "klinikos_implementation_blueprint_one_time_v1",
    publicSelfServe: true,
    audience: "clinic",
  },
  {
    key: "founding_clinic_implementation",
    name: clinicCommercialOffers.foundingImplementation.name,
    priceCents: clinicCommercialOffers.foundingImplementation.priceCents,
    billing: "one_time",
    classification: "ACTIVE_PRIVATE",
    stripeLookupKey: "klinikos_founding_implementation_starting_v1",
    publicSelfServe: false,
    audience: "clinic",
    note: "Starting-price anchor; final implementation scope remains quoted.",
  },
  {
    key: "clinic_core_monthly",
    name: clinicPlans.core.name,
    priceCents: clinicPlans.core.monthlyPriceCents,
    billing: "month",
    classification: "ACTIVE_PUBLIC",
    stripeLookupKey: "klinikos_clinic_core_monthly_v1",
    publicSelfServe: true,
    audience: "clinic",
  },
  {
    key: "clinic_core_annual",
    name: `${clinicPlans.core.name} annual`,
    priceCents: clinicPlans.core.annualPriceCents,
    billing: "year",
    classification: "ACTIVE_PUBLIC",
    stripeLookupKey: "klinikos_clinic_core_annual_v1",
    publicSelfServe: true,
    audience: "clinic",
  },
  {
    key: "clinic_growth_monthly",
    name: clinicPlans.growth.name,
    priceCents: clinicPlans.growth.monthlyPriceCents,
    billing: "month",
    classification: "ACTIVE_PUBLIC",
    stripeLookupKey: "klinikos_clinic_growth_monthly_v1",
    publicSelfServe: true,
    audience: "clinic",
  },
  {
    key: "clinic_growth_annual",
    name: `${clinicPlans.growth.name} annual`,
    priceCents: clinicPlans.growth.annualPriceCents,
    billing: "year",
    classification: "ACTIVE_PUBLIC",
    stripeLookupKey: "klinikos_clinic_growth_annual_v1",
    publicSelfServe: true,
    audience: "clinic",
  },
  {
    key: "clinic_scale_monthly",
    name: clinicPlans.scale.name,
    priceCents: clinicPlans.scale.monthlyPriceCents,
    billing: "month",
    classification: "ACTIVE_PUBLIC",
    stripeLookupKey: "klinikos_clinic_scale_monthly_v1",
    publicSelfServe: true,
    audience: "clinic",
  },
  {
    key: "clinic_scale_annual",
    name: `${clinicPlans.scale.name} annual`,
    priceCents: clinicPlans.scale.annualPriceCents,
    billing: "year",
    classification: "ACTIVE_PUBLIC",
    stripeLookupKey: "klinikos_clinic_scale_annual_v1",
    publicSelfServe: true,
    audience: "clinic",
  },
  {
    key: "grid_pro",
    name: GRID_MEMBERSHIP.individualPro.name,
    priceCents: GRID_MEMBERSHIP.individualPro.monthlyPriceCents,
    billing: "month",
    classification: "ACTIVE_PUBLIC",
    stripeLookupKey: "klinikos_grid_pro_monthly_v1",
    publicSelfServe: true,
    audience: "professional",
  },
  {
    key: "grid_pro_plus",
    name: GRID_MEMBERSHIP.individualProPlus.name,
    priceCents: 12_900,
    billing: "month",
    classification: "ACTIVE_PUBLIC",
    stripeLookupKey: "klinikos_grid_pro_plus_monthly_v1",
    publicSelfServe: true,
    audience: "professional",
  },
  {
    key: professionalPricing.business.key,
    name: professionalPricing.business.name,
    priceCents: professionalPricing.business.monthlyPriceCents,
    billing: "month",
    classification: professionalPricing.business.classification,
    stripeLookupKey: "klinikos_professional_business_monthly_v1",
    publicSelfServe: false,
    audience: "professional",
  },
  {
    key: professionalPricing.launchSetup.key,
    name: professionalPricing.launchSetup.name,
    priceCents: professionalPricing.launchSetup.priceCents,
    billing: "one_time",
    classification: professionalPricing.launchSetup.classification,
    stripeLookupKey: "klinikos_professional_launch_setup_one_time_v1",
    publicSelfServe: false,
    audience: "professional",
  },
  {
    key: "grid_organization_pro",
    name: GRID_MEMBERSHIP.organizationPro.name,
    priceCents: GRID_MEMBERSHIP.organizationPro.monthlyPriceCents,
    billing: "month",
    classification: "ACTIVE_PUBLIC",
    stripeLookupKey: "klinikos_grid_organization_pro_monthly_v1",
    publicSelfServe: true,
    audience: "organization",
  },
  {
    key: "grid_organization_scale",
    name: "Grid for organizations · Scale",
    priceCents: 99_900,
    billing: "month",
    classification: "TARGET",
    stripeLookupKey: "klinikos_grid_organization_scale_monthly_v1",
    publicSelfServe: false,
    audience: "organization",
  },
  {
    key: eduPricing.plus.key,
    name: eduPricing.plus.name,
    priceCents: eduPricing.plus.monthlyPriceCents,
    billing: "month",
    classification: eduPricing.plus.classification,
    stripeLookupKey: "klinikos_edu_plus_monthly_v1",
    publicSelfServe: true,
    audience: "learner",
  },
  {
    key: eduPricing.pathway.key,
    name: eduPricing.pathway.name,
    priceCents: eduPricing.pathway.priceCents,
    billing: "one_time",
    classification: eduPricing.pathway.classification,
    stripeLookupKey: "klinikos_edu_pathway_one_time_v1",
    publicSelfServe: true,
    audience: "learner",
  },
  {
    key: eduPricing.institutionalSeat.key,
    name: eduPricing.institutionalSeat.name,
    priceCents: eduPricing.institutionalSeat.priceCents,
    billing: "one_time",
    classification: eduPricing.institutionalSeat.classification,
    stripeLookupKey: "klinikos_edu_institutional_seat_one_time_v1",
    publicSelfServe: false,
    audience: "institution",
  },
  ...usagePacks.map((pack) => ({
    key: pack.key,
    name: pack.name,
    priceCents: pack.priceCents,
    billing: "one_time" as const,
    classification: "ACTIVE_PRIVATE" as const,
    stripeLookupKey: `klinikos_${pack.key}_one_time_v1`,
    publicSelfServe: false,
    audience: "existing_customer" as const,
    note: "Prepaid customer-funded variable-cost allowance; entitlement and spend policy remain server-owned.",
  })),
] as const;

export const publicSelfServeOffers = stripeCatalogOffers.filter(
  (offer) => offer.classification === "ACTIVE_PUBLIC" && offer.publicSelfServe,
);
