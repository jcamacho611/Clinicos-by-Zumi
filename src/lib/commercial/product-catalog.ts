import { clinicCommercialOffers, clinicPlans } from "@/lib/commercial/klinikos-commercial";

export const commercialProductKeys = [
  "operational_audit",
  "clinic_core",
  "clinic_growth",
  "clinic_scale",
  // Legacy internal alias retained only so previously recorded commercial evidence
  // remains readable. New clinic purchases use the named public plans above.
  "clinic_operator",
  "grid_professional",
  "grid_facility",
] as const;

export type CommercialProductKey = (typeof commercialProductKeys)[number];

export type CommercialProduct = {
  key: CommercialProductKey;
  label: string;
  audience: "clinic" | "professional" | "facility";
  billing: "one_time" | "monthly" | "custom";
  priceCents: number | null;
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

export const commercialProducts: readonly CommercialProduct[] = [
  {
    key: "operational_audit",
    label: clinicCommercialOffers.privateWorkflowReview.name,
    audience: "clinic",
    billing: "one_time",
    priceCents: clinicCommercialOffers.privateWorkflowReview.priceCents,
    publicPurchasable: false,
    modules: [],
    whopPlanEnvVars: [],
    allowanceEnv: {},
    postPurchaseBoundary:
      "Payment purchases the Clinic Operating Analysis only. It does not activate production software, PHI workflows, clinical authority, Grid eligibility, or any regulated capability.",
  },
  {
    key: "clinic_core",
    label: clinicPlans.core.name,
    audience: "clinic",
    billing: "monthly",
    priceCents: clinicPlans.core.monthlyPriceCents,
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
    key: "clinic_operator",
    label: "Klinikos Clinic Operator (legacy)",
    audience: "clinic",
    billing: "custom",
    priceCents: null,
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
    label: "Klinikos Grid Professional",
    audience: "professional",
    billing: "monthly",
    priceCents: 3_900,
    publicPurchasable: false,
    modules: ["grid"],
    whopPlanEnvVars: ["WHOP_PLAN_GRID_PROFESSIONAL", "WHOP_PLAN_GRID_PROVIDER"],
    allowanceEnv: { maps: "KLINIKOS_ALLOWANCE_GRID_PROFESSIONAL_MAPS_CENTS" },
    postPurchaseBoundary:
      "Payment never verifies a professional credential or makes someone eligible for regulated work. Grid eligibility remains deterministic and contextual.",
  },
  {
    key: "grid_facility",
    label: "Klinikos Grid Facility",
    audience: "facility",
    billing: "monthly",
    priceCents: 9_900,
    publicPurchasable: false,
    modules: ["grid"],
    whopPlanEnvVars: ["WHOP_PLAN_GRID_FACILITY", "WHOP_PLAN_GRID_LOCATION_PARTNER"],
    allowanceEnv: { maps: "KLINIKOS_ALLOWANCE_GRID_FACILITY_MAPS_CENTS" },
    postPurchaseBoundary:
      "Payment never verifies facility authority, permitted use, insurance, or regulated-service eligibility. Those checks remain separate.",
  },
] as const;

export function getCommercialProduct(key: string | null | undefined) {
  return commercialProducts.find((product) => product.key === key);
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
