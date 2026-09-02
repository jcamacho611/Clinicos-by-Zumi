/**
 * Klinikos GRID Marketplace — Black Label spatial discovery materials.
 *
 * Public discovery consumes the same active Marble / Obsidian material authority as the
 * rest of Klinikos instead of forcing a route-owned paper palette. Eligibility,
 * authorization, publication, privacy, payment, fulfillment, and transaction truth
 * remain deterministic and outside this presentation module.
 */

import { resolvePublicRoutePresentation } from "@/lib/screen-experience-route-presentation";

export function isMarketplaceSurface(route: string) {
  return resolvePublicRoutePresentation(route)?.projection === "grid-discovery";
}

export const marketplacePalette = {
  ground: "var(--k-public-bg)",
  surface: "var(--k-public-surface)",
  ink: "var(--k-text)",
  inkMuted: "var(--k-muted)",
  line: "var(--k-line)",
  lineStrong: "var(--k-line)",
  signal: "var(--k-accent)",
  rose: "var(--k-accent)",
  gold: "var(--k-premium)",
  verified: "var(--k-accent)",
  pending: "var(--k-premium)",
} as const;

export const marketplaceSurfaces = {
  /* Retained for listing detail until that still-hard-coded Marble route is migrated. */
  page: "grid-marble-surface min-h-screen bg-[var(--k-work-bg)] text-[var(--k-text)]",
  /* Browse is fully semantic and therefore follows the shared appearance preference. */
  browsePage: "min-h-screen bg-[var(--k-public-bg)] text-[var(--k-text)]",
  card: "border border-[var(--k-line)] bg-[var(--k-public-surface)]",
  cardInteractive:
    "border border-[var(--k-line)] bg-[var(--k-public-surface)] transition-[border-color,background-color] duration-200 hover:border-[var(--k-accent)] focus-within:border-[var(--k-accent)]",
  filterBar: "sticky top-[72px] z-30 border-b border-[var(--k-line)] bg-[var(--k-public-surface)] backdrop-blur-xl",
  chip: "min-h-[44px] rounded-full border px-3.5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-accent)]",
  chipIdle: "border-[var(--k-line)] bg-[var(--k-public-surface)] text-[var(--k-muted)] hover:text-[var(--k-text)]",
  chipActive: "border-[var(--k-accent)] bg-[var(--k-public-raised)] text-[var(--k-text)]",
  controlIdle: "border-[var(--k-line)] bg-[var(--k-public-surface)] text-[var(--k-muted)] hover:text-[var(--k-text)]",
  controlActive: "border-[var(--k-text)] bg-[var(--k-text)] text-[var(--k-public-surface)]",
  statusVerified: "border-[var(--k-accent)] bg-[var(--k-public-raised)] text-[var(--k-accent)]",
  statusAttention: "border-[var(--k-premium)] bg-[var(--k-public-raised)] text-[var(--k-text)]",
  eyebrow: "text-xs font-extrabold uppercase tracking-[.16em] text-[var(--k-accent)]",
  headline: "font-semibold tracking-[-.05em] text-[var(--k-text)]",
  meta: "text-xs leading-5 text-[var(--k-muted)]",
} as const;

export const LISTING_NOT_VERIFICATION_NOTICE =
  "A listing is not a Klinikos endorsement. Credential and malpractice verification is a separate human review, and its current state is shown on every profile.";

export const MARKETPLACE_SYNTHETIC_NOTICE =
  "This marketplace runs on synthetic demonstration data. Listings do not represent real availability, real clinicians, or real bookable services.";
