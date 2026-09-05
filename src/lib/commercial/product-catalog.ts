import { clinicPlans, commercialFabricOffers } from "@/lib/commercial/klinikos-commercial";

export const commercialProductKeys = [
  "deep_operating_audit",
  "proof_sprint",
  "optimization_retainer",
  "integration_launch",
  "data_migration_go_live",
  "enterprise_architecture_workshop",
  "clinic_core",
  "clinic_growth",
  "clinic_scale",
  "clinic_enterprise",
  // Evidence-only aliases preserve reconciliation of historical processor/database
  // records. They cannot begin a new commercial path.
  "operational_audit",
  "implementation_blueprint",
  "founding_clinic_implementation",
  "clinic_operator",
  "grid_professional",
  "grid_facility",
] as const;

export type CommercialProductKey = (typeof commercialProductKeys)[number];
export type CommercialProductLifecycle = "active" | "legacy_evidence_only";
export type CommercialAudience = "clinic" | "enterprise" | "professional" | "facility" | "organization";
export type CommercialRevenueClass =
  | "service"
  | "implementation"
  | "subscription"
  | "enterprise_contract"
  | "historical_evidence";
export type CommercialRoute =
  | "qualified_service"
  | "sales_led"
  | "recurring_reviewed"
  | "enterprise_government"
  | "historical_evidence_only";
export type CommercialPriceType = "fixed" | "custom" | "historical";

export type CommercialProduct = {
  key: CommercialProductKey;
  label: string;
  audience: CommercialAudience;
  billing: "one_time" | "monthly" | "custom";
  priceCents: number | null;
  revenueClass: CommercialRevenueClass;
  commercialRoute: CommercialRoute;
  priceType: CommercialPriceType;
  qualificationRequired: boolean;
  conversionDestination: string | null;
  lifecycle: CommercialProductLifecycle;
  publicPurchasable: boolean;
  directPublicCheckoutEligible: boolean;
  modules: readonly string[];
  whopPlanEnvVars: readonly string[];
  allowanceEnv: Partial<Record<"ai" | "voice" | "sms" | "email" | "maps" | "document_processing" | "storage" | "integrations", string>>;
  postPurchaseBoundary: string;
};

const clinicBoundary =
  "Payment can activate only the contracted software entitlement. Production PHI, clinical, connector, credential, integration, tenant, and human-review gates remain independent.";

const serviceBoundary =
  "Payment purchases only the scoped service. It does not create identity, production software authority, PHI access, clinical authority, professional eligibility, Grid eligibility, referral priority, or any regulated capability.";

