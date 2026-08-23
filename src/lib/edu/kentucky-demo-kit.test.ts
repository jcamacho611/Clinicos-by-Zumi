import { describe, expect, it } from "vitest";

import { kentuckyDemoKit } from "@/lib/edu/kentucky-demo-kit";

describe("Kentucky evaluator demo kit", () => {
  it("contains all representative material categories required by the RFP", () => {
    expect(kentuckyDemoKit.slideOutline.length).toBeGreaterThanOrEqual(8);
    expect(kentuckyDemoKit.participantActivity.title.length).toBeGreaterThan(0);
    expect(kentuckyDemoKit.assessmentItems.length).toBeGreaterThanOrEqual(3);
    expect(kentuckyDemoKit.rubric.length).toBeGreaterThanOrEqual(5);
    expect(kentuckyDemoKit.instructorGuide.agenda.length).toBeGreaterThanOrEqual(5);
    expect(kentuckyDemoKit.certificate.disclaimer.toLowerCase()).toContain("does not grant");
  });

  it("keeps the demo synthetic and human-reviewed", () => {
    expect(kentuckyDemoKit.participantActivity.dataBoundary.toLowerCase()).toContain("synthetic");
    expect(kentuckyDemoKit.authorityStatement.toLowerCase()).toContain("instructor");
    expect(kentuckyDemoKit.authorityStatement.toLowerCase()).toContain("final");
  });

  it("provides a complete clickable evaluator journey through product evidence", () => {
    const journey = kentuckyDemoKit.evaluatorJourney;
    expect(journey.length).toBeGreaterThanOrEqual(8);
    expect(journey.some((step) => step.href.includes("/edu/programs"))).toBe(true);
    expect(journey.some((step) => step.href.includes("/edu/zumi-practice"))).toBe(true);
    expect(journey.some((step) => step.href.includes("/edu/sessions"))).toBe(true);
    expect(journey.some((step) => step.href.includes("/edu/grading"))).toBe(true);
    expect(journey.some((step) => step.href.includes("/edu/reports"))).toBe(true);
    expect(journey.some((step) => step.href.includes("/edu/certificates"))).toBe(true);
  });
});
