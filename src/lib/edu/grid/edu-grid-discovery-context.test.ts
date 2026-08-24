import { describe, expect, it } from "vitest";

import { buildEduGridDiscoveryContext } from "./edu-grid-discovery-context";

describe("EDU to Grid discovery context", () => {
  it("returns nothing without explicit learner opt-in", () => {
    expect(
      buildEduGridDiscoveryContext({
        optedIn: false,
        pathway: "healthcare",
        completionDate: "2026-08-23",
        releasedCompetencies: ["evaluate_ai_outputs"],
        opportunityIntents: ["work"],
      }),
    ).toBeNull();
  });

  it("labels training evidence as training, not licensure or employment eligibility", () => {
    const result = buildEduGridDiscoveryContext({
      optedIn: true,
      pathway: "healthcare",
      completionDate: "2026-08-23",
      releasedCompetencies: ["evaluate_ai_outputs"],
      opportunityIntents: ["work"],
    });

    expect(result?.evidenceKind).toBe("training_completion");
    expect(result?.establishesLicensure).toBe(false);
    expect(result?.establishesEmploymentEligibility).toBe(false);
    expect(result?.autoApply).toBe(false);
  });
});
