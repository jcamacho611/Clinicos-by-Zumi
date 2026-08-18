import { describe, expect, it } from "vitest";
import { buildLuxeRecoveryReview, type LuxeRecoveryLeadFact } from "@/lib/luxe-recovery-rules";

const now = new Date("2026-08-18T18:00:00.000Z");

function lead(overrides: Partial<LuxeRecoveryLeadFact> = {}): LuxeRecoveryLeadFact {
  return {
    id: "lead-1",
    name: "Example Lead",
    source: "luxe_website",
    serviceInterest: "Botox",
    estimatedValueCents: 45000,
    status: "new",
    bookingStatus: "not_booked",
    consentStatus: "not_recorded",
    lostReason: null,
    lastContactedAt: null,
    followUpDueAt: null,
    updatedAt: new Date("2026-08-01T18:00:00.000Z"),
    ...overrides,
  };
}

describe("Luxe recovery review", () => {
  it("surfaces a stale non-booked lead for human review", () => {
    const result = buildLuxeRecoveryReview([lead()], { now, staleAfterDays: 7 });
    expect(result.metrics.reviewCandidates).toBe(1);
    expect(result.queue[0]?.reason).toBe("stale_unbooked");
    expect(result.queue[0]?.communicationEligibility).toBe("review_required");
  });

  it("surfaces a lost opportunity without auto-authorizing outreach", () => {
    const result = buildLuxeRecoveryReview([
      lead({ status: "lost", lostReason: "Timing was not right", updatedAt: new Date("2026-08-17T18:00:00.000Z") }),
    ], { now, staleAfterDays: 7 });
    expect(result.queue[0]?.reason).toBe("lost_review");
    expect(result.queue[0]?.communicationEligibility).toBe("review_required");
  });

  it("excludes booked and completed records from recovery", () => {
    const result = buildLuxeRecoveryReview([
      lead({ id: "booked", bookingStatus: "booked" }),
      lead({ id: "completed", status: "completed" }),
    ], { now, staleAfterDays: 7 });
    expect(result.metrics.reviewCandidates).toBe(0);
  });

  it("suppresses blocked consent states from the actionable queue", () => {
    const result = buildLuxeRecoveryReview([
      lead({ id: "optout", consentStatus: "opted_out", estimatedValueCents: 85000 }),
    ], { now, staleAfterDays: 7 });
    expect(result.metrics.reviewCandidates).toBe(0);
    expect(result.metrics.suppressedCandidates).toBe(1);
    expect(result.metrics.suppressedEstimatedOpportunityCents).toBe(85000);
  });

  it("suppresses obvious spam, duplicate, test, and invalid lost reasons", () => {
    const result = buildLuxeRecoveryReview([
      lead({ id: "spam", status: "lost", lostReason: "Spam submission" }),
      lead({ id: "duplicate", status: "lost", lostReason: "Duplicate record" }),
      lead({ id: "test", status: "lost", lostReason: "Test lead" }),
      lead({ id: "invalid", status: "lost", lostReason: "Invalid phone" }),
    ], { now, staleAfterDays: 7 });
    expect(result.metrics.reviewCandidates).toBe(0);
    expect(result.metrics.suppressedCandidates).toBe(4);
  });

  it("keeps estimated opportunity separate while ranking higher-value review candidates first", () => {
    const result = buildLuxeRecoveryReview([
      lead({ id: "low", estimatedValueCents: 18000 }),
      lead({ id: "high", estimatedValueCents: 85000, serviceInterest: "Juvederm and fillers" }),
    ], { now, staleAfterDays: 7 });
    expect(result.metrics.reviewEstimatedOpportunityCents).toBe(103000);
    expect(result.queue[0]?.id).toBe("high");
  });
});
