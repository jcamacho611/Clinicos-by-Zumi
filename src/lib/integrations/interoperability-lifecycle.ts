import "server-only";

export const INTEROPERABILITY_LIFECYCLE = [
  "PLANNED",
  "CONTRACT_PENDING",
  "CREDENTIALS_PENDING",
  "SANDBOX",
  "CONNECTED",
  "UAT",
  "CONTROLLED_PRODUCTION",
  "PRODUCTION_VERIFIED",
  "DEGRADED",
  "DISABLED",
] as const;

export type InteroperabilityLifecycle = (typeof INTEROPERABILITY_LIFECYCLE)[number];

export interface InteroperabilityLifecycleInput {
  readonly status: string | null | undefined;
  readonly phase: string | null | undefined;
  /**
   * Durable reference to controlled production proof. The resolver never interprets
   * the contents of that evidence; it only requires that explicit evidence exists
   * before the lifecycle may be called production verified.
   */
  readonly productionEvidenceRef?: string | null;
}

export interface InteroperabilityLifecycleProjection {
  readonly lifecycle: InteroperabilityLifecycle;
  readonly productionVerified: boolean;
  readonly productionClaimAllowed: boolean;
  readonly reason: string;
}

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? "";
}

function projection(
  lifecycle: InteroperabilityLifecycle,
  reason: string,
): InteroperabilityLifecycleProjection {
  const productionVerified = lifecycle === "PRODUCTION_VERIFIED";
  return {
    lifecycle,
    productionVerified,
    productionClaimAllowed: productionVerified,
    reason,
  };
}

const disabledStates = new Set(["disabled", "inactive", "off", "revoked"]);
const degradedStates = new Set(["degraded", "error", "failed", "unhealthy"]);
const productionPhases = new Set(["production_verified", "verified_production", "live_verified"]);
const controlledProductionPhases = new Set(["controlled_production", "production_controlled", "limited_production", "pilot_production"]);
const uatPhases = new Set(["uat", "user_acceptance", "user_acceptance_testing"]);
const connectedStates = new Set(["active", "connected"]);
const connectedPhases = new Set(["connected", "connection_verified"]);
const sandboxPhases = new Set(["sandbox", "test", "testing", "development"]);
const credentialPhases = new Set(["credentials", "credential_pending", "credentials_pending", "credentialing", "access_pending"]);
const contractPhases = new Set(["contract", "contracting", "contract_pending", "contract_pending_review", "baa_pending"]);
const knownPlanningStates = new Set(["", "planned", "planning", "pending", "configured", "not_configured", "roadmap"]);
const knownPlanningPhases = new Set(["", "planned", "planning", "roadmap", "discovery"]);

export function resolveInteroperabilityLifecycle(input: InteroperabilityLifecycleInput): InteroperabilityLifecycleProjection {
  const status = normalize(input.status);
  const phase = normalize(input.phase);
  const evidenceRef = input.productionEvidenceRef?.trim() ?? "";

  if (disabledStates.has(status) || disabledStates.has(phase)) {
    return projection("DISABLED", "The integration is explicitly disabled or inactive.");
  }

  if (degradedStates.has(status) || degradedStates.has(phase)) {
    return projection("DEGRADED", "Current integration evidence reports a degraded or failed condition.");
  }

  if (productionPhases.has(phase)) {
    if (evidenceRef) {
      return projection("PRODUCTION_VERIFIED", "Production verification is explicitly phased and backed by a durable evidence reference.");
    }
    return projection("CONTROLLED_PRODUCTION", "Production-like phase exists, but no durable production-verification evidence reference is present.");
  }

  if (controlledProductionPhases.has(phase)) {
    return projection("CONTROLLED_PRODUCTION", "The integration is in a bounded production phase that is not yet production verified.");
  }

  if (uatPhases.has(phase)) {
    return projection("UAT", "The integration is in user-acceptance testing and must not be represented as production verified.");
  }

  // An explicit lower lifecycle phase is more specific than a generic legacy
  // `active` / `connected` status and therefore wins to prevent readiness inflation.
  if (sandboxPhases.has(phase)) {
    return projection("SANDBOX", "The integration is limited to sandbox, test, or development evidence.");
  }

  if (credentialPhases.has(phase)) {
    return projection("CREDENTIALS_PENDING", "Credentials or external access evidence are still pending.");
  }

  if (contractPhases.has(phase)) {
    return projection("CONTRACT_PENDING", "Contract, BAA, or equivalent external agreement work remains pending.");
  }

  if (connectedStates.has(status) || connectedPhases.has(phase)) {
    return projection("CONNECTED", "A connection is represented, but connection state alone is not production verification.");
  }

  const statusKnown = knownPlanningStates.has(status);
  const phaseKnown = knownPlanningPhases.has(phase);
  if (statusKnown && phaseKnown) {
    return projection("PLANNED", "The integration remains planned; no stronger connection or production evidence is established.");
  }

  return projection("PLANNED", `Integration status or phase is not recognized (${status || "empty"}/${phase || "empty"}); lifecycle fails closed to planned.`);
}
