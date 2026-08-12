export type TransactionState = "requested" | "matched" | "offered" | "accepted" | "reserved" | "in_progress" | "fulfilled" | "review_required" | "completed" | "cancelled" | "disputed";

export type TransactionRecord = {
  id: string;
  type: string;
  requesterId: string;
  fulfillerId?: string | null;
  organizationId?: string | null;
  resourceId?: string | null;
  opportunityId?: string | null;
  state: TransactionState;
  startsAt?: Date | null;
  endsAt?: Date | null;
  amountCents?: number | null;
  currency?: string | null;
  acceptedAt?: Date | null;
  fulfilledAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const legalTransitions: Record<TransactionState, readonly TransactionState[]> = {
  requested: ["matched", "cancelled"],
  matched: ["offered", "cancelled"],
  offered: ["accepted", "cancelled"],
  accepted: ["reserved", "cancelled", "disputed"],
  reserved: ["in_progress", "cancelled", "disputed"],
  in_progress: ["fulfilled", "disputed"],
  fulfilled: ["review_required", "completed", "disputed"],
  review_required: ["completed", "disputed", "cancelled"],
  completed: ["disputed"],
  cancelled: [],
  disputed: ["review_required", "completed", "cancelled"],
};

export function transitionTransaction(input: {
  transaction: TransactionRecord;
  nextState: TransactionState;
  now?: Date;
  humanApproved?: boolean;
  fulfillmentConfirmed?: boolean;
}) {
  const now = input.now ?? new Date();
  const current = input.transaction.state;
  if (!legalTransitions[current].includes(input.nextState)) throw new Error(`Illegal transaction transition: ${current} → ${input.nextState}.`);
  if (input.nextState === "completed" && !input.fulfillmentConfirmed) throw new Error("Completion requires confirmed fulfillment.");
  if (current === "review_required" && input.nextState === "completed" && !input.humanApproved) throw new Error("Human approval is required to complete a reviewed transaction.");

  return {
    ...input.transaction,
    state: input.nextState,
    acceptedAt: input.nextState === "accepted" ? now : input.transaction.acceptedAt ?? null,
    fulfilledAt: input.nextState === "fulfilled" ? now : input.transaction.fulfilledAt ?? null,
    completedAt: input.nextState === "completed" ? now : input.transaction.completedAt ?? null,
    cancelledAt: input.nextState === "cancelled" ? now : input.transaction.cancelledAt ?? null,
    updatedAt: now,
  };
}

export function reservationOverlaps(a: Pick<TransactionRecord, "startsAt" | "endsAt" | "resourceId">, b: Pick<TransactionRecord, "startsAt" | "endsAt" | "resourceId">) {
  if (!a.resourceId || !b.resourceId || a.resourceId !== b.resourceId) return false;
  if (!a.startsAt || !a.endsAt || !b.startsAt || !b.endsAt) return false;
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

export function canReserveTransaction(input: {
  candidate: TransactionRecord;
  existing: readonly TransactionRecord[];
}) {
  const conflicting = input.existing.filter((transaction) =>
    ["accepted", "reserved", "in_progress"].includes(transaction.state) && reservationOverlaps(input.candidate, transaction),
  );
  return {
    allowed: conflicting.length === 0,
    conflicts: conflicting.map((transaction) => transaction.id),
  };
}
