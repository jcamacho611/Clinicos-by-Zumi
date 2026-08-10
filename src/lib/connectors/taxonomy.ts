/**
 * Connector taxonomy.
 *
 * Every external dependency in Klinikos is classified on five independent axes.
 * They are independent because collapsing them is how a product ends up claiming a
 * capability it does not have: "configured" is not "contracted", "contracted" is not
 * "approved for PHI", and none of them is "live".
 *
 *   1. Gateway        — which boundary owns the vendor call.
 *   2. Integration    — the mechanical shape of the wiring.
 *   3. Ownership      — whose account and whose credentials.
 *   4. Economics      — who bears the variable cost, and when it is incurred.
 *   5. Readiness      — nine separate gates, each independently true or false.
 *
 * Pure module. No database, no network, no environment reads.
 */

// ---------------------------------------------------------------------------
// 1. Gateways
// ---------------------------------------------------------------------------

/**
 * The boundary that owns a vendor call.
 *
 * UI → Klinikos service → gateway → adapter → vendor. Nothing above a gateway may
 * hold a vendor SDK, and no vendor-specific logic belongs in a UI component.
 */
export const gateways = [
  "ai",
  "location",
  "payment",
  "communication",
  "healthcare_transaction",
  "clinical_network",
  "credentialing",
  "document",
  "telehealth",
] as const;
export type Gateway = (typeof gateways)[number];

export const gatewayLabels: Record<Gateway, string> = {
  ai: "AI Gateway",
  location: "Location Gateway",
  payment: "Payment Gateway",
  communication: "Communication Gateway",
  healthcare_transaction: "Healthcare Transaction Gateway",
  clinical_network: "Clinical Network Gateway",
  credentialing: "Credentialing Gateway",
  document: "Document Gateway",
  telehealth: "Telehealth Gateway",
};

// ---------------------------------------------------------------------------
// 2. Integration classes
// ---------------------------------------------------------------------------

/**
 * How the wiring physically works.
 *
 * `server_only` is the default and the safe one: browser → Klinikos → vendor, never
 * browser → vendor with a secret. `browser_and_server` is an explicit, narrow
 * exception for vendors that legitimately require a separately-restricted public key.
 */
export const integrationClasses = [
  "server_only",
  "browser_and_server",
  "webhook_driven",
  "oauth_authorized",
  "regulated_network",
] as const;
export type IntegrationClass = (typeof integrationClasses)[number];

// ---------------------------------------------------------------------------
// 3. Ownership classes
// ---------------------------------------------------------------------------

/**
 * Whose relationship this is.
 *
 * The distinction decides who pays, who can revoke access, and who must be asked
 * before data moves. `patient_authorized` is separate from `clinic_owned` because the
 * clinic cannot consent on the patient's behalf.
 */
export const ownershipClasses = ["klinikos_owned", "clinic_owned", "patient_authorized", "regulated_network"] as const;
export type OwnershipClass = (typeof ownershipClasses)[number];

// ---------------------------------------------------------------------------
// 4. Economic classes
// ---------------------------------------------------------------------------

/**
 * Who bears the variable cost, and when it is incurred.
 *
 *   A — Klinikos platform infrastructure. Metered internally, recovered in pricing.
 *   B — the clinic's own external relationship. Klinikos connects it, does not buy it.
 *   C — activate after sale. The expense waits until a customer needs the feature.
 *
 * The governing principle: revenue should precede avoidable variable cost.
 */
export const economicClasses = ["A_platform", "B_customer_owned", "C_activate_after_sale"] as const;
export type EconomicClass = (typeof economicClasses)[number];

export const economicClassLabels: Record<EconomicClass, string> = {
  A_platform: "Klinikos platform infrastructure",
  B_customer_owned: "Customer-owned relationship",
  C_activate_after_sale: "Activated after sale",
};

// ---------------------------------------------------------------------------
// 5. Readiness gates
// ---------------------------------------------------------------------------

/**
 * Nine gates, each independently true or false.
 *
 * A single status enum cannot express "we have working credentials but no BAA", which
 * is precisely the state most integrations sit in for months and precisely the state
 * that gets misreported as "integrated".
 */
export const readinessGates = [
  "configured",
  "sandbox_ready",
  "contract_complete",
  "baa_complete",
  "security_review_complete",
  "enrollment_complete",
  "production_credentials",
  "phi_approved",
  "production_live",
] as const;
export type ReadinessGate = (typeof readinessGates)[number];

export type ReadinessGates = Partial<Record<ReadinessGate, boolean>>;

