import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("public Klinikos EDU Workforce proof", () => {
  it("renders Workforce proof from merged program/configuration sources instead of a second pathway registry", () => {
    const source = read("src/app/edu/page.tsx");

    expect(source).toContain("workforceAiReadinessProgram");
    expect(source).toContain("industryAcceleratorPathways");
    expect(source).toContain("careerReadinessWorkshop");
    expect(source).toContain("WORKFORCE_APPLIED_LEARNING_LOOP");
    expect(source).toContain("SCWDB_HEALTHCARE_EVALUATOR_DEMO");
    expect(source).toContain("SCWDB_WORKFORCE_CONFIGURATION");
    expect(source).toContain("Already built for live workforce delivery");
    expect(source).toContain("Instructor-controlled completion");
    expect(source).toContain("configure, validate, rehearse and launch");
    expect(source).not.toContain("transportation-logistics");
    expect(source).not.toContain("professional-services");
  });

  it("keeps the public proof truthful about customer and authority state", () => {
    const source = read("src/app/edu/page.tsx");

    expect(source).toContain("Synthetic scenario");
    expect(source).toContain("Zumi may help learners practice");
    expect(source).toContain("Zumi cannot approve completion");
    expect(source).not.toContain("SCWDB customer");
    expect(source).not.toContain("Kentucky deployed");
    expect(source).not.toContain("government approved");
  });
});
