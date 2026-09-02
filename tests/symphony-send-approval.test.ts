import { describe, expect, it } from "vitest";
import { executeSymphonyEmail } from "@/lib/company/symphony-execution";
import { buildSymphonyEmail, type SymphonyCompanyProfile } from "@/lib/company/symphony-message-builder";
import {
  hashSymphonyMessage,
  type SymphonyApprovalConsumer,
  type SymphonySendApprovalEvidence,
} from "@/lib/company/symphony-approval";
import type { SymphonyContactHistory, SymphonyOpportunity } from "@/lib/company/symphony-opportunity-types";

const now = new Date("2026-09-01T20:00:00.000Z");

const opportunity: SymphonyOpportunity = {
  id: "opp-approval-1",
  title: "Healthcare operations conversation",
  opportunityClass: "CUSTOMER_REVENUE",
  targetClass: "BUYER",
  organizationName: "Example Clinic",
  organizationDomain: "exampleclinic.org",
  recipientEmail: "operations@exampleclinic.org",
  recipientName: "Operations Lead",
  purpose: "confirm operational fit",
  ask: "Would you be open to a short operating-analysis conversation?",
  messageFamily: "CUSTOMER_PILOT",
  fitVerified: true,
  officialContactPolicy: "EMAIL_ALLOWED",
  personalNetworkRestricted: false,
  strategicPartnershipApproved: false,
  deadline: null,
};

const history: SymphonyContactHistory = {
  priorTouches: [],
  hardBouncedEmails: [],
  suppressedEmails: [],
  activeSubstantiveThread: false,
  nextFollowUpAt: null,
  followUpCount: 0,
};

const profile: SymphonyCompanyProfile = {
  companyName: "Klinikos, Inc.",
  senderName: "Justin R. Camacho",
  senderTitle: "Founder & CEO",
  website: "https://klinikos.io",
  summary: "Klinikos is building a governed healthcare operating network.",
  verifiedFacts: [{ text: "Klinikos has implemented healthcare operating workflows.", truthClass: "CURRENT_FACT" }],
  visionStatements: [],
};

function approvalEvidence(approvalId = "approval-1"): SymphonySendApprovalEvidence {
  return {
    approvalId,
    approvedBy: "person-founder",
    approvedAt: new Date("2026-09-01T19:58:00.000Z"),
    consumedAt: now,
    evidenceReference: "evidence://symphony/approval-1",
  };
}

describe("Symphony consequential send approval", () => {
  it("prepares the exact message but does not invoke the sender without an approval consumer", async () => {
    let sends = 0;
    const result = await executeSymphonyEmail({
      opportunity,
      history,
      profile,
      now,
      senderAvailable: true,
      sender: async () => {
        sends += 1;
        return { ok: true, provider: "test", providerReference: "provider-1" };
      },
    });

    expect(sends).toBe(0);
    expect(result.state).toBe("USER_ACTION_REQUIRED");
    expect(result.message?.to).toBe(opportunity.recipientEmail);
    expect(result.reason).toMatch(/approval/i);
  });

  it("binds approval consumption to the exact opportunity and exact rendered message hash", async () => {
    const rendered = buildSymphonyEmail({ opportunity, profile });
    const expectedHash = hashSymphonyMessage(opportunity.id, rendered);
    let sends = 0;
    let approvalRequests = 0;

    const consumeApproval: SymphonyApprovalConsumer = async (request) => {
      approvalRequests += 1;
      expect(request).toMatchObject({
        approvalId: "approval-1",
        opportunityId: opportunity.id,
        messageHash: expectedHash,
      });
      return { ok: true, evidence: approvalEvidence() };
    };

    const result = await executeSymphonyEmail({
      opportunity,
      history,
      profile,
      now,
      senderAvailable: true,
      approvalId: "approval-1",
      consumeApproval,
      sender: async () => {
        sends += 1;
        return { ok: true, provider: "test", providerReference: "provider-1" };
      },
    });

    expect(approvalRequests).toBe(1);
    expect(sends).toBe(1);
    expect(result.state).toBe("PROVIDER_ACCEPTED");
    expect(result.approvalEvidence).toMatchObject({ approvalId: "approval-1", approvedBy: "person-founder" });
  });

  it("fails closed when approval is stale, mismatched, rejected, or already consumed", async () => {
    let sends = 0;
    const rejectedReasons = ["approval_expired", "approval_mismatch", "approval_rejected", "approval_already_consumed"] as const;

    for (const reason of rejectedReasons) {
      const consumeApproval: SymphonyApprovalConsumer = async () => ({
        ok: false,
        reason,
        detail: `Blocked: ${reason}`,
      });

      const result = await executeSymphonyEmail({
        opportunity,
        history,
        profile,
        now,
        senderAvailable: true,
        approvalId: "approval-1",
        consumeApproval,
        sender: async () => {
          sends += 1;
          return { ok: true, provider: "test", providerReference: "provider-1" };
        },
      });

      expect(result.state).toBe("USER_ACTION_REQUIRED");
      expect(result.reason).toContain(reason);
    }

    expect(sends).toBe(0);
  });

  it("rejects success-shaped approval evidence when it does not match the approval being consumed", async () => {
    let sends = 0;
    const consumeApproval: SymphonyApprovalConsumer = async () => ({
      ok: true,
      evidence: approvalEvidence("different-approval"),
    });

    const result = await executeSymphonyEmail({
      opportunity,
      history,
      profile,
      now,
      senderAvailable: true,
      approvalId: "approval-1",
      consumeApproval,
      sender: async () => {
        sends += 1;
        return { ok: true, provider: "test", providerReference: "provider-1" };
      },
    });

    expect(result.state).toBe("USER_ACTION_REQUIRED");
    expect(result.reason).toContain("approval_mismatch");
    expect(sends).toBe(0);
  });

  it("requires a new approval after the approval authority reports the first approval consumed", async () => {
    let consumed = false;
    let sends = 0;

    const consumeApproval: SymphonyApprovalConsumer = async () => {
      if (consumed) {
        return { ok: false, reason: "approval_already_consumed", detail: "Approval was already consumed." };
      }
      consumed = true;
      return { ok: true, evidence: approvalEvidence() };
    };

    const input = {
      opportunity,
      history,
      profile,
      now,
      senderAvailable: true,
      approvalId: "approval-1",
      consumeApproval,
      sender: async () => {
        sends += 1;
        return { ok: true as const, provider: "test", providerReference: `provider-${sends}` };
      },
    };

    const first = await executeSymphonyEmail(input);
    const replay = await executeSymphonyEmail(input);

    expect(first.state).toBe("PROVIDER_ACCEPTED");
    expect(replay.state).toBe("USER_ACTION_REQUIRED");
    expect(sends).toBe(1);
  });
});