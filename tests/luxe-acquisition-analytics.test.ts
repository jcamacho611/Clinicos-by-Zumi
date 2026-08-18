import { describe, expect, it } from "vitest";
import { summarizeAcquisitionLeads, type AcquisitionLeadFact } from "@/lib/luxe-acquisition-analytics";

const now = new Date("2026-08-18T17:00:00.000Z");

function lead(overrides: Partial<AcquisitionLeadFact> = {}): AcquisitionLeadFact {
  return {
    id: "lead-1",
    name: "Example Lead",
    source: "luxe_website",
    campaignSource: "summer-campaign",
    serviceInterest: "Botox",
    estimatedValueCents: 45000,
    status: "new",
    pipelineStage: "new",
    assignedTo: null,
    followUpDueAt: new Date("2026-08-18T16:50:00.000Z"),
    lastContactedAt: null,
    bookingStatus: "not_booked",
    paymentStatus: "not_paid",
    createdAt: new Date("2026-08-18T16:30:00.000Z"),
    updatedAt: new Date("2026-08-18T16:30:00.000Z"),
    ...overrides,
  };
}

describe("Luxe acquisition operations analytics", () => {
  it("marks an overdue unanswered lead at risk without calling estimate collected revenue", () => {
    const result = summarizeAcquisitionLeads([lead()], { now, slaMinutes: 15 });
    expect(result.metrics.openLeads).toBe(1);
    expect(result.metrics.unansweredLeads).toBe(1);
    expect(result.metrics.atRiskLeads).toBe(1);
    expect(result.metrics.atRiskEstimatedOpportunityCents).toBe(45000);
    expect(result.metrics.collectedRevenueWithEvidenceCents).toBe(0);
    expect(result.actionQueue[0]?.action).toBe("contact_now");
  });

  it("separates booked estimated value from evidence-backed collected revenue", () => {
    const result = summarizeAcquisitionLeads([
      lead({ id: "booked", status: "booked", bookingStatus: "booked", estimatedValueCents: 85000, lastContactedAt: new Date("2026-08-18T16:35:00.000Z") }),
    ], { now, slaMinutes: 15 });
    expect(result.metrics.bookedEstimatedValueCents).toBe(85000);
    expect(result.metrics.collectedRevenueWithEvidenceCents).toBe(0);
  });

  it("shows booking start as verification work without counting it as booked", () => {
    const result = summarizeAcquisitionLeads([
      lead({
        id: "started",
        bookingStatus: "started",
        followUpDueAt: new Date("2026-08-18T17:15:00.000Z"),
        lastContactedAt: new Date("2026-08-18T16:40:00.000Z"),
      }),
    ], { now, slaMinutes: 15 });
    expect(result.metrics.bookingStartedLeads).toBe(1);
    expect(result.metrics.bookingReviewDueLeads).toBe(0);
    expect(result.metrics.bookedEstimatedValueCents).toBe(0);
    expect(result.actionQueue[0]?.action).toBe("booking_in_progress");
    expect(result.actionQueue[0]?.bookingInProgress).toBe(true);
  });

  it("turns an overdue booking-start review into verify-booking work, not a booked state", () => {
    const result = summarizeAcquisitionLeads([
      lead({
        id: "due",
        bookingStatus: "started",
        followUpDueAt: new Date("2026-08-18T16:59:00.000Z"),
        lastContactedAt: new Date("2026-08-18T16:40:00.000Z"),
      }),
    ], { now, slaMinutes: 15 });
    expect(result.metrics.bookingReviewDueLeads).toBe(1);
    expect(result.metrics.bookedEstimatedValueCents).toBe(0);
    expect(result.actionQueue[0]?.action).toBe("verify_booking");
  });

  it("attributes manual and processor evidence separately and by source", () => {
    const collectedEvidenceByLead = new Map([
      ["manual", { manualReconciledCents: 15000, processorVerifiedCents: 0 }],
      ["processor", { manualReconciledCents: 0, processorVerifiedCents: 45000 }],
    ]);
    const result = summarizeAcquisitionLeads([
      lead({ id: "manual", source: "instagram", estimatedValueCents: 45000 }),
      lead({ id: "processor", source: "google", estimatedValueCents: 45000 }),
    ], { now, slaMinutes: 15, collectedEvidenceByLead });
    expect(result.metrics.manualReconciledRevenueCents).toBe(15000);
    expect(result.metrics.processorVerifiedRevenueCents).toBe(45000);
    expect(result.metrics.collectedRevenueWithEvidenceCents).toBe(60000);
    expect(result.bySource.find((item) => item.key === "instagram")?.collectedWithEvidenceCents).toBe(15000);
    expect(result.bySource.find((item) => item.key === "google")?.collectedWithEvidenceCents).toBe(45000);
  });

  it("calculates median speed to lead only from recorded contact timestamps", () => {
    const result = summarizeAcquisitionLeads([
      lead({ id: "a", createdAt: new Date("2026-08-18T15:00:00.000Z"), lastContactedAt: new Date("2026-08-18T15:05:00.000Z") }),
      lead({ id: "b", createdAt: new Date("2026-08-18T15:00:00.000Z"), lastContactedAt: new Date("2026-08-18T15:15:00.000Z") }),
      lead({ id: "c", createdAt: new Date("2026-08-18T15:00:00.000Z"), lastContactedAt: null }),
    ], { now, slaMinutes: 15 });
    expect(result.metrics.medianSpeedToLeadMinutes).toBe(10);
  });

  it("groups source and service economics without inventing ad spend or ROAS", () => {
    const result = summarizeAcquisitionLeads([
      lead({ id: "a", source: "instagram", serviceInterest: "Botox", estimatedValueCents: 45000 }),
      lead({ id: "b", source: "instagram", serviceInterest: "Juvederm and fillers", estimatedValueCents: 85000 }),
      lead({ id: "c", source: "google", serviceInterest: "Botox", estimatedValueCents: 45000 }),
    ], { now, slaMinutes: 15 });
    expect(result.bySource.find((item) => item.key === "instagram")?.estimatedOpportunityCents).toBe(130000);
    expect(result.byService.find((item) => item.key === "Botox")?.leads).toBe(2);
    expect("roas" in result.metrics).toBe(false);
  });

  it("keeps assigned and unassigned routing truth visible", () => {
    const result = summarizeAcquisitionLeads([
      lead({ id: "unassigned", assignedTo: null }),
      lead({ id: "assigned", assignedTo: "user-1" }),
    ], { now, slaMinutes: 15 });
    expect(result.metrics.unassignedOpenLeads).toBe(1);
    expect(result.actionQueue.find((item) => item.id === "unassigned")?.routingStatus).toBe("unassigned");
    expect(result.actionQueue.find((item) => item.id === "assigned")?.routingStatus).toBe("assigned");
  });
});
