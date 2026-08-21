export type EconomicEvidence =
  | "known"
  | "self_reported"
  | "estimated"
  | "inferred"
  | "unknown";

export type ClaimSafety = "supported" | "qualified_estimate" | "insufficient";

export type MonthlyCostEvidence = {
  monthlyCents: number | null;
  evidence: EconomicEvidence;
  source?: string;
  asOf?: string;
  note?: string;
};

export type ClinicStackCategory =
  | "ehr"
  | "practice_management"
  | "billing"
  | "clearinghouse"
  | "communications"
  | "phone"
  | "telehealth"
  | "crm"
  | "forms"
  | "esign"
  | "scheduling"
  | "payments"
  | "ai"
  | "coding"
  | "credentialing"
  | "fax"
  | "tasks"
  | "documents"
  | "marketing"
  | "automation"
  | "other";

export type ClinicStackItem = {
  key: string;
  label: string;
  category: ClinicStackCategory;
  cost: MonthlyCostEvidence;
  /**
   * replaceable: Klinikos is expected to displace the whole current line item.
   * connected: the external system is expected to remain and its cost should not
   * be represented as savings.
   * partial: only a documented share is expected to be displaced.
   * unknown: replacement posture has not been established yet.
   */
  replaceability: "replaceable" | "connected" | "partial" | "unknown";
  replacementShareBps?: number;
};

export type CostToServeCategory =
  | "infrastructure"
  | "intelligence"
  | "communications"
  | "healthcare_transactions"
  | "location"
  | "payments"
  | "customer_delivery"
  | "security_compliance"
  | "other";

export type CostToServeItem = {
  key: string;
  label: string;
  category: CostToServeCategory;
  cost: MonthlyCostEvidence;
};

export type ClinicEconomicsInput = {
  stack: ClinicStackItem[];
  costToServe: CostToServeItem[];
  proposedMonthlyPriceCents: number;
  implementationPriceCents: number;
};

export type ClinicEconomicsResult = {
  currentStack: {
    monthlyCents: number | null;
    knownSubtotalCents: number;
  };
  replaceableStack: {
    monthlyCents: number | null;
    knownSubtotalCents: number;
  };
  connectedStack: {
    monthlyCents: number | null;
    knownSubtotalCents: number;
  };
  costToServe: {
    monthlyCents: number | null;
    knownSubtotalCents: number;
  };
  proposedMonthlyPriceCents: number;
  implementationPriceCents: number;
  customerPostKlinikosMonthlyCents: number | null;
  customerMonthlySavingsCents: number | null;
  customerAnnualSavingsCents: number | null;
  grossProfitCents: number | null;
  grossMarginBps: number | null;
  implementationPaybackMonths: number | null;
  unresolved: string[];
  evidenceUsed: EconomicEvidence[];
  claimSafety: ClaimSafety;
};

const evidenceRank: Record<EconomicEvidence, number> = {
  known: 0,
  self_reported: 1,
  estimated: 2,
  inferred: 3,
  unknown: 4,
};

function assertMoney(name: string, cents: number) {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error(`${name} must be a non-negative safe integer number of cents.`);
  }
}

function assertOptionalMoney(name: string, cents: number | null) {
  if (cents === null) return;
  assertMoney(name, cents);
}

function assertReplacementShare(item: ClinicStackItem) {
  if (item.replaceability !== "partial") return;
  const share = item.replacementShareBps;
  if (share === undefined || !Number.isInteger(share) || share < 0 || share > 10_000) {
    throw new Error(`${item.key}.replacementShareBps must be an integer from 0 to 10000 for partial replacement.`);
  }
}

function claimSafetyFor(evidence: EconomicEvidence[], unresolved: string[]): ClaimSafety {
  if (unresolved.length > 0 || evidence.some((value) => value === "unknown")) return "insufficient";
  const worstRank = Math.max(0, ...evidence.map((value) => evidenceRank[value]));
  return worstRank >= evidenceRank.estimated ? "qualified_estimate" : "supported";
}