export const readinessGateLabels: Record<ReadinessGate, string> = {
  configured: "Credentials present",
  sandbox_ready: "Sandbox usable",
  contract_complete: "Commercial contract executed",
  baa_complete: "Business Associate Agreement executed",
  security_review_complete: "Security review complete",
  enrollment_complete: "Vendor/payer enrollment complete",
  production_credentials: "Production credentials issued",
  phi_approved: "Approved for protected health information",
  production_live: "Live in production",
};

/**
 * Provisioning states a customer may be shown.
 *
 * Deliberately includes the honest waiting states. A healthcare vendor that requires
 * manual enrollment cannot be made instant, and showing "Active" while an enrollment
 * is pending is the lie this vocabulary exists to prevent.
 */
export const provisioningStates = [
  "not_started",
  "payment_received",
  "provisioning",
  "vendor_connection_required",
  "enrollment_pending",
  "compliance_review_pending",
  "ready",
  "active",
  "unavailable",
] as const;
export type ProvisioningState = (typeof provisioningStates)[number];

export const provisioningStateLabels: Record<ProvisioningState, string> = {
  not_started: "Not started",
  payment_received: "Payment received",
  provisioning: "Provisioning",
  vendor_connection_required: "Connection required",
  enrollment_pending: "Enrollment pending",
  compliance_review_pending: "Compliance review pending",
  ready: "Ready",
  active: "Active",
  unavailable: "Unavailable",
};

// ---------------------------------------------------------------------------
// Readiness evaluation
// ---------------------------------------------------------------------------

export type ConnectorReadinessInput = {
  gates: ReadinessGates;
  /** Whether this connector would carry PHI in the use it is being evaluated for. */
  handlesPhi: boolean;
  /** Whether the vendor requires a BAA before PHI. */
  baaRequired: boolean;
};

export type ConnectorReadiness = {
  /** Safe for non-PHI production traffic. */
  productionUsable: boolean;
  /** Safe to send protected health information. */
  phiUsable: boolean;
  /** Safe for sandbox/test traffic only. */
  sandboxUsable: boolean;
  /** Gates still outstanding for full production PHI use, in order. */
  missingGates: ReadinessGate[];
  /** The single most accurate short label for this connector's state. */
  summary: string;
};

const PRODUCTION_GATES: ReadinessGate[] = [
  "configured",
  "contract_complete",
  "security_review_complete",
  "production_credentials",
  "production_live",
];

/**
 * Evaluate what a connector may actually be used for.
 *
 * Fails closed on every axis. An unspecified gate is false, not "probably fine", so a
 * connector added to the catalog without its gates filled in reports as unusable
 * rather than quietly reporting as ready.
 */
export function evaluateConnectorReadiness(input: ConnectorReadinessInput): ConnectorReadiness {
  const gate = (name: ReadinessGate) => input.gates[name] === true;

  const sandboxUsable = gate("sandbox_ready") && gate("configured");
  const productionUsable = PRODUCTION_GATES.every(gate);

  // PHI needs everything production needs, plus enrollment, an explicit PHI approval,
  // and — when the vendor requires one — an executed BAA.
  const phiUsable =
    productionUsable &&
    gate("enrollment_complete") &&
    gate("phi_approved") &&
    (!input.baaRequired || gate("baa_complete"));

  const required: ReadinessGate[] = [...PRODUCTION_GATES];
  if (input.handlesPhi) {
    required.push("enrollment_complete", "phi_approved");
    if (input.baaRequired) required.push("baa_complete");
  }
  const missingGates = readinessGates.filter((name) => required.includes(name) && !gate(name));

  return {
    productionUsable,
    phiUsable,
    sandboxUsable,
    missingGates,
    summary: readinessSummary({ productionUsable, phiUsable, sandboxUsable, configured: gate("configured") }),
  };
}

function readinessSummary(input: { productionUsable: boolean; phiUsable: boolean; sandboxUsable: boolean; configured: boolean }) {
  if (input.phiUsable) return "Live, approved for PHI";
  if (input.productionUsable) return "Live, not approved for PHI";
  if (input.sandboxUsable) return "Sandbox only";
  if (input.configured) return "Credentials present, not approved for use";
  return "Pending connection";
}

/**
 * Whether PHI may be sent to this connector right now.
 *
 * Separated from `evaluateConnectorReadiness` so call sites read as the question they
 * are actually asking, and so this can never be answered by inspecting a status string.
 */
export function phiEgressAllowed(input: ConnectorReadinessInput) {
  return evaluateConnectorReadiness(input).phiUsable;
}

export const CONFIGURED_IS_NOT_APPROVED =
  "A working API key is not approval. A connector may only carry production traffic once its commercial, security, and credential gates are complete, and may only carry protected health information once enrollment, PHI approval, and any required Business Associate Agreement are also complete.";
