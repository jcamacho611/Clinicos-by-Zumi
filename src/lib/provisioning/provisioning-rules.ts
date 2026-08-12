import type { AccessProductKey } from "@/lib/commerce/access-product-catalog";
import { getAccessTier, type AccessTierKey } from "@/lib/commerce/whop-catalog";
import { planKeys, type PlanKey } from "@/lib/growth/pricing";

/**
 * Payment-driven provisioning.
 *
 * The bridge between "someone paid" and "their clinic can use what they paid for".
 * Before this existed, a verified purchase produced a `WhopEntitlement` and nothing
 * else — while Zumi resolves entitlements from `ClinicSubscription.modules`. The two
 * never met, so a paying customer was still refused with a 402. This module is the
 * single mapping that closes that gap.
 *
 * Two rules shape everything below:
 *
 *   1. **Payment activates only what payment can activate.** A purchase buys software
 *      access. It does not complete a credential review, sign an agreement, enrol a
 *      clinic with a payer, or approve a deployment for PHI. Anything gated on one of
 *      those is provisioned into a *pending* state that says which gate it is waiting
 *      on, never into an active one.
 *
 *   2. **Provisioning is derived, never asserted.** Modules come from the purchased
 *      tier or plan. Nothing in a webhook payload or a request body can name the
 *      modules to grant.
 *
 * Pure module. No database, no network.
 */

/**
 * Capability modules a subscription can carry.
 *
 * This is the vocabulary `ClinicSubscription.modules` stores and Zumi's capability
 * catalog reads. Keeping it as one closed list is what stops the two sides drifting
 * into different spellings of the same idea.
 */
export const subscriptionModules = [
  "clinic_workspace",
  "scheduling",
  "intake_forms",
  "tasks",
  "crm",
  "referrals",
  "results",
  "documents",
  "billing_readiness",
  "revenue_recovery",
  "advanced_reports",
  "grid",
  "multi_location",
  "migration",
] as const;
export type SubscriptionModule = (typeof subscriptionModules)[number];

/** Everything a clinic subscription includes at any paid level. */
const CORE_CLINIC_MODULES: readonly SubscriptionModule[] = [
  "clinic_workspace", "scheduling", "intake_forms", "tasks", "crm", "referrals", "results", "documents",
];

/**
 * Modules granted by each Whop access tier.
 *
 * `evaluator_pass` grants none on purpose. Evaluation access is materials, not a
 * workspace, and an evaluator who quietly received operational modules would be an
 * evaluator using the product for free.
 */
const TIER_MODULES: Record<AccessTierKey, readonly SubscriptionModule[]> = {
  evaluator_pass: [],
  clinic_operator: [...CORE_CLINIC_MODULES, "billing_readiness", "revenue_recovery", "grid"],
  grid_provider: ["grid"],
  grid_location_partner: ["grid"],
};

/** Modules granted by each Klinikos plan sold through the Growth Engine. */
const PLAN_MODULES: Record<PlanKey, readonly SubscriptionModule[]> = {
  klinikos: [...CORE_CLINIC_MODULES, "billing_readiness", "revenue_recovery"],
  klinikos_multi: [...CORE_CLINIC_MODULES, "billing_readiness", "revenue_recovery", "advanced_reports", "grid", "multi_location"],
  klinikos_enterprise: [...CORE_CLINIC_MODULES, "billing_readiness", "revenue_recovery", "advanced_reports", "grid", "multi_location", "migration"],
};

/**
 * Modules granted by each one-time marketplace product.
 *
 * Read from what each catalog entry says it includes, not from its `roleTarget`. Two
 * products share `roleTarget: "clinic"` and grant opposite things: a Founding Clinic
 * Seat is an implementation package with a workspace, while a Private Workflow Review
 * explicitly excludes an ongoing software subscription. Deriving from the role made the
 * review grant the seat's capabilities.
 *
 * The three review products grant `grid` and nothing else. Their buyer has to sign in
 * to submit the profile, listing, and evidence the review is *of* — but credential and
 * listing gates still stand between that and any published listing or booked work, and
 * those gates are enforced elsewhere and unaffected by this.
 *
 * The two service fees grant nothing. The consulting call says so in as many words
 * ("Software access or a portal seat" is in its `doesNotInclude`), and the workflow
 * review excludes the subscription.
 */
