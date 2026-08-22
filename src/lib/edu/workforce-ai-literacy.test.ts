import { describe, expect, it } from "vitest";

import {
  getWorkforceAiLiteracyModule,
  getWorkforceAiOccupationalPathway,
  workforceAiDeliveryPrinciples,
  workforceAiLiteracyModuleKeys,
  workforceAiLiteracyModules,
  workforceAiOccupationalPathways,
} from "@/lib/edu/workforce-ai-literacy";

describe("workforce AI literacy foundation", () => {
  it("covers the five foundational workforce AI literacy areas", () => {
    expect(workforceAiLiteracyModuleKeys).toEqual([
      "understand_ai",
      "explore_uses",
      "direct_ai_effectively",
      "evaluate_outputs",
      "use_ai_responsibly",
    ]);
    expect(workforceAiLiteracyModules).toHaveLength(5);
  });

  it("requires prompting, verification, privacy/security, and human accountability", () => {
    const prompting = getWorkforceAiLiteracyModule("direct_ai_effectively");
    const evaluation = getWorkforceAiLiteracyModule("evaluate_outputs");
    const responsibility = getWorkforceAiLiteracyModule("use_ai_responsibly");

    expect(prompting?.learningObjectives.join(" ").toLowerCase()).toContain("prompts");
    expect(prompting?.learningObjectives.join(" ").toLowerCase()).toContain("confidential");
    expect(evaluation?.learningObjectives.join(" ").toLowerCase()).toContain("accuracy");
    expect(evaluation?.learningObjectives.join(" ").toLowerCase()).toContain("verify");
    expect(responsibility?.learningObjectives.join(" ").toLowerCase()).toContain("cybersecurity");
    expect(responsibility?.learningObjectives.join(" ").toLowerCase()).toContain("human");
  });

  it("makes practice and human instruction explicit", () => {
    expect(
      workforceAiDeliveryPrinciples.some((principle) =>
        principle.toLowerCase().includes("live instructors"),
      ),
    ).toBe(true);
    expect(
      workforceAiDeliveryPrinciples.some((principle) =>
        principle.toLowerCase().includes("learners practice doing work"),
      ),
    ).toBe(true);
  });

  it("distinguishes the built healthcare foundation from configurable pathways", () => {
    expect(getWorkforceAiOccupationalPathway("healthcare")?.status).toBe(
      "built_healthcare_foundation",
    );

    for (const pathway of workforceAiOccupationalPathways) {
      if (pathway.key === "healthcare") continue;
      expect(pathway.status).toBe("configurable_methodology");
      expect(pathway.suggestedSimulationRoles).toEqual([]);
    }
  });

  it("keeps the healthcare examples operational rather than clinical-decision training", () => {
    const healthcare = getWorkforceAiOccupationalPathway("healthcare");
    const examples = healthcare?.exampleOperationalContexts.join(" ").toLowerCase() ?? "";

    expect(examples).toContain("scheduling");
    expect(examples).toContain("documentation support");
    expect(examples).toContain("referral");
    expect(examples).toContain("privacy");
    expect(examples).not.toContain("diagnos");
    expect(examples).not.toContain("prescrib");
  });
});
