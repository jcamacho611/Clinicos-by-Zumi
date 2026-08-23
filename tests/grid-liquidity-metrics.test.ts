import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { computeGridLiquidityMetrics } from "@/lib/grid/liquidity-metrics";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Grid liquidity metrics", () => {
  it("measures demand coverage, reservation conversion, fulfillment, and unsupplied demand from governed records", () => {
    const metrics = computeGridLiquidityMetrics({
      demands: [
        { id: "d1", status: "open" },
        { id: "d2", status: "open" },
        { id: "d3", status: "fulfilled" },
        { id: "d4", status: "cancelled" },
      ],
      offers: [
        { id: "o1", demandId: "d1", status: "sent" },
        { id: "o2", demandId: "d1", status: "declined" },
        { id: "o3", demandId: "d3", status: "accepted" },
      ],
      reservations: [
        { id: "r1", demandId: "d3", offerId: "o3", fulfillmentStatus: "fulfilled" },
      ],
    });

    expect(metrics).toEqual({
      totalDemands: 4,
      activeDemands: 2,
      demandsWithOffers: 2,
      activeDemandsWithOffers: 1,
      unsuppliedActiveDemands: 1,
      demandsWithReservations: 1,
      totalOffers: 3,
      totalReservations: 1,
      fulfilledReservations: 1,
      demandOfferCoverageRate: 0.5,
      demandReservationRate: 0.25,
      offerToReservationRate: 1 / 3,
      reservationFulfillmentRate: 1,
    });
  });

  it("deduplicates multiple offers and reservations for the same demand when measuring coverage", () => {
    const metrics = computeGridLiquidityMetrics({
      demands: [{ id: "d1", status: "open" }],
      offers: [
        { id: "o1", demandId: "d1", status: "sent" },
        { id: "o2", demandId: "d1", status: "sent" },
      ],
      reservations: [
        { id: "r1", demandId: "d1", offerId: "o1", fulfillmentStatus: "pending" },
        { id: "r2", demandId: "d1", offerId: "o2", fulfillmentStatus: "failed" },
      ],
    });

    expect(metrics.demandsWithOffers).toBe(1);
    expect(metrics.activeDemandsWithOffers).toBe(1);
    expect(metrics.demandsWithReservations).toBe(1);
    expect(metrics.demandOfferCoverageRate).toBe(1);
  });

  it("returns null rates when there is no meaningful denominator rather than inventing zero performance", () => {
    const metrics = computeGridLiquidityMetrics({ demands: [], offers: [], reservations: [] });

    expect(metrics.demandOfferCoverageRate).toBeNull();
    expect(metrics.demandReservationRate).toBeNull();
    expect(metrics.offerToReservationRate).toBeNull();
    expect(metrics.reservationFulfillmentRate).toBeNull();
  });

  it("excludes terminal demand states from active supply-gap measurement", () => {
    const metrics = computeGridLiquidityMetrics({
      demands: [
        { id: "fulfilled", status: "fulfilled" },
        { id: "cancelled", status: "cancelled" },
        { id: "expired", status: "expired" },
      ],
      offers: [],
      reservations: [],
    });

    expect(metrics.activeDemands).toBe(0);
    expect(metrics.unsuppliedActiveDemands).toBe(0);
    expect(metrics.demandOfferCoverageRate).toBeNull();
  });

  it("wires liquidity into the existing Grid transaction board instead of creating a second marketplace data source", () => {
    const repository = read("src/lib/grid/transaction-board-repository.ts");
    expect(repository).toContain("computeGridLiquidityMetrics");
    expect(repository).toContain("liquidity");
    expect(repository).toContain("demands");
    expect(repository).toContain("offers");
    expect(repository).toContain("reservations");
    expect(repository).not.toContain("GridLiquidityRecord");
  });
});