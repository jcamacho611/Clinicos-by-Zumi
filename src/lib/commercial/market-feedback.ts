/**
 * Outside feedback, recorded as evidence rather than remembered as anecdote.
 *
 * The directive is explicit that the Caduceus finding must become a tracked product
 * finding rather than a story someone retells. The reason is that this is the second
 * time the same class of signal has arrived — a sophisticated reader could not work out
 * what the company does — and nothing in the repository held the first one, so nothing
 * connected them.
 *
 * Two rules make this useful rather than decorative:
 *
 *   Feedback is quoted, not paraphrased into something more comfortable. "He could not
 *   determine the value proposition" is the finding; "messaging could be clearer" is a
 *   softened version that would not have justified rewriting the homepage.
 *
 *   A finding stays open until something shipped, and names what shipped. A resolution
 *   that says "improved copy" is not a resolution.
 */

export type FeedbackCategory =
  | "message_clarity"
  | "pricing"
  | "trust"
  | "product_gap"
  | "ux"
  | "technical"
  | "sales"
  | "deliverability"
  | "onboarding"
  | "security"
  | "accessibility";

export type FeedbackSeverity = "critical" | "high" | "medium" | "low";
export type FeedbackStatus = "open" | "addressed" | "wont_fix";

export interface MarketFinding {
  readonly id: string;
  /** Where it came from. Named organisations only where the person spoke for one. */
  readonly source: string;
  readonly persona: string;
  readonly observedOn: string;
  /** The surface the feedback was about. */
  readonly surface: string;
  /** What they actually said or reported, not a softened summary. */
  readonly finding: string;
  readonly category: FeedbackCategory;
  readonly severity: FeedbackSeverity;
  readonly status: FeedbackStatus;
  /** What shipped in response. Empty while the finding is open. */
  readonly resolution: string | null;
}

export const MARKET_FINDINGS: readonly MarketFinding[] = [
  {
    id: "2026-08-20-caduceus-value-proposition",
    source: "Caduceus (external evaluator)",
    persona: "Healthcare investor / operator",
    observedOn: "2026-08-20",
    surface: "klinikos.io homepage",
    finding:
      "Reviewed the website and could not determine the value proposition or what the product does. "
      + "Asked for a pitch deck because the site did not answer those questions.",
    category: "message_clarity",
    severity: "critical",
    status: "addressed",
    resolution:
      "The first viewport was an orb, the word Klinikos, the headline \"What needs to happen?\" and a chat "
      + "box — a visitor had to talk to a bot to learn what the company sells. The fold now leads with what "
      + "Klinikos is, what it does, what it is priced against and a primary action, verified visible without "
      + "scrolling at 1440px and 390px. Copy moved into canonical-messaging.ts so it cannot drift again.",
  },
  {
    id: "2026-08-20-charmhealth-thread-fragmentation",
    source: "CharmHealth contact",
    persona: "Partner / vendor contact",
    observedOn: "2026-08-20",
    surface: "Outbound email",
    finding:
      "Asked that communication stay in a single email thread, because multiple parallel threads risked "
      + "losing information.",
    category: "sales",
    severity: "high",
    status: "open",
    resolution: null,
  },
  {
    id: "2026-08-20-outbound-undeliverable-volume",
    source: "Klinikos outbound activity",
    persona: "Internal observation",
    observedOn: "2026-08-20",
    surface: "Growth engine outreach",
    finding:
      "A meaningful share of recent outbound messages were undeliverable. Sending was being treated as "
      + "success, so contact quality was never measured.",
    category: "deliverability",
    severity: "high",
    status: "open",
    resolution: null,
  },
];

export function openFindings(): readonly MarketFinding[] {
  return MARKET_FINDINGS.filter((finding) => finding.status === "open");
}

/** A finding is only closed by naming what shipped. */
export function findingsClaimingResolutionWithoutEvidence(): readonly MarketFinding[] {
  return MARKET_FINDINGS.filter(
    (finding) => finding.status === "addressed" && (finding.resolution ?? "").trim().length < 40,
  );
}
