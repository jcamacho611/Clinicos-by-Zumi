import { describe, expect, it } from "vitest";
import { buildCloseVisitResolution, type CloseVisitInputs } from "@/lib/clinical/close-visit-resolution";

const notEvaluated = () => ({ state: "not_evaluated" as const, source: null, evidenceRef: null });
const evaluated = <TState extends string>(state: TState, domain: string) => ({
  state,
  source: `${domain}_repository`,
  evidenceRef: `${domain}:evidence-1`,
});

function inputs(overrides: Partial<CloseVisitInputs> = {}): CloseVisitInputs {
  return {
    encounterStatus: "Ready for Review",
    missingRequiredDocumentation: [],
    followUp: "Return in four weeks.",
    coding: evaluated("ready" as const, "coding"),
    ordersResults: evaluated("resolved" as const, "orders-results"),
    aiReview: evaluated("not_applicable" as const, "ai-review"),
    attestations: evaluated("complete" as const, "attestations"),
    chargeReadiness: evaluated("ready" as const, "charge-readiness"),
    ...overrides,
  };
}

describe("Close Visit resolution", () => {
  it("blocks closure when required documentation or follow-up is missing", () => {
    const result = buildCloseVisitResolution(inputs({
      missingRequiredDocumentation: ["Assessment"],
      followUp: "   ",
    }));

    expect(result.readiness).toBe("blocked");
    expect(result.blockers).toEqual(["Assessment", "Follow-up not established"]);
    expect(result.canClaimReadyToClose).toBe(false);
  });

  it("never treats unevaluated governed domains as complete", () => {
    const result = buildCloseVisitResolution(inputs({
      coding: notEvaluated(),
      ordersResults: notEvaluated(),
      aiReview: notEvaluated(),
      attestations: notEvaluated(),
      chargeReadiness: notEvaluated(),
    }));

    expect(result.readiness).toBe("not_fully_evaluated");
    expect(result.unevaluatedDomains).toEqual([
      "Coding",
      "Orders/results",
      "AI review",
      "Attestations",
      "Charge readiness",
    ]);
    expect(result.evidence).toEqual([]);
    expect(result.canClaimReadyToClose).toBe(false);
  });

  it("surfaces explicit review/attention states rather than flattening them into incomplete documentation", () => {
    const result = buildCloseVisitResolution(inputs({
      coding: evaluated("needs_review" as const, "coding"),
      ordersResults: evaluated("needs_attention" as const, "orders-results"),
    }));

    expect(result.readiness).toBe("needs_review");
    expect(result.escalations).toEqual([
      "Coding requires review",
      "Orders/results require attention",
    ]);
  });

  it("preserves source provenance for every evaluated downstream close domain", () => {
    const result = buildCloseVisitResolution(inputs());

    expect(result.evidence).toEqual([
      { domain: "Coding", source: "coding_repository", evidenceRef: "coding:evidence-1" },
      { domain: "Orders/results", source: "orders-results_repository", evidenceRef: "orders-results:evidence-1" },
      { domain: "AI review", source: "ai-review_repository", evidenceRef: "ai-review:evidence-1" },
      { domain: "Attestations", source: "attestations_repository", evidenceRef: "attestations:evidence-1" },
      { domain: "Charge readiness", source: "charge-readiness_repository", evidenceRef: "charge-readiness:evidence-1" },
    ]);
  });

  it("fails closed when an evaluated state arrives without usable provenance", () => {
    const result = buildCloseVisitResolution(inputs({
      ordersResults: { state: "resolved", source: " ", evidenceRef: "" },
    }));

    expect(result.readiness).toBe("not_fully_evaluated");
    expect(result.unevaluatedDomains).toContain("Orders/results");
    expect(result.evidence.some((item) => item.domain === "Orders/results")).toBe(false);
    expect(result.canClaimReadyToClose).toBe(false);
  });

  it("does not claim a Draft encounter is ready to close before the governed review transition", () => {
    const result = buildCloseVisitResolution(inputs({ encounterStatus: "Draft" }));

    expect(result.readiness).toBe("ready");
    expect(result.canClaimReadyToClose).toBe(false);
    expect(result.readyForSignature).toBe(false);
    expect(result.finalClosureComplete).toBe(false);
  });

  it("separates readiness for human signature from final signed closure", () => {
    const unsigned = buildCloseVisitResolution(inputs({ encounterStatus: "Ready for Review" }));
    const signed = buildCloseVisitResolution(inputs({ encounterStatus: "Locked" }));

    expect(unsigned.readiness).toBe("ready");
    expect(unsigned.readyForSignature).toBe(true);
    expect(unsigned.finalClosureComplete).toBe(false);

    expect(signed.readiness).toBe("ready");
    expect(signed.readyForSignature).toBe(false);
    expect(signed.finalClosureComplete).toBe(true);
  });

  it("does not let a signed note manufacture completion for unevaluated external domains", () => {
    const result = buildCloseVisitResolution(inputs({
      encounterStatus: "Signed",
      ordersResults: notEvaluated(),
      chargeReadiness: notEvaluated(),
    }));

    expect(result.noteLocked).toBe(true);
    expect(result.readiness).toBe("not_fully_evaluated");
    expect(result.finalClosureComplete).toBe(false);
    expect(result.canClaimReadyToClose).toBe(false);
  });

  it("accepts explicit not-applicable states only when they carry governed evidence", () => {
    const result = buildCloseVisitResolution(inputs({
      coding: evaluated("not_applicable" as const, "coding"),
      ordersResults: evaluated("not_applicable" as const, "orders-results"),
      aiReview: evaluated("not_applicable" as const, "ai-review"),
      attestations: evaluated("not_required" as const, "attestations"),
      chargeReadiness: evaluated("not_applicable" as const, "charge-readiness"),
    }));

    expect(result.readiness).toBe("ready");
    expect(result.canClaimReadyToClose).toBe(true);
    expect(result.unevaluatedDomains).toEqual([]);
    expect(result.evidence).toHaveLength(5);
  });
});
