export type GridOfferState = "created" | "sent" | "viewed" | "accepted" | "declined" | "expired" | "withdrawn";
export type GridReservationState = "pending" | "held" | "released" | "consumed" | "expired";
export type GridFulfillmentState = "not_started" | "checked_in" | "in_progress" | "fulfilled" | "partial" | "failed" | "disputed";
export type GridSettlementState = "pending" | "held" | "payable" | "processing" | "settled" | "failed" | "reversed" | "disputed";

const offerTransitions: Record<GridOfferState, readonly GridOfferState[]> = {
  created: ["sent", "withdrawn"],
  sent: ["viewed", "accepted", "declined", "expired", "withdrawn"],
  viewed: ["accepted", "declined", "expired", "withdrawn"],
  accepted: [],
  declined: [],
  expired: [],
  withdrawn: [],
};

const reservationTransitions: Record<GridReservationState, readonly GridReservationState[]> = {
  pending: ["held", "released", "expired"],
  held: ["consumed", "released", "expired"],
  released: [],
  consumed: [],
  expired: [],
};

const fulfillmentTransitions: Record<GridFulfillmentState, readonly GridFulfillmentState[]> = {
  not_started: ["checked_in", "failed"],
  checked_in: ["in_progress", "failed"],
  in_progress: ["fulfilled", "partial", "failed", "disputed"],
  fulfilled: ["disputed"],
  partial: ["disputed"],
  failed: ["disputed"],
  disputed: [],
};

const settlementTransitions: Record<GridSettlementState, readonly GridSettlementState[]> = {
  pending: ["held", "payable", "failed", "disputed"],
  held: ["payable", "failed", "reversed", "disputed"],
  payable: ["processing", "reversed", "disputed"],
  processing: ["settled", "failed", "disputed"],
  settled: ["reversed", "disputed"],
  failed: ["processing", "reversed"],
  reversed: [],
  disputed: ["held", "payable", "reversed"],
};

function canTransition<T extends string>(table: Record<T, readonly T[]>, from: T, to: T) {
  return table[from].includes(to);
}

export function canTransitionGridOffer(from: GridOfferState, to: GridOfferState) {
  return canTransition(offerTransitions, from, to);
}

export function canTransitionGridReservation(from: GridReservationState, to: GridReservationState) {
  return canTransition(reservationTransitions, from, to);
}

export function canTransitionGridFulfillment(from: GridFulfillmentState, to: GridFulfillmentState) {
  return canTransition(fulfillmentTransitions, from, to);
}

export function canTransitionGridSettlement(from: GridSettlementState, to: GridSettlementState) {
  return canTransition(settlementTransitions, from, to);
}

export function reservationConflicts(input: {
  existingStart: Date;
  existingEnd: Date;
  requestedStart: Date;
  requestedEnd: Date;
}) {
  return input.requestedStart < input.existingEnd && input.requestedEnd > input.existingStart;
}

export function computeGridFinancialSplit(input: {
  grossAmountCents: number;
  platformFeeCents: number;
  locationPayableCents?: number;
}) {
  const { grossAmountCents, platformFeeCents } = input;
  const locationPayableCents = input.locationPayableCents ?? 0;

  if (!Number.isInteger(grossAmountCents) || grossAmountCents < 0) throw new Error("Gross amount must be a non-negative integer.");
  if (!Number.isInteger(platformFeeCents) || platformFeeCents < 0) throw new Error("Platform fee must be a non-negative integer.");
  if (!Number.isInteger(locationPayableCents) || locationPayableCents < 0) throw new Error("Location payable must be a non-negative integer.");
  if (platformFeeCents > grossAmountCents) throw new Error("Platform fee cannot exceed gross amount.");
  if (platformFeeCents + locationPayableCents > grossAmountCents) throw new Error("Platform fee and location payable cannot exceed gross amount.");

  const providerPayableCents = grossAmountCents - platformFeeCents - locationPayableCents;

  return {
    grossAmountCents,
    platformFeeCents,
    locationPayableCents,
    providerPayableCents,
  };
}

export function payoutCanSettle(input: {
  fulfillmentState: GridFulfillmentState;
  externalReference?: string | null;
  disputed?: boolean;
}) {
  return input.fulfillmentState === "fulfilled" && Boolean(input.externalReference?.trim()) && !input.disputed;
}
