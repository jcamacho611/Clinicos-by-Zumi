import { describe, expect, it } from "vitest";
import { computePlatformFeeCents, gridFeePolicySchema, gridObligationTransitionSchema } from "@/lib/grid/financial-rules";
import { gridOfferSchema } from "@/lib/grid/transaction-flow";

describe("Grid financial rules", () => {
  it("combines basis points and a flat fee using integer cents", () => {
    expect(computePlatformFeeCents({ grossAmountCents: 100_000, platformFeeBps: 1_000, platformFeeFlatCents: 2_500 })).toBe(12_500);
  });

  it("caps the platform fee at the gross amount", () => {
    expect(computePlatformFeeCents({ grossAmountCents: 10_000, platformFeeBps: 10_000, platformFeeFlatCents: 5_000 })).toBe(10_000);
  });

  it("requires scope values for non-default fee policies", () => {
    expect(gridFeePolicySchema.safeParse({ scopeKind: "demand_kind", platformFeeBps: 500 }).success).toBe(false);
    expect(gridFeePolicySchema.safeParse({ scopeKind: "demand_kind", scopeValue: "work", platformFeeBps: 500 }).success).toBe(true);
  });

  it("does not allow a scope value on the default fee policy", () => {
    expect(gridFeePolicySchema.safeParse({ scopeKind: "default", scopeValue: "work", platformFeeBps: 500 }).success).toBe(false);
  });

  it("requires a real reference when an obligation is marked settled", () => {
    expect(gridObligationTransitionSchema.safeParse({ targetStatus: "settled", note: "Mark this obligation as settled." }).success).toBe(false);
    expect(gridObligationTransitionSchema.safeParse({
      targetStatus: "settled",
      note: "Settlement reference was manually reconciled.",
      externalReference: "synthetic-settlement-reference",
    }).success).toBe(true);
  });

  it("keeps negotiated location compensation inside the gross offer amount", () => {
    const base = {
      demandId: "demand-1",
      providerId: "provider-1",
      serviceListingId: "service-1",
      locationId: "location-1",
      offeredStartAt: new Date(Date.now() + 86_400_000).toISOString(),
      grossAmountCents: 100_000,
      depositAmountCents: 10_000,
      note: "Synthetic offer with facility compensation.",
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    };
    expect(gridOfferSchema.safeParse({ ...base, locationPayableCents: 25_000 }).success).toBe(true);
    expect(gridOfferSchema.safeParse({ ...base, locationPayableCents: 125_000 }).success).toBe(false);
  });

  it("requires a selected location when location compensation is non-zero", () => {
    expect(gridOfferSchema.safeParse({
      demandId: "demand-1",
      providerId: "provider-1",
      serviceListingId: "service-1",
      offeredStartAt: new Date(Date.now() + 86_400_000).toISOString(),
      grossAmountCents: 100_000,
      locationPayableCents: 20_000,
      note: "Invalid offer without a selected location.",
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    }).success).toBe(false);
  });
});
