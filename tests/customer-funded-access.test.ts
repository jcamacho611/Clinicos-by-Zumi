import { describe, expect, it } from "vitest";
import {
  allocateFundedUsage,
  evaluateCustomerFundedAccess,
  type CommercialFundingState,
} from "@/lib/commercial/customer-funded-access";

const paidState: CommercialFundingState = {
  subscriptionStatus: "active",
  paymentConfirmed: true,
  entitlements: ["operations", "voice", "revenue"],
  includedAllowanceRemainingCents: 2_500,
  prepaidBalanceCents: 1_000,
  authorizedOverageRemainingCents: 500,
  demoMode: false,
  syntheticDataOnly: false,
};

describe("customer-funded commercial access", () => {
  it("requires confirmed payment before production access", () => {
    const result = evaluateCustomerFundedAccess(
      { ...paidState, paymentConfirmed: false },
      { capability: "zumi", requiredEntitlement: "operations" },
    );

    expect(result).toMatchObject({ allowed: false, reason: "payment_required" });
  });

  it("allows explicitly synthetic demo behavior without production spend", () => {
    const result = evaluateCustomerFundedAccess(
      {
        ...paidState,
        subscriptionStatus: "trialing",
        paymentConfirmed: false,
        demoMode: true,
        syntheticDataOnly: true,
      },
      { capability: "zumi_demo", allowSyntheticDemo: true, estimatedVariableCostCents: 900 },
    );

    expect(result).toMatchObject({ allowed: true, mode: "synthetic_demo", estimatedVariableCostCents: 0 });
  });

  it("does not let payment override product policy", () => {
    const result = evaluateCustomerFundedAccess(paidState, {
      capability: "autonomous_record_release",
      policyBlocked: true,
    });

    expect(result).toMatchObject({ allowed: false, reason: "policy_blocked" });
  });

  it("requires the paid entitlement even when budget exists", () => {
    const result = evaluateCustomerFundedAccess(paidState, {
      capability: "premium_grid",
      requiredEntitlement: "grid_premium",
      estimatedVariableCostCents: 100,
    });

    expect(result).toMatchObject({ allowed: false, reason: "upgrade_required" });
  });

  it("spends included allowance before prepaid and authorized overage", () => {
    const result = allocateFundedUsage(3_200, paidState);

    expect(result).toEqual({
      allocations: [
        { source: "included_allowance", amountCents: 2_500 },
        { source: "prepaid_balance", amountCents: 700 },
      ],
      shortfallCents: 0,
    });
  });

  it("can use explicitly authorized overage only after funded balances", () => {
    const result = evaluateCustomerFundedAccess(paidState, {
      capability: "voice_minutes",
      requiredEntitlement: "voice",
      estimatedVariableCostCents: 3_800,
    });

    expect(result).toMatchObject({
      allowed: true,
      mode: "funded_usage",
      allocations: [
        { source: "included_allowance", amountCents: 2_500 },
        { source: "prepaid_balance", amountCents: 1_000 },
        { source: "authorized_overage", amountCents: 300 },
      ],
    });
  });

  it("blocks a vendor-cost action when customer funding is insufficient", () => {
    const result = evaluateCustomerFundedAccess(paidState, {
      capability: "expensive_analysis",
      requiredEntitlement: "operations",
      estimatedVariableCostCents: 4_500,
    });

    expect(result).toMatchObject({ allowed: false, reason: "funds_required", shortfallCents: 500 });
  });

  it("allows paid zero-variable-cost capabilities without consuming allowance", () => {
    const result = evaluateCustomerFundedAccess(paidState, {
      capability: "task_board",
      requiredEntitlement: "operations",
      estimatedVariableCostCents: 0,
    });

    expect(result).toMatchObject({ allowed: true, mode: "subscription", allocations: [] });
  });

  it("rejects invalid negative funding amounts", () => {
    expect(() => allocateFundedUsage(100, { ...paidState, prepaidBalanceCents: -1 })).toThrow(
      "Commercial funding amounts must be finite and non-negative.",
    );
  });
});