const serviceProducts: readonly CommercialProduct[] = [
  {
    key: "deep_operating_audit",
    label: commercialFabricOffers.deepOperatingAudit.name,
    audience: "organization",
    billing: "one_time",
    priceCents: commercialFabricOffers.deepOperatingAudit.priceCents,
    revenueClass: "service",
    commercialRoute: "qualified_service",
    priceType: "fixed",
    qualificationRequired: true,
    conversionDestination: "/sales",
    lifecycle: "active",
    publicPurchasable: true,
    directPublicCheckoutEligible: false,
    modules: [],
    whopPlanEnvVars: [],
    allowanceEnv: {},
    postPurchaseBoundary: serviceBoundary,
  },
  {
    key: "proof_sprint",
    label: commercialFabricOffers.proofSprint.name,
    audience: "organization",
    billing: "one_time",
    priceCents: commercialFabricOffers.proofSprint.priceCents,
    revenueClass: "service",
    commercialRoute: "qualified_service",
    priceType: "fixed",
    qualificationRequired: true,
    conversionDestination: "/sales",
    lifecycle: "active",
    publicPurchasable: true,
    directPublicCheckoutEligible: false,
    modules: [],
    whopPlanEnvVars: [],
    allowanceEnv: {},
    postPurchaseBoundary: serviceBoundary,
  },
  {
    key: "optimization_retainer",
    label: commercialFabricOffers.optimizationRetainer.name,
    audience: "organization",
    billing: "monthly",
    priceCents: commercialFabricOffers.optimizationRetainer.priceCents,
    revenueClass: "service",
    commercialRoute: "qualified_service",
    priceType: "fixed",
    qualificationRequired: true,
    conversionDestination: "/sales",
    lifecycle: "active",
    publicPurchasable: true,
    directPublicCheckoutEligible: false,
    modules: [],
    whopPlanEnvVars: [],
    allowanceEnv: {},
    postPurchaseBoundary: serviceBoundary,
  },
  {
    key: "integration_launch",
    label: commercialFabricOffers.integrationLaunch.name,
    audience: "organization",
    billing: "one_time",
    priceCents: commercialFabricOffers.integrationLaunch.priceCents,
    revenueClass: "implementation",
    commercialRoute: "sales_led",
    priceType: "fixed",
    qualificationRequired: true,
    conversionDestination: "/sales",
    lifecycle: "active",
    publicPurchasable: true,
    directPublicCheckoutEligible: false,
    modules: [],
    whopPlanEnvVars: [],
    allowanceEnv: {},
    postPurchaseBoundary: serviceBoundary,
  },
  {
    key: "data_migration_go_live",
    label: commercialFabricOffers.dataMigrationGoLive.name,
    audience: "organization",
    billing: "one_time",
    priceCents: commercialFabricOffers.dataMigrationGoLive.priceCents,
    revenueClass: "implementation",
    commercialRoute: "sales_led",
    priceType: "fixed",
    qualificationRequired: true,
    conversionDestination: "/sales",
    lifecycle: "active",
    publicPurchasable: true,
    directPublicCheckoutEligible: false,
    modules: [],
    whopPlanEnvVars: [],
    allowanceEnv: {},
    postPurchaseBoundary: serviceBoundary,
  },
  {
    key: "enterprise_architecture_workshop",
    label: commercialFabricOffers.enterpriseArchitectureWorkshop.name,
    audience: "enterprise",
    billing: "one_time",
    priceCents: commercialFabricOffers.enterpriseArchitectureWorkshop.priceCents,
    revenueClass: "service",
    commercialRoute: "enterprise_government",
    priceType: "fixed",
    qualificationRequired: true,
    conversionDestination: "/sales",
    lifecycle: "active",
    publicPurchasable: true,
    directPublicCheckoutEligible: false,
    modules: [],
    whopPlanEnvVars: [],
    allowanceEnv: {},
    postPurchaseBoundary: serviceBoundary,
  },
];

