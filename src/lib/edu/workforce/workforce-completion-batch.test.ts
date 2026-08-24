import { describe, expect, it } from "vitest";

import { buildBatchWorkforceCompletionEvidence } from "./workforce-completion-batch";

describe("batch Workforce completion evidence", () => {
  it("computes participant evidence across cohorts without mixing attendance or activity counts", () => {
    const result = buildBatchWorkforceCompletionEvidence({
      minimumAttendancePercent: 80,
      requiredKnowledgePairs: 1,
      enrollments: [
        {
          id: "e-1",
          cohortId: "cohort-a",
          courseId: "course-a",
          studentDisplayName: "A Learner",
          studentEmail: "a@example.test",
          status: "active",
          completedAt: null,
        },
        {
          id: "e-2",
          cohortId: "cohort-b",
          courseId: "course-b",
          studentDisplayName: "B Learner",
          studentEmail: "b@example.test",
          status: "active",
          completedAt: null,
        },
      ],
      sessions: [
        { id: "s-a", cohortId: "cohort-a", startsAt: new Date("2026-08-23T13:00:00Z"), endsAt: new Date("2026-08-23T15:00:00Z") },
        { id: "s-b", cohortId: "cohort-b", startsAt: new Date("2026-08-23T13:00:00Z"), endsAt: new Date("2026-08-23T15:00:00Z") },
      ],
      attendance: [
        { enrollmentId: "e-1", sessionId: "s-a", status: "present", verifiedAt: new Date("2026-08-23T15:01:00Z"), minutesPresent: 120 },
        { enrollmentId: "e-2", sessionId: "s-b", status: "partial", verifiedAt: new Date("2026-08-23T15:01:00Z"), minutesPresent: 30 },
      ],
      requiredActivitiesByCohort: new Map([
        ["cohort-a", 2],
        ["cohort-b", 3],
      ]),
      gradedActivitiesByEnrollment: new Map([
        ["e-1", 2],
        ["e-2", 3],
      ]),
      knowledgeByEnrollment: new Map([
        ["e-1", { pairedParticipants: 1, averagePercentagePointChange: 15 }],
        ["e-2", { pairedParticipants: 1, averagePercentagePointChange: 5 }],
      ]),
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      enrollmentId: "e-1",
      scheduledMinutes: 120,
      verifiedMinutesPresent: 120,
      attendancePercent: 100,
      requiredActivities: 2,
      gradedActivities: 2,
      resolution: { status: "needs_instructor_review" },
    });
    expect(result[1]).toMatchObject({
      enrollmentId: "e-2",
      scheduledMinutes: 120,
      verifiedMinutesPresent: 30,
      attendancePercent: 25,
      requiredActivities: 3,
      gradedActivities: 3,
      resolution: { status: "incomplete", blockers: ["attendance"] },
    });
  });

  it("ignores attendance for a session that belongs to another cohort", () => {
    const result = buildBatchWorkforceCompletionEvidence({
      minimumAttendancePercent: 80,
      requiredKnowledgePairs: 0,
      enrollments: [{
        id: "e-1",
        cohortId: "cohort-a",
        courseId: "course-a",
        studentDisplayName: "A Learner",
        studentEmail: "a@example.test",
        status: "active",
        completedAt: null,
      }],
      sessions: [
        { id: "s-a", cohortId: "cohort-a", startsAt: new Date("2026-08-23T13:00:00Z"), endsAt: new Date("2026-08-23T15:00:00Z") },
        { id: "s-b", cohortId: "cohort-b", startsAt: new Date("2026-08-23T13:00:00Z"), endsAt: new Date("2026-08-23T15:00:00Z") },
      ],
      attendance: [
        { enrollmentId: "e-1", sessionId: "s-b", status: "present", verifiedAt: new Date("2026-08-23T15:01:00Z"), minutesPresent: 120 },
      ],
      requiredActivitiesByCohort: new Map([["cohort-a", 0]]),
      gradedActivitiesByEnrollment: new Map([["e-1", 0]]),
      knowledgeByEnrollment: new Map(),
    });

    expect(result[0]).toMatchObject({
      scheduledMinutes: 120,
      verifiedMinutesPresent: 0,
      attendancePercent: 0,
      resolution: { status: "incomplete", blockers: ["attendance"] },
    });
  });
});
