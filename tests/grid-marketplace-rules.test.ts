import { describe, expect, it } from "vitest";
import { isMarketplaceSurface, MARKETPLACE_EXCEPTION_SCOPE } from "@/lib/design/marketplace-system";
import {
  activeFilterCount,
  applyMarketplaceFilters,
  availabilitySummary,
  buildFacets,
  canReceiveRequests,
  emptyMarketplaceFilters,
  filterListings,
  formatPriceRange,
  marketplaceFilterSchema,
  nextAvailableInDays,
  presentVerification,
  sortListings,
  type MarketplaceListing,
} from "@/lib/grid/marketplace-rules";

function listing(overrides: Partial<MarketplaceListing> & { id: string }): MarketplaceListing {
  return {
    serviceName: "Lip filler consultation",
    category: "Injectables",
    description: "A synthetic demonstration listing.",
    priceLowCents: 30_000,
    priceHighCents: 60_000,
    requiresDeposit: false,
    requiresConsent: true,
    requiresMedicalReview: false,
    settings: ["clinic_location"],
    availableWeekdays: [1, 3],
    nextAvailableInDays: 1,
    serviceAreas: ["Brooklyn"],
    states: ["NY"],
    ...overrides,
    provider: {
      id: `prov_${overrides.id}`,
      displayName: "Synthetic Provider",
      providerType: "Nurse Injector",
      specialty: "Aesthetics",
      experienceLevel: "Experienced",
      servicesOffered: ["Injectables"],
      travelRadiusMiles: 15,
      onCallNow: false,
      verificationStatus: "verified",
      malpracticeVerificationStatus: "verified",
      ...overrides.provider,
    },
  };
}

describe("verification presentation", () => {
  it("requires both licence and malpractice review to read as verified", () => {
    expect(presentVerification({ verificationStatus: "verified", malpracticeVerificationStatus: "verified" }).key).toBe("verified");
    // A half-complete review must never round up to verified on a public surface.
    expect(presentVerification({ verificationStatus: "verified", malpracticeVerificationStatus: "pending" }).key).toBe("in_review");
    expect(presentVerification({ verificationStatus: "draft", malpracticeVerificationStatus: "verified" }).key).toBe("unverified");
  });

  it("only lets a fully verified provider receive requests", () => {
    expect(canReceiveRequests({ verificationStatus: "verified", malpracticeVerificationStatus: "verified" })).toBe(true);
    expect(canReceiveRequests({ verificationStatus: "submitted", malpracticeVerificationStatus: "verified" })).toBe(false);
  });

  it("states plainly that a listing is not an endorsement", () => {
    expect(presentVerification({ verificationStatus: "draft", malpracticeVerificationStatus: "pending" }).detail.toLowerCase())
      .toContain("not an endorsement");
  });
});

