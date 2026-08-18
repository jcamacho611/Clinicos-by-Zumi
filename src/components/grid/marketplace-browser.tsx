"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeCheck, Clock, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { marketplaceSurfaces } from "@/lib/design/marketplace-system";
import {
  activeFilterCount,
  applyMarketplaceFilters,
  availabilitySummary,
  buildFacets,
  emptyMarketplaceFilters,
  formatPriceRange,
  marketplaceSorts,
  presentVerification,
  settingLabel,
  weekdayLabels,
  type MarketplaceFilters,
  type MarketplaceListing,
  type MarketplaceSort,
} from "@/lib/grid/marketplace-rules";

const toneClass = {
  verified: "border-[#17745f]/28 bg-[#17745f]/[.07] text-[#17745f]",
  pending: "border-[#a55a22]/28 bg-[#a55a22]/[.07] text-[#8a481b]",
} as const;

const sortLabels: Record<MarketplaceSort, string> = {
  recommended: "Recommended",
  price_low: "Price: low to high",
  price_high: "Price: high to low",
  soonest: "Soonest available",
};

function ListingCard({ listing }: { listing: MarketplaceListing }) {
  const verification = presentVerification(listing.provider);

  return (
    <li className="relative">
      <article className={`${marketplaceSurfaces.cardInteractive} h-full rounded-[18px] p-5`}>
        <div className="min-w-0">
          <h3 className="text-base font-extrabold tracking-[-.02em] text-[#241517]">
            <Link className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8474e]" href={`/grid/browse/${listing.id}`}>
              <span aria-hidden="true" className="absolute inset-0" />
              {listing.serviceName}
            </Link>
          </h3>
          <p className="mt-1 truncate text-[13px] font-semibold text-[#756461]">{listing.provider.displayName} · {listing.provider.providerType}</p>
        </div>

        {/* Hard readiness/trust information precedes commercial price. A shopper
            should never become price-anchored before seeing whether the professional
            is actually in a verified or still-pending state. */}
        <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${toneClass[verification.tone]}`}><BadgeCheck aria-hidden="true" className="size-3.5" />{verification.label}</p>

        <p className="mt-3 line-clamp-2 text-[13px] leading-6 text-[#756461]">{listing.description}</p>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {listing.settings.map((setting) => <li className="rounded-full border border-[#e8ded9] px-2.5 py-1 text-[11px] font-semibold text-[#756461]" key={setting}>{settingLabel(setting)}</li>)}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e8ded9] pt-4 text-[12px]">
          <span className="flex items-center gap-1.5 font-semibold text-[#241517]"><Clock aria-hidden="true" className="size-3.5 text-[#756461]" />{availabilitySummary(listing)}</span>
          {listing.states.length > 0 && <span className="flex items-center gap-1.5 text-[#756461]"><MapPin aria-hidden="true" className="size-3.5" />{listing.states.join(", ")}</span>}
        </div>

        <div className="mt-4 flex items-end justify-between gap-4 border-t border-[#e8ded9] pt-4">
          <span className="text-[9px] font-extrabold uppercase tracking-[.13em] text-[#9b8883]">Terms / rate</span>
          <p className="text-right text-base font-extrabold tracking-[-.02em] text-[#241517]">{formatPriceRange(listing.priceLowCents, listing.priceHighCents)}</p>
        </div>
      </article>
    </li>
  );
}

export function MarketplaceBrowser({
  listings,
  initialQuery = "",
  initialWeekdays = [],
}: {
  listings: MarketplaceListing[];
  initialQuery?: string;
  initialWeekdays?: number[];
}) {
  const [filters, setFilters] = useState<MarketplaceFilters>(() => ({
    ...emptyMarketplaceFilters,
    q: initialQuery,
    weekdays: [...new Set(initialWeekdays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))],
  }));
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(() => applyMarketplaceFilters(listings, filters), [listings, filters]);
  const facets = useMemo(() => buildFacets(listings, filters), [listings, filters]);
  const activeCount = activeFilterCount(filters);

  function update<K extends keyof MarketplaceFilters>(key: K, value: MarketplaceFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function toggleIn<T>(key: keyof MarketplaceFilters, list: T[], value: T) {
    const next = list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
    setFilters((current) => ({ ...current, [key]: next }));
  }

  return (
    <>
      <div className={marketplaceSurfaces.filterBar}>
        <div className="mx-auto max-w-[1500px] px-5 py-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#756461]" />
              <input
                aria-label="Search Grid listings"
                className="h-11 w-full rounded-full border border-[#e8ded9] bg-[#fffdf9] pl-10 pr-3 text-sm text-[#241517] placeholder:text-[#8f7c77] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8474e]"
                onChange={(event) => update("q", event.target.value)}
                placeholder="Search work, providers, services, specialties, or areas…"
                type="search"
                value={filters.q}
              />
            </div>

            <button aria-expanded={showFilters} className={`${marketplaceSurfaces.chip} ${activeCount ? marketplaceSurfaces.chipActive : marketplaceSurfaces.chipIdle} flex items-center gap-2`} onClick={() => setShowFilters((current) => !current)} type="button"><SlidersHorizontal aria-hidden="true" className="size-4" />Filters{activeCount ? ` · ${activeCount}` : ""}</button>

            <label className="flex items-center gap-2 text-[12px] font-semibold text-[#756461]">
              <span className="sr-only sm:not-sr-only">Sort</span>
              <select className="h-11 rounded-full border border-[#e8ded9] bg-[#fffdf9] px-3 text-sm text-[#241517] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8474e]" onChange={(event) => update("sort", event.target.value as MarketplaceSort)} value={filters.sort}>
                {marketplaceSorts.map((sort) => <option key={sort} value={sort}>{sortLabels[sort]}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <button className={`${marketplaceSurfaces.chip} ${filters.verifiedOnly ? marketplaceSurfaces.chipActive : marketplaceSurfaces.chipIdle}`} onClick={() => update("verifiedOnly", !filters.verifiedOnly)} type="button" aria-pressed={filters.verifiedOnly}>Verified only</button>
            <button className={`${marketplaceSurfaces.chip} ${filters.onCallOnly ? marketplaceSurfaces.chipActive : marketplaceSurfaces.chipIdle}`} onClick={() => update("onCallOnly", !filters.onCallOnly)} type="button" aria-pressed={filters.onCallOnly}>Available now</button>
            {facets.settings.filter((facet) => facet.count > 0).map((facet) => <button aria-pressed={filters.settings.includes(facet.value)} className={`${marketplaceSurfaces.chip} ${filters.settings.includes(facet.value) ? marketplaceSurfaces.chipActive : marketplaceSurfaces.chipIdle}`} key={facet.value} onClick={() => toggleIn("settings", filters.settings, facet.value)} type="button">{settingLabel(facet.value)} <span className="text-[#8f7c77]">({facet.count})</span></button>)}
            {activeCount > 0 && <button className={`${marketplaceSurfaces.chip} ${marketplaceSurfaces.chipIdle} flex items-center gap-1.5`} onClick={() => setFilters(emptyMarketplaceFilters)} type="button"><X aria-hidden="true" className="size-3.5" /> Clear all</button>}
          </div>

          {showFilters && (
            <div className="mt-4 grid gap-5 border-t border-[#e8ded9] pt-4 sm:grid-cols-3">
              <fieldset><legend className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#756461]">Category</legend><div className="mt-2 flex flex-wrap gap-1.5">{facets.categories.filter((facet) => facet.count > 0).map((facet) => <button aria-pressed={filters.category === facet.value} className={`${marketplaceSurfaces.chip} ${filters.category === facet.value ? marketplaceSurfaces.chipActive : marketplaceSurfaces.chipIdle}`} key={facet.value} onClick={() => update("category", filters.category === facet.value ? "" : facet.value)} type="button">{facet.value} <span className="text-[#8f7c77]">({facet.count})</span></button>)}</div></fieldset>
              <fieldset><legend className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#756461]">Available on</legend><div className="mt-2 flex flex-wrap gap-1.5">{facets.weekdays.map((facet) => <button aria-pressed={filters.weekdays.includes(facet.value)} className={`${marketplaceSurfaces.chip} ${filters.weekdays.includes(facet.value) ? marketplaceSurfaces.chipActive : marketplaceSurfaces.chipIdle} disabled:opacity-40`} disabled={facet.count === 0} key={facet.value} onClick={() => toggleIn("weekdays", filters.weekdays, facet.value)} type="button">{weekdayLabels[facet.value]}</button>)}</div></fieldset>
              <fieldset><legend className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#756461]">State</legend><div className="mt-2 flex flex-wrap gap-1.5">{facets.states.filter((facet) => facet.count > 0).map((facet) => <button aria-pressed={filters.state === facet.value} className={`${marketplaceSurfaces.chip} ${filters.state === facet.value ? marketplaceSurfaces.chipActive : marketplaceSurfaces.chipIdle}`} key={facet.value} onClick={() => update("state", filters.state === facet.value ? "" : facet.value)} type="button">{facet.value} <span className="text-[#8f7c77]">({facet.count})</span></button>)}</div></fieldset>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
        <p aria-live="polite" className="text-[13px] font-semibold text-[#756461]">{results.length} {results.length === 1 ? "listing" : "listings"}{activeCount > 0 ? " matching your filters" : " available"}</p>
        {results.length ? <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{results.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</ul> : <div className="mt-5 rounded-[18px] border border-dashed border-[#d7c7c1] bg-[#fffdf9] px-6 py-16 text-center"><p className="text-sm font-extrabold text-[#241517]">{listings.length === 0 ? "Nothing is published in this lane yet" : "Nothing matches those filters"}</p><p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-[#756461]">{listings.length === 0 ? "Grid surfaces inventory only after the underlying participant or resource is ready to be published." : "Try clearing a filter, widening the days, or changing your Grid goal."}</p>{activeCount > 0 && <button className={`${marketplaceSurfaces.chip} ${marketplaceSurfaces.chipIdle} mt-5 inline-flex`} onClick={() => setFilters(emptyMarketplaceFilters)} type="button">Clear all filters</button>}</div>}
      </div>
    </>
  );
}
