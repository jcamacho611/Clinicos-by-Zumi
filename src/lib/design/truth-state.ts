/**
 * The vocabulary Klinikos uses to say how true something is.
 *
 * The failure this prevents is a single green check. A connector with credentials
 * saved, a connector whose provider has verified the sender, a connector the
 * organization is authorized to use for a given purpose, and a connector that has
 * actually moved a real transaction in production are four different facts. Collapsing
 * them into "Connected ✓" is how a product ends up claiming a live lab feed it does not
 * have, and how an operator ends up believing a patient was messaged when nothing left
 * the building.
 *
 * So each stage is named, ordered, and carries its own sentence. `tests/truth-state.test.ts`
 * holds the two properties that matter: the stages are strictly ordered, and no two
 * share a label, an icon or a colour — because a state a person cannot distinguish is a
 * state the product has not really made.
 *
 * Colour is never the only carrier. Every stage has a `mark` (a text/shape token) so the
 * status survives greyscale, colour blindness, and forced-colors mode.
 */

export type TruthStage =
  | "not_configured"
  | "configured"
  | "provider_verified"
  | "authorized"
  | "proven_in_production"
  | "manual_fallback"
  | "human_review"
  | "blocked"
  | "failed";

export interface TruthStateSpec {
  readonly stage: TruthStage;
  /** What a person reads. Plain language, never an internal enum. */
  readonly label: string;
  /** Non-colour carrier: shown alongside the label so greyscale still reads. */
  readonly mark: string;
  /** The design token role, not a raw hex — surfaces map roles to their own palette. */
  readonly tone: "neutral" | "progress" | "success" | "warning" | "critical" | "review";
  /** One sentence saying exactly what is and is not true at this stage. */
  readonly meaning: string;
  /**
   * How far along the trust chain this is. Only the ordered stages carry a rank; the
   * off-path states (manual fallback, human review, blocked, failed) are null because
   * they are not steps toward production, they are where the chain stopped.
   */
  readonly rank: number | null;
}

export const truthStates: Readonly<Record<TruthStage, TruthStateSpec>> = {
  not_configured: {
    stage: "not_configured",
    label: "Not connected",
    mark: "○",
    tone: "neutral",
    meaning: "Nothing has been set up yet. No credentials, no traffic.",
    rank: 0,
  },
  configured: {
    stage: "configured",
    label: "Configured",
    mark: "◐",
    tone: "progress",
    meaning: "Settings are saved. This does not mean the provider has verified anything.",
    rank: 1,
  },
  provider_verified: {
    stage: "provider_verified",
    label: "Provider verified",
    mark: "◑",
    tone: "progress",
    meaning: "The provider confirmed the sender or account. Klinikos has not yet authorized it for a purpose.",
    rank: 2,
  },
  authorized: {
    stage: "authorized",
    label: "Authorized",
    mark: "◕",
    tone: "progress",
    meaning: "Approved for a specific use here. Nothing has gone through in production yet.",
    rank: 3,
  },
  proven_in_production: {
    stage: "proven_in_production",
    label: "Working",
    mark: "●",
    tone: "success",
    meaning: "A real transaction has completed through this connection and was recorded.",
    rank: 4,
  },
  manual_fallback: {
    stage: "manual_fallback",
    label: "Manual for now",
    mark: "✎",
    tone: "warning",
    meaning: "A person does this step by hand. There is no automatic verification behind it.",
    rank: null,
  },
  human_review: {
    stage: "human_review",
    label: "Waiting on review",
    mark: "◉",
    tone: "review",
    meaning: "A qualified person has to decide before this can move. Nothing is automatic here.",
    rank: null,
  },
  blocked: {
    stage: "blocked",
    label: "Blocked",
    mark: "⊘",
    tone: "critical",
    meaning: "Something has to change before this is permitted at all.",
    rank: null,
  },
  failed: {
    stage: "failed",
    label: "Did not go through",
    mark: "✕",
    tone: "critical",
    meaning: "This was attempted and did not succeed. Nothing was recorded as done.",
    rank: null,
  },
};

/** The ordered trust chain, shortest true statement to strongest. */
export const truthChain: readonly TruthStage[] = [
  "not_configured",
  "configured",
  "provider_verified",
  "authorized",
  "proven_in_production",
];

/**
 * Is this connection safe to describe as live?
 *
 * Only the last stage qualifies. Everything earlier is a promise, and the whole point
 * of the chain is that a promise is never rendered as a completed fact.
 */
export function isLive(stage: TruthStage): boolean {
  return stage === "proven_in_production";
}

/** The next honest step, or null when there is nothing further along the chain. */
export function nextTruthStage(stage: TruthStage): TruthStage | null {
  const index = truthChain.indexOf(stage);
  if (index < 0 || index === truthChain.length - 1) return null;
  return truthChain[index + 1];
}