const clinicProducts: readonly CommercialProduct[] = [
  {
    key: "clinic_core",
    label: clinicPlans.core.name,
    audience: "clinic",
    billing: "monthly",
    priceCents: clinicPlans.core.monthlyPriceCents,
    revenueClass: "subscription",
    commercialRoute: "recurring_reviewed",
    priceType: "fixed",
    qualificationRequired: true,
    conversionDestination: "/pricing",
    lifecycle: "active",
    publicPurchasable: true,
    directPublicCheckoutEligible: false,
    modules: ["advanced_reports"],
    whopPlanEnvVars: [],
    allowanceEnv: {
      ai: "KLINIKOS_ALLOWANCE_CORE_AI_CENTS",
      voice: "KLINIKOS_ALLOWANCE_CORE_VOICE_CENTS",
      sms: "KLINIKOS_ALLOWANCE_CORE_SMS_CENTS",
      email: "KLINIKOS_ALLOWANCE_CORE_EMAIL_CENTS",
      maps: "KLINIKOS_ALLOWANCE_CORE_MAPS_CENTS",
      document_processing: "KLINIKOS_ALLOWANCE_CORE_DOCUMENTS_CENTS",
      storage: "KLINIKOS_ALLOWANCE_CORE_STORAGE_CENTS",
      integrations: "KLINIKOS_ALLOWANCE_CORE_INTEGRATIONS_CENTS",
    },
    postPurchaseBoundary: clinicBoundary,
  },
  {
    key: "clinic_growth",
    label: clinicPlans.growth.name,
    audience: "clinic",
    billing: "monthly",
    priceCents: clinicPlans.growth.monthlyPriceCents,
    revenueClass: "subscription",
    commercialRoute: "recurring_reviewed",
    priceType: "fixed",
    qualificationRequired: true,
    conversionDestination: "/pricing",
    lifecycle: "active",
    publicPurchasable: true,
    directPublicCheckoutEligible: false,
    modules: ["revenue_recovery", "billing_readiness", "grid", "advanced_reports"],
    whopPlanEnvVars: [],
    allowanceEnv: {
      ai: "KLINIKOS_ALLOWANCE_GROWTH_AI_CENTS",
      voice: "KLINIKOS_ALLOWANCE_GROWTH_VOICE_CENTS",
      sms: "KLINIKOS_ALLOWANCE_GROWTH_SMS_CENTS",
      email: "KLINIKOS_ALLOWANCE_GROWTH_EMAIL_CENTS",
      maps: "KLINIKOS_ALLOWANCE_GROWTH_MAPS_CENTS",
      document_processing: "KLINIKOS_ALLOWANCE_GROWTH_DOCUMENTS_CENTS",
      storage: "KLINIKOS_ALLOWANCE_GROWTH_STORAGE_CENTS",
      integrations: "KLINIKOS_ALLOWANCE_GROWTH_INTEGRATIONS_CENTS",
    },
    postPurchaseBoundary: clinicBoundary,
  },
  {
    key: "clinic_scale",
    label: clinicPlans.scale.name,
    audience: "clinic",
    billing: "monthly",
    priceCents: clinicPlans.scale.monthlyPriceCents,
    revenueClass: "subscription",
    commercialRoute: "recurring_reviewed",
    priceType: "fixed",
    qualificationRequired: true,
    conversionDestination: "/pricing",
    lifecycle: "active",
    publicPurchasable: true,
    directPublicCheckoutEligible: false,
    modules: ["revenue_recovery", "billing_readiness", "grid", "advanced_reports"],
    whopPlanEnvVars: [],
    allowanceEnv: {
      ai: "KLINIKOS_ALLOWANCE_SCALE_AI_CENTS",
      voice: "KLINIKOS_ALLOWANCE_SCALE_VOICE_CENTS",
      sms: "KLINIKOS_ALLOWANCE_SCALE_SMS_CENTS",
      email: "KLINIKOS_ALLOWANCE_SCALE_EMAIL_CENTS",
      maps: "KLINIKOS_ALLOWANCE_SCALE_MAPS_CENTS",
      document_processing: "KLINIKOS_ALLOWANCE_SCALE_DOCUMENTS_CENTS",
      storage: "KLINIKOS_ALLOWANCE_SCALE_STORAGE_CENTS",
      integrations: "KLINIKOS_ALLOWANCE_SCALE_INTEGRATIONS_CENTS",
    },
    postPurchaseBoundary: clinicBoundary,
  },
  {
    key: "clinic_enterprise",
    label: clinicPlans.enterprise.name,
    audience: "enterprise",
    billing: "custom",
    priceCents: null,
    revenueClass: "enterprise_contract",
    commercialRoute: "enterprise_government",
    priceType: "custom",
    qualificationRequired: true,
    conversionDestination: "/pricing",
    lifecycle: "active",
    publicPurchasable: false,
    directPublicCheckoutEligible: false,
    modules: ["revenue_recovery", "billing_readiness", "grid", "advanced_reports"],
    whopPlanEnvVars: [],
    allowanceEnv: {},
    postPurchaseBoundary:
      "Enterprise scope, pricing, security, deployment, integrations, procurement, and entitlements remain governed by the executed commercial agreement and independent technical gates.",
  },
];

const historicalBoundary =
  "Historical commercial evidence is retained only for reconciliation. It cannot begin a new sale, create a new entitlement, or establish any governed authority.";

const historicalProducts: readonly CommercialProduct[] = [
  "operational_audit",
  "implementation_blueprint",
  "founding_clinic_implementation",
  "clinic_operator",
  "grid_professional",
  "grid_facility",
].map((key) => ({
  key: key as CommercialProductKey,
  label: "Retired legacy commercial evidence",
  audience: key.startsWith("grid_") ? ("professional" as const) : ("clinic" as const),
  billing: "custom" as const,
  priceCents: null,
  revenueClass: "historical_evidence" as const,
  commercialRoute: "historical_evidence_only" as const,
  priceType: "historical" as const,
  qualificationRequired: false,
  conversionDestination: null,
  lifecycle: "legacy_evidence_only" as const,
  publicPurchasable: false,
  directPublicCheckoutEligible: false,
  modules: [],
  whopPlanEnvVars: key === "clinic_operator" ? ["WHOP_PLAN_CLINIC_OPERATOR"] : [],
  allowanceEnv: {},
  postPurchaseBoundary: historicalBoundary,
}));

export const commercialProducts: readonly CommercialProduct[] = Object.freeze([
  ...serviceProducts,
  ...clinicProducts,
  ...historicalProducts,
]);

export function getCommercialProduct(key: string | null | undefined) {
  return commercialProducts.find((product) => product.key === key);
}

export function canStartNewCommercialCheckout(product: CommercialProduct) {
  return product.lifecycle === "active" && product.directPublicCheckoutEligible;
}
