import { describe, expect, it } from "vitest";
import { executeSymphonyEmail } from "@/lib/company/symphony-execution";
import { buildSymphonyEmail, type SymphonyCompanyProfile } from "@/lib/company/symphony-message-builder";
import {
  symphonyExecutionStates,
  symphonyRegisterMap,
  symphonyTruthClasses,
  type SymphonyContactHistory,
  type SymphonyOpportunity,
} from "@/lib/company/symphony-opportunity-types";
import { evaluateSymphonySendPolicy } from "@/lib/company/symphony-policy";
import { scoreSymphonyOpportunity } from "@/lib/company/symphony-priority";

const now = new Date("2026-09-02T12:00:00.000Z");

function opportunity(overrides: Partial<SymphonyOpportunity> = {}): SymphonyOpportunity {
  return {
    id: "opp-1",
    tenantId: "tenant-klinikos",
    title: "Healthcare AI program",
    opportunityClass: "GRANT_NON_DILUTIVE",
    targetClass: "FUNDER",
    organizationName: "Example Program",
    organizationDomain: "example.org",
    recipientEmail: "program@example.org",
    recipientName: "Program Officer",
    purpose: "confirm healthcare AI funding fit",
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

function history(overrides: Partial<SymphonyContactHistory> = {}): SymphonyContactHistory {
  return {
    priorTouches: [],
    hardBouncedEmails: [],
    suppressedEmails: [],
    activeSubstantiveThread: false,
    nextFollowUpAt: null,
    followUpCount: 0,
    ...overrides,
  };
}

const profile: SymphonyCompanyProfile = {
  companyName: "Klinikos, Inc.",
  senderName: "Justin R. Camacho",
  senderTitle: "Founder & CEO",
  website: "https://klinikos.io",
  summary: "Klinikos is building a governed operating layer for outpatient healthcare.",
  verifiedFacts: [
    {
      evidenceId: "company-formation",
      sourceReference: "corporate-record://ny/klinikos",
      text: "Klinikos is a New York business corporation.",
      truthClass: "ACTUAL",
      observedAt: new Date("2026-08-01T12:00:00.000Z"),
      verifiedAt: new Date("2026-09-01T12:00:00.000Z"),
      reviewAfter: new Date("2026-09-15T12:00:00.000Z"),
      expiresAt: new Date("2026-09-30T12:00:00.000Z"),
      approvedForExternalUse: {
        evidenceId: "company-formation-external-use",
        approvedByActorId: "founder-1",
        approvedAt: new Date("2026-09-01T13:00:00.000Z"),
        purpose: "confirm healthcare AI funding fit",
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
    purpose: "confirm healthcare AI funding fit",
    reviewedByActorId: "founder-1",
    reviewedAt: new Date("2026-09-01T13:00:00.000Z"),
    reviewAfter: new Date("2026-09-15T12:00:00.000Z"),
    expiresAt: new Date("2026-09-30T12:00:00.000Z"),
    revokedAt: null,
  },
};

describe("Symphony selective runtime recovery", () => {
  it("maps opportunities to existing company registers and preserves each consequential truth as its own state", () => {
    expect(symphonyRegisterMap.GRANT_NON_DILUTIVE).toEqual(["capital-opportunity"]);
    expect(symphonyRegisterMap.INVESTOR).toEqual(expect.arrayContaining(["capital-opportunity", "investor-evidence"]));
    expect(symphonyTruthClasses).toEqual(["ACTUAL", "CONTRACTED", "PIPELINE", "ASSUMPTION", "SCENARIO", "TARGET"]);
    expect(symphonyExecutionStates).toEqual(
      expect.arrayContaining([
        "PROVIDER_ACCEPTED",
        "DELIVERY_CONFIRMED",
        "RESPONSE_RECEIVED",
        "APPLICATION_SUBMITTED",
        "AWARDED_OR_CONTRACTED",
        "CASH_RECEIVED",
      ]),
    );
    expect(symphonyExecutionStates).not.toContain("FUNDED_OR_CONTRACTED");
  });

  it("blocks unknown and ordinary competitor outreach but permits an approved teaming purpose", () => {
    for (const targetClass of ["UNKNOWN", "COMPETITOR"] as const) {
      const result = evaluateSymphonySendPolicy({
        opportunity: opportunity({ targetClass }),
        history: history(),
        now,
        senderAvailable: true,
      });
      expect(result.allowed).toBe(false);
    }

    expect(
      evaluateSymphonySendPolicy({
        opportunity: opportunity({
          targetClass: "COMPETITOR",
          strategicPartnershipApproved: true,
          messageFamily: "PARTNERSHIP_TEAMING",
        }),
        history: history(),
        now,
        senderAvailable: true,
      }).allowed,
    ).toBe(true);
  });

  it("blocks duplicate, suppressed, bounced, and portal-only outreach", () => {
    const cases = [
      { opp: opportunity(), hist: history({ hardBouncedEmails: ["PROGRAM@example.org"] }) },
      { opp: opportunity(), hist: history({ suppressedEmails: ["program@example.org"] }) },
      { opp: opportunity({ officialContactPolicy: "PORTAL_ONLY" }), hist: history() },
      {
        opp: opportunity(),
        hist: history({
          priorTouches: [
            {
              recipientEmail: "program@example.org",
              organizationDomain: "example.org",
              purpose: "confirm healthcare ai funding fit",
              sentAt: new Date("2026-09-01T12:00:00.000Z"),
              substantiveThread: false,
            },
          ],
          nextFollowUpAt: new Date("2026-09-05T12:00:00.000Z"),
        }),
      },
    ];

    for (const item of cases) {
      expect(
        evaluateSymphonySendPolicy({
          opportunity: item.opp,
          history: item.hist,
          now,
          senderAvailable: true,
        }).allowed,
      ).toBe(false);
    }
  });

  it("prioritizes a substantive reply over a larger theoretical cold target", () => {
    const warm = scoreSymphonyOpportunity({
      fit: 80,
      eligibilityConfidence: 80,
      urgency: 70,
      expectedValueSignal: 40,
      strategicMultiplier: 70,
      effortBurden: 30,
      commitmentBurden: 0,
      founderActionBurden: 10,
      relationshipState: "SUBSTANTIVE_REPLY",
    });
    const cold = scoreSymphonyOpportunity({
      fit: 90,
      eligibilityConfidence: 70,
      urgency: 60,
      expectedValueSignal: 100,
      strategicMultiplier: 80,
      effortBurden: 20,
      commitmentBurden: 0,
      founderActionBurden: 10,
      relationshipState: "COLD",
    });
    expect(warm.score).toBeGreaterThan(cold.score);
  });

  it("keeps every calculated priority inside the declared zero-to-one-hundred range", () => {
    expect(
      scoreSymphonyOpportunity({
        fit: 100,
        eligibilityConfidence: 100,
        urgency: 100,
        expectedValueSignal: 100,
        strategicMultiplier: 100,
        effortBurden: 0,
        commitmentBurden: 0,
        founderActionBurden: 0,
        relationshipState: "DILIGENCE_REQUESTED",
      }).score,
    ).toBe(100);
  });

  it("builds from verified facts and rejects proposed facts or injected headers", () => {
    const email = buildSymphonyEmail({ opportunity: opportunity(), profile, now });
    expect(email.to).toBe("program@example.org");
    expect(email.body).toContain("Klinikos is a New York business corporation.");

    const proposed = {
      ...profile,
      verifiedFacts: [{ ...profile.verifiedFacts[0], text: "Klinikos has $1M ARR.", truthClass: "PIPELINE" }],
    } as unknown as SymphonyCompanyProfile;
    expect(() => buildSymphonyEmail({ opportunity: opportunity(), profile: proposed, now })).toThrow(/verified/i);
    expect(() =>
      buildSymphonyEmail({
        opportunity: opportunity({ recipientEmail: "program@example.org\nBcc: other@example.org" }),
        profile,
        now,
      }),
    ).toThrow(/control|recipient/i);
  });

  it("does not invoke a sender for a blocked target or an unavailable rail", async () => {
    let calls = 0;
    const sender = {
      toolId: "test-tool",
      providerId: "test",
      send: async () => {
        calls += 1;
        return { ok: true as const, providerReference: "provider-1", provider: "test" };
      },
    };

    const blocked = await executeSymphonyEmail({
      opportunity: opportunity({ targetClass: "UNKNOWN" }),
      history: history(),
      profile,
      now,
      sender,
    });
    const draft = await executeSymphonyEmail({
      opportunity: opportunity(),
      history: history(),
      profile,
      now,
    });

    expect(calls).toBe(0);
    expect(blocked.state).toBe("SEND_BLOCKED_POLICY");
    expect(draft.state).toBe("READY_TO_SEND_CONNECTION_REQUIRED");
    expect(draft.message?.to).toBe("program@example.org");
  });
});
