import { describe, expect, it } from "vitest";
import { STACK_CATEGORIES, computeStackSavings } from "@/lib/commercial/clinic-stack-savings";
import { clinicPlans } from "@/lib/commercial/klinikos-commercial";

/**
 * A buyer who disproves one number stops believing all of them. These tests therefore
 * protect both arithmetic truth and current replacement-readiness truth.
 */

const CORE = clinicPlans.core.monthlyPriceCents;
const IMPLEMENTATION = 800_000;

describe("clinic stack savings", () => {
  it("counts only native currently-countable replacement scope as saved", () => {
    const result = computeStackSavings(
      [
        { key: "practice_management", monthlyCents: 25_000 }, // currently countable replacement
        { key: "texting", monthlyCents: 19_900 },             // target, external rail not ready enough to count
        { key: "clearinghouse", monthlyCents: 15_000 },       // connected, still billed
        { key: "ehr", monthlyCents: 45_000 },                 // partial, not claimed
      ],
      CORE,
      IMPLEMENTATION,
    );
    expect(result.replaceableMonthlyCents).toBe(25_000);
    expect(result.transitionMonthlyCents).toBe(19_900);
    expect(result.connectedMonthlyCents).toBe(15_000);
    expect(result.partialMonthlyCents).toBe(45_000);
    expect(result.netMonthlyChangeCents).toBe(25_000 - CORE);
    expect(result.transitionCategories).toContain("Patient texting");
  });

  it("does not use SMS, external AI, or transition storage to manufacture savings", () => {
    const result = computeStackSavings(
      [
        { key: "texting", monthlyCents: 30_000 },
        { key: "ai_tools", monthlyCents: 30_000 },
        { key: "documents", monthlyCents: 15_000 },
      ],
      CORE,
      IMPLEMENTATION,
    );
    expect(result.replaceableMonthlyCents).toBe(0);
    expect(result.transitionMonthlyCents).toBe(75_000);
    expect(result.netMonthlyChangeCents).toBe(-CORE);
    expect(result.paybackMonths).toBeNull();
  });

  it("shows a loss when currently countable replacement spend is cheaper than Klinikos", () => {
    const result = computeStackSavings([{ key: "forms", monthlyCents: 9_900 }], CORE, IMPLEMENTATION);
    expect(result.netMonthlyChangeCents).toBeLessThan(0);
    expect(result.paybackMonths, "payback is meaningless when there is no saving").toBeNull();
  });

  it("never invents a cost for a category the clinic left blank", () => {
    const result = computeStackSavings([{ key: "forms", monthlyCents: 8_900 }], CORE, IMPLEMENTATION);
    expect(result.currentMonthlyCents).toBe(8_900);
    expect(result.unansweredCategories.length).toBe(STACK_CATEGORIES.length - 1);
    expect(result.unansweredCategories).toContain("EHR / charting");
  });

  it("reports nothing rather than zero-confidence evidence when the clinic entered nothing", () => {
    const result = computeStackSavings([], CORE, IMPLEMENTATION);
    expect(result.confidence).toBe("unknown");
    expect(result.currentMonthlyCents).toBe(0);
  });

  it("labels the clinic's own numbers as self-reported", () => {
    expect(computeStackSavings([{ key: "forms", monthlyCents: 8_900 }], CORE, IMPLEMENTATION).confidence)
      .toBe("self_reported");
  });

  it("keeps regulated external infrastructure out of the replaced column", () => {
    for (const key of ["clearinghouse", "erx", "labs", "phone"]) {
      const category = STACK_CATEGORIES.find((entry) => entry.key === key);
      expect(category?.disposition, `${key} must not be sold as replaceable`).toBe("connected");
      expect(category?.replacementReadiness).toBe("not_applicable");
    }
  });

  it("marks known unresolved replacement dependencies so a future copy edit cannot count them", () => {
    expect(STACK_CATEGORIES.find((entry) => entry.key === "texting")?.replacementReadiness).toBe("external_connection_required");
    expect(STACK_CATEGORIES.find((entry) => entry.key === "ai_tools")?.replacementReadiness).toBe("external_connection_required");
    expect(STACK_CATEGORIES.find((entry) => entry.key === "documents")?.replacementReadiness).toBe("transition_only");
  });

  it("computes payback only from currently countable native replacement scope", () => {
    const result = computeStackSavings(
      [
        { key: "practice_management", monthlyCents: 40_000 },
        { key: "crm", monthlyCents: 40_000 },
        { key: "forms", monthlyCents: 20_000 },
        { key: "tasks", monthlyCents: 15_000 },
        { key: "texting", monthlyCents: 39_900 }, // deliberately excluded until rail is ready
      ],
      CORE,
      IMPLEMENTATION,
    );
    const monthly = 115_000 - CORE;
    expect(result.replaceableMonthlyCents).toBe(115_000);
    expect(result.transitionMonthlyCents).toBe(39_900);
    expect(result.netMonthlyChangeCents).toBe(monthly);
    expect(result.paybackMonths).toBe(Math.ceil(IMPLEMENTATION / monthly));
  });
});
