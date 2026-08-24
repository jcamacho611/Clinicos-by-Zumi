import { describe, expect, it } from "vitest";

import {
  evaluateWorkforceCompletion,
  summarizeWorkforceProgram,
  type WorkforceParticipantRecord,
} from "@/lib/edu/workforce-program-reporting";

const base: WorkforceParticipantRecord = {
  participantKey: "p-1",
  pathway: "healthcare",
  deliveryMode: "live_remote",
  attendancePercent: 100,
  requiredActivitiesComplete: true,
  requiredAssessmentsComplete: true,
  instructorReviewed: true,
  completed: true,
  feedbackSubmitted: false,
  preAssessmentScore: 6,
  postAssessmentScore: 9,
};

describe("workforce program reporting", () => {
  it("does not treat attendance alone as completion", () => {
    expect(evaluateWorkforceCompletion({
      ...base,
      requiredActivitiesComplete: false,
      requiredAssessmentsComplete: false,
      instructorReviewed: false,
      completed: false,
    }, 80)).toEqual({ eligibleForCompletion: false, reasons: expect.arrayContaining(["required activities incomplete", "required assessments incomplete", "instructor review missing"]) });
  });

  it("requires the configured attendance threshold and instructor review", () => {
    expect(evaluateWorkforceCompletion({ ...base, attendancePercent: 79 }, 80).eligibleForCompletion).toBe(false);
    expect(evaluateWorkforceCompletion({ ...base, instructorReviewed: false }, 80).eligibleForCompletion).toBe(false);
    expect(evaluateWorkforceCompletion(base, 80).eligibleForCompletion).toBe(true);
  });

  it("summarizes real records without dividing by zero", () => {
    expect(summarizeWorkforceProgram([])).toEqual({
      participants: 0,
      completed: 0,
      completionPercent: 0,
      assessmentComplete: 0,
      feedbackSubmitted: 0,
      averagePreScore: null,
      averagePostScore: null,
      averageScoreChange: null,
      byPathway: {},
      byDeliveryMode: {},
    });
  });

  it("reports pathway, modality, completion and pre/post change from supplied records", () => {
    const summary = summarizeWorkforceProgram([
      base,
      { ...base, participantKey: "p-2", pathway: "manufacturing", deliveryMode: "in_person", completed: false, instructorReviewed: false, feedbackSubmitted: true, preAssessmentScore: 4, postAssessmentScore: 7 },
    ]);

    expect(summary.participants).toBe(2);
    expect(summary.completed).toBe(1);
    expect(summary.completionPercent).toBe(50);
    expect(summary.averagePreScore).toBe(5);
    expect(summary.averagePostScore).toBe(8);
    expect(summary.averageScoreChange).toBe(3);
    expect(summary.byPathway).toEqual({ healthcare: 1, manufacturing: 1 });
    expect(summary.byDeliveryMode).toEqual({ live_remote: 1, in_person: 1 });
  });
});