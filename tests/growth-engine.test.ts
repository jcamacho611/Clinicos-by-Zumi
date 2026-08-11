import { describe, expect, it } from "vitest";
import {
  bandGuidance,
  countReturnVisits,
  intentBand,
  intentEventSchema,
  intentEventTypes,
  isPostPurchaseEvent,
  pointsForEvent,
  prioritizeForOutreach,
  scoreProspect,
  type ScoredEvent,
} from "@/lib/growth/intent";
import {
  advanceStatus,
  isCustomer,
  LEAD_CAPTURE_NO_PHI_NOTICE,
  outboundCopyProblems,
  prospectCaptureSchema,
  prospectStatuses,
} from "@/lib/growth/lead-rules";
import {
  nextSend,
  SEQUENCE_FOOTER,
  sequenceForStatus,
  sequenceKeys,
  sequenceSteps,
  sequences,
  type EnrollmentState,
} from "@/lib/growth/sequences";
import {
  ATTRIBUTION_WINDOW_DAYS,
  commissionCents,
  commissionPayable,
  evaluateAttribution,
  normalizeReferralCode,
  PARTNER_DISCLOSURE,
  partnerCanEarn,
} from "@/lib/growth/referrals";

/**
 * The Growth Engine's job is to turn a hundred strangers into six calls worth making.
 * These tests defend the two ways that goes wrong: scoring that flatters noise, and
 * automated email that outlives the prospect's interest.
 */

const at = (iso: string) => new Date(iso);
const event = (type: (typeof intentEventTypes)[number], iso: string): ScoredEvent => ({ type, occurredAt: at(iso) });

describe("lead capture", () => {
  const valid = {
    contactName: "Dana Reyes",
    clinicName: "Harbor Aesthetics",
    email: "Dana@Harbor.example ".trim(),
    clinicType: "medical_spa" as const,
    locationCount: "2_5" as const,
    providerCount: "2_5" as const,
  };

  it("accepts a clinic without a phone number", () => {
    // Making phone mandatory costs more leads than it gains calls.
    const parsed = prospectCaptureSchema.parse(valid);
    expect(parsed.phone).toBeUndefined();
    expect(parsed.email).toBe("dana@harbor.example");
  });

  it("has no field that invites protected health information", () => {
    // A public marketing form must not solicit PHI, and a free-text box is how PHI
    // arrives somewhere it must never be.
    const fields = Object.keys(prospectCaptureSchema.shape);
    for (const banned of ["notes", "note", "message", "details", "patient", "condition", "description"]) {
      expect({ banned, present: fields.includes(banned) }).toEqual({ banned, present: false });
    }
    expect(LEAD_CAPTURE_NO_PHI_NOTICE).toContain("protected health information");
  });

  it("constrains what brought them in rather than accepting free text", () => {
    expect(prospectCaptureSchema.safeParse({ ...valid, interest: "operational_audit" }).success).toBe(true);
    expect(prospectCaptureSchema.safeParse({ ...valid, interest: "my patient needs help" }).success).toBe(false);
  });
});

