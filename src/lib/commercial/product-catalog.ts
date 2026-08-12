export const commercialProductKeys = [
  "clinic_operator",
  "grid_professional",
  "grid_facility",
] as const;

export type CommercialProductKey = (typeof commercialProductKeys)[number];

export type CommercialProduct = {
  key: CommercialProductKey;
  label: string;
  audience: "clinic" | "professional" | "facility";
  modules: readonly string[];
  whopPlanEnvVars: readonly string[];
  allowanceEnv: Partial<Record<
    "ai" | "voice" | "sms" | "email" | "maps" | "document_processing" | "storage" | "integrations",
    string
  >>;
  boundary: string;
};

export const commercialProducts: readonly CommercialProduct[] = [
  {
    key: "clinic_operator",
    label: "Klinikos Clinic Operator",
    audience: "clinic",
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
    boundary:
      "Payment may activate purchased software access, but it does not override PHI, clinical, connector, credential, Grid eligibility, or production-readiness gates.",
  },
  {
    key: "grid_professional",
    label: "Klinikos Grid Professional",
    audience: "professional",
    modules: ["grid"],
    whopPlanEnvVars: ["WHOP_PLAN_GRID_PROFESSIONAL", "WHOP_PLAN_GRID_PROVIDER"],
    allowanceEnv: { maps: "KLINIKOS_ALLOWANCE_GRID_PROFESSIONAL_MAPS_CENTS" },
    boundary:
      "Payment never verifies a professional credential or makes someone eligible for regulated work. Eligibility remains deterministic and contextual.",
  },
  {
    key: "grid_facility",
    label: "Klinikos Grid Facility",
    audience: "facility",
    modules: ["grid"],
    whopPlanEnvVars: ["WHOP_PLAN_GRID_FACILITY", "WHOP_PLAN_GRID_LOCATION_PARTNER"],
    allowanceEnv: { maps: "KLINIKOS_ALLOWANCE_GRID_FACILITY_MAPS_CENTS" },
    boundary:
      "Payment never verifies facility authority, permitted use, insurance, or regulated-service eligibility.",
  },
] as const;

export function getCommercialProduct(key: string | null | undefined) {
  return commercialProducts.find((product) => product.key === key);
}

export function whopPlanIdForProduct(product: CommercialProduct, env: NodeJS.ProcessEnv = process.env) {
  for (const variable of product.whopPlanEnvVars) {
    const value = env[variable]?.trim();
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
    const raw = variable ? env[variable]?.trim() : undefined;
    if (!raw) return [];
    const amount = Number(raw);
    if (!Number.isInteger(amount) || amount < 0) return [];
    return [{ bucket, amountCents: amount }];
  });
}
