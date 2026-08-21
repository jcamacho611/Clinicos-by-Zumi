import { describe, expect, it } from "vitest";
import {
  MICRO_USD_PER_CENT,
  additionalBackingCentsForReservation,
  completeMicroUsage,
  emptyMicroFundingPool,
  planMicroFundingSettlement,
  releaseMicroReservation,
  reserveMicroUsage,
  validateMicroFundingPool,
  type MicroFundingPoolState,
} from "@/lib/commercial/micro-funding-math";

describe("micro-unit customer funding", () => {
  it("defines one cent as exactly 10,000 micro-USD", () => {
    expect(MICRO_USD_PER_CENT).toBe(10_000);
  });

  it("does not round a sub-cent operation into a whole-cent charge", () => {
    let pool = emptyMicroFundingPool();
    const estimate = 900;
    const backing = additionalBackingCentsForReservation(pool, estimate);
    expect(backing).toBe(1);
    pool = reserveMicroUsage(pool, estimate, backing);
    pool = completeMicroUsage(pool, estimate, estimate).state;
    const settlement = planMicroFundingSettlement(pool);
    expect(settlement.settleCents).toBe(0);
    expect(settlement.carryMicroUsd).toBe(900);
    expect(settlement.releaseCents).toBe(0);
    expect(settlement.state).toEqual({ backingCents: 1, reservedMicroUsd: 0, consumedMicroUsd: 900 });
  });

  it("lets many sub-cent operations share backing and settles only aggregate whole cents", () => {
    let pool: MicroFundingPoolState = emptyMicroFundingPool();
    for (let index = 0; index < 12; index += 1) {
      const estimate = 900;
      const added = additionalBackingCentsForReservation(pool, estimate);
      pool = reserveMicroUsage(pool, estimate, added);
      pool = completeMicroUsage(pool, estimate, estimate).state;
    }
    expect(pool).toEqual({ backingCents: 2, reservedMicroUsd: 0, consumedMicroUsd: 10_800 });
    const settlement = planMicroFundingSettlement(pool);
    expect(settlement.settleCents).toBe(1);
    expect(settlement.carryMicroUsd).toBe(800);
    expect(settlement.releaseCents).toBe(0);
    expect(settlement.state).toEqual({ backingCents: 1, reservedMicroUsd: 0, consumedMicroUsd: 800 });
  });

  it("can pre-fund a 25-cent AI turn budget, settle actual micro-cost, and release unused backing", () => {
    let pool = emptyMicroFundingPool();
    const maxTurnBudgetMicroUsd = 250_000;
    expect(additionalBackingCentsForReservation(pool, maxTurnBudgetMicroUsd)).toBe(25);
    pool = reserveMicroUsage(pool, maxTurnBudgetMicroUsd, 25);
    const completion = completeMicroUsage(pool, maxTurnBudgetMicroUsd, 23_456);
    expect(completion.unfundedOverrunMicroUsd).toBe(0);
    const settlement = planMicroFundingSettlement(completion.state);
    expect(settlement.settleCents).toBe(2);
    expect(settlement.carryMicroUsd).toBe(3_456);
    expect(settlement.releaseCents).toBe(22);
    expect(settlement.state).toEqual({ backingCents: 1, reservedMicroUsd: 0, consumedMicroUsd: 3_456 });
  });

  it("protects other in-flight reservations before funding an over-budget actual cost", () => {
    const pool: MicroFundingPoolState = { backingCents: 2, reservedMicroUsd: 15_000, consumedMicroUsd: 0 };
    const completion = completeMicroUsage(pool, 5_000, 12_000);
    expect(completion.fundedActualMicroUsd).toBe(10_000);
    expect(completion.unfundedOverrunMicroUsd).toBe(2_000);
    expect(completion.state).toEqual({ backingCents: 2, reservedMicroUsd: 10_000, consumedMicroUsd: 10_000 });
  });

  it("releases a failed provider reservation and makes unused backing releasable", () => {
    let pool = reserveMicroUsage(emptyMicroFundingPool(), 900, 1);
    pool = releaseMicroReservation(pool, 900);
    const settlement = planMicroFundingSettlement(pool);
    expect(settlement).toMatchObject({ settleCents: 0, carryMicroUsd: 0, releaseCents: 1 });
    expect(settlement.state).toEqual(emptyMicroFundingPool());
  });

  it("requires enough whole-cent backing before a micro reservation is admitted", () => {
    const pool = { backingCents: 1, reservedMicroUsd: 9_500, consumedMicroUsd: 0 };
    expect(additionalBackingCentsForReservation(pool, 600)).toBe(1);
    expect(() => reserveMicroUsage(pool, 600, 0)).toThrow("under-backed");
    expect(reserveMicroUsage(pool, 600, 1)).toEqual({ backingCents: 2, reservedMicroUsd: 10_100, consumedMicroUsd: 0 });
  });

  it("rejects invalid, unsafe or under-backed state instead of repairing it silently", () => {
    expect(() => validateMicroFundingPool({ backingCents: -1, reservedMicroUsd: 0, consumedMicroUsd: 0 })).toThrow();
    expect(() => validateMicroFundingPool({ backingCents: 1, reservedMicroUsd: 10_001, consumedMicroUsd: 0 })).toThrow("under-backed");
    expect(() => reserveMicroUsage(emptyMicroFundingPool(), Number.MAX_SAFE_INTEGER, 1)).toThrow();
  });
});
