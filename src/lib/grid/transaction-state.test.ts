import { describe, expect, it } from "vitest";
import {
  canTransitionGridFulfillment,
  canTransitionGridOffer,
  canTransitionGridReservation,
  canTransitionGridSettlement,
  computeGridFinancialSplit,
  payoutCanSettle,
  reservationConflicts,
} from "@/lib/grid/transaction-state";

describe("Grid transaction state", () => {
  it("allows an offer to move from sent to accepted but not back to sent", () => {
    expect(canTransitionGridOffer("sent", "accepted")).toBe(true);
    expect(canTransitionGridOffer("accepted", "sent")).toBe(false);
  });

  it("consumes a held reservation and prevents reopening it", () => {
    expect(canTransitionGridReservation("held", "consumed")).toBe(true);
    expect(canTransitionGridReservation("consumed", "held")).toBe(false);
  });

  it("only settles through the processing path", () => {
    expect(canTransitionGridSettlement("payable", "processing")).toBe(true);
    expect(canTransitionGridSettlement("processing", "settled")).toBe(true);
    expect(canTransitionGridSettlement("pending", "settled")).toBe(false);
  });

  it("detects overlapping reservations", () => {
    const existingStart = new Date("2026-08-15T14:00:00.000Z");
    const existingEnd = new Date("2026-08-15T16:00:00.000Z");
    expect(reservationConflicts({
      existingStart,
      existingEnd,
      requestedStart: new Date("2026-08-15T15:00:00.000Z"),
      requestedEnd: new Date("2026-08-15T17:00:00.000Z"),
    })).toBe(true);
    expect(reservationConflicts({
      existingStart,
      existingEnd,
      requestedStart: new Date("2026-08-15T16:00:00.000Z"),
      requestedEnd: new Date("2026-08-15T17:00:00.000Z"),
    })).toBe(false);
  });

  it("computes provider, location, and platform shares without exceeding gross", () => {
    expect(computeGridFinancialSplit({ grossAmountCents: 100_000, platformFeeCents: 10_000, locationPayableCents: 20_000 })).toEqual({
      grossAmountCents: 100_000,
      platformFeeCents: 10_000,
      locationPayableCents: 20_000,
      providerPayableCents: 70_000,
    });
    expect(() => computeGridFinancialSplit({ grossAmountCents: 100_000, platformFeeCents: 90_000, locationPayableCents: 20_000 })).toThrow();
  });

  it("does not allow payout settlement before fulfillment and a real external reference", () => {
    expect(payoutCanSettle({ fulfillmentState: "fulfilled", externalReference: "ACH-123" })).toBe(true);
    expect(payoutCanSettle({ fulfillmentState: "fulfilled", externalReference: "" })).toBe(false);
    expect(payoutCanSettle({ fulfillmentState: "in_progress", externalReference: "ACH-123" })).toBe(false);
    expect(payoutCanSettle({ fulfillmentState: "fulfilled", externalReference: "ACH-123", disputed: true })).toBe(false);
  });

  it("allows a fulfilled transaction to enter dispute without rewriting fulfillment history", () => {
    expect(canTransitionGridFulfillment("fulfilled", "disputed")).toBe(true);
  });
});
