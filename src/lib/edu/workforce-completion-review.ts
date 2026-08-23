import { evaluateWorkforceCompletion } from "@/lib/edu/workforce-delivery-evidence";

export const defaultWorkforceCompletionPolicy = {
  minimumAttendancePercent: 80,
  requiredKnowledgePairs: 1,
} as const;

export type WorkforceCompletionReviewInput = {
  minimumAttendancePercent: number;
  scheduledMinutes: number;
  verifiedMinutesPresent: number;
  requiredActivities: number;
  gradedActivities: number;
  requiredKnowledgePairs: number;
  comparableKnowledgePairs: number;
  instructorApproved: boolean;
};

export function buildWorkforceCompletionReview(input: WorkforceCompletionReviewInput) {
  if (input.minimumAttendancePercent < 0 || input.minimumAttendancePercent > 100) throw new Error("Attendance threshold must be between 0 and 100.");
  if ([input.scheduledMinutes, input.verifiedMinutesPresent, input.requiredActivities, input.gradedActivities, input.requiredKnowledgePairs, input.comparableKnowledgePairs].some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("Completion evidence counts and minutes must be non-negative finite numbers.");
  }

  const boundedVerifiedMinutes = Math.min(input.verifiedMinutesPresent, input.scheduledMinutes);
  const attendancePercent = input.scheduledMinutes > 0
    ? Math.round((boundedVerifiedMinutes / input.scheduledMinutes) * 10000) / 100
    : 0;
  const attendanceSatisfied = attendancePercent >= input.minimumAttendancePercent;
  const requiredActivitiesSatisfied = input.requiredActivities === 0 || input.gradedActivities >= input.requiredActivities;
  const requiredAssessmentsSatisfied = input.requiredKnowledgePairs === 0 || input.comparableKnowledgePairs >= input.requiredKnowledgePairs;

  return {
    attendancePercent,
    attendanceSatisfied,
    requiredActivitiesSatisfied,
    requiredAssessmentsSatisfied,
    resolution: evaluateWorkforceCompletion({
      attendanceSatisfied,
      requiredActivitiesSatisfied,
      requiredAssessmentsSatisfied,
      instructorApproved: input.instructorApproved,
    }),
  };
}
