import "server-only";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { listGridFinancialObligations } from "@/lib/grid/financial-obligation-repository";

/**
 * Grid money, summarised for the surface a clinic owner actually opens.
 *
 * "Money" in the rail goes to billing, which showed the clinical revenue cycle and
 * nothing else. Meanwhile the seeded clinic owed $1,200 to another organization through
 * a fulfilled Grid transaction, and that number appeared on no surface a person visits
 * to answer "what do I owe" — it lived only inside the Grid workspace, which is where
 * you go to run a marketplace, not to reconcile.
 *
 * Two things this deliberately does not do.
 *
 * It does not add Grid money into the clinical totals. A patient balance and a
 * marketplace obligation are different promises to different counterparties, and one
 * combined figure would be a number nobody could act on. They sit side by side, each
 * labelled.
 *
 * It does not call anything settled that a processor has not settled. `settled` here
 * means the obligation record says settled; the Grid surface is explicit that manual
 * evidence is not processor verification, and summarising it here does not upgrade that.
 */

export interface GridMoneyLine {
  readonly id: string;
  readonly label: string;
  readonly counterparty: string;
  readonly amountCents: number;
  readonly status: string;
  /** True when this organization receives the money; false when it owes it. */
  readonly incoming: boolean;
}

export interface GridMoney {
  readonly pendingToYouCents: number;
  readonly settledToYouCents: number;
  readonly youOweCents: number;
  readonly lines: readonly GridMoneyLine[];
  /** True when the Grid has produced no obligations at all for this organization. */
  readonly quiet: boolean;
}

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export async function getGridMoney(session: ClinicSession): Promise<GridMoney | null> {
  // A role that cannot read either side gets nothing rather than a row of zeroes.
  // "$0 owed" is a claim, and it is not one this surface may make to someone who is
  // not entitled to know.
  if (!can(session.role, "grid", "read") && !can(session.role, "billing", "read")) return null;

  const obligations = await listGridFinancialObligations(session);

  let pendingToYouCents = 0;
  let settledToYouCents = 0;
  let youOweCents = 0;
  const lines: GridMoneyLine[] = [];

  for (const obligation of obligations) {
    const incoming = obligation.beneficiaryType === "organization"
      && obligation.beneficiaryReference === session.organizationId;
    if (incoming) {
      if (obligation.status === "settled") settledToYouCents += obligation.amountCents;
      else pendingToYouCents += obligation.amountCents;
    } else if (obligation.status !== "settled") {
      youOweCents += obligation.amountCents;
    }
    lines.push({
      id: obligation.id,
      label: label(obligation.obligationType),
      counterparty: obligation.beneficiaryType === "platform" ? "Klinikos" : "Grid participant",
      amountCents: obligation.amountCents,
      status: obligation.status,
      incoming,
    });
  }

  return {
    pendingToYouCents,
    settledToYouCents,
    youOweCents,
    lines: lines.slice(0, 8),
    quiet: obligations.length === 0,
  };
}
