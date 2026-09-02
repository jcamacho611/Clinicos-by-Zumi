import { describe, expect, it } from "vitest";
import {
  executeSymphonyEmail,
  type SymphonyApprovalStore,
  type SymphonyExecutionAuditEvent,
  type SymphonyOutboundApprovalRecord,
} from "@/lib/company/symphony-execution";
import {
  buildSymphonyEmail,
  type SymphonyCompanyProfile,
} from "@/lib/company/symphony-message-builder";
import type {
  SymphonyContactHistory,
  SymphonyOpportunity,
} from "@/lib/company/symphony-opportunity-types";
import {
  hashSymphonyOutboundMessage,
  validateClaimedSymphonyApproval,
} from "@/lib/company/symphony-approval";

const now = new Date("2026-09-02T12:00:00.000Z");

function opportunity(overrides: Partial<SymphonyOpportunity> = {}): SymphonyOpportunity {
  return {
    id: "opp-approval-1",
    title: "Healthcare technology program",
    opportunityClass: "GRANT_NON_DILUTIVE",
    targetClass: "FUNDER",
    organizationName: "Example Program",
    organizationDomain: "example.org",
    recipientEmail: "program@example.org",
    recipientName: "Program Officer",
    purpose: "confirm current program fit",
    ask: "Could you confirm whether Klinikos fits the current program?",
    messageFamily: "FUNDING_PROGRAM_ROUTING",
    fitVerified: true,
    officialContactPolicy: "EMAIL_ALLOWED",
    personalNetworkRestricted: false,
    strategicPartnershipApproved: false,
    deadline: new Date("2026-09-30T23:59:59.000Z"),
    ...overrides,
  };
}

function history(): SymphonyContactHistory {
  return {
    priorTouches: [],
    hardBouncedEmails: [],
    suppressedEmails: [],
    activeSubstantiveThread: false,
    nextFollowUpAt: null,
    followUpCount: 0,
  };
}

function profile(overrides: Partial<SymphonyCompanyProfile> = {}): SymphonyCompanyProfile {
  return {
    companyName: "Klinikos, Inc.",
    senderName: "Justin R. Camacho",
    senderTitle: "Founder & CEO",
    website: "https://klinikos.io",
    summary: "Klinikos is building a governed operating network for healthcare.",
    verifiedFacts: [
      {
        evidenceId: "evidence-company-formation",
        sourceReference: "corporate-record://ny/klinikos",
        text: "Klinikos is a New York business corporation.",
        truthClass: "ACTUAL",
        observedAt: new Date("2026-08-01T12:00:00.000Z"),
        verifiedAt: new Date("2026-09-01T12:00:00.000Z"),
        reviewAfter: new Date("2026-09-15T12:00:00.000Z"),
        expiresAt: new Date("2026-09-30T12:00:00.000Z"),
        approvedForExternalUse: {
          evidenceId: "external-use-company-formation",
          approvedByActorId: "founder-1",
          approvedAt: new Date("2026-09-01T13:00:00.000Z"),
          purpose: "confirm current program fit",
          expiresAt: new Date("2026-09-30T12:00:00.000Z"),
          revokedAt: null,
        },
      },
    ],
    visionStatements: ["Klinikos is building toward a broader healthcare operating network."],
    disclosureReview: {
      evidenceId: "disclosure-review-1",
      classification: "PUBLIC",
      minimumNecessary: true,
      purpose: "confirm current program fit",
      reviewedByActorId: "founder-1",
      reviewedAt: new Date("2026-09-01T13:00:00.000Z"),
      reviewAfter: new Date("2026-09-15T12:00:00.000Z"),
      expiresAt: new Date("2026-09-30T12:00:00.000Z"),
      revokedAt: null,
    },
    ...overrides,
  };
}

function approvalRecord(messageHash: string, overrides: Partial<SymphonyOutboundApprovalRecord> = {}): SymphonyOutboundApprovalRecord {
  return {
    id: "approval-1",
    scope: "SYMPHONY_EMAIL_SEND",
    payloadSha256: messageHash,
    recipient: "program@example.org",
    opportunityId: "opp-approval-1",
    purpose: "confirm current program fit",
    requestedByActorId: "draft-author-1",
    authorizedActorId: "symphony-operator-1",
    approvedByActorId: "founder-1",
    approvedAt: new Date("2026-09-02T11:00:00.000Z"),
    expiresAt: new Date("2026-09-02T13:00:00.000Z"),
    revokedAt: null,
    consumedAt: now,
    consumedByExecutionId: "execution-1",
    consumedByIdempotencyKey: "symphony-send-1",
    toolId: "klinikos-outbound-email",
    providerId: "resend",
    ...overrides,
  };
}

