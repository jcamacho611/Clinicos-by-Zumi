/**
 * "Why hasn't this been paid?" — answered as structure rather than prose.
 *
 * A biller asking that question does not want six paragraphs. They want to see where the
 * money stopped and who owns the next move. This turns one claim into the canonical
 * progression so the answer can be rendered as the path itself:
 *
 *   PERFORMED → DOCUMENTED → CODED → CLAIM READY → SUBMITTED
 *   → ACCEPTED → ADJUDICATED → PAID → RECONCILED
 *
 * The hard part is not the ordering. It is refusing to overstate what any of it means.
 *
 * No claims rail is connected in production — 837 submission, 276/277 status and 835
 * remittance are all sandbox-ready and pending production connection. So a claim marked
 * SUBMITTED was marked by a person or an internal process; nothing transmitted it to a
 * clearinghouse. ACCEPTED is a row we wrote, not a payer's answer. PAID is a recorded
 * status, not settlement.
 *
 * Every stage therefore carries how it is known, separately from whether it is done. A
 * stage can be complete on internal record and still have no external confirmation, and
 * the two must never be collapsed — a claim that merely looks paid is the most expensive
 * lie this system could tell.
 *
 * RECONCILED has no representation in the schema at all. It reports `unknown` rather
 * than `pending`, because "we have not got there yet" and "we cannot see this" are
 * different answers and only one of them is honest here.
 *
 * Pure on purpose: it takes a snapshot and returns a reading, so the truth rules are
 * testable without a database and cannot drift into a query.
 */

export type RevenueStageKey =
  | "performed"
  | "documented"
  | "coded"
  | "claim_ready"
  | "submitted"
  | "accepted"
  | "adjudicated"
  | "paid"
  | "reconciled";

/**
 * `attention` rather than `failed`: a denial is a normal, workable state that owns a next
 * action, not an error. `unknown` means Klinikos cannot see the answer — never a guess.
 */
export type RevenueStageState = "complete" | "attention" | "pending" | "unknown";

/** How a stage is known. The distinction the whole module exists to preserve. */
export type RevenueConfirmation =
  /** An outside system confirmed it. Nothing can claim this until a rail is connected. */
  | "externally_confirmed"
  /** Klinikos recorded it. True about our record, silent about the outside world. */
  | "internal_record_only"
  /** Nothing supports it yet. */
  | "none";

export interface RevenueStage {
  readonly key: RevenueStageKey;
  /** Plain language for a person. Never a raw enum. */
  readonly label: string;
  readonly state: RevenueStageState;
  /** What in Klinikos supports this, in a biller's words. Null when nothing does. */
  readonly evidence: string | null;
  readonly confirmation: RevenueConfirmation;
}

export interface RevenueIntegrityPath {
  readonly stages: readonly RevenueStage[];
  /** Where attention belongs: the first stage that is not complete. */
  readonly firstUnresolved: RevenueStageKey | null;
  /** One sentence a biller can act on. */
  readonly nextAction: string;
  /**
   * Whether an external claims rail is connected. False today, and the reason every
   * post-submission stage stays `internal_record_only`.
   */
  readonly externalRailConnected: boolean;
}

/** A claim reduced to the facts this reading needs. */
export interface RevenueClaimSnapshot {
  readonly status: string;
  readonly totalCents: number;
  readonly submittedAt: string | null;
  /** The encounter the work was performed in, when the claim is linked to one. */
  readonly encounter: { readonly signedAt: string | null } | null;
  /** The superbill carrying codes, when one exists. */
  readonly superbill: {
    readonly procedureCount: number;
    readonly diagnosisCount: number;
    readonly reviewedAt: string | null;
  } | null;
  /** Open denials against this claim. */
  readonly openDenials: readonly { readonly reason: string; readonly appealDueAt: string | null }[];
}

/** Statuses at or past the point a claim was marked submitted. */
const SUBMITTED_OR_LATER = new Set([
  "SUBMITTED", "ACCEPTED", "REJECTED", "DENIED", "PAID", "PATIENT_BALANCE", "APPEALED", "CLOSED",
]);
/** Statuses where a payer answer has been recorded, whatever that answer was. */
const ADJUDICATED = new Set(["DENIED", "PAID", "PATIENT_BALANCE", "APPEALED", "CLOSED", "REJECTED"]);

