export type WorkforceEvidenceInput = {
  enrolled: boolean;
  sessionScheduled: boolean;
  attendanceVerified: boolean;
  appliedEvidenceSatisfied: boolean;
  knowledgeSatisfied: boolean;
  instructorReviewed: boolean;
  completionApproved: boolean;
  credentialIssued: boolean;
};

export type WorkforceEvidenceStageStatus = "satisfied" | "action_required" | "blocked";

export function projectWorkforceEvidenceChain(input: WorkforceEvidenceInput) {
  const prerequisites = {
    enrollment: input.enrolled,
    session: input.enrolled && input.sessionScheduled,
    attendance: input.enrolled && input.sessionScheduled && input.attendanceVerified,
    applied_evidence: input.attendanceVerified && input.appliedEvidenceSatisfied,
    knowledge: input.attendanceVerified && input.knowledgeSatisfied,
    instructor_review: input.appliedEvidenceSatisfied && input.knowledgeSatisfied && input.instructorReviewed,
    completion_approval: input.instructorReviewed && input.completionApproved,
    credential: input.completionApproved && input.credentialIssued,
    reporting: input.completionApproved,
  } as const;

  const order = [
    "enrollment",
    "session",
    "attendance",
    "applied_evidence",
    "knowledge",
    "instructor_review",
    "completion_approval",
    "credential",
    "reporting",
  ] as const;

  return order.map((key) => {
    const satisfied = prerequisites[key];
    const priorKey = order[Math.max(0, order.indexOf(key) - 1)];
    const priorSatisfied = key === "enrollment" ? true : prerequisites[priorKey];
    const humanAction = key === "completion_approval" && priorSatisfied && !satisfied;

    return {
      key,
      status: satisfied ? "satisfied" : humanAction ? "action_required" : "blocked",
    } as const;
  });
}