export function calculateClinicEconomics(input: ClinicEconomicsInput): ClinicEconomicsResult {
  assertMoney("proposedMonthlyPriceCents", input.proposedMonthlyPriceCents);
  assertMoney("implementationPriceCents", input.implementationPriceCents);

  const unresolved = new Set<string>();
  const evidenceUsed: EconomicEvidence[] = [];

  let currentKnown = 0;
  let currentComplete = true;
  let replaceableKnown = 0;
  let replaceableComplete = true;
  let connectedKnown = 0;
  let connectedComplete = true;

  for (const item of input.stack) {
    assertOptionalMoney(`${item.key}.monthlyCents`, item.cost.monthlyCents);
    assertReplacementShare(item);
    evidenceUsed.push(item.cost.evidence);

    if (item.cost.monthlyCents === null || item.cost.evidence === "unknown") {
      unresolved.add(`stack:${item.key}:monthly_cost`);
      currentComplete = false;
      if (item.replaceability === "replaceable" || item.replaceability === "partial") replaceableComplete = false;
      if (item.replaceability === "connected") connectedComplete = false;
      continue;
    }

    currentKnown += item.cost.monthlyCents;

    if (item.replaceability === "replaceable") {
      replaceableKnown += item.cost.monthlyCents;
    } else if (item.replaceability === "connected") {
      connectedKnown += item.cost.monthlyCents;
    } else if (item.replaceability === "partial") {
      const share = item.replacementShareBps as number;
      const displaced = Math.round((item.cost.monthlyCents * share) / 10_000);
      replaceableKnown += displaced;
      connectedKnown += item.cost.monthlyCents - displaced;
    } else {
      unresolved.add(`stack:${item.key}:replaceability`);
      replaceableComplete = false;
      connectedComplete = false;
    }
  }

  let costToServeKnown = 0;
  let costToServeComplete = true;
  for (const item of input.costToServe) {
    assertOptionalMoney(`${item.key}.monthlyCents`, item.cost.monthlyCents);
    evidenceUsed.push(item.cost.evidence);
    if (item.cost.monthlyCents === null || item.cost.evidence === "unknown") {
      unresolved.add(`cost_to_serve:${item.key}:monthly_cost`);
      costToServeComplete = false;
      continue;
    }
    costToServeKnown += item.cost.monthlyCents;
  }

  const replaceableMonthlyCents = replaceableComplete ? replaceableKnown : null;
  const connectedMonthlyCents = connectedComplete ? connectedKnown : null;
  const costToServeMonthlyCents = costToServeComplete ? costToServeKnown : null;

  const customerMonthlySavingsCents =
    replaceableMonthlyCents === null
      ? null
      : replaceableMonthlyCents - input.proposedMonthlyPriceCents;

  const customerAnnualSavingsCents =
    customerMonthlySavingsCents === null ? null : customerMonthlySavingsCents * 12;

  const customerPostKlinikosMonthlyCents =
    connectedMonthlyCents === null
      ? null
      : connectedMonthlyCents + input.proposedMonthlyPriceCents;

  const grossProfitCents =
    costToServeMonthlyCents === null
      ? null
      : input.proposedMonthlyPriceCents - costToServeMonthlyCents;

  const grossMarginBps =
    grossProfitCents === null || input.proposedMonthlyPriceCents === 0
      ? null
      : Math.round((grossProfitCents / input.proposedMonthlyPriceCents) * 10_000);

  const implementationPaybackMonths =
    customerMonthlySavingsCents !== null && customerMonthlySavingsCents > 0
      ? Number((input.implementationPriceCents / customerMonthlySavingsCents).toFixed(1))
      : null;

  const unresolvedList = [...unresolved].sort();

  return {
    currentStack: {
      monthlyCents: currentComplete ? currentKnown : null,
      knownSubtotalCents: currentKnown,
    },
    replaceableStack: {
      monthlyCents: replaceableMonthlyCents,
      knownSubtotalCents: replaceableKnown,
    },
    connectedStack: {
      monthlyCents: connectedMonthlyCents,
      knownSubtotalCents: connectedKnown,
    },
    costToServe: {
      monthlyCents: costToServeMonthlyCents,
      knownSubtotalCents: costToServeKnown,
    },
    proposedMonthlyPriceCents: input.proposedMonthlyPriceCents,
    implementationPriceCents: input.implementationPriceCents,
    customerPostKlinikosMonthlyCents,
    customerMonthlySavingsCents,
    customerAnnualSavingsCents,
    grossProfitCents,
    grossMarginBps,
    implementationPaybackMonths,
    unresolved: unresolvedList,
    evidenceUsed,
    claimSafety: claimSafetyFor(evidenceUsed, unresolvedList),
  };
}