describe("intent scoring", () => {
  it("weights actions by how close to a purchase they are", () => {
    expect(pointsForEvent("checkout_started")).toBeGreaterThan(pointsForEvent("pricing_viewed"));
    expect(pointsForEvent("pricing_viewed")).toBeGreaterThan(pointsForEvent("homepage_viewed"));
    expect(pointsForEvent("demo_completed")).toBeGreaterThan(pointsForEvent("demo_started"));
  });

  it("counts each event type once, however many times it repeats", () => {
    // Eleven pricing reloads is one interested person, not eleven. Letting repeats
    // accumulate would rank a restless browser above a buyer.
    const once = scoreProspect([event("pricing_viewed", "2026-08-10T10:00:00Z")]);
    const eleven = scoreProspect(
      Array.from({ length: 11 }, (_, index) => event("pricing_viewed", `2026-08-10T10:0${index % 10}:00Z`)),
    );
    expect(eleven).toBe(once);
  });

  it("scores coming back on a separate day", () => {
    const sameSitting = scoreProspect([
      event("pricing_viewed", "2026-08-10T10:00:00Z"),
      event("zumi_page_viewed", "2026-08-10T10:20:00Z"),
    ]);
    const cameBack = scoreProspect([
      event("pricing_viewed", "2026-08-10T10:00:00Z"),
      event("zumi_page_viewed", "2026-08-13T09:00:00Z"),
    ]);
    expect(cameBack).toBeGreaterThan(sameSitting);
  });

  it("does not penalize an abandoned checkout", () => {
    // Abandonment is the strongest signal on the list. Scoring it down would bury the
    // one person most worth calling today.
    const started = scoreProspect([event("checkout_started", "2026-08-10T10:00:00Z")]);
    const abandoned = scoreProspect([
      event("checkout_started", "2026-08-10T10:00:00Z"),
      event("checkout_abandoned", "2026-08-10T10:05:00Z"),
    ]);
    expect(abandoned).toBeGreaterThanOrEqual(started);
  });

  it("caps the score so one prospect cannot dominate the list", () => {
    const everything = intentEventTypes.map((type, index) => event(type, `2026-0${(index % 8) + 1}-0${(index % 9) + 1}T10:00:00Z`));
    expect(scoreProspect(everything)).toBeLessThanOrEqual(100);
  });

  it("scores an empty history as zero", () => {
    expect(scoreProspect([])).toBe(0);
    expect(countReturnVisits([])).toBe(0);
  });

  it("marks an unfinished checkout urgent regardless of total score", () => {
    const events = [event("checkout_started", "2026-08-10T10:00:00Z")];
    expect(intentBand(scoreProspect(events), events)).toBe("urgent");
    expect(bandGuidance.urgent).toContain("today");
  });

  it("stops calling someone urgent once they have paid", () => {
    const events = [
      event("checkout_started", "2026-08-10T10:00:00Z"),
      event("payment_completed", "2026-08-10T10:04:00Z"),
    ];
    expect(intentBand(scoreProspect(events), events)).not.toBe("urgent");
    expect(isPostPurchaseEvent("payment_completed")).toBe(true);
  });

  it("bands a browser as cold and a repeat researcher as warm or better", () => {
    const browser = [event("homepage_viewed", "2026-08-10T10:00:00Z")];
    expect(intentBand(scoreProspect(browser), browser)).toBe("cold");

    const researcher = [
      event("zumi_page_viewed", "2026-08-10T10:00:00Z"),
      event("demo_completed", "2026-08-12T10:00:00Z"),
      event("pricing_viewed", "2026-08-14T10:00:00Z"),
    ];
    expect(["warm", "high"]).toContain(intentBand(scoreProspect(researcher), researcher));
  });

  it("hands back a list a person can actually work", () => {
    const many = Array.from({ length: 40 }, (_, index) => ({ score: index * 2, band: "high" as const }));
    expect(prioritizeForOutreach(many)).toHaveLength(10);
    expect(prioritizeForOutreach(many)[0].score).toBe(78);
  });

  it("puts urgent above high, whatever the scores say", () => {
    const list = [
      { id: "high", score: 95, band: "high" as const },
      { id: "urgent", score: 40, band: "urgent" as const },
    ];
    expect(prioritizeForOutreach(list)[0].id).toBe("urgent");
  });

  it("leaves cold and warm prospects off the call list entirely", () => {
    const list = [
      { score: 10, band: "cold" as const },
      { score: 30, band: "warm" as const },
    ];
    expect(prioritizeForOutreach(list)).toEqual([]);
  });

  it("rejects an absolute URL as an event path", () => {
    // Paths only. A full URL carries query strings, and query strings carry whatever
    // was in them.
    expect(intentEventSchema.safeParse({ type: "pricing_viewed", path: "https://klinikos.io/pricing" }).success).toBe(false);
    expect(intentEventSchema.safeParse({ type: "pricing_viewed", path: "/pricing" }).success).toBe(true);
  });
});

