import { describe, expect, it } from "vitest";
import { STACK_CATEGORIES, computeStackSavings } from "@/lib/commercial/clinic-stack-savings";
import { clinicPlans } from "@/lib/commercial/klinikos-commercial";

/**
 * The savings calculator has one job that matters more than being persuasive: being
 * checkable. A buyer who disproves one number stops believing all of them, so the rules
 * below are about what it must refuse to claim.
 */

const CORE = clinicPlans.core.monthlyPriceCents;
const IMPLEMENTATION = 800_000;

describe("clinic stack savings", () => {
  it("counts only what Klinikos actually replaces as saved", () => {
    // Connected spend continues after the sale and partial spend is a guess, so neither
    // belongs in a savings figure a clinic will check against its own invoices.
    const result = computeStackSavings(
      [
        { key: "texting", monthlyCents: 19_900 },       // replaced
        { key: "clearinghouse", monthlyCents: 15_000 },  // connected, still billed
        { key: "ehr", monthlyCents: 45_000 },            // partial, not claimed
      ],
      CORE,
      IMPLEMENTATION,
    );
    expect(result.replaceableMonthlyCents).toBe(19_900);
    expect(result.connectedMonthlyCents).toBe(15_000);
    expect(result.partialMonthlyCents).toBe(45_000);
    expect(result.netMonthlyChangeCents).toBe(19_900 - CORE);
  });

  it("shows a loss when the clinic's stack is cheaper than Klinikos", () => {
    // A calculator that can only produce good news is one nobody believes, and the
    // clinics it would mislead are the ones that churn. This is the realistic small
    // clinic: replaceable spend below the Core price.
    const result = computeStackSavings([{ key: "texting", monthlyCents: 9_900 }], CORE, IMPLEMENTATION);
    expect(result.netMonthlyChangeCents).toBeLessThan(0);
    expect(result.paybackMonths, "payback is meaningless when there is no saving").toBeNull();
  });

  it("never invents a cost for a category the clinic left blank", () => {
    const result = computeStackSavings([{ key: "texting", monthlyCents: 19_900 }], CORE, IMPLEMENTATION);
    expect(result.currentMonthlyCents).toBe(19_900);
    expect(result.unansweredCategories.length).toBe(STACK_CATEGORIES.length - 1);
    expect(result.unansweredCategories).toContain("EHR / charting");
  });

  it("reports nothing rather than zero when the clinic has entered nothing", () => {
    const result = computeStackSavings([], CORE, IMPLEMENTATION);
    expect(result.confidence).toBe("unknown");
    expect(result.currentMonthlyCents).toBe(0);
  });

  it("labels the clinic's own numbers as self-reported", () => {
    // Klinikos has not verified any of this, and the result should not imply otherwise.
    expect(computeStackSavings([{ key: "forms", monthlyCents: 8_900 }], CORE, IMPLEMENTATION).confidence)
      .toBe("self_reported");
  });

  it("keeps regulated external infrastructure out of the replaced column", () => {
    // Promising to replace a clearinghouse, eRx network or lab interface would be a lie
    // a clinic discovers during implementation, which is the worst possible moment.
    for (const key of ["clearinghouse", "erx", "labs", "phone"]) {
      const category = STACK_CATEGORIES.find((entry) => entry.key === key);
      expect(category?.disposition, `${key} must not be sold as replaceable`).toBe("connected");
    }
  });

  it("computes payback from the real implementation price, not a rounded one", () => {
    const result = computeStackSavings(
      [{ key: "practice_management", monthlyCents: 40_000 }, { key: "crm", monthlyCents: 40_000 },
       { key: "texting", monthlyCents: 39_900 }, { key: "tasks", monthlyCents: 15_000 }],
      CORE,
      IMPLEMENTATION,
    );
    const monthly = 134_900 - CORE;
    expect(result.netMonthlyChangeCents).toBe(monthly);
    expect(result.paybackMonths).toBe(Math.ceil(IMPLEMENTATION / monthly));
  });
});
