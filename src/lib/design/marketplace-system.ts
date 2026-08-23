/**
 * Klinikos GRID Marketplace — Black Label spatial discovery materials.
 *
 * Public discovery remains Marble-first because comparison and map work benefit from
 * sustained legibility. It now consumes the same shared Klinikos material authority as
 * the authenticated product instead of owning a separate paper palette. Eligibility,
 * authorization, publication, privacy, payment, fulfillment, and transaction truth
 * remain deterministic and outside this presentation module.
 */

export const MARKETPLACE_EXCEPTION_SCOPE = ["/grid/browse"] as const;

export function isMarketplaceSurface(route: string) {
  return MARKETPLACE_EXCEPTION_SCOPE.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));
}

export const marketplacePalette = {
  ground: "var(--k-work-bg)",
  surface: "var(--k-public-surface)",
  ink: "var(--k-text)",
  inkMuted: "var(--k-muted)",
  line: "var(--k-line)",
  lineStrong: "var(--k-line)",
  signal: "var(--k-accent)",
  rose: "var(--k-accent)",
  gold: "var(--k-premium)",
  verified: "#17745f",
  pending: "#a55a22",
} as const;

export const marketplaceSurfaces = {
  /* Grid discovery is deliberately Marble-first. The existing compatibility class
     keeps old cinematic rules from forcing dark presentation while the values below
     come from the shared Black Label material system. */
  page: "grid-marble-surface min-h-screen bg-[var(--k-work-bg)] text-[var(--k-text)]",
  card: "border border-[var(--k-line)] bg-[var(--k-public-surface)]",
  cardInteractive:
    "border border-[var(--k-line)] bg-[var(--k-public-surface)] transition-[border-color,background-color] duration-200 hover:border-[var(--k-accent)] focus-within:border-[var(--k-accent)]",
  filterBar: "sticky top-0 z-30 border-b border-[var(--k-line)] bg-[var(--k-public-surface)]/92 backdrop-blur-xl",
  chip: "min-h-[44px] rounded-full border px-3.5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-accent)]",
  chipIdle: "border-[var(--k-line)] bg-[var(--k-public-surface)] text-[var(--k-muted)] hover:text-[var(--k-text)]",
  chipActive: "border-[var(--k-accent)] bg-[var(--k-public-raised)] text-[var(--k-text)]",
  eyebrow: "text-xs font-extrabold uppercase tracking-[.16em] text-[var(--k-accent)]",
  headline: "font-semibold tracking-[-.05em] text-[var(--k-text)]",
  meta: "text-xs leading-5 text-[var(--k-muted)]",
} as const;

export const LISTING_NOT_VERIFICATION_NOTICE =
  "A listing is not a Klinikos endorsement. Credential and malpractice verification is a separate human review, and its current state is shown on every profile.";

export const MARKETPLACE_SYNTHETIC_NOTICE =
  "This marketplace runs on synthetic demonstration data. Listings do not represent real availability, real clinicians, or real bookable services.";