describe("prospect lifecycle", () => {
  it("advances a prospect as they show intent", () => {
    expect(advanceStatus("NEW", "pricing_viewed")).toBe("PRICING_VIEWED");
    expect(advanceStatus("PRICING_VIEWED", "audit_viewed")).toBe("AUDIT_INTEREST");
    expect(advanceStatus("AUDIT_INTEREST", "checkout_started")).toBe("CHECKOUT_STARTED");
  });

  it("never moves a prospect backwards", () => {
    // A paying customer who rereads the pricing page has not become a lead again.
    expect(advanceStatus("CHECKOUT_STARTED", "homepage_viewed")).toBe("CHECKOUT_STARTED");
    expect(advanceStatus("ACTIVE", "pricing_viewed")).toBe("ACTIVE");
  });

  it("never marks anyone PAID from browsing", () => {
    // That transition belongs to a verified payment event, not to a page view.
    for (const type of ["checkout_started", "audit_checkout_clicked", "pricing_viewed", "contact_submitted"]) {
      expect({ type, status: advanceStatus("CHECKOUT_STARTED", type) }).not.toEqual({ type, status: "PAID" });
    }
  });

  it("picks a lost prospect back up when they return", () => {
    expect(advanceStatus("LOST", "pricing_viewed")).toBe("PRICING_VIEWED");
  });

  it("ignores an event that implies nothing", () => {
    expect(advanceStatus("ENGAGED", "some_event_nobody_declared")).toBe("ENGAGED");
  });

  it("knows which statuses mean the prospect has bought", () => {
    expect(prospectStatuses.filter(isCustomer)).toEqual(["PAID", "ONBOARDING", "ACTIVE"]);
  });
});

describe("outbound copy", () => {
  it("holds marketing email to the same copy law as the public site", () => {
    // Email reaches people who never saw a governed page. Without this, the one
    // channel nobody reviews becomes the one that promises a free trial.
    expect(outboundCopyProblems("Start free today", "Try our platform, no card needed.")).toContain("start free");
    expect(outboundCopyProblems("Your Klinikos overview", "A HIPAA compliant certified EHR.")).toContain("hipaa compliant");
  });

  it("passes copy that stays inside what the product can claim", () => {
    expect(
      outboundCopyProblems(
        "Where clinics usually lose revenue",
        "Klinikos is not a certified EHR. It surfaces the follow-ups and unbilled encounters your team already has.",
      ),
    ).toEqual([]);
  });
});

describe("follow-up sequences", () => {
  const state = (overrides: Partial<EnrollmentState> = {}): EnrollmentState => ({
    sequence: "overview",
    nextStepIndex: 0,
    enrolledAt: at("2026-08-10T09:00:00Z"),
    lastSentAt: null,
    unsubscribed: false,
    ...overrides,
  });

  it("every sequence terminates", () => {
    // No nurture-forever path. A sequence with no end is how a sender becomes spam.
    for (const key of sequenceKeys) {
      expect({ key, steps: sequenceSteps(key).length }).toEqual({ key, steps: sequences[key].steps.length });
      expect(sequenceSteps(key).length).toBeGreaterThan(0);
      expect(sequenceSteps(key).length).toBeLessThanOrEqual(5);
    }
  });

  it("sends the first overview message immediately", () => {
    const decision = nextSend({ state: state(), status: "NEW", now: at("2026-08-10T09:00:00Z") });
    expect(decision).toMatchObject({ send: true });
  });

  it("waits until a step is due", () => {
    expect(nextSend({ state: state({ nextStepIndex: 1 }), status: "NEW", now: at("2026-08-10T10:00:00Z") })).toMatchObject({
      send: false,
      reason: "not_due",
    });
    expect(nextSend({ state: state({ nextStepIndex: 1 }), status: "NEW", now: at("2026-08-12T10:00:00Z") })).toMatchObject({
      send: true,
    });
  });

  it("stops unconditionally on unsubscribe", () => {
    expect(
      nextSend({ state: state({ unsubscribed: true }), status: "NEW", now: at("2027-01-01T00:00:00Z") }),
    ).toMatchObject({ send: false, reason: "unsubscribed" });
  });

  it("stops selling to someone who already bought", () => {
    expect(nextSend({ state: state(), status: "PAID", now: at("2026-08-20T09:00:00Z") })).toMatchObject({
      send: false,
      reason: "became_customer",
    });
  });

  it("still welcomes a customer, because that message is addressed to them", () => {
    expect(
      nextSend({ state: state({ sequence: "post_purchase" }), status: "PAID", now: at("2026-08-10T09:00:00Z") }),
    ).toMatchObject({ send: true });
  });

  it("does not let the overview drip compete with checkout recovery", () => {
    expect(nextSend({ state: state(), status: "CHECKOUT_STARTED", now: at("2026-08-20T09:00:00Z") })).toMatchObject({
      send: false,
      reason: "sequence_superseded",
    });
  });

  it("stops once the sequence is exhausted", () => {
    const finished = state({ nextStepIndex: sequenceSteps("overview").length });
    expect(nextSend({ state: finished, status: "NEW", now: at("2027-01-01T00:00:00Z") })).toMatchObject({
      send: false,
      reason: "finished",
    });
  });

  it("recovers a checkout within the hour, not the week", () => {
    expect(sequenceSteps("checkout_recovery")[0].delayHours).toBe(1);
  });

  it("puts each prospect on exactly one sequence", () => {
    expect(sequenceForStatus("NEW")).toBe("overview");
    expect(sequenceForStatus("CHECKOUT_STARTED")).toBe("checkout_recovery");
    expect(sequenceForStatus("ACTIVE")).toBe("post_purchase");
    expect(sequenceForStatus("LOST")).toBeNull();
  });

  it("carries an unsubscribe on every sequence message", () => {
    expect(SEQUENCE_FOOTER).toContain("Unsubscribe");
  });

  it("keeps every subject line inside copy law", () => {
    for (const key of sequenceKeys) {
      for (const step of sequenceSteps(key)) {
        expect({ key, index: step.index, problems: outboundCopyProblems(step.subject, step.purpose) }).toEqual({
          key, index: step.index, problems: [],
        });
      }
    }
  });
});

