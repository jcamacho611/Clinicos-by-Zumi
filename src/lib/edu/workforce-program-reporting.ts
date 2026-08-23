export type WorkforceParticipantRecord = {
  participantKey: string;
  pathway: string;
  deliveryMode: "in_person" | "live_remote" | "hybrid";
  attendancePercent: number;
  requiredActivitiesComplete: boolean;
  requiredAssessmentsComplete: boolean;
  instructorReviewed: boolean;
  completed: boolean;
  feedbackSubmitted: boolean;
  preAssessmentScore: number | null;
  postAssessmentScore: number | null;
};

export type WorkforceCompletionDecision = {
  eligibleForCompletion: boolean;
  reasons: string[];
};

export function evaluateWorkforceCompletion(record: WorkforceParticipantRecord, minimumAttendancePercent: number): WorkforceCompletionDecision {
  const reasons: string[] = [];
  if (record.attendancePercent < minimumAttendancePercent) reasons.push("attendance below required threshold");
  if (!record.requiredActivitiesComplete) reasons.push("required activities incomplete");
  if (!record.requiredAssessmentsComplete) reasons.push("required assessments incomplete");
  if (!record.instructorReviewed) reasons.push("instructor review missing");
  return { eligibleForCompletion: reasons.length === 0, reasons };
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function countBy(records: readonly WorkforceParticipantRecord[], select: (record: WorkforceParticipantRecord) => string) {
  return records.reduce<Record<string, number>>((counts, record) => {
    const key = select(record);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

export function summarizeWorkforceProgram(records: readonly WorkforceParticipantRecord[]) {
  const participants = records.length;
  const completed = records.filter((record) => record.completed).length;
  const assessmentComplete = records.filter((record) => record.requiredAssessmentsComplete).length;
  const feedbackSubmitted = records.filter((record) => record.feedbackSubmitted).length;
  const preScores = records.flatMap((record) => record.preAssessmentScore === null ? [] : [record.preAssessmentScore]);
  const postScores = records.flatMap((record) => record.postAssessmentScore === null ? [] : [record.postAssessmentScore]);
  const pairedChanges = records.flatMap((record) =>
    record.preAssessmentScore === null || record.postAssessmentScore === null
      ? []
      : [record.postAssessmentScore - record.preAssessmentScore],
  );

  return {
    participants,
    completed,
    completionPercent: participants ? Math.round((completed / participants) * 10000) / 100 : 0,
    assessmentComplete,
    feedbackSubmitted,
    averagePreScore: average(preScores),
    averagePostScore: average(postScores),
    averageScoreChange: average(pairedChanges),
    byPathway: countBy(records, (record) => record.pathway),
    byDeliveryMode: countBy(records, (record) => record.deliveryMode),
  };
}