function claimedStore(record: SymphonyOutboundApprovalRecord) {
  const outcomes: SymphonyExecutionAuditEvent[] = [];
  const store: SymphonyApprovalStore = {
    claimForSend: async () => ({ status: "CLAIMED", approval: record }),
    recordOutcome: async (event) => {
      outcomes.push(event);
    },
  };
  return { store, outcomes };
}

describe("Symphony evidence and disclosure safety", () => {
  it("requires source, freshness, and external-use approval for every verified fact", () => {
    const valid = buildSymphonyEmail({ opportunity: opportunity(), profile: profile(), now });
    expect(valid.body).toContain("Klinikos is a New York business corporation.");

    const unsafeFact = {
      ...profile().verifiedFacts[0],
      sourceReference: "",
    };
    expect(() =>
      buildSymphonyEmail({
        opportunity: opportunity(),
        profile: profile({ verifiedFacts: [unsafeFact] }),
        now,
      }),
    ).toThrow(/source|evidence/i);

    const staleFact = {
      ...profile().verifiedFacts[0],
      reviewAfter: new Date("2026-09-01T00:00:00.000Z"),
    };
    expect(() =>
      buildSymphonyEmail({
        opportunity: opportunity(),
        profile: profile({ verifiedFacts: [staleFact] }),
        now,
      }),
    ).toThrow(/stale|review/i);

    const revokedExternalUse = {
      ...profile().verifiedFacts[0],
      approvedForExternalUse: {
        ...profile().verifiedFacts[0].approvedForExternalUse,
        revokedAt: new Date("2026-09-02T10:00:00.000Z"),
      },
    };
    expect(() =>
      buildSymphonyEmail({
        opportunity: opportunity(),
        profile: profile({ verifiedFacts: [revokedExternalUse] }),
        now,
      }),
    ).toThrow(/revoked|external/i);

    const approvedBeforeVerification = {
      ...profile().verifiedFacts[0],
      approvedForExternalUse: {
        ...profile().verifiedFacts[0].approvedForExternalUse,
        approvedAt: new Date("2026-08-31T12:00:00.000Z"),
      },
    };
    expect(() =>
      buildSymphonyEmail({
        opportunity: opportunity(),
        profile: profile({ verifiedFacts: [approvedBeforeVerification] }),
        now,
      }),
    ).toThrow(/external-use approval.*verification|chronolog/i);
  });

  it("denies PHI, crown-jewel, and non-minimum-necessary disclosure classes", () => {
    for (const classification of ["PHI", "CROWN_JEWEL"] as const) {
      expect(() =>
        buildSymphonyEmail({
          opportunity: opportunity(),
          profile: profile({
            disclosureReview: { ...profile().disclosureReview, classification },
          }),
          now,
        }),
      ).toThrow(/phi|crown|disclosure/i);
    }

    expect(() =>
      buildSymphonyEmail({
        opportunity: opportunity(),
        profile: profile({
          disclosureReview: { ...profile().disclosureReview, minimumNecessary: false },
        }),
        now,
      }),
    ).toThrow(/minimum necessary/i);
  });
});