describe("referral attribution", () => {
  const touch = at("2026-05-01T00:00:00Z");

  it("normalizes a code a partner can read down a phone line", () => {
    expect(normalizeReferralCode(" biller-42 ")).toBe("BILLER-42");
    expect(normalizeReferralCode("has spaces")).toBeNull();
    expect(normalizeReferralCode("ab")).toBeNull();
  });

  it("credits a conversion inside the window", () => {
    expect(evaluateAttribution({ firstTouchAt: touch, convertedAt: at("2026-06-01T00:00:00Z"), partnerStatus: "active" })).toEqual({
      credited: true,
      daysToConversion: 31,
    });
  });

  it("measures from first touch, so a later direct visit cannot steal the credit", () => {
    const justInside = new Date(touch.getTime() + ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    expect(evaluateAttribution({ firstTouchAt: touch, convertedAt: justInside, partnerStatus: "active" }).credited).toBe(true);

    const justOutside = new Date(justInside.getTime() + 60 * 60 * 1000);
    expect(evaluateAttribution({ firstTouchAt: touch, convertedAt: justOutside, partnerStatus: "active" })).toMatchObject({
      credited: false,
      reason: "window_expired",
    });
  });

  it("does not pay for a sale that was already made", () => {
    expect(
      evaluateAttribution({ firstTouchAt: touch, convertedAt: at("2026-04-01T00:00:00Z"), partnerStatus: "active" }),
    ).toMatchObject({ credited: false, reason: "converted_before_touch" });
  });

  it("pays only active partners", () => {
    expect(partnerCanEarn("active")).toBe(true);
    for (const status of ["pending", "paused", "terminated"] as const) {
      expect({ status, earns: partnerCanEarn(status) }).toEqual({ status, earns: false });
    }
  });
});

describe("commission", () => {
  it("computes in integer minor units", () => {
    expect(commissionCents(75_000, 1_500)).toBe(11_250);
    expect(commissionCents(0, 1_500)).toBe(0);
  });

  it("floors a fractional cent rather than rounding up", () => {
    // Never pay more than the agreed rate. 333 * 15% = 49.95 cents.
    expect(commissionCents(333, 1_500)).toBe(49);
  });

  it("refuses a nonsensical amount or rate", () => {
    expect(() => commissionCents(10.5, 1_500)).toThrow();
    expect(() => commissionCents(-100, 1_500)).toThrow();
    expect(() => commissionCents(1_000, 10_001)).toThrow();
  });

  it("holds payout until the sale settles and the refund window closes", () => {
    // Clawing money back from a partner costs more goodwill than the delay does.
    expect(commissionPayable({ status: "approved", saleSettled: false, refundWindowClosed: true }).payable).toBe(false);
    expect(commissionPayable({ status: "approved", saleSettled: true, refundWindowClosed: false }).payable).toBe(false);
    expect(commissionPayable({ status: "pending", saleSettled: true, refundWindowClosed: true }).payable).toBe(false);
    expect(commissionPayable({ status: "approved", saleSettled: true, refundWindowClosed: true }).payable).toBe(true);
  });

  it("discloses that a partner recommendation is a paid referral", () => {
    expect(PARTNER_DISCLOSURE).toContain("commission");
    expect(PARTNER_DISCLOSURE).toContain("not a clinical or regulatory endorsement");
  });
});
