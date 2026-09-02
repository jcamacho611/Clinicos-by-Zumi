"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Clock, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
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
  verified: marketplaceSurfaces.statusVerified,
  pending: marketplaceSurfaces.statusAttention,
} as const;

const sortLabels: Record<MarketplaceSort, string> = {
  recommended: "Recommended",
  price_low: "Price: low to high",
  price_high: "Price: high to low",
  soonest: "Soonest available",
};

function ListingRow({ listing }: { listing: MarketplaceListing }) {
  const verification = presentVerification(listing.provider);

  return (
    <li data-grid-ledger-row="service" className="group relative border-b border-[var(--k-line)] last:border-b-0">
      <article className="grid gap-5 px-4 py-5 transition-colors hover:bg-[var(--k-public-raised)] sm:px-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(150px,.52fr)_minmax(185px,.64fr)_minmax(140px,.44fr)] lg:items-center lg:gap-6 lg:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3 className="min-w-0 text-base font-extrabold tracking-[-.025em] text-[var(--k-text)]">
              <Link className="inline-flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--k-accent)]" href={`/grid/browse/${listing.id}`}>
                {listing.serviceName}<ArrowRight aria-hidden="true" className="size-3.5 text-[var(--k-accent)] opacity-70 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </h3>
            <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-bold ${toneClass[verification.tone]}`}><BadgeCheck aria-hidden="true" className="size-3.5" />{verification.label}</span>
          </div>
          <p className="mt-1 text-[13px] font-semibold text-[var(--k-muted)]">{listing.provider.displayName} · {listing.provider.providerType}</p>
          <p className="mt-3 line-clamp-2 max-w-2xl text-[13px] leading-6 text-[var(--k-muted)]">{listing.description}</p>
          {listing.settings.length > 0 && <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-[var(--k-muted)]">{listing.settings.map((setting) => <li key={setting}>{settingLabel(setting)}</li>)}</ul>}
        </div>

        {/* Trust/readiness stays ahead of commercial terms. */}
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.13em] text-[var(--k-muted)]">Readiness</p>
          <p className="mt-2 text-sm font-bold text-[var(--k-text)]">{verification.label}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--k-muted)]">Human review state shown before rate.</p>
        </div>

        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.13em] text-[var(--k-muted)]">Availability</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--k-text)]"><Clock aria-hidden="true" className="size-3.5 text-[var(--k-accent)]" />{availabilitySummary(listing)}</p>
          {listing.states.length > 0 && <p className="mt-2 flex items-center gap-1.5 text-xs leading-5 text-[var(--k-muted)]"><MapPin aria-hidden="true" className="size-3.5" />{listing.states.join(", ")}</p>}
        </div>

        <div className="lg:text-right">
          <p className="text-xs font-extrabold uppercase tracking-[.13em] text-[var(--k-muted)]">Terms / rate</p>
          <p className="mt-2 text-base font-extrabold tabular-nums tracking-[-.02em] text-[var(--k-text)]">{formatPriceRange(listing.priceLowCents, listing.priceHighCents)}</p>
          <Link className="relative z-10 mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-extrabold text-[var(--k-accent)] underline decoration-[var(--k-accent)]/45 underline-offset-4" href={`/grid/browse/${listing.id}`}>Review <ArrowRight aria-hidden="true" className="size-3.5" /></Link>
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
    <section className="border-t border-[var(--k-line)] bg-[var(--k-public-bg)]" aria-labelledby="grid-service-ledger-title">
      <div className={marketplaceSurfaces.filterBar}>
        <div className="mx-auto max-w-[1500px] px-5 py-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--k-muted)]" />
              <input
                aria-label="Search Grid listings"
                className="h-11 w-full rounded-full border border-[var(--k-line)] bg-[var(--k-public-surface)] pl-10 pr-3 text-sm text-[var(--k-text)] placeholder:text-[var(--k-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-accent)]"
                onChange={(event) => update("q", event.target.value)}
                placeholder="Search work, providers, services, specialties, or areas…"
                type="search"
                value={filters.q}
              />
            </div>

            <button aria-expanded={showFilters} className={`${marketplaceSurfaces.chip} ${activeCount ? marketplaceSurfaces.chipActive : marketplaceSurfaces.chipIdle} flex items-center gap-2`} onClick={() => setShowFilters((current) => !current)} type="button"><SlidersHorizontal aria-hidden="true" className="size-4" />Filters{activeCount ? ` · ${activeCount}` : ""}</button>

            <label className="flex items-center gap-2 text-xs font-semibold text-[var(--k-muted)]">
              <span className="sr-only sm:not-sr-only">Sort</span>
              <select className="h-11 rounded-full border border-[var(--k-line)] bg-[var(--k-public-surface)] px-3 text-sm text-[var(--k-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-accent)]" onChange={(event) => update("sort", event.target.value as MarketplaceSort)} value={filters.sort}>
                {marketplaceSorts.map((sort) => <option key={sort} value={sort}>{sortLabels[sort]}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <button className={`${marketplaceSurfaces.chip} ${filters.verifiedOnly ? marketplaceSurfaces.chipActive : marketplaceSurfaces.chipIdle}`} onClick={() => update("verifiedOnly", !filters.verifiedOnly)} type="button" aria-pressed={filters.verifiedOnly}>Verified only</button>
            <button className={`${marketplaceSurfaces.chip} ${filters.onCallOnly ? marketplaceSurfaces.chipActive : marketplaceSurfaces.chipIdle}`} onClick={() => update("onCallOnly", !filters.onCallOnly)} type="button" aria-pressed={filters.onCallOnly}>Available now</button>
            {facets.settings.filter((facet) => facet.count > 0).map((facet) => <button aria-pressed={filters.settings.includes(facet.value)} className={`${marketplaceSurfaces.chip} ${filters.settings.includes(facet.value) ? marketplaceSurfaces.chipActive : marketplaceSurfaces.chipIdle}`} key={facet.value} onClick={() => toggleIn("settings", filters.settings, facet.value)} type="button">{settingLabel(facet.value)} <span className="text-[var(--k-muted)]">({facet.count})</span></button>)}
            {activeCount > 0 && <button className={`${marketplaceSurfaces.chip} ${marketplaceSurfaces.chipIdle} flex items-center gap-1.5`} onClick={() => setFilters(emptyMarketplaceFilters)} type="button"><X aria-hidden="true" className="size-3.5" /> Clear all</button>}
          </div>

          {showFilters && (
            <div className="mt-4 grid gap-5 border-t border-[var(--k-line)] pt-4 sm:grid-cols-3">
              <fieldset><legend className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--k-muted)]">Category</legend><div className="mt-2 flex flex-wrap gap-1.5">{facets.categories.filter((facet) => facet.count > 0).map((facet) => <button aria-pressed={filters.category === facet.value} className={`${marketplaceSurfaces.chip} ${filters.category === facet.value ? marketplaceSurfaces.chipActive : marketplaceSurfaces.chipIdle}`} key={facet.value} onClick={() => update("category", filters.category === facet.value ? "" : facet.value)} type="button">{facet.value} <span className="text-[var(--k-muted)]">({facet.count})</span></button>)}</div></fieldset>
              <fieldset><legend className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--k-muted)]">Available on</legend><div className="mt-2 flex flex-wrap gap-1.5">{facets.weekdays.map((facet) => <button aria-pressed={filters.weekdays.includes(facet.value)} className={`${marketplaceSurfaces.chip} ${filters.weekdays.includes(facet.value) ? marketplaceSurfaces.chipActive : marketplaceSurfaces.chipIdle} disabled:opacity-40`} disabled={facet.count === 0} key={facet.value} onClick={() => toggleIn("weekdays", filters.weekdays, facet.value)} type="button">{weekdayLabels[facet.value]}</button>)}</div></fieldset>
              <fieldset><legend className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--k-muted)]">State</legend><div className="mt-2 flex flex-wrap gap-1.5">{facets.states.filter((facet) => facet.count > 0).map((facet) => <button aria-pressed={filters.state === facet.value} className={`${marketplaceSurfaces.chip} ${filters.state === facet.value ? marketplaceSurfaces.chipActive : marketplaceSurfaces.chipIdle}`} key={facet.value} onClick={() => update("state", filters.state === facet.value ? "" : facet.value)} type="button">{facet.value} <span className="text-[var(--k-muted)]">({facet.count})</span></button>)}</div></fieldset>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={marketplaceSurfaces.eyebrow}>Service & professional capacity</p>
            <h2 id="grid-service-ledger-title" className="mt-2 text-2xl font-semibold tracking-[-.04em] text-[var(--k-text)]">Compare readiness before rate.</h2>
          </div>
          <p aria-live="polite" className="text-[13px] font-semibold text-[var(--k-muted)]">{results.length} {results.length === 1 ? "listing" : "listings"}{activeCount > 0 ? " matching your filters" : " available"}</p>
        </div>

        {results.length ? <ul data-grid-ledger="services" className="mt-5 overflow-hidden border-y border-[var(--k-line)] bg-[var(--k-public-surface)]">{results.map((listing) => <ListingRow key={listing.id} listing={listing} />)}</ul> : <div className="mt-5 border border-dashed border-[var(--k-line)] bg-[var(--k-public-surface)] px-6 py-16 text-center"><p className="text-sm font-extrabold text-[var(--k-text)]">{listings.length === 0 ? "Nothing is published in this lane yet" : "Nothing matches those filters"}</p><p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-[var(--k-muted)]">{listings.length === 0 ? "Grid surfaces inventory only after the underlying participant or resource is ready to be published." : "Try clearing a filter, widening the days, or changing your Grid goal."}</p>{activeCount > 0 && <button className={`${marketplaceSurfaces.chip} ${marketplaceSurfaces.chipIdle} mt-5 inline-flex`} onClick={() => setFilters(emptyMarketplaceFilters)} type="button">Clear all filters</button>}</div>}
      </div>
    </section>
  );
}
