import { z } from "zod";
import { gridLocationTypes } from "@/lib/grid-rules";
import { gridSearchTerms, matchesGridSearchTerms } from "@/lib/grid/intent-rules";

/**
 * GRID marketplace discovery rules.
 *
 * Pure module: filtering, faceting, ranking, and the labels that keep a bright
 * consumer surface from implying endorsement. No database, no network.
 *
 * The whole point of the discovery surface is that a buyer forms a shortlist in
 * seconds, so everything here is designed to run instantly on an already-fetched
 * result set rather than round-tripping per keystroke.
 */

export const marketplaceWorkSettings = ["clinic_location", "chair_rental", "mobile", "at_home"] as const;
export type MarketplaceWorkSetting = (typeof marketplaceWorkSettings)[number];

export const marketplaceSorts = ["recommended", "price_low", "price_high", "soonest"] as const;
export type MarketplaceSort = (typeof marketplaceSorts)[number];

export const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * Verification state, presented to a buyer.
 *
 * Deliberately three states rather than a boolean badge. "Not yet verified" must be
 * legible as a real state on the card, not an absence a buyer can miss — a bright
 * marketplace makes it very easy to read silence as approval.
 */
export const verificationPresentations = {
  verified: {
    key: "verified" as const,
    label: "Credentials verified",
    detail: "A Klinikos reviewer has verified this provider's licence and malpractice evidence.",
    tone: "verified" as const,
  },
  in_review: {
    key: "in_review" as const,
    label: "Verification in review",
    detail: "Evidence has been submitted and is awaiting human review. This provider cannot accept work yet.",
    tone: "pending" as const,
  },
  unverified: {
    key: "unverified" as const,
    label: "Not yet verified",
    detail: "This listing has not completed Klinikos credential review. A listing is not an endorsement.",
    tone: "pending" as const,
  },
};

export type VerificationPresentation = (typeof verificationPresentations)[keyof typeof verificationPresentations];

/**
 * Both gates must pass to read as verified. A provider whose licence is verified but
 * whose malpractice evidence is not has not completed review, and the card must not
 * round that up.
 */
export function presentVerification(input: { verificationStatus: string; malpracticeVerificationStatus: string }): VerificationPresentation {
  if (input.verificationStatus === "verified" && input.malpracticeVerificationStatus === "verified") {
    return verificationPresentations.verified;
  }

  // "In review" must mean a human is actually reviewing something. `malpractice:
  // pending` is the column default, so a provider who has never submitted anything
  // carries it — reading that as "in review" would flatter an untouched draft into
  // looking like work in progress.
  const submitted = input.verificationStatus === "submitted" || input.verificationStatus === "needs_review";
  const partiallyVerified = input.verificationStatus === "verified" && input.malpracticeVerificationStatus === "pending";
  if (submitted || partiallyVerified) return verificationPresentations.in_review;

  return verificationPresentations.unverified;
}

