export type WorkforceAttendanceStatus = "present" | "absent" | "partial" | "excused" | "unverified";

export type WorkforceAttendanceEvidence = {
  status: WorkforceAttendanceStatus;
  verifiedAt: Date | null;
};

export type WorkforceCompletionInput = {
  attendanceSatisfied: boolean;
  requiredActivitiesSatisfied: boolean;
  requiredAssessmentsSatisfied: boolean;
  instructorApproved: boolean;
};

export type WorkforceCompletionBlocker = "attendance" | "activities" | "assessments" | "instructor_review";

export type WorkforceCompletionResolution = {
  status: "incomplete" | "needs_instructor_review" | "complete";
  blockers: WorkforceCompletionBlocker[];
};

/**
 * Attendance only counts when a human/system-authoritative verification event exists.
 * Enrollment, login, invitation acceptance, and submission activity are not attendance.
 */
export function workforceAttendanceCountsTowardCompletion(evidence: WorkforceAttendanceEvidence) {
  return evidence.verifiedAt !== null && (evidence.status === "present" || evidence.status === "partial");
}

/**
 * Deterministic completion gate for workforce programs.
 * AI output never appears in this decision. Instructor approval remains the final
 * human authority after required evidence is satisfied.
 */
export function evaluateWorkforceCompletion(input: WorkforceCompletionInput): WorkforceCompletionResolution {
  const blockers: WorkforceCompletionBlocker[] = [];
  if (!input.attendanceSatisfied) blockers.push("attendance");
  if (!input.requiredActivitiesSatisfied) blockers.push("activities");
  if (!input.requiredAssessmentsSatisfied) blockers.push("assessments");

  if (blockers.length) return { status: "incomplete", blockers };
  if (!input.instructorApproved) return { status: "needs_instructor_review", blockers: ["instructor_review"] };
  return { status: "complete", blockers: [] };
}
