import { describe, expect, it } from "vitest";

import {
  compareKnowledgeAssessments,
  normalizeKnowledgeAssessment,
  type KnowledgeAssessmentAttempt,
} from "@/lib/edu/workforce-knowledge-measurement";

const pre: KnowledgeAssessmentAttempt = {
  phase: "pre",
  pointsAwarded: 6,
  pointsPossible: 10,
  completedAt: "2026-09-21T13:00:00.000Z",
  instructorReviewed: true,
};

const post: KnowledgeAssessmentAttempt = {
  phase: "post",
  pointsAwarded: 9,
  pointsPossible: 10,
  completedAt: "2026-09-21T20:00:00.000Z",
  instructorReviewed: true,
};

describe("workforce knowledge measurement", () => {
  it("normalizes a scored attempt without confusing it with self-reported confidence", () => {
    expect(normalizeKnowledgeAssessment(pre)).toMatchObject({ phase: "pre", percentScore: 60 });
  });

  it("computes paired knowledge change only from comparable pre/post scored assessments", () => {
    expect(compareKnowledgeAssessments(pre, post)).toEqual({
      comparable: true,
      prePercent: 60,
      postPercent: 90,
      percentagePointChange: 30,
      reason: null,
    });
  });

  it("refuses to manufacture improvement when either assessment lacks instructor review", () => {
    expect(compareKnowledgeAssessments(pre, { ...post, instructorReviewed: false })).toMatchObject({
      comparable: false,
      reason: "instructor_review_missing",
    });
  });

  it("refuses invalid or mismatched assessment totals", () => {
    expect(() => normalizeKnowledgeAssessment({ ...pre, pointsPossible: 0 })).toThrow();
    expect(compareKnowledgeAssessments(pre, { ...post, pointsPossible: 20 })).toMatchObject({
      comparable: false,
      reason: "assessment_scale_mismatch",
    });
  });
});
