import type { CommercialCostBucket } from "@/lib/commercial/customer-funded-access";

export const variableCostOwners = ["tenant", "platform", "transaction", "unknown"] as const;
export type VariableCostOwner = (typeof variableCostOwners)[number];

export const variableFundingModes = [
  "micro_pool_reservation",
  "meter_then_micro_reconcile",
  "platform_budget",
  "transaction_economics",
  "pending_decision",
] as const;
export type VariableFundingMode = (typeof variableFundingModes)[number];

export const variableEconomicReadinessStates = [
  "policy_resolved",
  "requires_micro_persistence",
  "pending_decision",
] as const;
export type VariableEconomicReadinessState = (typeof variableEconomicReadinessStates)[number];

export type VariableCostRailPolicy = {
  readonly key: string;
  readonly provider: string;
  readonly capability: string;
  readonly costOwner: VariableCostOwner;
  readonly bucket: CommercialCostBucket;
  readonly fundingMode: VariableFundingMode;
  /**
   * Economic readiness only. This never proves connector, consent, PHI, credential,
   * legal, tenant, or production-provider readiness.
   */
  readonly economicReadiness: VariableEconomicReadinessState;
  readonly reason: string;
};

/**
 * Canonical economic ownership for variable-cost rails.
 *
 * This registry deliberately answers only two questions:
 *   1. whose economics own the marginal cost?
 *   2. which accounting/funding path must govern it?
 *
 * It is NOT a provider-readiness or permission registry. A resolved economic policy can
 * still be blocked by auth, consent, PHI, credential, legal, connector, or deployment
 * requirements. Likewise a configured provider is never evidence that customer funding
 * exists.
 */
