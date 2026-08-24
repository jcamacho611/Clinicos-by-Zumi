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
  const enrollment = input.enrolled;
  const session = enrollment && input.sessionScheduled;
  const attendance = session && input.attendanceVerified;
  const appliedEvidence = attendance && input.appliedEvidenceSatisfied;
  const knowledge = attendance && input.knowledgeSatisfied;
  const instructorReviewReady = appliedEvidence && knowledge;
  const instructorReview = instructorReviewReady && input.instructorReviewed;
  const completionApproval = instructorReview && input.completionApproved;
  const credential = completionApproval && input.credentialIssued;
  const reporting = completionApproval;

  const states = {
    enrollment,
    session,
    attendance,
    applied_evidence: appliedEvidence,
    knowledge,
    instructor_review: instructorReview,
    completion_approval: completionApproval,
    credential,
    reporting,
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
    if (states[key]) return { key, status: "satisfied" as const };

    if (key === "instructor_review" && instructorReviewReady && !input.instructorReviewed) {
      return { key, status: "action_required" as const };
    }

    if (key === "completion_approval" && instructorReview && !input.completionApproved) {
      return { key, status: "action_required" as const };
    }

    return { key, status: "blocked" as const };
  });
}
