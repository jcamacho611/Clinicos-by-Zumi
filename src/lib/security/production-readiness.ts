export type ProductionEvidenceState =
  | "NOT_EVALUATED"
  | "BLOCKED"
  | "PARTIAL"
  | "TECHNICAL_EVIDENCE_GREEN"
  | "EXTERNAL_EVIDENCE_REQUIRED"
  | "LEGAL_REVIEW_REQUIRED"
  | "PRODUCTION_APPROVAL_REQUIRED"
  | "PRODUCTION_VERIFIED"
  | "DEGRADED_OR_REVOKED";

export type ProductionReadinessControl = {
  controlId: string;
  applicable: boolean;
  state: ProductionEvidenceState;
};

export type ProductionReadinessInput = {
  environment: string;
  dataClass: string;
  capability: string;
  provider?: string | null;
  controls: ProductionReadinessControl[];
};

export type ProductionReadinessDecision = {
  state: "BLOCKED" | "PARTIAL" | "PRODUCTION_VERIFIED" | "DEGRADED_OR_REVOKED";
  blockers: string[];
};

export function evaluateProductionReadiness(
  input: ProductionReadinessInput,
): ProductionReadinessDecision {
  const applicableControls = input.controls.filter((control) => control.applicable);

  if (applicableControls.length === 0) {
    return {
      state: "BLOCKED",
      blockers: ["NO_APPLICABLE_EVIDENCE"],
    };
  }

  const revoked = applicableControls.filter(
    (control) => control.state === "DEGRADED_OR_REVOKED",
  );
  if (revoked.length > 0) {
    return {
      state: "DEGRADED_OR_REVOKED",
      blockers: revoked.map((control) => control.controlId),
    };
  }

  const unverified = applicableControls.filter(
    (control) => control.state !== "PRODUCTION_VERIFIED",
  );

  if (unverified.length === 0) {
    return {
      state: "PRODUCTION_VERIFIED",
      blockers: [],
    };
  }

  return {
    state: "PARTIAL",
    blockers: unverified.map((control) => control.controlId),
  };
}
