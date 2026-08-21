import { describe, expect, it } from "vitest";
import {
  economicallyExecutable,
  variableCostRailPolicies,
  variableCostRailPolicy,
} from "@/lib/commercial/variable-cost-rail-registry";

describe("variable-cost rail registry", () => {
  it("never allows unknown cost ownership to become economically executable", () => {
    for (const policy of variableCostRailPolicies) {
      if (policy.costOwner === "unknown") expect(economicallyExecutable(policy), policy.key).toBe(false);
    }
  });

  it("classifies patient SMS as tenant-funded without classifying platform access email as tenant spend", () => {
    expect(variableCostRailPolicy("patient_sms")).toMatchObject({
      costOwner: "tenant",
      bucket: "sms",
      fundingMode: "customer_reservation",
    });
    expect(variableCostRailPolicy("evaluation_access_email")).toMatchObject({
      costOwner: "platform",
      bucket: "email",
      fundingMode: "platform_budget",
    });
  });

  it("keeps pooled sub-cent email economics out of whole-cent per-message customer reservation", () => {
    expect(variableCostRailPolicy("patient_followup_email")).toMatchObject({
      costOwner: "tenant",
      fundingMode: "batch_or_subcent_required",
    });
  });

  it("keeps processor and Grid payout fees in transaction economics", () => {
    expect(variableCostRailPolicy("stripe_customer_payment")?.fundingMode).toBe("transaction_economics");
    expect(variableCostRailPolicy("grid_external_payout")?.fundingMode).toBe("transaction_economics");
  });

  it("does not mistake AI provider metering for completed tenant funding adoption", () => {
    for (const key of ["cloudflare_ai", "openai_ai"]) {
      const policy = variableCostRailPolicy(key);
      expect(policy?.costOwner).toBe("tenant");
      expect(policy?.fundingMode).toBe("provider_meter_then_reconcile");
      expect(economicallyExecutable(policy!)).toBe(false);
    }
  });
});
