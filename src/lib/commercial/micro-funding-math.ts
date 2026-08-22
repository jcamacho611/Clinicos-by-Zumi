export const MICRO_USD_PER_CENT = 10_000;

export type MicroFundingPoolState = {
  /** Whole cents already backed by allowance, prepaid money or authorized overage. */
  backingCents: number;
  /** Micro-USD reserved for in-flight provider operations. */
  reservedMicroUsd: number;
  /** Completed provider cost not yet converted into whole-cent settlement. */
  consumedMicroUsd: number;
};

export type MicroFundingCompletion = {
  state: MicroFundingPoolState;
  fundedActualMicroUsd: number;
  unfundedOverrunMicroUsd: number;
};

export type MicroFundingSettlement = {
  /** Whole cents that can now be consumed from the pool's existing backing. */
  settleCents: number;
  /** Whole backing cents that are no longer needed and may be released. */
  releaseCents: number;
  /** Fractional-cent completed cost kept for the next aggregate settlement. */
  carryMicroUsd: number;
  /** Normalized pool after applying settleCents + releaseCents externally. */
  state: MicroFundingPoolState;
};

function nonNegativeInteger(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a non-negative safe integer.`);
  return value;
}

export function validateMicroFundingPool(state: MicroFundingPoolState) {
  const backingCents = nonNegativeInteger(state.backingCents, "backingCents");
  const reservedMicroUsd = nonNegativeInteger(state.reservedMicroUsd, "reservedMicroUsd");
  const consumedMicroUsd = nonNegativeInteger(state.consumedMicroUsd, "consumedMicroUsd");
  const capacityMicroUsd = backingCents * MICRO_USD_PER_CENT;
  if (!Number.isSafeInteger(capacityMicroUsd)) throw new Error("Micro-funding pool capacity exceeds safe integer range.");
  if (reservedMicroUsd + consumedMicroUsd > capacityMicroUsd) {
    throw new Error("Micro-funding pool is under-backed: reserved + consumed cost exceeds whole-cent backing.");
  }
  return { backingCents, reservedMicroUsd, consumedMicroUsd, capacityMicroUsd };
}

export function emptyMicroFundingPool(): MicroFundingPoolState {
  return { backingCents: 0, reservedMicroUsd: 0, consumedMicroUsd: 0 };
}

/**
 * Whole cents that must be added BEFORE an operation may reserve `estimateMicroUsd`.
 *
 * Several sub-cent operations share one backed cent. We therefore fund the aggregate
 * pool instead of rounding every request to a cent independently.
 */
export function additionalBackingCentsForReservation(state: MicroFundingPoolState, estimateMicroUsd: number) {
  const checked = validateMicroFundingPool(state);
  const estimate = nonNegativeInteger(estimateMicroUsd, "estimateMicroUsd");
  const requiredMicroUsd = checked.reservedMicroUsd + checked.consumedMicroUsd + estimate;
  const requiredBackingCents = Math.ceil(requiredMicroUsd / MICRO_USD_PER_CENT);
  return Math.max(0, requiredBackingCents - checked.backingCents);
}

/** Reserve one provider operation after any required whole-cent backing was acquired. */
export function reserveMicroUsage(
  state: MicroFundingPoolState,
  estimateMicroUsd: number,
  addedBackingCents = 0,
): MicroFundingPoolState {
  const checked = validateMicroFundingPool(state);
  const estimate = nonNegativeInteger(estimateMicroUsd, "estimateMicroUsd");
  const added = nonNegativeInteger(addedBackingCents, "addedBackingCents");
  const next = {
    backingCents: checked.backingCents + added,
    reservedMicroUsd: checked.reservedMicroUsd + estimate,
    consumedMicroUsd: checked.consumedMicroUsd,
  };
  validateMicroFundingPool(next);
  return next;
}

/** Release one in-flight estimate when the provider was not accepted/executed. */
export function releaseMicroReservation(state: MicroFundingPoolState, reservedForOperationMicroUsd: number) {
  const checked = validateMicroFundingPool(state);
  const reservation = nonNegativeInteger(reservedForOperationMicroUsd, "reservedForOperationMicroUsd");
  if (reservation > checked.reservedMicroUsd) throw new Error("Cannot release more micro-USD than the pool has reserved.");
  return {
    backingCents: checked.backingCents,
    reservedMicroUsd: checked.reservedMicroUsd - reservation,
    consumedMicroUsd: checked.consumedMicroUsd,
  };
}

/**
 * Complete an operation against the aggregate pool.
 *
 * Actual cost may exceed that operation's estimate when spare backed capacity exists.
 * Other in-flight reservations are protected first. Any remainder is an unfunded
 * overrun and should block further variable-cost execution until reviewed/funded.
 */
export function completeMicroUsage(
  state: MicroFundingPoolState,
  reservedForOperationMicroUsd: number,
  actualCostMicroUsd: number,
): MicroFundingCompletion {
  const checked = validateMicroFundingPool(state);
  const operationReservation = nonNegativeInteger(reservedForOperationMicroUsd, "reservedForOperationMicroUsd");
  const actual = nonNegativeInteger(actualCostMicroUsd, "actualCostMicroUsd");
  if (operationReservation > checked.reservedMicroUsd) {
    throw new Error("Operation reservation exceeds the micro-USD currently reserved by the pool.");
  }

  const otherReserved = checked.reservedMicroUsd - operationReservation;
  const availableForThisActual = Math.max(
    0,
    checked.capacityMicroUsd - checked.consumedMicroUsd - otherReserved,
  );
  const fundedActualMicroUsd = Math.min(actual, availableForThisActual);
  const unfundedOverrunMicroUsd = actual - fundedActualMicroUsd;

  const next = {
    backingCents: checked.backingCents,
    reservedMicroUsd: otherReserved,
    consumedMicroUsd: checked.consumedMicroUsd + fundedActualMicroUsd,
  };
  validateMicroFundingPool(next);
  return { state: next, fundedActualMicroUsd, unfundedOverrunMicroUsd };
}

/**
 * Convert aggregate completed micro-USD into whole cents without rounding each call.
 *
 * Full cents are settled. A fractional remainder stays in the pool, backed by enough
 * whole cents to cover both that carry and any in-flight reservations. Extra backing
 * becomes releasable. This means Klinikos never fronts the fractional cost, while the
 * customer is also not charged a full cent for every tiny operation.
 */
export function planMicroFundingSettlement(state: MicroFundingPoolState): MicroFundingSettlement {
  const checked = validateMicroFundingPool(state);
  const settleCents = Math.floor(checked.consumedMicroUsd / MICRO_USD_PER_CENT);
  const carryMicroUsd = checked.consumedMicroUsd % MICRO_USD_PER_CENT;
  const backingAfterSettlement = checked.backingCents - settleCents;
  const requiredOpenBackingCents = Math.ceil((checked.reservedMicroUsd + carryMicroUsd) / MICRO_USD_PER_CENT);
  const releaseCents = Math.max(0, backingAfterSettlement - requiredOpenBackingCents);
  const normalizedBackingCents = backingAfterSettlement - releaseCents;

  const next = {
    backingCents: normalizedBackingCents,
    reservedMicroUsd: checked.reservedMicroUsd,
    consumedMicroUsd: carryMicroUsd,
  };
  validateMicroFundingPool(next);

  return { settleCents, releaseCents, carryMicroUsd, state: next };
}
