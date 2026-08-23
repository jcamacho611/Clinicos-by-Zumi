import type { Encounter } from "@/lib/types";

export type CodingResolutionState = "not_evaluated" | "ready" | "needs_review" | "not_applicable";
export type OrdersResultsResolutionState = "not_evaluated" | "resolved" | "needs_attention" | "not_applicable";
export type AiReviewResolutionState = "not_evaluated" | "reviewed" | "needs_review" | "not_applicable";
export type AttestationResolutionState = "not_evaluated" | "complete" | "incomplete" | "not_required";
export type ChargeResolutionState = "not_evaluated" | "ready" | "needs_attention" | "not_applicable";

export interface CloseVisitInputs {
  encounterStatus: Encounter["status"];
  missingRequiredDocumentation: string[];
  followUp: string | null;
  coding: CodingResolutionState;
  ordersResults: OrdersResultsResolutionState;
  aiReview: AiReviewResolutionState;
  attestations: AttestationResolutionState;
  chargeReadiness: ChargeResolutionState;
}

export interface CloseVisitResolution {
  readiness: "blocked" | "needs_review" | "not_fully_evaluated" | "ready";
  blockers: string[];
  escalations: string[];
  unevaluatedDomains: string[];
  noteLocked: boolean;
  readyForSignature: boolean;
  canClaimReadyToClose: boolean;
  finalClosureComplete: boolean;
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function buildCloseVisitResolution(inputs: CloseVisitInputs): CloseVisitResolution {
  const blockers = [...inputs.missingRequiredDocumentation];
  const escalations: string[] = [];
  const unevaluatedDomains: string[] = [];

  if (!hasText(inputs.followUp)) blockers.push("Follow-up not established");
  if (inputs.encounterStatus === "Addendum Needed") blockers.push("Required addendum unresolved");

  if (inputs.coding === "not_evaluated") unevaluatedDomains.push("Coding");
  if (inputs.coding === "needs_review") escalations.push("Coding requires review");

  if (inputs.ordersResults === "not_evaluated") unevaluatedDomains.push("Orders/results");
  if (inputs.ordersResults === "needs_attention") escalations.push("Orders/results require attention");

  if (inputs.aiReview === "not_evaluated") unevaluatedDomains.push("AI review");
  if (inputs.aiReview === "needs_review") escalations.push("AI review requires human review");

  if (inputs.attestations === "not_evaluated") unevaluatedDomains.push("Attestations");
  if (inputs.attestations === "incomplete") blockers.push("Required attestations incomplete");

  if (inputs.chargeReadiness === "not_evaluated") unevaluatedDomains.push("Charge readiness");
  if (inputs.chargeReadiness === "needs_attention") escalations.push("Charge readiness requires attention");

  let readiness: CloseVisitResolution["readiness"] = "ready";
  if (blockers.length > 0) readiness = "blocked";
  else if (escalations.length > 0) readiness = "needs_review";
  else if (unevaluatedDomains.length > 0) readiness = "not_fully_evaluated";

  const noteLocked = inputs.encounterStatus === "Signed" || inputs.encounterStatus === "Locked" || inputs.encounterStatus === "Addendum Needed";
  const canClaimReadyToClose = readiness === "ready";
  const readyForSignature = canClaimReadyToClose && inputs.encounterStatus === "Ready for Review";
  const finalClosureComplete = canClaimReadyToClose && (inputs.encounterStatus === "Signed" || inputs.encounterStatus === "Locked");

  return {
    readiness,
    blockers,
    escalations,
    unevaluatedDomains,
    noteLocked,
    readyForSignature,
    canClaimReadyToClose,
    finalClosureComplete,
  };
}
