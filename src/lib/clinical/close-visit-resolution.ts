import type { Encounter } from "@/lib/types";

export type CodingResolutionState = "not_evaluated" | "ready" | "needs_review" | "not_applicable";
export type OrdersResultsResolutionState = "not_evaluated" | "resolved" | "needs_attention" | "not_applicable";
export type AiReviewResolutionState = "not_evaluated" | "reviewed" | "needs_review" | "not_applicable";
export type AttestationResolutionState = "not_evaluated" | "complete" | "incomplete" | "not_required";
export type ChargeResolutionState = "not_evaluated" | "ready" | "needs_attention" | "not_applicable";

export type GovernedDomainEvaluation<TState extends string> =
  | {
      state: Extract<TState, "not_evaluated">;
      source: null;
      evidenceRef: null;
    }
  | {
      state: Exclude<TState, "not_evaluated">;
      source: string;
      evidenceRef: string;
    };

export interface CloseVisitInputs {
  encounterStatus: Encounter["status"];
  missingRequiredDocumentation: string[];
  followUp: string | null;
  coding: GovernedDomainEvaluation<CodingResolutionState>;
  ordersResults: GovernedDomainEvaluation<OrdersResultsResolutionState>;
  aiReview: GovernedDomainEvaluation<AiReviewResolutionState>;
  attestations: GovernedDomainEvaluation<AttestationResolutionState>;
  chargeReadiness: GovernedDomainEvaluation<ChargeResolutionState>;
}

export interface CloseVisitEvidenceReference {
  domain: "Coding" | "Orders/results" | "AI review" | "Attestations" | "Charge readiness";
  source: string;
  evidenceRef: string;
}

export interface CloseVisitResolution {
  readiness: "blocked" | "needs_review" | "not_fully_evaluated" | "ready";
  blockers: string[];
  escalations: string[];
  unevaluatedDomains: string[];
  evidence: CloseVisitEvidenceReference[];
  noteLocked: boolean;
  readyForSignature: boolean;
  canClaimReadyToClose: boolean;
  finalClosureComplete: boolean;
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function resolveGovernedState<TState extends string>(
  domain: CloseVisitEvidenceReference["domain"],
  evaluation: GovernedDomainEvaluation<TState>,
  unevaluatedDomains: string[],
  evidence: CloseVisitEvidenceReference[],
): TState {
  if (evaluation.state === "not_evaluated") {
    unevaluatedDomains.push(domain);
    return evaluation.state;
  }

  if (!hasText(evaluation.source) || !hasText(evaluation.evidenceRef)) {
    unevaluatedDomains.push(domain);
    return "not_evaluated" as TState;
  }

  evidence.push({
    domain,
    source: evaluation.source.trim(),
    evidenceRef: evaluation.evidenceRef.trim(),
  });
  return evaluation.state;
}

export function buildCloseVisitResolution(inputs: CloseVisitInputs): CloseVisitResolution {
  const blockers = [...inputs.missingRequiredDocumentation];
  const escalations: string[] = [];
  const unevaluatedDomains: string[] = [];
  const evidence: CloseVisitEvidenceReference[] = [];

  if (!hasText(inputs.followUp)) blockers.push("Follow-up not established");
  if (inputs.encounterStatus === "Addendum Needed") blockers.push("Required addendum unresolved");

  const coding = resolveGovernedState("Coding", inputs.coding, unevaluatedDomains, evidence);
  if (coding === "needs_review") escalations.push("Coding requires review");

  const ordersResults = resolveGovernedState("Orders/results", inputs.ordersResults, unevaluatedDomains, evidence);
  if (ordersResults === "needs_attention") escalations.push("Orders/results require attention");

  const aiReview = resolveGovernedState("AI review", inputs.aiReview, unevaluatedDomains, evidence);
  if (aiReview === "needs_review") escalations.push("AI review requires human review");

  const attestations = resolveGovernedState("Attestations", inputs.attestations, unevaluatedDomains, evidence);
  if (attestations === "incomplete") blockers.push("Required attestations incomplete");

  const chargeReadiness = resolveGovernedState("Charge readiness", inputs.chargeReadiness, unevaluatedDomains, evidence);
  if (chargeReadiness === "needs_attention") escalations.push("Charge readiness requires attention");

  let readiness: CloseVisitResolution["readiness"] = "ready";
  if (blockers.length > 0) readiness = "blocked";
  else if (escalations.length > 0) readiness = "needs_review";
  else if (unevaluatedDomains.length > 0) readiness = "not_fully_evaluated";

  const noteLocked = inputs.encounterStatus === "Signed" || inputs.encounterStatus === "Locked" || inputs.encounterStatus === "Addendum Needed";
  const lifecycleAllowsCloseClaim = inputs.encounterStatus === "Ready for Review" || inputs.encounterStatus === "Signed" || inputs.encounterStatus === "Locked";
  const canClaimReadyToClose = readiness === "ready" && lifecycleAllowsCloseClaim;
  const readyForSignature = canClaimReadyToClose && inputs.encounterStatus === "Ready for Review";
  const finalClosureComplete = canClaimReadyToClose && (inputs.encounterStatus === "Signed" || inputs.encounterStatus === "Locked");

  return {
    readiness,
    blockers,
    escalations,
    unevaluatedDomains,
    evidence,
    noteLocked,
    readyForSignature,
    canClaimReadyToClose,
    finalClosureComplete,
  };
}
