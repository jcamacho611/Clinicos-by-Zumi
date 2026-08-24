import { describe, expect, it } from "vitest";

import {
  evaluateGridFeePolicyScope,
  evaluateGridMonetizationPolicy,
  gridFeeClassForTransaction,
} from "@/lib/commercial/monetization-policy";
import { GRID_FEE_POLICY, gridPolicyHasCounselClearance } from "@/lib/commercial/grid-economics";

describe("gridFeeClassForTransaction", () => {
  it("prefers a resource kind that names a declared class", () => {
    expect(gridFeeClassForTransaction({ resourceKind: "space", demandKind: "referral" })).toBe("space");
  });

  it("ignores an undeclared resource kind and falls back to the demand kind", () => {
    // resourceKind is an unconstrained text column, so an arbitrary value must not
    // become a fee class by itself.
    expect(gridFeeClassForTransaction({ resourceKind: "anything-at-all", demandKind: "space" })).toBe("space");
  });

  it("returns null for demand kinds that carry no declaration", () => {
    for (const kind of ["work", "service", "network", "organization"]) {
      expect(gridFeeClassForTransaction({ resourceKind: null, demandKind: kind })).toBeNull();
    }
  });
});

describe("evaluateGridMonetizationPolicy", () => {
  it("refuses a percentage on patient care", () => {
    const result = evaluateGridMonetizationPolicy({
      resourceKind: "regulated_clinical_service",
      demandKind: "service",
      platformFeeBps: 1_500,
      platformFeeFlatCents: 0,
    });
    expect(result.outcome).toBe("percentage_fee_prohibited");
    expect(result.permitted).toBe(false);
  });

  it("refuses a percentage on a referral", () => {
    const result = evaluateGridMonetizationPolicy({
      resourceKind: null,
      demandKind: "referral",
      platformFeeBps: 1_000,
      platformFeeFlatCents: 0,
    });
    expect(result.outcome).toBe("percentage_fee_prohibited");
    expect(result.permitted).toBe(false);
  });

  it("refuses even a flat fee on a referral, because the class is declared zero-fee", () => {
    const result = evaluateGridMonetizationPolicy({
      resourceKind: null,
      demandKind: "referral",
      platformFeeBps: 0,
      platformFeeFlatCents: 5_000,
    });
    expect(result.outcome).toBe("fee_prohibited");
    expect(result.permitted).toBe(false);
  });

  it("refuses a percentage on professional coverage, which is declared flat-fee only", () => {
    const result = evaluateGridMonetizationPolicy({
      resourceKind: null,
      demandKind: "provider",
      platformFeeBps: 1_200,
      platformFeeFlatCents: 0,
    });
    expect(result.outcome).toBe("percentage_fee_prohibited");
    expect(result.permitted).toBe(false);
  });

  it("refuses any fee for a demand kind with no declared class", () => {
    const result = evaluateGridMonetizationPolicy({
      resourceKind: null,
      demandKind: "work",
      platformFeeBps: 500,
      platformFeeFlatCents: 0,
    });
    expect(result.outcome).toBe("manual_review_required");
    expect(result.permitted).toBe(false);
  });

  it("permits a zero fee everywhere, including prohibited classes", () => {
    for (const demandKind of ["referral", "provider", "work", "space"]) {
      const result = evaluateGridMonetizationPolicy({
        resourceKind: null,
        demandKind,
        platformFeeBps: 0,
        platformFeeFlatCents: 0,
      });
      expect(result.permitted).toBe(true);
      expect(result.outcome).toBe("free");
    }
  });

  it("holds a declared marketplace class until counsel clearance carries evidence", () => {
    // "space" is declared as a percentage class but is still a business draft. Until it
    // is cleared, no persisted row may activate a fee against it.
    const spaceDeclaration = GRID_FEE_POLICY.find((policy) => policy.resourceClass === "space");
    expect(spaceDeclaration).toBeDefined();
    expect(gridPolicyHasCounselClearance(spaceDeclaration!)).toBe(false);

    const result = evaluateGridMonetizationPolicy({
      resourceKind: "space",
      demandKind: "space",
      platformFeeBps: 1_000,
      platformFeeFlatCents: 0,
    });
    expect(result.outcome).toBe("manual_review_required");
    expect(result.permitted).toBe(false);
  });

  it("permits no fee-bearing class today, because none carries clearance", () => {
    // This is the property that matters: the gate is not merely configured to refuse a
    // hand-picked list, it refuses every fee that lacks evidence.
    const permitted = GRID_FEE_POLICY.filter(
      (policy) =>
        evaluateGridMonetizationPolicy({
          resourceKind: policy.resourceClass,
          demandKind: "",
          platformFeeBps: 1_000,
          platformFeeFlatCents: 0,
        }).permitted,
    );
    expect(permitted).toEqual([]);
  });
});

describe("evaluateGridFeePolicyScope", () => {
  it("refuses a fee-bearing default policy, which would also reach referrals and care", () => {
    const result = evaluateGridFeePolicyScope({
      scopeKind: "default",
      scopeValue: null,
      platformFeeBps: 1_000,
      platformFeeFlatCents: 0,
    });
    expect(result.outcome).toBe("manual_review_required");
    expect(result.permitted).toBe(false);
  });

  it("allows a zero-fee default policy", () => {
    const result = evaluateGridFeePolicyScope({
      scopeKind: "default",
      scopeValue: null,
      platformFeeBps: 0,
      platformFeeFlatCents: 0,
    });
    expect(result.permitted).toBe(true);
  });

  it("refuses a percentage scoped directly at referrals", () => {
    const result = evaluateGridFeePolicyScope({
      scopeKind: "demand_kind",
      scopeValue: "referral",
      platformFeeBps: 800,
      platformFeeFlatCents: 0,
    });
    expect(result.outcome).toBe("percentage_fee_prohibited");
    expect(result.permitted).toBe(false);
  });

  it("refuses a scoped policy with a blank scope value", () => {
    const result = evaluateGridFeePolicyScope({
      scopeKind: "resource_kind",
      scopeValue: "   ",
      platformFeeBps: 100,
      platformFeeFlatCents: 0,
    });
    expect(result.permitted).toBe(false);
  });
});
