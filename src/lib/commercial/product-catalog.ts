import { clinicCommercialOffers, clinicPlans } from "@/lib/commercial/klinikos-commercial";

export const commercialProductKeys = [
  "operational_audit",
  "implementation_blueprint",
  "founding_clinic_implementation",
  "clinic_core",
  "clinic_growth",
  "clinic_scale",
  "clinic_enterprise",
  // Legacy internal aliases remain readable so historical processor/subscription
  // evidence can still resolve. They must not become new checkout products.
  "clinic_operator",
  "grid_professional",
  "grid_facility",
] as const;

export type CommercialProductKey = (typeof commercialProductKeys)[number];
export type CommercialProductLifecycle = "active" | "legacy_evidence_only";
export type CommercialAudience = "clinic" | "enterprise" | "professional" | "facility";
export type CommercialRevenueClass =
  | "service"
  | "implementation"
  | "subscription"
  | "enterprise_contract"
  | "historical_evidence";
export type CommercialRoute =
  | "self_serve"
  | "qualified_service"
  | "sales_led"
  | "recurring_reviewed"
  | "enterprise_government"
  | "historical_evidence_only";
export type CommercialPriceType = "fixed" | "starting_at" | "custom" | "historical";

export type CommercialProduct = {
  key: CommercialProductKey;
  label: string;
  audience: CommercialAudience;
  billing: "one_time" | "monthly" | "custom";
  priceCents: number | null;
  /** What kind of revenue event this offer represents. */
  revenueClass: CommercialRevenueClass;
  /** The governed path a qualified buyer should enter. This is separate from the payment processor. */
  commercialRoute: CommercialRoute;
  /** Describes whether the displayed commercial amount is exact, a floor, custom, or historical evidence only. */
  priceType: CommercialPriceType;
  /** True when a human/system qualification gate must be satisfied before the commercial path advances. */
  qualificationRequired: boolean;
  /** Canonical public/sales destination for this offer, or null when the product cannot start a new sale. */
  conversionDestination: string | null;
  /** Current product can start a new governed checkout. Historical aliases cannot. */
  lifecycle: CommercialProductLifecycle;
  /** May be offered directly on a public purchase surface without another sales gate. */
  publicPurchasable: boolean;
  modules: readonly string[];
  whopPlanEnvVars: readonly string[];
  /**
   * Variable-cost allowances are deliberately configured outside source code.
   * This avoids silently spending vendor money before a commercial package has
   * actually funded the corresponding usage bucket.
   */
  allowanceEnv: Partial<Record<"ai" | "voice" | "sms" | "email" | "maps" | "document_processing" | "storage" | "integrations", string>>;
  postPurchaseBoundary: string;
};

const clinicBoundary =
  "Payment can activate the purchased software entitlement, but production PHI, clinical, connector, credential, integration, and human-review gates remain independent.";

const serviceBoundary =
  "Payment purchases only the named service. It does not activate production software, PHI workflows, clinical authority, professional eligibility, Grid eligibility, or any regulated capability.";

