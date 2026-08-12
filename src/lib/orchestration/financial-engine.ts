export type FinancialObligationState = "draft" | "review_required" | "due" | "authorized" | "paid" | "void" | "refunded" | "disputed";

export type FinancialObligation = {
  id: string;
  transactionId?: string | null;
  payerId: string;
  payeeId: string;
  organizationId?: string | null;
  currency: string;
  grossAmountCents: number;
  platformFeeCents: number;
  processorFeeCents: number;
  netAmountCents: number;
  reason: string;
  state: FinancialObligationState;
  dueAt?: Date | null;
  createdAt: Date;
};

export type FeeRule = {
  key: string;
  applies: (input: { transactionType: string; grossAmountCents: number }) => boolean;
  calculateCents: (input: { transactionType: string; grossAmountCents: number }) => number;
};

export function calculateFinancialObligation(input: {
  id: string;
  transactionId?: string | null;
  transactionType: string;
  payerId: string;
  payeeId: string;
  organizationId?: string | null;
  currency?: string;
  grossAmountCents: number;
  processorFeeCents?: number;
  feeRules?: readonly FeeRule[];
  reason: string;
  dueAt?: Date | null;
  now?: Date;
}): FinancialObligation {
  if (!Number.isInteger(input.grossAmountCents) || input.grossAmountCents < 0) throw new Error("grossAmountCents must be a non-negative integer.");
  const platformFeeCents = (input.feeRules ?? [])
    .filter((rule) => rule.applies({ transactionType: input.transactionType, grossAmountCents: input.grossAmountCents }))
    .reduce((sum, rule) => sum + Math.max(0, Math.round(rule.calculateCents({ transactionType: input.transactionType, grossAmountCents: input.grossAmountCents }))), 0);
  const processorFeeCents = Math.max(0, Math.round(input.processorFeeCents ?? 0));
  const netAmountCents = Math.max(0, input.grossAmountCents - platformFeeCents - processorFeeCents);

  return {
    id: input.id,
    transactionId: input.transactionId ?? null,
    payerId: input.payerId,
    payeeId: input.payeeId,
    organizationId: input.organizationId ?? null,
    currency: input.currency ?? "USD",
    grossAmountCents: input.grossAmountCents,
    platformFeeCents,
    processorFeeCents,
    netAmountCents,
    reason: input.reason,
    state: "review_required",
    dueAt: input.dueAt ?? null,
    createdAt: input.now ?? new Date(),
  };
}

export function transitionFinancialObligation(input: {
  obligation: FinancialObligation;
  nextState: FinancialObligationState;
  paymentVerified?: boolean;
  humanApproved?: boolean;
}) {
  const current = input.obligation.state;
  const allowed: Record<FinancialObligationState, readonly FinancialObligationState[]> = {
    draft: ["review_required", "void"],
    review_required: ["due", "void"],
    due: ["authorized", "void", "disputed"],
    authorized: ["paid", "void", "disputed"],
    paid: ["refunded", "disputed"],
    void: [],
    refunded: ["disputed"],
    disputed: ["paid", "refunded", "void"],
  };

  if (!allowed[current].includes(input.nextState)) throw new Error(`Illegal financial state transition: ${current} → ${input.nextState}.`);
  if (current === "review_required" && input.nextState === "due" && !input.humanApproved) throw new Error("Human approval is required before an obligation becomes due.");
  if (input.nextState === "paid" && !input.paymentVerified) throw new Error("Paid state requires verified server-side payment evidence.");

  return { ...input.obligation, state: input.nextState };
}
