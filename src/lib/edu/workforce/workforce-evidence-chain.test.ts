import { describe, expect, it } from "vitest";

import { projectWorkforceEvidenceChain } from "./workforce-evidence-chain";

describe("Workforce evidence chain", () => {
  it("does not make registration or attendance equal completion", () => {
    const result = projectWorkforceEvidenceChain({
      enrolled: true,
      sessionScheduled: true,
      attendanceVerified: true,
      appliedEvidenceSatisfied: false,
      knowledgeSatisfied: false,
      instructorReviewed: false,
      completionApproved: false,
      credentialIssued: false,
    });

    expect(result.find((stage) => stage.key === "attendance")?.status).toBe("satisfied");
    expect(result.find((stage) => stage.key === "completion_approval")?.status).toBe("blocked");
  });

  it("requires explicit human completion approval before credential eligibility", () => {
    const result = projectWorkforceEvidenceChain({
      enrolled: true,
      sessionScheduled: true,
      attendanceVerified: true,
      appliedEvidenceSatisfied: true,
      knowledgeSatisfied: true,
      instructorReviewed: true,
      completionApproved: false,
      credentialIssued: false,
    });

    expect(result.find((stage) => stage.key === "completion_approval")?.status).toBe("action_required");
    expect(result.find((stage) => stage.key === "credential")?.status).toBe("blocked");
  });
});
