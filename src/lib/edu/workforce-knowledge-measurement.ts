export type KnowledgeAssessmentPhase = "pre" | "post";

export type KnowledgeAssessmentAttempt = {
  phase: KnowledgeAssessmentPhase;
  pointsAwarded: number;
  pointsPossible: number;
  completedAt: string;
  instructorReviewed: boolean;
};

export type NormalizedKnowledgeAssessment = KnowledgeAssessmentAttempt & {
  percentScore: number;
};

export type KnowledgeAssessmentComparison = {
  comparable: boolean;
  prePercent: number | null;
  postPercent: number | null;
  percentagePointChange: number | null;
  reason: "instructor_review_missing" | "assessment_scale_mismatch" | "phase_mismatch" | null;
};

export function normalizeKnowledgeAssessment(attempt: KnowledgeAssessmentAttempt): NormalizedKnowledgeAssessment {
  if (!Number.isFinite(attempt.pointsAwarded) || !Number.isFinite(attempt.pointsPossible)) {
    throw new Error("Knowledge assessment points must be finite numbers.");
  }
  if (attempt.pointsPossible <= 0) throw new Error("Knowledge assessment points possible must be greater than zero.");
  if (attempt.pointsAwarded < 0 || attempt.pointsAwarded > attempt.pointsPossible) {
    throw new Error("Knowledge assessment points awarded must be within the available score range.");
  }

  return {
    ...attempt,
    percentScore: Math.round((attempt.pointsAwarded / attempt.pointsPossible) * 10000) / 100,
  };
}

export function compareKnowledgeAssessments(
  preAttempt: KnowledgeAssessmentAttempt,
  postAttempt: KnowledgeAssessmentAttempt,
): KnowledgeAssessmentComparison {
  const pre = normalizeKnowledgeAssessment(preAttempt);
  const post = normalizeKnowledgeAssessment(postAttempt);

  if (pre.phase !== "pre" || post.phase !== "post") {
    return { comparable: false, prePercent: pre.percentScore, postPercent: post.percentScore, percentagePointChange: null, reason: "phase_mismatch" };
  }
  if (!pre.instructorReviewed || !post.instructorReviewed) {
    return { comparable: false, prePercent: pre.percentScore, postPercent: post.percentScore, percentagePointChange: null, reason: "instructor_review_missing" };
  }
  if (pre.pointsPossible !== post.pointsPossible) {
    return { comparable: false, prePercent: pre.percentScore, postPercent: post.percentScore, percentagePointChange: null, reason: "assessment_scale_mismatch" };
  }

  return {
    comparable: true,
    prePercent: pre.percentScore,
    postPercent: post.percentScore,
    percentagePointChange: Math.round((post.percentScore - pre.percentScore) * 100) / 100,
    reason: null,
  };
}
