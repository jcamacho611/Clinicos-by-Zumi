import type { CommercialCostBucket } from "@/lib/commercial/customer-funded-access";

export const variableCostOwners = ["tenant", "platform", "transaction", "unknown"] as const;
export type VariableCostOwner = (typeof variableCostOwners)[number];

export const variableFundingModes = [
  "customer_reservation",
  "provider_meter_then_reconcile",
  "platform_budget",
  "transaction_economics",
  "batch_or_subcent_required",
  "pending_decision",
] as const;
export type VariableFundingMode = (typeof variableFundingModes)[number];

export const variableExecutionStates = ["executable", "adapter_ready", "pending_connection", "blocked"] as const;
export type VariableExecutionState = (typeof variableExecutionStates)[number];

export type VariableCostRailPolicy = {
  readonly key: string;
  readonly provider: string;
  readonly capability: string;
  readonly costOwner: VariableCostOwner;
  readonly bucket: CommercialCostBucket;
  readonly fundingMode: VariableFundingMode;
  readonly executionState: VariableExecutionState;
  readonly reason: string;
};

/**
 * Canonical ownership/funding classification for external rails that can create cost.
 *
 * This registry does not prove provider connectivity or legal/PHI approval. It answers a
 * narrower economic question before code is allowed to scale a side effect: whose money
 * is supposed to pay for it and which accounting path is authoritative?
 */
export const variableCostRailPolicies: readonly VariableCostRailPolicy[] = [
  {
    key: "patient_sms",
    provider: "twilio",
    capability: "communications.patient_sms",
    costOwner: "tenant",
    bucket: "sms",
    fundingMode: "customer_reservation",
    executionState: "adapter_ready",
    reason: "A clinic-triggered patient message is tenant operating usage; consent/PHI policy still runs before commercial funding.",
  },
  {
    key: "phone_verification",
    provider: "twilio_verify",
    capability: "identity.phone_verification",
    costOwner: "unknown",
    bucket: "identity_verification",
    fundingMode: "pending_decision",
    executionState: "adapter_ready",
    reason: "The adapter exists but no production caller establishes whether verification is clinic usage or platform security/onboarding cost.",
  },
  {
    key: "patient_followup_email",
    provider: "resend",
    capability: "communications.patient_followup_email",
    costOwner: "tenant",
    bucket: "email",
    fundingMode: "batch_or_subcent_required",
    executionState: "adapter_ready",
    reason: "Current email marginal overage is sub-cent and pooled-plan economics make whole-cent per-message settlement materially distortive.",
  },
  {
    key: "evaluation_access_email",
    provider: "resend",
    capability: "platform.evaluation_access_verification",
    costOwner: "platform",
    bucket: "email",
    fundingMode: "platform_budget",
    executionState: "executable",
    reason: "Evaluation-access verification protects/distributes Klinikos material and is a platform acquisition/security expense, not clinic tenant usage.",
  },
  {
    key: "cloudflare_ai",
    provider: "cloudflare_workers_ai",
    capability: "zumi.inference",
    costOwner: "tenant",
    bucket: "ai",
    fundingMode: "provider_meter_then_reconcile",
    executionState: "adapter_ready",
    reason: "Provider token usage is now priced into Zumi turn budgets; tenant commercial-ledger allocation remains a distinct adoption step.",
  },
  {
    key: "openai_ai",
    provider: "openai_responses",
    capability: "zumi.inference",
    costOwner: "tenant",
    bucket: "ai",
    fundingMode: "provider_meter_then_reconcile",
    executionState: "adapter_ready",
    reason: "Token/tool usage is modelled in micro-USD; full tenant funding/reconciliation must not be inferred merely from provider metering.",
  },
  {
    key: "paid_geocoding",
    provider: "provider_selected_at_runtime",
    capability: "grid.geocoding_routing",
    costOwner: "tenant",
    bucket: "maps",
    fundingMode: "customer_reservation",
    executionState: "pending_connection",
    reason: "Core Grid mapping is keyless; paid enrichment should be tenant-funded only after a reviewed provider and real product need exist.",
  },
  {
    key: "eligibility_transactions",
    provider: "stedi_or_clearinghouse",
    capability: "revenue.eligibility",
    costOwner: "tenant",
    bucket: "eligibility",
    fundingMode: "customer_reservation",
    executionState: "pending_connection",
    reason: "Eligibility is clinic transaction usage and must reserve tenant-backed funds before a production gateway call.",
  },
  {
    key: "telemedicine_video",
    provider: "provider_selected_at_runtime",
    capability: "telemedicine.video",
    costOwner: "tenant",
    bucket: "telemedicine",
    fundingMode: "customer_reservation",
    executionState: "pending_connection",
    reason: "Video transport is external infrastructure; exact vendor billing unit and approved PHI posture are not connected yet.",
  },
  {
    key: "production_storage",
    provider: "provider_selected_at_runtime",
    capability: "records.object_storage",
    costOwner: "tenant",
    bucket: "storage",
    fundingMode: "provider_meter_then_reconcile",
    executionState: "pending_connection",
    reason: "Tenant storage, operations and egress need metering plus a documented shared-infrastructure allocation policy.",
  },
  {
    key: "stripe_customer_payment",
    provider: "stripe",
    capability: "payments.customer_charge",
    costOwner: "transaction",
    bucket: "payments",
    fundingMode: "transaction_economics",
    executionState: "adapter_ready",
    reason: "Processor fees belong to payment economics and verified payment evidence, not to optional feature-usage allowance accounting.",
  },
  {
    key: "grid_external_payout",
    provider: "stripe_connect_or_equivalent",
    capability: "grid.payout",
    costOwner: "transaction",
    bucket: "grid",
    fundingMode: "transaction_economics",
    executionState: "pending_connection",
    reason: "Marketplace payout costs must remain distinct from platform fees, refunds, disputes and clinical/referral economics.",
  },
] as const;

export function variableCostRailPolicy(key: string) {
  return variableCostRailPolicies.find((policy) => policy.key === key) ?? null;
}

/** Unknown ownership is never an executable economic policy. */
export function economicallyExecutable(policy: VariableCostRailPolicy) {
  return policy.costOwner !== "unknown" && policy.fundingMode !== "pending_decision" && policy.executionState === "executable";
}
