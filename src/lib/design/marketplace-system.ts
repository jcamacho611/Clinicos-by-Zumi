/**
 * Klinikos GRID Marketplace — premium paper discovery mode.
 *
 * Discovery remains intentionally light because comparison work benefits from air,
 * legibility, and density. The exception no longer uses the older Aegean-blue visual
 * identity: paper white, warm ink, black cherry, rose signal, and restrained gold now
 * connect Grid discovery to the current Klinikos brand while preserving a true light
 * presentation for users who prefer it.
 *
 * This is a presentation exception only. Eligibility, authorization, publication,
 * privacy, payment, fulfillment, and transaction truth remain deterministic.
 */

export const MARKETPLACE_EXCEPTION_SCOPE = ["/grid/browse"] as const;

export function isMarketplaceSurface(route: string) {
  return MARKETPLACE_EXCEPTION_SCOPE.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));
}

export const marketplacePalette = {
  ground: "#f7f3ef",
  surface: "#fffdf9",
  ink: "#241517",
  inkMuted: "#756461",
  line: "#e8ded9",
  lineStrong: "#d7c7c1",
  signal: "#a8474e",
  rose: "#d47d77",
  gold: "#9b7c45",
  verified: "#17745f",
  pending: "#a55a22",
} as const;

export const marketplaceSurfaces = {
  /* `grid-marble-surface` declares this a light surface so the legacy dark-theme
     conversion leaves it alone. Without it the layer remapped authored colours that
     were correct for a light page — text-[#5b6675] became a pale rose on cream at
     2.26:1 — while the page's own backgrounds stayed light. The class supplies the
     background and base text colour; a bg-* utility alongside it only re-opens the
     specificity fight the layer already loses badly. */
  page: "grid-marble-surface min-h-screen",
  card: "border border-[#e8ded9] bg-[#fffdf9]",
  cardInteractive:
    "border border-[#e8ded9] bg-[#fffdf9] transition-[border-color,background-color] duration-200 hover:border-[#a8474e]/45 hover:bg-white focus-within:border-[#a8474e]",
  filterBar: "sticky top-0 z-30 border-b border-[#e8ded9] bg-[#fffdf9]/92 backdrop-blur",
  chip: "min-h-[44px] rounded-full border px-3.5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8474e]",
  chipIdle: "border-[#e8ded9] bg-[#fffdf9] text-[#756461] hover:border-[#d7c7c1] hover:text-[#241517]",
  chipActive: "border-[#a8474e] bg-[#a8474e]/[.07] text-[#241517]",
  eyebrow: "text-[11px] font-extrabold uppercase tracking-[.16em] text-[#a8474e]",
  headline: "font-semibold tracking-[-.05em] text-[#241517]",
  meta: "text-[12px] leading-5 text-[#756461]",
} as const;

export const LISTING_NOT_VERIFICATION_NOTICE =
  "A listing is not a Klinikos endorsement. Credential and malpractice verification is a separate human review, and its current state is shown on every profile.";

export const MARKETPLACE_SYNTHETIC_NOTICE =
  "This marketplace runs on synthetic demonstration data. Listings do not represent real availability, real clinicians, or real bookable services.";
