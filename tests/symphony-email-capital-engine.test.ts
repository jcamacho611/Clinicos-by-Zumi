import { describe, expect, it } from "vitest";
import {
  symphonyExecutionStates,
  symphonyMessageFamilies,
  symphonyOpportunityClasses,
  symphonyRegisterMap,
  symphonyTargetClasses,
  symphonyUserGates,
  type SymphonyContactHistory,
  type SymphonyOpportunity,
} from "@/lib/company/symphony-opportunity-types";
import { evaluateSymphonySendPolicy, requiresSymphonyUserAction } from "@/lib/company/symphony-policy";
import { scoreSymphonyOpportunity } from "@/lib/company/symphony-priority";
import { buildSymphonyEmail, type SymphonyCompanyProfile } from "@/lib/company/symphony-message-builder";
import { executeSymphonyEmail } from "@/lib/company/symphony-execution";

const now = new Date("2026-08-27T12:00:00.000Z");

function opportunity(overrides: Partial<SymphonyOpportunity> = {}): SymphonyOpportunity {
  return {
    id: "opp-1",
    title: "Healthcare AI program",
    opportunityClass: "GRANT_NON_DILUTIVE",
    targetClass: "FUNDER",
    organizationName: "Example Program",
    organizationDomain: "example.org",
    recipientEmail: "program@example.org",
    recipientName: "Program Officer",
    purpose: "confirm healthcare AI funding fit",
    ask: "Could you confirm whether Klinikos fits the current program and route us to the correct next step?",
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
  summary:
    "Klinikos is building a governed operating layer for outpatient healthcare, designed to make unfinished operational work visible while preserving human and deterministic authority over consequential actions.",
  verifiedFacts: [
    { text: "Klinikos is a New York business corporation.", truthClass: "CURRENT_FACT" },
    { text: "The company has a working software platform with implemented core workflows.", truthClass: "CURRENT_FACT" },
  ],
  visionStatements: ["Klinikos is building toward a broader healthcare operating network spanning operations, workforce, and governed intelligence."],
};

describe("Symphony vocabulary and register mapping", () => {
  it("defines the approved opportunity, target, message, state, and user-gate vocabulary", () => {
    expect(symphonyOpportunityClasses).toEqual([
      "CUSTOMER_REVENUE",
      "GRANT_NON_DILUTIVE",
      "GOVERNMENT_CONTRACT",
      "WORKFORCE_INSTITUTIONAL",
      "ACCELERATOR_PROGRAM",
      "INVESTOR",
      "PARTNERSHIP",
      "CREDIT_INCENTIVE",
      "LENDER_CDFI",
      "OTHER_REVIEW_REQUIRED",
    ]);

    expect(symphonyTargetClasses).toEqual([
      "BUYER",
      "FUNDER",
      "GOVERNMENT_PROGRAM",
      "LENDER",
      "INVESTOR",
      "PARTNER",
      "ACCELERATOR",
      "RESOURCE_PARTNER",
      "COMPETITOR",
      "UNKNOWN",
    ]);

    expect(symphonyMessageFamilies).toHaveLength(10);
    expect(symphonyExecutionStates).toContain("PROVIDER_ACCEPTED");
    expect(symphonyExecutionStates).toContain("FUNDED_OR_CONTRACTED");
    expect(symphonyUserGates).toContain("HARD_CREDIT_PULL");
    expect(symphonyUserGates).toContain("CONTRACT_SIGNATURE");
  });

  it("maps Symphony classes into existing company registers instead of creating parallel truth", () => {
    expect(symphonyRegisterMap.CUSTOMER_REVENUE).toEqual(expect.arrayContaining(["customer-prospect"]));
    expect(symphonyRegisterMap.GRANT_NON_DILUTIVE).toEqual(["capital-opportunity"]);
    expect(symphonyRegisterMap.WORKFORCE_INSTITUTIONAL).toEqual(["edu-institutional-pipeline"]);
    expect(symphonyRegisterMap.INVESTOR).toEqual(expect.arrayContaining(["capital-opportunity", "investor-evidence"]));
    expect(symphonyRegisterMap.LENDER_CDFI).toEqual(expect.arrayContaining(["capital-opportunity", "lender-readiness"]));
  });
});

describe("Symphony outbound policy", () => {
  it.each(["UNKNOWN", "COMPETITOR"] as const)("blocks ordinary outreach to %s targets", (targetClass) => {
    const result = evaluateSymphonySendPolicy({
      opportunity: opportunity({ targetClass }),
      history: history(),
      now,
      senderAvailable: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.nextState).toBe("SEND_BLOCKED_POLICY");
  });

  it("allows an explicitly approved strategic competitor partnership path", () => {
    const result = evaluateSymphonySendPolicy({
      opportunity: opportunity({ targetClass: "COMPETITOR", strategicPartnershipApproved: true, messageFamily: "PARTNERSHIP_TEAMING" }),
      history: history(),
      now,
      senderAvailable: true,
    });
    expect(result.allowed).toBe(true);
  });

  it("blocks hard-bounced, suppressed, personal-network-restricted, and contact-prohibited targets", () => {
    const cases = [
      { opp: opportunity(), hist: history({ hardBouncedEmails: ["PROGRAM@example.org"] }) },
      { opp: opportunity(), hist: history({ suppressedEmails: ["program@example.org"] }) },
      { opp: opportunity({ personalNetworkRestricted: true }), hist: history() },
      { opp: opportunity({ officialContactPolicy: "CONTACT_PROHIBITED" }), hist: history() },
      { opp: opportunity({ officialContactPolicy: "PORTAL_ONLY" }), hist: history() },
    ];

    for (const item of cases) {
      const result = evaluateSymphonySendPolicy({ opportunity: item.opp, history: item.hist, now, senderAvailable: true });
      expect(result.allowed).toBe(false);
      expect(result.nextState).toBe("SEND_BLOCKED_POLICY");
    }
  });

  it("blocks duplicate first-touch and active substantive threads", () => {
    const duplicate = evaluateSymphonySendPolicy({
      opportunity: opportunity(),
      history: history({
        priorTouches: [
          {
            recipientEmail: "PROGRAM@example.org",
            organizationDomain: "example.org",
            purpose: "confirm healthcare ai funding fit",
            sentAt: new Date("2026-08-26T12:00:00.000Z"),
            substantiveThread: false,
          },
        ],
        nextFollowUpAt: new Date("2026-08-30T12:00:00.000Z"),
      }),
      now,
      senderAvailable: true,
    });
    expect(duplicate.allowed).toBe(false);

    const active = evaluateSymphonySendPolicy({
      opportunity: opportunity(),
      history: history({ activeSubstantiveThread: true }),
      now,
      senderAvailable: true,
    });
    expect(active.allowed).toBe(false);
  });

  it("closes stale deadline opportunities instead of sending fake urgency", () => {
    const result = evaluateSymphonySendPolicy({
      opportunity: opportunity({ deadline: new Date("2026-08-26T23:59:59.000Z") }),
      history: history(),
      now,
      senderAvailable: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.nextState).toBe("CLOSED");
  });

  it("prepares but does not claim send when the email rail is unavailable", () => {
    const result = evaluateSymphonySendPolicy({ opportunity: opportunity(), history: history(), now, senderAvailable: false });
    expect(result.allowed).toBe(false);
    expect(result.nextState).toBe("READY_TO_SEND_CONNECTION_REQUIRED");
  });

  it("recognizes founder-only non-delegable gates", () => {
    expect(requiresSymphonyUserAction("NONE")).toBe(false);
    for (const gate of symphonyUserGates.filter((item) => item !== "NONE")) {
      expect(requiresSymphonyUserAction(gate)).toBe(true);
    }
  });
});

describe("Symphony priority", () => {
  it("makes a substantive reply more important than a larger theoretical cold target", () => {
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
    expect(warm.reasons.join(" ")).toMatch(/reply/i);
  });

  it("penalizes high commitment/debt burden instead of treating all capital as free money", () => {
    const lowBurden = scoreSymphonyOpportunity({
      fit: 80,
      eligibilityConfidence: 70,
      urgency: 70,
      expectedValueSignal: 70,
      strategicMultiplier: 60,
      effortBurden: 40,
      commitmentBurden: 0,
      founderActionBurden: 20,
      relationshipState: "COLD",
    });
    const debtLike = scoreSymphonyOpportunity({
      fit: 80,
      eligibilityConfidence: 70,
      urgency: 70,
      expectedValueSignal: 70,
      strategicMultiplier: 60,
      effortBurden: 40,
      commitmentBurden: 100,
      founderActionBurden: 70,
      relationshipState: "COLD",
    });
    expect(lowBurden.score).toBeGreaterThan(debtLike.score);
  });
});

describe("Symphony message builder", () => {
  it.each([
    "FUNDING_PROGRAM_ROUTING",
    "GOVERNMENT_PROCUREMENT",
    "WORKFORCE_INSTITUTIONAL",
    "CUSTOMER_PILOT",
    "ACCELERATOR_FIT",
    "INVESTOR_THESIS_FIT",
    "LENDER_PRESCREEN",
    "PARTNERSHIP_TEAMING",
  ] as const)("builds the %s family from verified company truth", (messageFamily) => {
    const email = buildSymphonyEmail({ opportunity: opportunity({ messageFamily }), profile });
    expect(email.channel).toBe("email");
    expect(email.to).toBe("program@example.org");
    expect(email.subject.length).toBeGreaterThan(8);
    expect(email.body).toContain("Klinikos");
    expect(email.body).toContain("https://klinikos.io");
    expect(email.body).toContain(opportunity().ask);
  });

  it("rejects missing recipient or ask", () => {
    expect(() => buildSymphonyEmail({ opportunity: opportunity({ recipientEmail: "" }), profile })).toThrow();
    expect(() => buildSymphonyEmail({ opportunity: opportunity({ ask: "" }), profile })).toThrow();
  });

  it("rejects a proposed statement smuggled into verified-current facts", () => {
    const unsafe = {
      ...profile,
      verifiedFacts: [{ text: "Klinikos has $1M ARR.", truthClass: "PROPOSED" }],
    } as unknown as SymphonyCompanyProfile;
    expect(() => buildSymphonyEmail({ opportunity: opportunity(), profile: unsafe })).toThrow(/verified/i);
  });
});

describe("Symphony execution", () => {
  it("does not invoke sender when policy is blocked", async () => {
    let calls = 0;
    const result = await executeSymphonyEmail({
      opportunity: opportunity({ targetClass: "UNKNOWN" }),
      history: history(),
      profile,
      now,
      senderAvailable: true,
      sender: async () => {
        calls += 1;
        return { ok: true, providerReference: "msg-1", provider: "test" };
      },
    });
    expect(calls).toBe(0);
    expect(result.state).toBe("SEND_BLOCKED_POLICY");
  });

  it("returns a prepared draft without invoking sender when the rail is unavailable", async () => {
    let calls = 0;
    const result = await executeSymphonyEmail({
      opportunity: opportunity(),
      history: history(),
      profile,
      now,
      senderAvailable: false,
      sender: async () => {
        calls += 1;
        return { ok: true, providerReference: "msg-1", provider: "test" };
      },
    });
    expect(calls).toBe(0);
    expect(result.state).toBe("READY_TO_SEND_CONNECTION_REQUIRED");
    expect(result.message?.to).toBe("program@example.org");
  });

  it("records provider acceptance only with a real provider reference", async () => {
    const result = await executeSymphonyEmail({
      opportunity: opportunity(),
      history: history(),
      profile,
      now,
      senderAvailable: true,
      sender: async () => ({ ok: true, providerReference: "provider-message-123", provider: "test" }),
    });
    expect(result.state).toBe("PROVIDER_ACCEPTED");
    expect(result.providerReference).toBe("provider-message-123");
    expect(result.nextFollowUpAt?.toISOString()).toBe("2026-08-30T12:00:00.000Z");
  });

  it("records provider failure as failure, not delivery", async () => {
    const result = await executeSymphonyEmail({
      opportunity: opportunity(),
      history: history(),
      profile,
      now,
      senderAvailable: true,
      sender: async () => ({ ok: false, reason: "provider_error", detail: "provider unavailable" }),
    });
    expect(result.state).toBe("DELIVERY_FAILED");
    expect(result.providerReference).toBeUndefined();
  });
});