const PRODUCT_MODULES: Record<AccessProductKey, readonly SubscriptionModule[]> = {
  clinic_workflow_review: [],
  founding_clinic_seat: [...CORE_CLINIC_MODULES, "billing_readiness", "revenue_recovery"],
  contractor_application_review: ["grid"],
  room_listing_review: ["grid"],
  seller_listing_review: ["grid"],
  ai_consulting_call: [],
};

export function modulesForAccessProduct(productKey: string): readonly SubscriptionModule[] {
  return PRODUCT_MODULES[productKey as AccessProductKey] ?? [];
}

export function modulesForTier(tierKey: string): readonly SubscriptionModule[] {
  return TIER_MODULES[tierKey as AccessTierKey] ?? [];
}

export function modulesForPlan(planKey: string): readonly SubscriptionModule[] {
  return PLAN_MODULES[planKey as PlanKey] ?? [];
}

// ---------------------------------------------------------------------------
// Provisioning steps
// ---------------------------------------------------------------------------

/**
 * The ordered steps a payment triggers.
 *
 * Each is recorded individually so a run that fails halfway can resume from where it
 * stopped rather than starting over — which matters because several of these are not
 * safely repeatable in bulk.
 */
export const provisioningSteps = [
  "organization",
  "subscription",
  "entitlements",
  "onboarding",
  "connections",
  "regulated_review",
] as const;
export type ProvisioningStep = (typeof provisioningSteps)[number];

export const provisioningStepLabels: Record<ProvisioningStep, string> = {
  organization: "Create the clinic workspace",
  subscription: "Activate the subscription",
  entitlements: "Enable purchased capabilities",
  onboarding: "Start guided onboarding",
  connections: "Request the connections your clinic already has",
  regulated_review: "Begin reviews that require a person",
};

export const stepStates = ["pending", "in_progress", "complete", "blocked", "not_applicable"] as const;
export type StepState = (typeof stepStates)[number];

/**
 * Steps payment alone can finish, and steps it cannot.
 *
 * `connections` and `regulated_review` can never complete from a payment: one needs
 * the clinic to connect an account it owns, the other needs a person. Marking either
 * complete on payment would be exactly the fake instant activation the product
 * constitution forbids.
 */
const PAYMENT_COMPLETABLE: readonly ProvisioningStep[] = ["organization", "subscription", "entitlements", "onboarding"];

export function stepCompletableByPayment(step: ProvisioningStep) {
  return PAYMENT_COMPLETABLE.includes(step);
}

export type ProvisioningPlan = {
  steps: readonly { step: ProvisioningStep; state: StepState; detail: string }[];
  modules: readonly SubscriptionModule[];
  /** What still stands between the customer and full use, in plain words. */
  outstanding: readonly string[];
};

/**
 * Build the provisioning plan for a purchase.
 *
 * Returns the whole picture — what activates now, what is waiting, and on what — so a
 * post-purchase screen can tell the truth in one read rather than showing a spinner
 * over work that will never finish on its own.
 */
/**
 * The role a buyer holds in the organization their purchase creates.
 *
 * A GRID contractor is not the owner of a clinic, and giving them that role because it
 * was the only one the code knew about would hand a marketplace participant the
 * permissions of a practice owner.
 */
export function buyerRoleForModules(modules: readonly string[]): "clinic_owner" | "contractor" {
  return modules.includes("clinic_workspace") ? "clinic_owner" : "contractor";
}

