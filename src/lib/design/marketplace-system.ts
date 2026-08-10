/**
 * Klinikos GRID Marketplace — "Aegean daylight".
 *
 * A deliberate, documented exception to the dark command law in
 * `command-system.ts`, scoped to demand-side discovery only.
 *
 * Why the exception exists: command law is built for focus — a dark ground, one
 * dominant surface, an operator working a queue they already understand.
 * Discovery is the opposite task. Someone is scanning thirty options they have
 * never seen, comparing them, and forming a shortlist. That work wants air, light,
 * and density, which is why every marketplace people actually enjoy using is bright.
 *
 * What keeps it one product rather than two: typography, spacing rhythm, border
 * weights, and the gold and cyan accents are shared with command law. Only the
 * ground inverts.
 *
 * Scope of the exception — discovery surfaces only:
 *   /grid/browse, /grid/browse/[listingId]
 * Operator workspaces, admin queues, EDU, and every authenticated command surface
 * remain on the dark ground. Adding a route here is a deliberate act.
 */

export const MARKETPLACE_EXCEPTION_SCOPE = ["/grid/browse"] as const;

export function isMarketplaceSurface(route: string) {
  return MARKETPLACE_EXCEPTION_SCOPE.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));
}

/**
 * Daylight palette.
 *
 * Aegean blue and gold carry over from command law so the two grounds read as one
 * family. Cyan is intentionally absent: it means "Zumi is acting" and Zumi does not
 * act on the discovery surface, so using it here would dilute the signal.
 */
export const marketplacePalette = {
  ground: "#fbfbfc",
  surface: "#ffffff",
  ink: "#0b1220",
  inkMuted: "#5b6675",
  line: "#e6e9ee",
  lineStrong: "#cdd3dc",
  aegean: "#174ea6",
  gold: "#9a7a1f",
  verified: "#0f766e",
  pending: "#b45309",
} as const;

export const marketplaceSurfaces = {
  page: "min-h-screen bg-[#fbfbfc] text-[#0b1220]",
  card: "border border-[#e6e9ee] bg-white",
  /** Lift on hover only — no shadow at rest, so a dense grid stays calm. */
  cardInteractive:
    "border border-[#e6e9ee] bg-white transition hover:border-[#cdd3dc] hover:shadow-[0_12px_32px_rgba(11,18,32,.08)] focus-within:border-[#174ea6]",
  /** Sticky filter rail. Filters apply as you touch them; nothing is submitted. */
  filterBar: "sticky top-0 z-30 border-b border-[#e6e9ee] bg-white/90 backdrop-blur",
  chip: "min-h-[44px] border px-3.5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174ea6]",
  chipIdle: "border-[#e6e9ee] bg-white text-[#5b6675] hover:border-[#cdd3dc] hover:text-[#0b1220]",
  chipActive: "border-[#174ea6] bg-[#174ea6]/[.06] text-[#0b1220]",
  eyebrow: "text-[11px] font-extrabold uppercase tracking-[.16em] text-[#9a7a1f]",
  headline: "font-extrabold tracking-[-.05em] text-[#0b1220]",
  meta: "text-[12px] leading-5 text-[#5b6675]",
} as const;

/**
 * The one claim this surface must never make.
 *
 * A marketplace listing is a listing. Klinikos verification is a separate,
 * human-reviewed state, and a bright consumer surface makes it *easier* to imply
 * endorsement, so the disclaimer is mandatory on every card and every profile
 * rather than tucked into a footer.
 */
export const LISTING_NOT_VERIFICATION_NOTICE =
  "A listing is not a Klinikos endorsement. Credential and malpractice verification is a separate human review, and its current state is shown on every profile.";

export const MARKETPLACE_SYNTHETIC_NOTICE =
  "This marketplace runs on synthetic demonstration data. Listings do not represent real availability, real clinicians, or real bookable services.";