export const variableCostRailPolicies: readonly VariableCostRailPolicy[] = [
  {
    key: "public_zumi_inference",
    provider: "selected_zumi_provider",
    capability: "zumi.public_inference",
    costOwner: "platform",
    bucket: "ai",
    fundingMode: "platform_budget",
    economicReadiness: "policy_resolved",
    reason:
      "Anonymous public Zumi is an acquisition/product-comprehension surface. Its provider cost belongs to Klinikos, not to an unidentified clinic. Paid inference remains separately gated by the durable public quota boundary.",
  },
  {
    key: "authenticated_zumi_inference",
    provider: "selected_zumi_provider",
    capability: "zumi.authenticated_inference",
    costOwner: "tenant",
    bucket: "ai",
    fundingMode: "meter_then_micro_reconcile",
    economicReadiness: "requires_micro_persistence",
    reason:
      "Authenticated tenant inference has measured micro-USD provider cost, but the durable aggregate micro-funding pool/reconciliation path must exist before provider metering can be treated as completed customer funding.",
  },
  {
    key: "patient_sms",
    provider: "twilio",
    capability: "communications.patient_sms",
    costOwner: "tenant",
    bucket: "sms",
    fundingMode: "micro_pool_reservation",
    economicReadiness: "requires_micro_persistence",
    reason:
      "Clinic-triggered patient messaging is tenant operating usage. Consent, suppression, PHI, sender, and routing policy must run before economic reservation, and current whole-cent-per-message funding must not be used as a substitute for the micro pool.",
  },
  {
    key: "patient_followup_email",
    provider: "resend_or_selected_email_provider",
    capability: "communications.patient_followup_email",
    costOwner: "tenant",
    bucket: "email",
    fundingMode: "micro_pool_reservation",
    economicReadiness: "requires_micro_persistence",
    reason:
      "Per-message marginal email economics can be sub-cent and pooled. Aggregate micro-unit funding avoids both one-cent-per-email overcharging and silent platform subsidy.",
  },
  {
    key: "evaluation_access_email",
    provider: "resend_or_selected_email_provider",
    capability: "platform.evaluation_access_verification",
    costOwner: "platform",
    bucket: "email",
    fundingMode: "platform_budget",
    economicReadiness: "policy_resolved",
    reason:
      "Evaluation/access verification protects and distributes Klinikos itself, so it is a platform acquisition/security expense rather than clinic tenant usage.",
  },
  {
    key: "phone_verification",
    provider: "twilio_verify_or_selected_verifier",
    capability: "identity.phone_verification",
    costOwner: "unknown",
    bucket: "identity_verification",
    fundingMode: "pending_decision",
    economicReadiness: "pending_decision",
    reason:
      "Phone-possession verification may serve platform security, clinic workflow, or both. No production caller may silently assign it to a tenant until ownership is explicitly decided for that use case.",
  },
  {
    key: "paid_geocoding_routing",
    provider: "provider_selected_at_runtime",
    capability: "grid.geocoding_routing",
    costOwner: "tenant",
    bucket: "maps",
    fundingMode: "micro_pool_reservation",
    economicReadiness: "requires_micro_persistence",
    reason:
      "Core Grid mapping is keyless. Any optional paid enrichment must have a reviewed provider/use case and tenant-backed micro funding before the paid call executes.",
  },
  {
    key: "eligibility_transaction",
    provider: "stedi_or_selected_clearinghouse",
    capability: "revenue.eligibility",
    costOwner: "tenant",
    bucket: "eligibility",
    fundingMode: "micro_pool_reservation",
    economicReadiness: "requires_micro_persistence",
    reason:
      "Eligibility checks are clinic transaction usage. Production gateway execution needs applicable clinical/privacy/connectivity gates plus tenant-backed funding before the paid transaction.",
  },
  {
    key: "telemedicine_transport",
    provider: "provider_selected_at_runtime",
    capability: "telemedicine.video",
    costOwner: "tenant",
    bucket: "telemedicine",
    fundingMode: "meter_then_micro_reconcile",
    economicReadiness: "requires_micro_persistence",
    reason:
      "External video transport can accrue metered tenant cost. Exact vendor billing units and approved PHI posture remain separate readiness requirements.",
  },
  {
    key: "production_storage",
    provider: "provider_selected_at_runtime",
    capability: "records.object_storage",
    costOwner: "tenant",
    bucket: "storage",
    fundingMode: "meter_then_micro_reconcile",
    economicReadiness: "requires_micro_persistence",
    reason:
      "Tenant storage, operations, and egress require measured usage plus a documented shared-infrastructure allocation policy before customer reconciliation is truthful.",
  },
  {
    key: "stripe_customer_payment",
    provider: "stripe",
    capability: "payments.customer_charge",
    costOwner: "transaction",
    bucket: "payments",
    fundingMode: "transaction_economics",
    economicReadiness: "policy_resolved",
    reason:
      "Processor fees belong to verified payment/transaction economics, not optional feature-usage allowances. Browser return never establishes paid state.",
  },
  {
    key: "grid_external_payout",
    provider: "stripe_connect_or_equivalent",
    capability: "grid.payout",
    costOwner: "transaction",
    bucket: "grid",
    fundingMode: "transaction_economics",
    economicReadiness: "policy_resolved",
    reason:
      "Marketplace payout cost belongs to the transaction and must remain separate from proposed Grid platform fees, refunds, disputes, eligibility, and clinical/referral economics.",
  },
] as const;

export function variableCostRailPolicy(key: string) {
  return variableCostRailPolicies.find((policy) => policy.key === key) ?? null;
}

/** True only when economic ownership/accounting policy itself is settled. */
export function variableEconomicPolicyResolved(policy: VariableCostRailPolicy) {
  return policy.costOwner !== "unknown"
    && policy.fundingMode !== "pending_decision"
    && policy.economicReadiness === "policy_resolved";
}

/**
 * Tenant provider spend may not execute from economic policy alone until the durable
 * micro-unit reservation/reconciliation authority exists. This is intentionally stricter
 * than `variableEconomicPolicyResolved`.
 */
export function tenantVariableSpendFundingReady(policy: VariableCostRailPolicy) {
  return policy.costOwner === "tenant"
    && policy.economicReadiness === "policy_resolved"
    && (policy.fundingMode === "micro_pool_reservation" || policy.fundingMode === "meter_then_micro_reconcile");
}
