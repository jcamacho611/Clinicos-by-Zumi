import { describe, expect, it } from "vitest";
import { buildCloseVisitResolution, type CloseVisitInputs } from "@/lib/clinical/close-visit-resolution";

function inputs(overrides: Partial<CloseVisitInputs> = {}): CloseVisitInputs {
  return {
    encounterStatus: "Ready for Review",
    missingRequiredDocumentation: [],
    followUp: "Return in four weeks.",
    coding: "ready",
    ordersResults: "resolved",
    aiReview: "not_applicable",
    attestations: "complete",
    chargeReadiness: "ready",
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
      coding: "not_evaluated",
      ordersResults: "not_evaluated",
      aiReview: "not_evaluated",
      attestations: "not_evaluated",
      chargeReadiness: "not_evaluated",
    }));

    expect(result.readiness).toBe("not_fully_evaluated");
    expect(result.unevaluatedDomains).toEqual([
      "Coding",
      "Orders/results",
      "AI review",
      "Attestations",
      "Charge readiness",
    ]);
    expect(result.canClaimReadyToClose).toBe(false);
  });

  it("surfaces explicit review/attention states rather than flattening them into incomplete documentation", () => {
    const result = buildCloseVisitResolution(inputs({
      coding: "needs_review",
      ordersResults: "needs_attention",
    }));

    expect(result.readiness).toBe("needs_review");
    expect(result.escalations).toEqual([
      "Coding requires review",
      "Orders/results require attention",
    ]);
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
      ordersResults: "not_evaluated",
      chargeReadiness: "not_evaluated",
    }));

    expect(result.noteLocked).toBe(true);
    expect(result.readiness).toBe("not_fully_evaluated");
    expect(result.finalClosureComplete).toBe(false);
    expect(result.canClaimReadyToClose).toBe(false);
  });

  it("accepts explicit not-applicable states without inventing work that is not required", () => {
    const result = buildCloseVisitResolution(inputs({
      coding: "not_applicable",
      ordersResults: "not_applicable",
      aiReview: "not_applicable",
      attestations: "not_required",
      chargeReadiness: "not_applicable",
    }));

    expect(result.readiness).toBe("ready");
    expect(result.canClaimReadyToClose).toBe(true);
    expect(result.unevaluatedDomains).toEqual([]);
  });
});