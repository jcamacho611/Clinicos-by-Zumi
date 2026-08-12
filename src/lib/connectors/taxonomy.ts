/**
 * Connector integrity taxonomy.
 *
 * External dependencies are classified on five independent axes so Klinikos never
 * turns "we have an API key" into "this integration is approved for production".
 *
 * 1. Gateway: which server boundary owns the vendor call.
 * 2. Integration: how the wiring works.
 * 3. Ownership: whose account/authorization controls the relationship.
 * 4. Economics: who bears variable cost and when.
 * 5. Readiness: independent operational/compliance gates.
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

export const integrationClasses = [
  "server_only",
  "browser_and_server",
  "webhook_driven",
  "oauth_authorized",
  "regulated_network",
] as const;
export type IntegrationClass = (typeof integrationClasses)[number];

export const ownershipClasses = ["klinikos_owned", "clinic_owned", "patient_authorized", "regulated_network"] as const;
export type OwnershipClass = (typeof ownershipClasses)[number];

export const economicClasses = ["A_platform", "B_customer_owned", "C_activate_after_sale"] as const;
export type EconomicClass = (typeof economicClasses)[number];

export const economicClassLabels: Record<EconomicClass, string> = {
  A_platform: "Klinikos platform infrastructure",
  B_customer_owned: "Customer-owned relationship",
  C_activate_after_sale: "Activated after sale",
};

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
  configured: "Credentials/configuration present",
  sandbox_ready: "Sandbox usable",
  contract_complete: "Commercial contract executed",
  baa_complete: "Business Associate Agreement executed",
  security_review_complete: "Security review complete",
  enrollment_complete: "Vendor/payer enrollment complete",
  production_credentials: "Production credentials issued",
  phi_approved: "Approved for protected health information",
  production_live: "Live in production",
};

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

export type ConnectorReadinessInput = {
  gates: ReadinessGates;
  handlesPhi: boolean;
  baaRequired: boolean;
};

export type ConnectorReadiness = {
  productionUsable: boolean;
  phiUsable: boolean;
  sandboxUsable: boolean;
  missingGates: ReadinessGate[];
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
 * Fails closed. An unspecified gate is false, never "probably fine".
 *
 * `baaRequired` is deliberately independent from `handlesPhi`: a self-hosted service
 * may not require a third-party BAA but still requires security, enrollment/deployment
 * assurance, explicit PHI approval, and the rest of the production gates.
 */
export function evaluateConnectorReadiness(input: ConnectorReadinessInput): ConnectorReadiness {
  const gate = (name: ReadinessGate) => input.gates[name] === true;
  const sandboxUsable = gate("sandbox_ready") && gate("configured");
  const productionUsable = PRODUCTION_GATES.every(gate);
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
  if (input.configured) return "Configuration present, not approved for use";
  return "Pending connection";
}

export function phiEgressAllowed(input: ConnectorReadinessInput) {
  return evaluateConnectorReadiness(input).phiUsable;
}

export const CONFIGURED_IS_NOT_APPROVED =
  "Working configuration is not approval. Production traffic requires completed commercial/security/credential gates; PHI additionally requires enrollment, explicit PHI approval, and any required Business Associate Agreement.";