export const commercialProducts: readonly CommercialProduct[] = [
  {
    key: "operational_audit",
    label: clinicCommercialOffers.privateWorkflowReview.name,
    audience: "clinic",
    billing: "one_time",
    priceCents: clinicCommercialOffers.privateWorkflowReview.priceCents,
    revenueClass: "service",
    commercialRoute: "self_serve",
    priceType: "fixed",
    qualificationRequired: false,
    conversionDestination: "/sales",
    lifecycle: "active",
    publicPurchasable: false,
    modules: [],
    whopPlanEnvVars: [],
    allowanceEnv: {},
    postPurchaseBoundary: serviceBoundary,
  },
  {
    key: "implementation_blueprint",
    label: clinicCommercialOffers.foundingEvaluation.name,
    audience: "clinic",
    billing: "one_time",
    priceCents: clinicCommercialOffers.foundingEvaluation.priceCents,
    revenueClass: "service",
    commercialRoute: "qualified_service",
    priceType: "fixed",
    qualificationRequired: true,
    conversionDestination: "/founding-clinic",
    lifecycle: "active",
    publicPurchasable: false,
    modules: [],
    whopPlanEnvVars: [],
    allowanceEnv: {},
    postPurchaseBoundary: serviceBoundary,
  },
  {
    key: "founding_clinic_implementation",
    label: clinicCommercialOffers.foundingImplementation.name,
    audience: "clinic",
    billing: "custom",
    // `from $8,000` is a scope floor, not a fixed amount the browser may charge.
    priceCents: null,
    revenueClass: "implementation",
    commercialRoute: "sales_led",
    priceType: "starting_at",
    qualificationRequired: true,
    conversionDestination: "/founding-clinic",
    lifecycle: "active",
    publicPurchasable: false,
    modules: [],
    whopPlanEnvVars: [],
    allowanceEnv: {},
    postPurchaseBoundary:
      "A scoped implementation agreement funds only its contracted work. Payment never proves production readiness, clinical authority, connector readiness, or PHI eligibility.",
  },
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
    conversionDestination: "/founding-clinic",
    lifecycle: "active",
    publicPurchasable: true,
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
    conversionDestination: "/founding-clinic",
    lifecycle: "active",
    publicPurchasable: true,
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
    conversionDestination: "/founding-clinic",
    lifecycle: "active",
    publicPurchasable: true,
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
    conversionDestination: "/founding-clinic",
    lifecycle: "active",
    publicPurchasable: false,
    modules: ["revenue_recovery", "billing_readiness", "grid", "advanced_reports"],
    whopPlanEnvVars: [],
    allowanceEnv: {},
    postPurchaseBoundary:
      "Enterprise scope, pricing, security, deployment, integrations, procurement, and entitlements remain governed by the executed commercial agreement and independent technical gates.",
  },
  {
    key: "clinic_operator",
    label: "Klinikos Clinic Operator (legacy evidence only)",
    audience: "clinic",
    billing: "custom",
    priceCents: null,
    revenueClass: "historical_evidence",
    commercialRoute: "historical_evidence_only",
    priceType: "historical",
    qualificationRequired: false,
    conversionDestination: null,
    lifecycle: "legacy_evidence_only",
    publicPurchasable: false,
    modules: ["revenue_recovery", "billing_readiness", "grid", "advanced_reports"],
    whopPlanEnvVars: ["WHOP_PLAN_CLINIC_OPERATOR"],
    allowanceEnv: {
      ai: "KLINIKOS_ALLOWANCE_CLINIC_AI_CENTS",
      voice: "KLINIKOS_ALLOWANCE_CLINIC_VOICE_CENTS",
      sms: "KLINIKOS_ALLOWANCE_CLINIC_SMS_CENTS",
      email: "KLINIKOS_ALLOWANCE_CLINIC_EMAIL_CENTS",
      maps: "KLINIKOS_ALLOWANCE_CLINIC_MAPS_CENTS",
      document_processing: "KLINIKOS_ALLOWANCE_CLINIC_DOCUMENTS_CENTS",
      storage: "KLINIKOS_ALLOWANCE_CLINIC_STORAGE_CENTS",
      integrations: "KLINIKOS_ALLOWANCE_CLINIC_INTEGRATIONS_CENTS",
    },
    postPurchaseBoundary: clinicBoundary,
  },
  {
    key: "grid_professional",
    label: "Klinikos Grid Professional (legacy Whop evidence)",
    audience: "professional",
    billing: "monthly",
    // Historical processor amount retained for reconciliation only. Current public
    // Grid subscription truth lives in `gridPlans` and must not be inferred from this.
    priceCents: 3_900,
    revenueClass: "historical_evidence",
    commercialRoute: "historical_evidence_only",
    priceType: "historical",
    qualificationRequired: false,
    conversionDestination: null,
    lifecycle: "legacy_evidence_only",
    publicPurchasable: false,
    modules: ["grid"],
    whopPlanEnvVars: ["WHOP_PLAN_GRID_PROFESSIONAL", "WHOP_PLAN_GRID_PROVIDER"],
    allowanceEnv: { maps: "KLINIKOS_ALLOWANCE_GRID_PROFESSIONAL_MAPS_CENTS" },
    postPurchaseBoundary:
      "Historical payment evidence never verifies a professional credential or makes someone eligible for regulated work. Grid eligibility remains deterministic and contextual.",
  },
  {
    key: "grid_facility",
    label: "Klinikos Grid Facility (legacy Whop evidence)",
    audience: "facility",
    billing: "monthly",
    // Historical processor amount retained for reconciliation only. Current public
    // organization pricing lives in `gridPlans` and must not be inferred from this.
    priceCents: 9_900,
    revenueClass: "historical_evidence",
    commercialRoute: "historical_evidence_only",
    priceType: "historical",
    qualificationRequired: false,
    conversionDestination: null,
    lifecycle: "legacy_evidence_only",
    publicPurchasable: false,
    modules: ["grid"],
    whopPlanEnvVars: ["WHOP_PLAN_GRID_FACILITY", "WHOP_PLAN_GRID_LOCATION_PARTNER"],
    allowanceEnv: { maps: "KLINIKOS_ALLOWANCE_GRID_FACILITY_MAPS_CENTS" },
    postPurchaseBoundary:
      "Historical payment evidence never verifies facility authority, permitted use, insurance, or regulated-service eligibility. Those checks remain separate.",
  },
] as const;

export function getCommercialProduct(key: string | null | undefined) {
  return commercialProducts.find((product) => product.key === key);
}

export function canStartNewCommercialCheckout(product: CommercialProduct) {
  return product.lifecycle === "active";
}

export function resolveCommercialCheckoutAmount(product: CommercialProduct, requestedAmountCents?: number | null) {
  const amountCents = requestedAmountCents ?? product.priceCents ?? null;
  if (amountCents !== null && (!Number.isInteger(amountCents) || amountCents < 0)) {
    throw new Error("Expected checkout amount must be a non-negative integer number of cents.");
  }
  if (product.priceCents !== null && amountCents !== product.priceCents) {
    throw new Error(`Checkout amount does not match the server-owned price for ${product.label}.`);
  }
  return amountCents;
}

export function whopPlanIdForProduct(product: CommercialProduct, env: NodeJS.ProcessEnv = process.env) {
  for (const key of product.whopPlanEnvVars) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return null;
}

export function productForWhopPlanId(planId: string | null | undefined, env: NodeJS.ProcessEnv = process.env) {
  const candidate = planId?.trim();
  if (!candidate) return undefined;
  return commercialProducts.find((product) => whopPlanIdForProduct(product, env) === candidate);
}

export function configuredAllowanceCents(product: CommercialProduct, env: NodeJS.ProcessEnv = process.env) {
  return Object.entries(product.allowanceEnv).flatMap(([bucket, variable]) => {
    if (!variable) return [];
    const raw = env[variable]?.trim();
    if (!raw) return [];
    const amount = Number(raw);
    if (!Number.isInteger(amount) || amount < 0) return [];
    return [{ bucket, amountCents: amount }];
  });
}
