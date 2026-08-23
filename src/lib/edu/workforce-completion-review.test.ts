import { describe, expect, it } from "vitest";

import { buildWorkforceCompletionReview } from "@/lib/edu/workforce-completion-review";

describe("workforce completion review", () => {
  it("requires verified instructional time, applied work, assessments, and instructor approval", () => {
    expect(buildWorkforceCompletionReview({
      minimumAttendancePercent: 80,
      scheduledMinutes: 420,
      verifiedMinutesPresent: 360,
      requiredActivities: 2,
      gradedActivities: 2,
      requiredKnowledgePairs: 1,
      comparableKnowledgePairs: 1,
      instructorApproved: true,
    })).toMatchObject({
      attendancePercent: 85.71,
      resolution: { status: "complete", blockers: [] },
    });
  });

  it("does not infer attendance when verified minutes are missing", () => {
    expect(buildWorkforceCompletionReview({
      minimumAttendancePercent: 80,
      scheduledMinutes: 420,
      verifiedMinutesPresent: 0,
      requiredActivities: 2,
      gradedActivities: 2,
      requiredKnowledgePairs: 1,
      comparableKnowledgePairs: 1,
      instructorApproved: true,
    }).resolution.blockers).toContain("attendance");
  });

  it("keeps assessment and activity blockers separate", () => {
    const review = buildWorkforceCompletionReview({
      minimumAttendancePercent: 80,
      scheduledMinutes: 420,
      verifiedMinutesPresent: 420,
      requiredActivities: 3,
      gradedActivities: 2,
      requiredKnowledgePairs: 1,
      comparableKnowledgePairs: 0,
      instructorApproved: true,
    });
    expect(review.resolution.blockers).toEqual(["activities", "assessments"]);
  });

  it("requires instructor approval even after all deterministic evidence is satisfied", () => {
    expect(buildWorkforceCompletionReview({
      minimumAttendancePercent: 80,
      scheduledMinutes: 420,
      verifiedMinutesPresent: 420,
      requiredActivities: 1,
      gradedActivities: 1,
      requiredKnowledgePairs: 0,
      comparableKnowledgePairs: 0,
      instructorApproved: false,
    }).resolution).toEqual({ status: "needs_instructor_review", blockers: ["instructor_review"] });
  });
});
