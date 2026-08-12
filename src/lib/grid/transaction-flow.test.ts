import { describe, expect, it } from "vitest";
import { canTransitionGridDemand, canTransitionGridOffer, gridOfferSchema, savedGridDemandSchema } from "@/lib/grid/transaction-flow";

describe("Grid transaction flow", () => {
  it("allows demand to move from open to matched to offered to reserved", () => {
    expect(canTransitionGridDemand("open", "matched")).toBe(true);
    expect(canTransitionGridDemand("matched", "offered")).toBe(true);
    expect(canTransitionGridDemand("offered", "reserved")).toBe(true);
  });

  it("does not allow fulfilled demand to reopen", () => {
    expect(canTransitionGridDemand("fulfilled", "open")).toBe(false);
  });

  it("allows sent offers to be accepted, countered, declined, expired, or withdrawn", () => {
    for (const target of ["accepted", "countered", "declined", "expired", "withdrawn"]) {
      expect(canTransitionGridOffer("sent", target)).toBe(true);
    }
  });

  it("does not allow an accepted offer to mutate", () => {
    expect(canTransitionGridOffer("accepted", "withdrawn")).toBe(false);
  });

  it("validates saved demand", () => {
    const result = savedGridDemandSchema.safeParse({
      kind: "service",
      title: "Need a medical billing contractor",
      description: "We need remote billing support for an independent clinic.",
      category: "billing",
      requestedStartAt: new Date(Date.now() + 86_400_000).toISOString(),
      locationType: "virtual",
      requirements: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an offer with an end before its start", () => {
    const start = new Date(Date.now() + 86_400_000);
    const end = new Date(start.getTime() - 60_000);
    const result = gridOfferSchema.safeParse({
      demandId: "demand-1",
      providerId: "provider-1",
      offeredStartAt: start.toISOString(),
      offeredEndAt: end.toISOString(),
      grossAmountCents: 50_000,
      depositAmountCents: 10_000,
      note: "Offer for requested service window.",
      expiresAt: new Date(start.getTime() - 3_600_000).toISOString(),
    });
    expect(result.success).toBe(false);
  });
});
