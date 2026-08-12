import { describe, expect, it } from "vitest";
import {
  canTransitionGridDemand,
  canTransitionGridOffer,
  gridOfferDecisionSchema,
  gridOfferSchema,
  savedGridDemandSchema,
} from "@/lib/grid/transaction-flow";

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

  it("does not mutate accepted or superseded countered offers", () => {
    expect(canTransitionGridOffer("accepted", "withdrawn")).toBe(false);
    expect(canTransitionGridOffer("countered", "accepted")).toBe(false);
  });

  it("validates universal saved demand", () => {
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

  it("accepts a synthetic generic resource offer only when its counterparty is identified", () => {
    const start = new Date(Date.now() + 86_400_000);
    const result = gridOfferSchema.safeParse({
      demandId: "demand-1",
      recipientOrganizationId: "organization-2",
      resourceKind: "equipment",
      resourceReference: "synthetic-equipment-listing-1",
      offeredStartAt: start.toISOString(),
      grossAmountCents: 75_000,
      depositAmountCents: 15_000,
      note: "Synthetic equipment-capacity offer for review.",
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a generic resource offer without a recipient organization", () => {
    const result = gridOfferSchema.safeParse({
      demandId: "demand-1",
      resourceKind: "equipment",
      resourceReference: "synthetic-equipment-listing-1",
      offeredStartAt: new Date(Date.now() + 86_400_000).toISOString(),
      grossAmountCents: 75_000,
      note: "Synthetic equipment-capacity offer for review.",
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an offer with an end before its start", () => {
    const start = new Date(Date.now() + 86_400_000);
    const end = new Date(start.getTime() - 60_000);
    const result = gridOfferSchema.safeParse({
      demandId: "demand-1",
      providerId: "provider-1",
      serviceListingId: "service-1",
      offeredStartAt: start.toISOString(),
      offeredEndAt: end.toISOString(),
      grossAmountCents: 50_000,
      depositAmountCents: 10_000,
      note: "Offer for requested service window.",
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a deposit larger than the offer", () => {
    const result = gridOfferSchema.safeParse({
      demandId: "demand-1",
      locationId: "location-1",
      offeredStartAt: new Date(Date.now() + 86_400_000).toISOString(),
      grossAmountCents: 10_000,
      depositAmountCents: 20_000,
      note: "Room-capacity offer with an invalid deposit.",
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("requires provider and service listing to be selected together", () => {
    const result = gridOfferSchema.safeParse({
      demandId: "demand-1",
      providerId: "provider-1",
      offeredStartAt: new Date(Date.now() + 86_400_000).toISOString(),
      grossAmountCents: 25_000,
      note: "Incomplete clinician offer.",
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("requires new immutable terms for a counteroffer", () => {
    expect(gridOfferDecisionSchema.safeParse({ targetStatus: "countered", note: "Need different terms." }).success).toBe(false);
    expect(gridOfferDecisionSchema.safeParse({
      targetStatus: "countered",
      note: "Need different terms.",
      counterOffer: {
        offeredStartAt: new Date(Date.now() + 86_400_000).toISOString(),
        grossAmountCents: 60_000,
        depositAmountCents: 10_000,
        note: "Counter at the revised amount.",
        expiresAt: new Date(Date.now() + 7_200_000).toISOString(),
      },
    }).success).toBe(true);
  });
});