describe("marketplace filtering", () => {
  const listings = [
    listing({
      id: "a", category: "Injectables", priceLowCents: 20_000, settings: ["mobile"],
      availableWeekdays: [1], states: ["NY"], serviceAreas: ["Brooklyn"],
      provider: { servicesOffered: ["Injectables"] } as MarketplaceListing["provider"],
    }),
    listing({
      id: "b", category: "IV Therapy", priceLowCents: 50_000, settings: ["clinic_location"],
      availableWeekdays: [5], states: ["NJ"], serviceAreas: ["Newark"],
      provider: { servicesOffered: ["IV Therapy"] } as MarketplaceListing["provider"],
    }),
    listing({
      id: "c",
      category: "Injectables",
      priceLowCents: 80_000,
      settings: ["chair_rental"],
      availableWeekdays: [2],
      states: ["NY"],
      serviceAreas: ["Queens"],
      provider: {
        servicesOffered: ["Injectables"],
        verificationStatus: "draft",
        malpracticeVerificationStatus: "pending",
      } as MarketplaceListing["provider"],
    }),
  ];

  it("returns everything when no filter is set", () => {
    expect(filterListings(listings, emptyMarketplaceFilters)).toHaveLength(3);
  });

  it("narrows on every word of a search rather than widening", () => {
    const single = filterListings(listings, { ...emptyMarketplaceFilters, q: "injectables" });
    expect(single.map((entry) => entry.id)).toEqual(["a", "c"]);
    // Adding a second word narrows to the one listing matching both.
    const both = filterListings(listings, { ...emptyMarketplaceFilters, q: "injectables brooklyn" });
    expect(both.map((entry) => entry.id)).toEqual(["a"]);
    expect(filterListings(listings, { ...emptyMarketplaceFilters, q: "injectables nonsense" })).toHaveLength(0);
  });

  it("treats a price ceiling as matching ranges that start under it", () => {
    // A $200–$600 service is still worth showing to someone with a $300 ceiling.
    expect(filterListings(listings, { ...emptyMarketplaceFilters, maxPriceCents: 30_000 }).map((entry) => entry.id)).toEqual(["a"]);
  });

  it("treats work settings as any-of, not all-of", () => {
    const result = filterListings(listings, { ...emptyMarketplaceFilters, settings: ["mobile", "chair_rental"] });
    expect(result.map((entry) => entry.id)).toEqual(["a", "c"]);
  });

  it("hides unverified providers when verified-only is on", () => {
    expect(filterListings(listings, { ...emptyMarketplaceFilters, verifiedOnly: true }).map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("filters by weekday and state", () => {
    expect(filterListings(listings, { ...emptyMarketplaceFilters, weekdays: [5] }).map((entry) => entry.id)).toEqual(["b"]);
    expect(filterListings(listings, { ...emptyMarketplaceFilters, state: "NY" }).map((entry) => entry.id)).toEqual(["a", "c"]);
  });

  it("counts active filters for the interface badge", () => {
    expect(activeFilterCount(emptyMarketplaceFilters)).toBe(0);
    expect(activeFilterCount({ ...emptyMarketplaceFilters, q: "rn", verifiedOnly: true, state: "NY" })).toBe(3);
  });
});

describe("facet counts", () => {
  const listings = [
    listing({ id: "a", category: "Injectables", states: ["NY"] }),
    listing({ id: "b", category: "IV Therapy", states: ["NJ"] }),
  ];

  it("never advertises a facet count that would produce an empty page", () => {
    // Category counts must ignore the category filter itself, or selecting the
    // other category would show a count of zero results.
    const facets = buildFacets(listings, { ...emptyMarketplaceFilters, category: "Injectables" });
    const ivTherapy = facets.categories.find((facet) => facet.value === "IV Therapy");
    expect(ivTherapy?.count).toBe(1);
  });

  it("still respects the other active filters", () => {
    const facets = buildFacets(listings, { ...emptyMarketplaceFilters, state: "NY" });
    expect(facets.categories.find((facet) => facet.value === "IV Therapy")?.count).toBe(0);
  });
});

describe("ranking", () => {
  it("puts bookable providers above ones a buyer cannot request", () => {
    const unverified = listing({
      id: "unverified",
      provider: { verificationStatus: "draft", malpracticeVerificationStatus: "pending" } as MarketplaceListing["provider"],
    });
    const verified = listing({ id: "verified" });
    const sorted = sortListings([unverified, verified], "recommended");
    expect(sorted[0].id).toBe("verified");
  });

  it("sorts by price in both directions", () => {
    const cheap = listing({ id: "cheap", priceLowCents: 10_000, priceHighCents: 20_000 });
    const dear = listing({ id: "dear", priceLowCents: 90_000, priceHighCents: 120_000 });
    expect(sortListings([dear, cheap], "price_low")[0].id).toBe("cheap");
    expect(sortListings([cheap, dear], "price_high")[0].id).toBe("dear");
  });

  it("ranks unpublished availability last rather than first", () => {
    const none = listing({ id: "none", nextAvailableInDays: null });
    const soon = listing({ id: "soon", nextAvailableInDays: 2 });
    expect(sortListings([none, soon], "soonest")[0].id).toBe("soon");
  });

  it("filters and sorts together", () => {
    const results = applyMarketplaceFilters(
      [listing({ id: "a", priceLowCents: 90_000 }), listing({ id: "b", priceLowCents: 10_000 })],
      { ...emptyMarketplaceFilters, sort: "price_low" },
    );
    expect(results.map((entry) => entry.id)).toEqual(["b", "a"]);
  });
});

describe("availability presentation", () => {
  it("wraps to the following week rather than returning a negative offset", () => {
    // Today is Friday (5); the only slot is Monday (1) — three days out, not minus four.
    expect(nextAvailableInDays([1], 5)).toBe(3);
    expect(nextAvailableInDays([5], 5)).toBe(0);
    expect(nextAvailableInDays([], 3)).toBeNull();
  });

  it("phrases availability for a buyer scanning a card", () => {
    expect(availabilitySummary(listing({ id: "a", nextAvailableInDays: 0 }))).toBe("Available today");
    expect(availabilitySummary(listing({ id: "b", nextAvailableInDays: 1 }))).toBe("Available tomorrow");
    expect(availabilitySummary(listing({ id: "c", nextAvailableInDays: null }))).toBe("No published availability");
  });

  it("lets on-call override a scheduled window", () => {
    const onCall = listing({ id: "d", nextAvailableInDays: 4, provider: { onCallNow: true } as MarketplaceListing["provider"] });
    expect(availabilitySummary(onCall)).toBe("On call now");
  });

  it("collapses a flat price to a single figure", () => {
    expect(formatPriceRange(30_000, 30_000)).toBe("$300");
    expect(formatPriceRange(30_000, 60_000)).toBe("$300 – $600");
  });
});

describe("filter input validation", () => {
  it("accepts an empty query and rejects an unknown sort or setting", () => {
    expect(marketplaceFilterSchema.safeParse({}).success).toBe(true);
    expect(marketplaceFilterSchema.safeParse({ sort: "cheapest" }).success).toBe(false);
    expect(marketplaceFilterSchema.safeParse({ settings: ["teleport"] }).success).toBe(false);
    expect(marketplaceFilterSchema.safeParse({ weekdays: [9] }).success).toBe(false);
  });
});

describe("design law exception", () => {
  it("scopes the daylight surface to discovery only", () => {
    expect(isMarketplaceSurface("/grid/browse")).toBe(true);
    expect(isMarketplaceSurface("/grid/browse/listing_123")).toBe(true);
    // Operator, admin, and EDU surfaces stay on the dark command ground.
    expect(isMarketplaceSurface("/grid/requests")).toBe(false);
    expect(isMarketplaceSurface("/admin/grid")).toBe(false);
    expect(isMarketplaceSurface("/edu/dashboard")).toBe(false);
    expect(isMarketplaceSurface("/sales")).toBe(false);
  });

  it("keeps the exception list short enough to stay deliberate", () => {
    expect(MARKETPLACE_EXCEPTION_SCOPE.length).toBeLessThanOrEqual(2);
  });
});
