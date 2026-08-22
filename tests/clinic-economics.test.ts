import { describe, expect, it } from "vitest";
import { calculateClinicEconomics, type ClinicEconomicsInput } from "@/lib/commercial/clinic-economics";

const completeInput: ClinicEconomicsInput = {
  stack: [
    {
      key: "ehr",
      label: "Current EHR",
      category: "ehr",
      cost: { monthlyCents: 60_000, evidence: "self_reported", source: "clinic invoice" },
      replaceability: "connected",
    },
    {
      key: "crm",
      label: "CRM",
      category: "crm",
      cost: { monthlyCents: 40_000, evidence: "known", source: "invoice" },
      replaceability: "replaceable",
    },
    {
      key: "forms",
      label: "Forms and e-sign",
      category: "forms",
      cost: { monthlyCents: 20_000, evidence: "self_reported" },
      replaceability: "replaceable",
    },
    {
      key: "communications",
      label: "Messaging",
      category: "communications",
      cost: { monthlyCents: 30_000, evidence: "self_reported" },
      replaceability: "partial",
      replacementShareBps: 5_000,
    },
  ],
  costToServe: [
    {
      key: "infra",
      label: "Attributable infrastructure",
      category: "infrastructure",
      cost: { monthlyCents: 10_000, evidence: "known" },
    },
    {
      key: "ai",
      label: "Included intelligence allowance",
      category: "intelligence",
      cost: { monthlyCents: 5_000, evidence: "estimated" },
    },
  ],
  proposedMonthlyPriceCents: 50_000,
  implementationPriceCents: 100_000,
};

describe("clinic economics", () => {
  it("calculates stack replacement, customer savings, margin and payback without double-counting connected systems", () => {
    const result = calculateClinicEconomics(completeInput);

    expect(result.currentStack.monthlyCents).toBe(150_000);
    expect(result.replaceableStack.monthlyCents).toBe(75_000);
    expect(result.connectedStack.monthlyCents).toBe(75_000);
    expect(result.customerPostKlinikosMonthlyCents).toBe(125_000);
    expect(result.customerMonthlySavingsCents).toBe(25_000);
    expect(result.customerAnnualSavingsCents).toBe(300_000);
    expect(result.costToServe.monthlyCents).toBe(15_000);
    expect(result.grossProfitCents).toBe(35_000);
    expect(result.grossMarginBps).toBe(7_000);
    expect(result.implementationPaybackMonths).toBe(4);
    expect(result.claimSafety).toBe("qualified_estimate");
    expect(result.unresolved).toEqual([]);
  });

  it("keeps ROI and complete totals unknown when a current cost is unknown", () => {
    const result = calculateClinicEconomics({
      ...completeInput,
      stack: [
        ...completeInput.stack,
        {
          key: "phone",
          label: "Phone system",
          category: "phone",
          cost: { monthlyCents: null, evidence: "unknown" },
          replaceability: "replaceable",
        },
      ],
    });

    expect(result.currentStack.monthlyCents).toBeNull();
    expect(result.currentStack.knownSubtotalCents).toBe(150_000);
    expect(result.replaceableStack.monthlyCents).toBeNull();
    expect(result.customerMonthlySavingsCents).toBeNull();
    expect(result.customerAnnualSavingsCents).toBeNull();
    expect(result.implementationPaybackMonths).toBeNull();
    expect(result.claimSafety).toBe("insufficient");
    expect(result.unresolved).toContain("stack:phone:monthly_cost");
  });

  it("does not invent gross margin when cost-to-serve is unresolved", () => {
    const result = calculateClinicEconomics({
      ...completeInput,
      costToServe: [
        ...completeInput.costToServe,
        {
          key: "claims",
          label: "Claims transactions",
          category: "healthcare_transactions",
          cost: { monthlyCents: null, evidence: "unknown" },
        },
      ],
    });

    expect(result.costToServe.monthlyCents).toBeNull();
    expect(result.costToServe.knownSubtotalCents).toBe(15_000);
    expect(result.grossProfitCents).toBeNull();
    expect(result.grossMarginBps).toBeNull();
    expect(result.claimSafety).toBe("insufficient");
  });

  it("allows supported calculations when inputs are known or explicitly self-reported", () => {
    const result = calculateClinicEconomics({
      ...completeInput,
      costToServe: completeInput.costToServe.map((item) => ({
        ...item,
        cost: { ...item.cost, evidence: "known" as const },
      })),
    });

    expect(result.claimSafety).toBe("supported");
  });

  it("rejects invalid money and partial-replacement inputs instead of normalizing them silently", () => {
    expect(() =>
      calculateClinicEconomics({ ...completeInput, proposedMonthlyPriceCents: -1 }),
    ).toThrow("non-negative safe integer");

    expect(() =>
      calculateClinicEconomics({
        ...completeInput,
        stack: [
          {
            key: "bad-partial",
            label: "Bad partial",
            category: "other",
            cost: { monthlyCents: 10_000, evidence: "known" },
            replaceability: "partial",
            replacementShareBps: 10_001,
          },
        ],
      }),
    ).toThrow("replacementShareBps");
  });
});
