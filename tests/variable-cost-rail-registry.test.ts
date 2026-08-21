import { describe, expect, it } from "vitest";
import {
  tenantVariableSpendFundingReady,
  variableCostRailPolicies,
  variableCostRailPolicy,
  variableEconomicPolicyResolved,
} from "@/lib/commercial/variable-cost-rail-registry";

describe("variable-cost economic ownership", () => {
  it("keeps anonymous public Zumi on the platform budget rather than charging an unidentified clinic", () => {
    expect(variableCostRailPolicy("public_zumi_inference")).toMatchObject({
      costOwner: "platform",
      bucket: "ai",
      fundingMode: "platform_budget",
      economicReadiness: "policy_resolved",
    });
  });

  it("does not confuse authenticated provider metering with completed tenant funding", () => {
    const policy = variableCostRailPolicy("authenticated_zumi_inference");
    expect(policy).toMatchObject({
      costOwner: "tenant",
      fundingMode: "meter_then_micro_reconcile",
      economicReadiness: "requires_micro_persistence",
    });
    expect(policy && variableEconomicPolicyResolved(policy)).toBe(false);
    expect(policy && tenantVariableSpendFundingReady(policy)).toBe(false);
  });

  it("requires the micro funding authority before patient SMS can be economically ready", () => {
    const policy = variableCostRailPolicy("patient_sms");
    expect(policy).toMatchObject({
      costOwner: "tenant",
      bucket: "sms",
      fundingMode: "micro_pool_reservation",
      economicReadiness: "requires_micro_persistence",
    });
    expect(policy && tenantVariableSpendFundingReady(policy)).toBe(false);
  });

  it("keeps unresolved ownership fail closed", () => {
    const policy = variableCostRailPolicy("phone_verification");
    expect(policy).toMatchObject({ costOwner: "unknown", fundingMode: "pending_decision" });
    expect(policy && variableEconomicPolicyResolved(policy)).toBe(false);
  });

  it("keeps platform, tenant, and transaction economics separate", () => {
    expect(variableCostRailPolicy("evaluation_access_email")?.costOwner).toBe("platform");
    expect(variableCostRailPolicy("patient_followup_email")?.costOwner).toBe("tenant");
    expect(variableCostRailPolicy("stripe_customer_payment")?.costOwner).toBe("transaction");
    expect(variableCostRailPolicy("grid_external_payout")?.costOwner).toBe("transaction");
  });

  it("does not mark any current tenant variable-spend rail funding-ready before persistence exists", () => {
    const tenantPolicies = variableCostRailPolicies.filter((policy) => policy.costOwner === "tenant");
    expect(tenantPolicies.length).toBeGreaterThan(0);
    expect(tenantPolicies.every((policy) => !tenantVariableSpendFundingReady(policy))).toBe(true);
  });
});