describe("Symphony one-time outbound approval", () => {
  it("hashes the exact outbound payload so recipient or body changes invalidate approval", () => {
    const message = buildSymphonyEmail({ opportunity: opportunity(), profile: profile(), now });
    const original = hashSymphonyOutboundMessage(message);
    expect(hashSymphonyOutboundMessage({ ...message, to: "other@example.org" })).not.toBe(original);
    expect(hashSymphonyOutboundMessage({ ...message, body: `${message.body}\nChanged` })).not.toBe(original);
    expect(original).toMatch(/^[a-f0-9]{64}$/);
  });

  it("validates every server-claimed approval binding and its one-time consumed state", () => {
    const message = buildSymphonyEmail({ opportunity: opportunity(), profile: profile(), now });
    const payloadSha256 = hashSymphonyOutboundMessage(message);
    const expected = {
      approvalId: "approval-1",
      payloadSha256,
      recipient: "program@example.org",
      opportunityId: "opp-approval-1",
      purpose: "confirm current program fit",
      actorId: "symphony-operator-1",
      executionId: "execution-1",
      idempotencyKey: "symphony-send-1",
      toolId: "klinikos-outbound-email",
      providerId: "resend",
      now,
    };

    expect(validateClaimedSymphonyApproval(approvalRecord(payloadSha256), expected)).toEqual({ ok: true });
    expect(validateClaimedSymphonyApproval(approvalRecord(payloadSha256, { payloadSha256: "0".repeat(64) }), expected)).toMatchObject({ ok: false, reason: "PAYLOAD_MISMATCH" });
    expect(validateClaimedSymphonyApproval(approvalRecord(payloadSha256, { recipient: "other@example.org" }), expected)).toMatchObject({ ok: false, reason: "RECIPIENT_MISMATCH" });
    expect(validateClaimedSymphonyApproval(approvalRecord(payloadSha256, { expiresAt: now }), expected)).toMatchObject({ ok: false, reason: "EXPIRED" });
    expect(validateClaimedSymphonyApproval(approvalRecord(payloadSha256, { revokedAt: now }), expected)).toMatchObject({ ok: false, reason: "REVOKED" });
    expect(validateClaimedSymphonyApproval(approvalRecord(payloadSha256, { consumedByExecutionId: "execution-other" }), expected)).toMatchObject({ ok: false, reason: "REPLAYED" });
    expect(validateClaimedSymphonyApproval(approvalRecord(payloadSha256, { approvedByActorId: "" }), expected)).toMatchObject({ ok: false, reason: "MISSING_APPROVER" });
    expect(validateClaimedSymphonyApproval(approvalRecord(payloadSha256, { consumedByIdempotencyKey: "send-other" }), expected)).toMatchObject({ ok: false, reason: "IDEMPOTENCY_MISMATCH" });
    expect(validateClaimedSymphonyApproval(approvalRecord(payloadSha256, { consumedAt: new Date("2026-09-02T13:00:00.000Z") }), expected)).toMatchObject({ ok: false, reason: "INVALID_CONSUMPTION_TIME" });
    expect(validateClaimedSymphonyApproval(approvalRecord(payloadSha256, { approvedAt: new Date("invalid") }), expected)).toMatchObject({ ok: false, reason: "INVALID_APPROVAL_TIME" });
    expect(validateClaimedSymphonyApproval(approvalRecord(payloadSha256, { expiresAt: new Date("invalid") }), expected)).toMatchObject({ ok: false, reason: "INVALID_APPROVAL_TIME" });
    expect(validateClaimedSymphonyApproval(approvalRecord(payloadSha256, { consumedAt: new Date("invalid") }), expected)).toMatchObject({ ok: false, reason: "INVALID_CONSUMPTION_TIME" });
  });

  it("remains draft-only without a one-time approval claim", async () => {
    let sends = 0;
    const result = await executeSymphonyEmail({
      opportunity: opportunity(),
      history: history(),
      profile: profile(),
      now,
      sender: {
        toolId: "klinikos-outbound-email",
        providerId: "resend",
        send: async () => {
          sends += 1;
          return { ok: true, provider: "resend", providerReference: "provider-1" };
        },
      },
    });
    expect(sends).toBe(0);
    expect(result.state).toBe("APPROVAL_REQUIRED");
    expect(result.message?.to).toBe("program@example.org");
  });

  it.each(["MISSING", "EXPIRED", "REVOKED", "REPLAYED", "MISMATCH"] as const)(
    "fails closed when the approval store reports %s",
    async (reason) => {
      let sends = 0;
      const store: SymphonyApprovalStore = {
        claimForSend: async () => ({ status: "REJECTED", reason, detail: `approval ${reason.toLowerCase()}` }),
        recordOutcome: async () => undefined,
      };
      const result = await executeSymphonyEmail({
        opportunity: opportunity(),
        history: history(),
        profile: profile(),
        now,
        sender: {
          toolId: "klinikos-outbound-email",
          providerId: "resend",
          send: async () => {
            sends += 1;
            return { ok: true, provider: "resend", providerReference: "provider-1" };
          },
        },
        authorization: {
          approvalId: "approval-1",
          actorId: "symphony-operator-1",
          executionId: "execution-1",
          idempotencyKey: "symphony-send-1",
          allowedToolIds: ["klinikos-outbound-email"],
          allowedProviderIds: ["resend"],
          store,
        },
      });
      expect(sends).toBe(0);
      expect(result.state).toBe("SEND_BLOCKED_POLICY");
    },
  );

  it("blocks a tool or provider outside the server allowlist before claiming approval", async () => {
    let claims = 0;
    let sends = 0;
    const store: SymphonyApprovalStore = {
      claimForSend: async () => {
        claims += 1;
        return { status: "REJECTED", reason: "MISSING", detail: "unused" };
      },
      recordOutcome: async () => undefined,
    };
    const result = await executeSymphonyEmail({
      opportunity: opportunity(),
      history: history(),
      profile: profile(),
      now,
      sender: {
        toolId: "unapproved-tool",
        providerId: "unapproved-provider",
        send: async () => {
          sends += 1;
          return { ok: true, provider: "unapproved-provider", providerReference: "provider-1" };
        },
      },
      authorization: {
        approvalId: "approval-1",
        actorId: "symphony-operator-1",
        executionId: "execution-1",
        idempotencyKey: "symphony-send-1",
        allowedToolIds: ["klinikos-outbound-email"],
        allowedProviderIds: ["resend"],
        store,
      },
    });
    expect(claims).toBe(0);
    expect(sends).toBe(0);
    expect(result.state).toBe("SEND_BLOCKED_POLICY");
  });

  it("sends once after an exact approval claim and records provider acceptance without inflating downstream truth", async () => {
    const message = buildSymphonyEmail({ opportunity: opportunity(), profile: profile(), now });
    const payloadSha256 = hashSymphonyOutboundMessage(message);
    const { store, outcomes } = claimedStore(approvalRecord(payloadSha256));
    let sends = 0;
    const result = await executeSymphonyEmail({
      opportunity: opportunity(),
      history: history(),
      profile: profile(),
      now,
      sender: {
        toolId: "klinikos-outbound-email",
        providerId: "resend",
        send: async () => {
          sends += 1;
          return { ok: true, provider: "resend", providerReference: "provider-message-1" };
        },
      },
      authorization: {
        approvalId: "approval-1",
        actorId: "symphony-operator-1",
        executionId: "execution-1",
        idempotencyKey: "symphony-send-1",
        allowedToolIds: ["klinikos-outbound-email"],
        allowedProviderIds: ["resend"],
        store,
      },
    });
    expect(sends).toBe(1);
    expect(result.state).toBe("PROVIDER_ACCEPTED");
    expect(result.truth).toEqual({
      providerAccepted: true,
      delivered: false,
      responseReceived: false,
      applicationSubmitted: false,
      awardedOrContracted: false,
      cashReceived: false,
    });
    expect(result.auditEvent).toMatchObject({
      executionId: "execution-1",
      approvalId: "approval-1",
      payloadSha256,
      fromState: "EMAIL_PREPARED",
      toState: "PROVIDER_ACCEPTED",
    });
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toEqual(result.auditEvent);
  });

  it("records a thrown provider attempt as failure after consuming approval", async () => {
    const message = buildSymphonyEmail({ opportunity: opportunity(), profile: profile(), now });
    const payloadSha256 = hashSymphonyOutboundMessage(message);
    const { store, outcomes } = claimedStore(approvalRecord(payloadSha256));
    const result = await executeSymphonyEmail({
      opportunity: opportunity(),
      history: history(),
      profile: profile(),
      now,
      sender: {
        toolId: "klinikos-outbound-email",
        providerId: "resend",
        send: async () => {
          throw new Error("network failed");
        },
      },
      authorization: {
        approvalId: "approval-1",
        actorId: "symphony-operator-1",
        executionId: "execution-1",
        idempotencyKey: "symphony-send-1",
        allowedToolIds: ["klinikos-outbound-email"],
        allowedProviderIds: ["resend"],
        store,
      },
    });
    expect(result.state).toBe("DELIVERY_FAILED");
    expect(result.reason).toMatch(/provider request failed/i);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toMatchObject({ toState: "DELIVERY_FAILED" });
  });
});