export function buildRevenueIntegrityPath(
  claim: RevenueClaimSnapshot,
  options: {
    readonly externalRailConnected: boolean;
    /** Injected so "is this appeal still open?" is testable rather than clock-dependent. */
    readonly now?: Date;
  },
): RevenueIntegrityPath {
  const now = options.now ?? new Date();
  const rail = options.externalRailConnected;
  /* Anything a payer or clearinghouse would have to confirm can only ever be an internal
     record while no rail is connected. This is the single place that rule is applied. */
  const external: RevenueConfirmation = rail ? "externally_confirmed" : "internal_record_only";

  const signed = claim.encounter?.signedAt ?? null;
  const coded = claim.superbill !== null
    && claim.superbill.procedureCount > 0
    && claim.superbill.diagnosisCount > 0;
  const submitted = claim.submittedAt !== null || SUBMITTED_OR_LATER.has(claim.status);
  const denial = claim.openDenials[0] ?? null;

  const stages: RevenueStage[] = [
    {
      key: "performed",
      label: "Service performed",
      state: claim.encounter ? "complete" : "unknown",
      evidence: claim.encounter
        ? "An encounter is linked to this claim."
        : "No encounter is linked to this claim, so the work behind it cannot be shown.",
      confirmation: claim.encounter ? "internal_record_only" : "none",
    },
    {
      key: "documented",
      label: "Note signed",
      state: signed ? "complete" : claim.encounter ? "attention" : "unknown",
      evidence: signed
        ? "The encounter note is signed."
        : claim.encounter
          ? "The encounter note is not signed yet."
          : "Without a linked encounter there is no note to sign.",
      confirmation: signed ? "internal_record_only" : "none",
    },
    {
      key: "coded",
      label: "Coded",
      state: coded ? "complete" : "attention",
      evidence: coded
        ? `${claim.superbill?.procedureCount} procedure code${claim.superbill?.procedureCount === 1 ? "" : "s"} and ${claim.superbill?.diagnosisCount} diagnosis code${claim.superbill?.diagnosisCount === 1 ? "" : "s"} are attached.`
        : claim.superbill
          ? "The superbill is missing procedure or diagnosis codes."
          : "No superbill is attached to this claim.",
      confirmation: coded ? "internal_record_only" : "none",
    },
    {
      key: "claim_ready",
      label: "Ready to submit",
      state: claim.status === "DRAFT" ? "attention" : "complete",
      evidence: claim.status === "DRAFT"
        ? "The claim is still a draft and has not been marked ready."
        : "The claim has passed draft.",
      confirmation: claim.status === "DRAFT" ? "none" : "internal_record_only",
    },
    {
      key: "submitted",
      label: "Submitted",
      state: submitted ? "complete" : "pending",
      // The wording carries the boundary. "Marked submitted" is what actually happened.
      evidence: submitted
        ? rail
          ? "The claim was transmitted to the clearinghouse."
          : "The claim is marked submitted in Klinikos. No claims connection is live, so nothing has been transmitted to a clearinghouse."
        : "The claim has not been marked submitted.",
      confirmation: submitted ? external : "none",
    },
    {
      key: "accepted",
      label: "Accepted",
      state: claim.status === "REJECTED"
        ? "attention"
        : ["ACCEPTED", "DENIED", "PAID", "PATIENT_BALANCE", "APPEALED", "CLOSED"].includes(claim.status)
          ? "complete"
          : "pending",
      evidence: claim.status === "REJECTED"
        ? "The claim is recorded as rejected before adjudication."
        : ["ACCEPTED", "DENIED", "PAID", "PATIENT_BALANCE", "APPEALED", "CLOSED"].includes(claim.status)
          ? rail
            ? "The clearinghouse accepted the claim."
            : "Klinikos records the claim as accepted. That is our record; no clearinghouse has confirmed it."
          : "No acceptance has been recorded.",
      confirmation: ADJUDICATED.has(claim.status) || claim.status === "ACCEPTED" ? external : "none",
    },
    {
      key: "adjudicated",
      label: "Payer response",
      state: denial ? "attention" : ADJUDICATED.has(claim.status) ? "complete" : "pending",
      evidence: denial
        ? `Denied: ${denial.reason}`
        : ADJUDICATED.has(claim.status)
          ? rail
            ? "A payer response was received."
            : "A payer response is recorded in Klinikos. No remittance connection is live to confirm it."
          : "No payer response has been recorded.",
      confirmation: ADJUDICATED.has(claim.status) ? external : "none",
    },
    {
      key: "paid",
      label: "Paid",
      state: claim.status === "PAID" ? "complete" : denial ? "attention" : "pending",
      evidence: claim.status === "PAID"
        ? rail
          ? "Payment was received and matched to this claim."
          : "The claim is marked paid in Klinikos. No remittance connection is live, so this is a recorded status rather than settlement evidence."
        : denial
          ? "Payment is blocked by an open denial."
          : "No payment has been recorded.",
      confirmation: claim.status === "PAID" ? external : "none",
    },
    {
      key: "reconciled",
      // Nothing in the schema records reconciliation. Saying "pending" would imply we
      // are watching for it; we are not, and cannot until remittance is connected.
      label: "Reconciled",
      state: "unknown",
      evidence: "Klinikos does not track reconciliation for this claim yet.",
      confirmation: "none",
    },
  ];

  const firstUnresolved = stages.find((stage) => stage.state !== "complete")?.key ?? null;

  return {
    stages,
    firstUnresolved,
    nextAction: nextActionFor(stages, denial, rail, now),
    externalRailConnected: rail,
  };
}

/** The one sentence the biller acts on. Names the work, never an internal state name. */
function nextActionFor(
  stages: readonly RevenueStage[],
  denial: { readonly reason: string; readonly appealDueAt: string | null } | null,
  rail: boolean,
  now: Date,
): string {
  const blocked = stages.find((stage) => stage.state === "attention");

  if (blocked?.key === "documented") return "Sign the encounter note.";
  if (blocked?.key === "coded") return "Complete coding on the superbill.";
  if (blocked?.key === "claim_ready") return "Review the claim and mark it ready to submit.";
  if (blocked?.key === "accepted") return "Review the rejection and correct the claim before resubmitting.";
  if (denial) {
    if (!denial.appealDueAt) return "Resolve the denial before this claim can be paid.";
    const due = denial.appealDueAt.slice(0, 10);
    /* A deadline that has already passed is a different situation from one approaching,
       and reading "due 2026-08-01" three weeks later invites someone to treat a missed
       window as still open. Live data surfaced this; every synthetic denial had a future
       date. */
    return new Date(denial.appealDueAt).getTime() < now.getTime()
      ? `Appeal window closed ${due}. Confirm whether this denial can still be reworked.`
      : `Resolve the denial — appeal is due ${due}.`;
  }
  if (blocked) return "This claim needs review before it can move forward.";

  const pending = stages.find((stage) => stage.state === "pending");
  if (pending?.key === "submitted") return "Submit the claim once a claims connection is available.";
  if (pending && !rail) return "Nothing further can move until a claims connection is live.";
  if (pending) return "Waiting on the payer.";

  return "Nothing is blocking this claim.";
}
