import { describe, expect, it } from "vitest";
import { evaluateWorkforceCompletion, workforceAttendanceCountsTowardCompletion } from "@/lib/edu/workforce-delivery-evidence";

describe("workforce delivery evidence", () => {
  it("does not treat enrollment or unverified presence as attendance", () => {
    expect(workforceAttendanceCountsTowardCompletion({ status: "unverified", verifiedAt: null })).toBe(false);
    expect(workforceAttendanceCountsTowardCompletion({ status: "present", verifiedAt: null })).toBe(false);
  });

  it("accepts verified present or partial attendance as attendance evidence", () => {
    expect(workforceAttendanceCountsTowardCompletion({ status: "present", verifiedAt: new Date("2026-09-30T15:00:00Z") })).toBe(true);
    expect(workforceAttendanceCountsTowardCompletion({ status: "partial", verifiedAt: new Date("2026-09-30T15:00:00Z") })).toBe(true);
  });

  it("requires verified attendance, required work, and instructor approval before completion", () => {
    expect(evaluateWorkforceCompletion({
      attendanceSatisfied: true,
      requiredActivitiesSatisfied: true,
      requiredAssessmentsSatisfied: true,
      instructorApproved: false,
    })).toEqual({ status: "needs_instructor_review", blockers: ["instructor_review"] });

    expect(evaluateWorkforceCompletion({
      attendanceSatisfied: true,
      requiredActivitiesSatisfied: true,
      requiredAssessmentsSatisfied: true,
      instructorApproved: true,
    })).toEqual({ status: "complete", blockers: [] });
  });

  it("keeps missing evidence visible instead of manufacturing completion", () => {
    expect(evaluateWorkforceCompletion({
      attendanceSatisfied: false,
      requiredActivitiesSatisfied: false,
      requiredAssessmentsSatisfied: true,
      instructorApproved: true,
    })).toEqual({ status: "incomplete", blockers: ["attendance", "activities"] });
  });
});