/** Whether a provider may actually receive a request right now. */
export function canReceiveRequests(input: { verificationStatus: string; malpracticeVerificationStatus: string }) {
  return presentVerification(input).key === "verified";
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export const marketplaceFilterSchema = z.object({
  q: z.string().trim().max(120).default(""),
  category: z.string().trim().max(80).default(""),
  settings: z.array(z.enum(marketplaceWorkSettings)).default([]),
  weekdays: z.array(z.number().int().min(0).max(6)).default([]),
  state: z.string().trim().max(40).default(""),
  maxPriceCents: z.number().int().min(0).max(100_000_000).nullable().default(null),
  verifiedOnly: z.boolean().default(false),
  onCallOnly: z.boolean().default(false),
  sort: z.enum(marketplaceSorts).default("recommended"),
});

export type MarketplaceFilters = z.infer<typeof marketplaceFilterSchema>;

export const emptyMarketplaceFilters: MarketplaceFilters = marketplaceFilterSchema.parse({});

export type MarketplaceListing = {
  id: string;
  serviceName: string;
  category: string;
  description: string;
  priceLowCents: number;
  priceHighCents: number;
  requiresDeposit: boolean;
  requiresConsent: boolean;
  requiresMedicalReview: boolean;
  settings: MarketplaceWorkSetting[];
  provider: {
    id: string;
    displayName: string;
    providerType: string;
    specialty: string | null;
    experienceLevel: string;
    servicesOffered: string[];
    travelRadiusMiles: number;
    onCallNow: boolean;
    verificationStatus: string;
    malpracticeVerificationStatus: string;
  };
  /** Weekdays this provider has an active availability window. */
  availableWeekdays: number[];
  /** Soonest weekday offset from today, or null when nothing is published. */
  nextAvailableInDays: number | null;
  serviceAreas: string[];
  states: string[];
};

function matchesText(listing: MarketplaceListing, term: string) {
  return matchesGridSearchTerms([
    listing.serviceName,
    listing.category,
    listing.description,
    listing.provider.displayName,
    listing.provider.providerType,
    listing.provider.specialty,
    ...listing.provider.servicesOffered,
    ...listing.serviceAreas,
    ...listing.states,
  ], gridSearchTerms(term));
}

export function filterListings(listings: MarketplaceListing[], filters: MarketplaceFilters): MarketplaceListing[] {
  return listings.filter((listing) => {
    if (!matchesText(listing, filters.q)) return false;
    if (filters.category && listing.category !== filters.category) return false;
    if (filters.settings.length && !filters.settings.some((setting) => listing.settings.includes(setting))) return false;
    if (filters.weekdays.length && !filters.weekdays.some((day) => listing.availableWeekdays.includes(day))) return false;
    if (filters.state && !listing.states.includes(filters.state)) return false;
    // Compare against the low end: a range that starts under budget is still worth showing.
    if (filters.maxPriceCents !== null && listing.priceLowCents > filters.maxPriceCents) return false;
    if (filters.verifiedOnly && !canReceiveRequests(listing.provider)) return false;
    if (filters.onCallOnly && !listing.provider.onCallNow) return false;
    return true;
  });
}

const experienceWeight: Record<string, number> = {
  "OG / Master Provider": 3,
  Experienced: 2,
  Intermediate: 1,
  Entry: 0,
};

/**
 * Recommended ordering.
 *
 * Verified providers rank above unverified ones because only they can actually
 * accept work — surfacing a listing a buyer cannot book is the fastest way to make
 * a marketplace feel broken. Availability then experience break ties.
 */
export function sortListings(listings: MarketplaceListing[], sort: MarketplaceSort): MarketplaceListing[] {
  const sorted = [...listings];

  switch (sort) {
    case "price_low":
      return sorted.sort((a, b) => a.priceLowCents - b.priceLowCents);
    case "price_high":
      return sorted.sort((a, b) => b.priceHighCents - a.priceHighCents);
    case "soonest":
      return sorted.sort((a, b) => (a.nextAvailableInDays ?? 99) - (b.nextAvailableInDays ?? 99));
    case "recommended":
    default:
      return sorted.sort((a, b) => {
        const verified = Number(canReceiveRequests(b.provider)) - Number(canReceiveRequests(a.provider));
        if (verified !== 0) return verified;
        const onCall = Number(b.provider.onCallNow) - Number(a.provider.onCallNow);
        if (onCall !== 0) return onCall;
        const availability = (a.nextAvailableInDays ?? 99) - (b.nextAvailableInDays ?? 99);
        if (availability !== 0) return availability;
        return (experienceWeight[b.provider.experienceLevel] ?? 0) - (experienceWeight[a.provider.experienceLevel] ?? 0);
      });
  }
}

export function applyMarketplaceFilters(listings: MarketplaceListing[], filters: MarketplaceFilters) {
  return sortListings(filterListings(listings, filters), filters.sort);
}

/**
 * Facet counts.
 *
 * Counted against the results of *every other* filter, so a facet never shows a
 * count that would produce an empty page when clicked.
 */
export function buildFacets(listings: MarketplaceListing[], filters: MarketplaceFilters) {
  const countFor = <T extends string | number>(
    key: keyof MarketplaceFilters,
    values: T[],
    predicate: (listing: MarketplaceListing, value: T) => boolean,
  ) => {
    const base = filterListings(listings, { ...filters, [key]: emptyMarketplaceFilters[key] } as MarketplaceFilters);
    return values.map((value) => ({ value, count: base.filter((listing) => predicate(listing, value)).length }));
  };

  const categories = [...new Set(listings.map((listing) => listing.category))].sort();
  const states = [...new Set(listings.flatMap((listing) => listing.states))].sort();

  return {
    categories: countFor("category", categories, (listing, value) => listing.category === value),
    settings: countFor("settings", [...marketplaceWorkSettings], (listing, value) => listing.settings.includes(value)),
    weekdays: countFor("weekdays", [0, 1, 2, 3, 4, 5, 6], (listing, value) => listing.availableWeekdays.includes(value)),
    states: countFor("state", states, (listing, value) => listing.states.includes(value)),
  };
}

export function activeFilterCount(filters: MarketplaceFilters) {
  return [
    filters.q !== "",
    filters.category !== "",
    filters.settings.length > 0,
    filters.weekdays.length > 0,
    filters.state !== "",
    filters.maxPriceCents !== null,
    filters.verifiedOnly,
    filters.onCallOnly,
  ].filter(Boolean).length;
}

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

export function formatPriceRange(lowCents: number, highCents: number) {
  const money = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
  return lowCents === highCents ? money(lowCents) : `${money(lowCents)} – ${money(highCents)}`;
}

const settingLabels: Record<MarketplaceWorkSetting, string> = {
  clinic_location: "At a clinic",
  chair_rental: "Chair rental",
  mobile: "Mobile",
  at_home: "At home",
};

export function settingLabel(setting: MarketplaceWorkSetting) {
  return settingLabels[setting];
}

/** Plain-language availability, phrased for a buyer scanning a card. */
export function availabilitySummary(listing: MarketplaceListing) {
  if (listing.provider.onCallNow) return "On call now";
  if (listing.nextAvailableInDays === null) return "No published availability";
  if (listing.nextAvailableInDays === 0) return "Available today";
  if (listing.nextAvailableInDays === 1) return "Available tomorrow";
  return `Available in ${listing.nextAvailableInDays} days`;
}

/**
 * Soonest availability as a day offset.
 *
 * Exported so the repository and the tests agree on one definition rather than each
 * computing "next available" their own way.
 */
export function nextAvailableInDays(availableWeekdays: number[], today: number) {
  if (!availableWeekdays.length) return null;
  return Math.min(...availableWeekdays.map((day) => (day - today + 7) % 7));
}

export const marketplaceLocationTypes = gridLocationTypes;
