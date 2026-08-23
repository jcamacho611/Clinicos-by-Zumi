import { describe, expect, it } from "vitest";

import { aiCareerReadinessModule } from "@/lib/edu/ai-career-readiness";
import {
  assertInstitutionalProgramTemplate,
  baselineWorkforceReportingFields,
} from "@/lib/edu/institutional-program";

const validTemplate = {
  key: "test_program",
  label: "Test workforce program",
  templateStatus: "proposed_demo_template" as const,
  audience: ["adult learners"],
  description: "A live instructor-led workforce program.",
  deliveryModes: ["in_person", "live_remote"] as const,
  curriculumPackageKeys: ["ai_in_healthcare_operations"] as const,
  customModuleKeys: ["understand_ai"],
  objectives: [{ key: "verify", statement: "Verify consequential AI output before action." }],
  completionRule: {
    minimumAttendancePercent: 80,
    requiredAssessmentKeys: ["pre", "applied", "post"],
    requireInstructorReview: true,
    requireAllRequiredModules: true,
  },
  certificate: {
    title: "Certificate of Completion",
    subtitle: "Workforce AI Readiness",
    disclaimer: "This documents course completion and does not grant a professional license or certification.",
  },
  reportingFields: baselineWorkforceReportingFields,
  accessibilityNotes: ["Keyboard accessible"],
  safetyBoundaries: ["Human review required"],
};

describe("institutional EDU workforce contracts", () => {
  it("requires human instructor authority for completion", () => {
    expect(() => assertInstitutionalProgramTemplate({
      ...validTemplate,
      completionRule: { ...validTemplate.completionRule, requireInstructorReview: false },
    })).toThrow(/instructor authority/i);
  });

  it("rejects invalid attendance percentages", () => {
    expect(() => assertInstitutionalProgramTemplate({
      ...validTemplate,
      completionRule: { ...validTemplate.completionRule, minimumAttendancePercent: 101 },
    })).toThrow(/attendance/i);
  });

  it("requires certificate wording that disclaims professional authority", () => {
    expect(() => assertInstitutionalProgramTemplate({
      ...validTemplate,
      certificate: { ...validTemplate.certificate, disclaimer: "Completed the program." },
    })).toThrow(/license|certif/i);
  });

  it("defines workforce reporting fields needed for delivery and audit", () => {
    const keys = baselineWorkforceReportingFields.map((field) => field.key);
    expect(keys).toEqual(expect.arrayContaining([
      "enrolled",
      "attended",
      "completed",
      "assessment_completion",
      "pre_post_comparison",
      "participant_feedback",
      "program_revision",
    ]));
  });

  it("keeps career readiness truthful and human-owned", () => {
    const prohibited = aiCareerReadinessModule.activities.flatMap((activity) => activity.prohibited);
    expect(prohibited).toEqual(expect.arrayContaining(["inventing credentials", "inventing employment"]));
    expect(aiCareerReadinessModule.authorityRule.toLowerCase()).toContain("factual accuracy");
    expect(aiCareerReadinessModule.authorityRule.toLowerCase()).toContain("final submission");
  });
});