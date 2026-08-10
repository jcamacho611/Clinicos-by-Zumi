/**
 * Klinikos paid-access catalog.
 *
 * Whop is the first commerce surface for paid Klinikos entry: a buyer purchases an
 * access pass on Whop, and Whop remains the source of truth for whether that
 * purchase is currently valid. This module holds the deterministic tier catalog and
 * the capabilities each tier unlocks. It contains no network or database access so
 * the entitlement rules stay testable.
 *
 * Nothing here grants access on its own. A tier only becomes an entitlement after a
 * signature-verified webhook or a server-side membership verification confirms it.
 */

export const accessCapabilities = [
  "evaluation_materials",
  "clinic_workspace",
  "grid_browse",
  "grid_publish_listing",
  "grid_send_request",
  "grid_receive_request",
  "grid_list_location",
  "grid_receive_payout",
] as const;

export type AccessCapability = (typeof accessCapabilities)[number];

export const accessTierKeys = ["evaluator_pass", "clinic_operator", "grid_provider", "grid_location_partner"] as const;

export type AccessTierKey = (typeof accessTierKeys)[number];

export type AccessTier = {
  key: AccessTierKey;
  name: string;
  audience: "evaluator" | "clinic" | "provider" | "location_partner";
  summary: string;
  /** Environment variable holding the Whop plan id that sells this tier. */
  planEnvVar: string;
  capabilities: readonly AccessCapability[];
  /** Legal document keys that must be accepted before this tier is usable. */
  requiredLegalDocuments: readonly string[];
  /**
   * Human approval that must still complete after purchase. Payment alone never
   * satisfies credentialing, facility authority, or clinical scope.
   */
  postPurchaseReview: string;
};

export const accessTierCatalog: readonly AccessTier[] = [
  {
    key: "evaluator_pass",
    name: "Evaluation Access Pass",
    audience: "evaluator",
    summary: "Time-boxed access to protected Klinikos product and implementation materials for evaluation only.",
    planEnvVar: "WHOP_PLAN_EVALUATOR_PASS",
    capabilities: ["evaluation_materials"],
    requiredLegalDocuments: ["access_terms", "privacy_policy"],
    postPurchaseReview: "None. Evaluation access does not grant clinic, GRID, or production use.",
  },
  {
    key: "clinic_operator",
    name: "Clinic Operator Access",
    audience: "clinic",
    summary: "Clinic workspace entry plus the requesting side of the GRID marketplace.",
    planEnvVar: "WHOP_PLAN_CLINIC_OPERATOR",
    capabilities: ["evaluation_materials", "clinic_workspace", "grid_browse", "grid_send_request", "grid_list_location"],
    requiredLegalDocuments: ["clinic_msa", "clinic_baa", "acceptable_use", "grid_marketplace_terms", "grid_location_terms"],
    postPurchaseReview: "Clinic onboarding and signed commercial documents are required before production workspace use.",
  },
  {
    key: "grid_provider",
    name: "GRID Provider Access",
    audience: "provider",
    summary: "Independent provider entry to the GRID marketplace: listings, inbound requests, and payout records.",
    planEnvVar: "WHOP_PLAN_GRID_PROVIDER",
    capabilities: ["grid_browse", "grid_publish_listing", "grid_receive_request", "grid_receive_payout"],
    requiredLegalDocuments: ["grid_marketplace_terms", "grid_provider_terms", "acceptable_use"],
    postPurchaseReview: "License and malpractice evidence still require human verification before any request is accepted.",
  },
  {
    key: "grid_location_partner",
    name: "GRID Location Partner Access",
    audience: "location_partner",
    summary: "Chair, room, and partner-location listing access for facility owners.",
    planEnvVar: "WHOP_PLAN_GRID_LOCATION_PARTNER",
    capabilities: ["grid_browse", "grid_list_location", "grid_receive_request"],
    requiredLegalDocuments: ["grid_marketplace_terms", "grid_location_terms", "acceptable_use"],
    postPurchaseReview: "Facility authority, insurance, and allowed-service review remain manual administrator steps.",
  },
];

export function getAccessTier(key: string): AccessTier | undefined {
  return accessTierCatalog.find((tier) => tier.key === key);
}

export function tierCapabilities(key: string): readonly AccessCapability[] {
  return getAccessTier(key)?.capabilities ?? [];
}

/**
 * Resolve a Whop plan id back to a Klinikos tier using the configured environment
 * mapping. An unmapped plan id never resolves to a tier, so a purchase of an
 * unrecognised product cannot silently unlock Klinikos capabilities.
 */
export function resolveTierForPlan(planId: string | null | undefined, env: Record<string, string | undefined>): AccessTier | undefined {
  const candidate = planId?.trim();
  if (!candidate) return undefined;
  return accessTierCatalog.find((tier) => {
    const configured = env[tier.planEnvVar]?.trim();
    return Boolean(configured) && configured === candidate;
  });
}

/** Tiers that are actually purchasable right now, i.e. have a configured Whop plan id. */
export function purchasableTiers(env: Record<string, string | undefined>) {
  return accessTierCatalog.map((tier) => ({
    tier,
    planId: env[tier.planEnvVar]?.trim() || null,
    purchasable: Boolean(env[tier.planEnvVar]?.trim()),
  }));
}