export function planProvisioning(input: {
  /** Whop tier, when the purchase came through the access-pass path. */
  tierKey?: string;
  /** Klinikos plan, when the purchase came through the Growth Engine path. */
  planKey?: string;
  /** Marketplace product, when the purchase was a one-time access payment. */
  productKey?: string;
  /** Whether the buyer already belongs to an organization. */
  hasOrganization: boolean;
}): ProvisioningPlan {
  const modules = input.planKey
    ? modulesForPlan(input.planKey)
    : input.productKey
      ? modulesForAccessProduct(input.productKey)
      : modulesForTier(input.tierKey ?? "");
  const tier = input.tierKey ? getAccessTier(input.tierKey) : undefined;

  // An evaluator has bought materials, not a workspace. Provisioning one would hand
  // out the product the evaluation is meant to lead to.
  const workspaceBearing = modules.length > 0 && modules.includes("clinic_workspace");

  // Anything that grants a module needs somewhere for the buyer to sign in to, because
  // every Klinikos account is scoped to a tenant. A GRID pass grants only `grid`, but
  // its buyer still has to authenticate — treating "no clinic workspace" as "no
  // account" is what left paid GRID buyers with nothing to log in to.
  const accountBearing = modules.length > 0;

  const steps: { step: ProvisioningStep; state: StepState; detail: string }[] = [
    {
      step: "organization",
      state: !accountBearing ? "not_applicable" : input.hasOrganization ? "complete" : "pending",
      detail: !accountBearing
        ? "This purchase does not include a Klinikos account."
        : input.hasOrganization
          ? "Linked to your existing organization."
          : workspaceBearing
            ? "A clinic workspace is created on payment."
            : "A Klinikos account is created on payment so you can sign in to GRID.",
    },
    {
      step: "subscription",
      state: modules.length === 0 ? "not_applicable" : "pending",
      detail: modules.length === 0 ? "No subscription modules are included." : "Recorded against your clinic on payment.",
    },
    {
      step: "entitlements",
      state: modules.length === 0 ? "not_applicable" : "pending",
      detail: modules.length === 0 ? "Nothing to enable." : `${modules.length} capability modules activate on payment.`,
    },
    {
      step: "onboarding",
      state: workspaceBearing ? "pending" : "not_applicable",
      detail: workspaceBearing ? "Guided setup opens once your workspace exists." : "No workspace setup is required.",
    },
    {
      // Never completable by payment: these are the clinic's own accounts.
      step: "connections",
      state: workspaceBearing ? "blocked" : "not_applicable",
      detail: "Laboratory, clearinghouse, payment, and messaging connections use accounts your clinic owns. Klinikos asks for them during onboarding.",
    },
    {
      step: "regulated_review",
      state: tier?.postPurchaseReview && !tier.postPurchaseReview.startsWith("None") ? "blocked" : "not_applicable",
      detail: tier?.postPurchaseReview ?? "No post-purchase review applies to this purchase.",
    },
  ];

  const outstanding: string[] = [];
  for (const entry of steps) {
    if (entry.state === "blocked") outstanding.push(entry.detail);
  }

  return { steps, modules, outstanding };
}

/**
 * An idempotency key for one purchase's provisioning.
 *
 * Derived from the payment identity rather than generated, so a webhook redelivery —
 * which Whop will do, and which is the normal case rather than the exception — resolves
 * to the same key and provisions nothing twice.
 */
export function provisioningKey(input: { source: "whop_membership" | "access_payment"; reference: string }) {
  return `${input.source}:${input.reference.trim()}`;
}

export const PAYMENT_DOES_NOT_GRANT = [
  "Credential or licence verification",
  "A signed Business Associate Agreement",
  "Clearinghouse or payer enrolment",
  "Approval to process protected health information",
  "Live laboratory, imaging, or e-prescribing connectivity",
] as const;

/** Sanity check used by tests: every plan key has a module mapping. */
export const MAPPED_PLAN_KEYS = planKeys;
