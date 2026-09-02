"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, List, Map, MapPin, Radar, Users } from "lucide-react";
import { GoogleGridMap, type GridMapPoint } from "@/components/grid/google-grid-map";
import { rankGridCoordinatesByDistance, type GridCoordinates } from "@/lib/grid/geo-rules";

type MapLocation = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  locationType: string;
  roomTypes: string[];
  chairRentalAvailable: boolean;
  hourlyRateCents: number | null;
  dailyRateCents: number | null;
  servicesAllowed: string[];
};

type MapProvider = {
  id: string;
  serviceName: string;
  providerName: string;
  providerType: string;
  serviceAreas: string[];
  states: string[];
  onCallNow: boolean;
};

type MapResource = {
  id: string;
  title: string;
  resourceType: string;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
};

function money(cents: number | null) {
  if (cents == null) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

export function GridLiveMap({ locations, providers, resources }: { locations: MapLocation[]; providers: MapProvider[]; resources: MapResource[] }) {
  const [userLocation, setUserLocation] = useState<GridCoordinates | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "list">("list");
  const [radiusMiles, setRadiusMiles] = useState<number | null>(25);
  const mapped: GridMapPoint[] = useMemo(() => resources.flatMap((resource) => {
    if (resource.latitude == null || resource.longitude == null) return [];
    return [{
      id: resource.id,
      title: resource.title,
      category: resource.resourceType,
      city: resource.city,
      state: resource.state,
      latitude: resource.latitude,
      longitude: resource.longitude,
    }];
  }), [resources]);
  const rankedMapped = useMemo(
    () => rankGridCoordinatesByDistance(mapped, userLocation, userLocation ? radiusMiles : null),
    [mapped, radiusMiles, userLocation],
  );
  const unmappedResources = resources.filter((resource) => resource.latitude == null || resource.longitude == null);
  const hasInventory = locations.length + providers.length + resources.length > 0;
  const radiusActive = userLocation !== null && radiusMiles !== null;
  const hiddenMappedCount = mapped.length - rankedMapped.length;
  const unpinnedCount = locations.length + providers.length + unmappedResources.length;
  const selectedVisiblePointId = rankedMapped.some((point) => point.id === selectedPointId) ? selectedPointId : null;

  const selectPoint = useCallback((id: string) => {
    setSelectedPointId(id);
    setMobileView("map");
  }, []);

  const selectFromMap = useCallback((id: string) => {
    setSelectedPointId(id);
    setMobileView("list");
    requestAnimationFrame(() => document.getElementById(`grid-map-result-${id}`)?.scrollIntoView({ block: "nearest" }));
  }, []);

  const muted = "text-[var(--k-muted)]";
  const accent = "text-[var(--k-accent)]";

  return (
    <section className="grid-marble-surface border-y border-[var(--k-line)] bg-[var(--k-work-bg)]">
      <div className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 lg:py-16">
        <div className="mb-8 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-4xl">
            <p className={`text-xs font-extrabold uppercase tracking-[.18em] ${accent}`}>Spatial Grid</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-.05em] text-[var(--k-text)] sm:text-5xl">One geographic field for healthcare capacity.</h2>
            <p className={`mt-4 max-w-3xl text-[13px] leading-7 ${muted}`}>Choose location access when you want distance. The map uses only coordinates supplied on resource records, keeps city/state-only inventory unpinned, and never fills an empty map with invented places.</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold lg:justify-end">
            <span className="inline-flex items-center gap-1.5 text-[var(--k-text)]"><MapPin className={`size-3.5 ${accent}`} /> {rankedMapped.length} mapped{radiusActive ? ` in ${radiusMiles} mi` : ""}</span>
            <span className="inline-flex items-center gap-1.5 text-[var(--k-text)]"><Building2 className={`size-3.5 ${accent}`} /> {locations.length} spaces</span>
            <span className="inline-flex items-center gap-1.5 text-[var(--k-text)]"><Users className={`size-3.5 ${accent}`} /> {providers.length} professionals</span>
          </div>
        </div>

        {/* Mobile begins with results; the map is an explicit user choice. */}
        <div className="mb-3 grid grid-cols-2 border border-[var(--k-line)] bg-[var(--k-public-surface)] lg:hidden">
          <button className={`inline-flex min-h-11 items-center justify-center gap-2 text-xs font-extrabold ${mobileView === "map" ? "bg-[var(--k-text)] text-[var(--k-work-bg)]" : "text-[var(--k-muted)]"}`} onClick={() => setMobileView("map")} type="button" aria-pressed={mobileView === "map"}><Map className="size-4" /> Map</button>
          <button className={`inline-flex min-h-11 items-center justify-center gap-2 text-xs font-extrabold ${mobileView === "list" ? "bg-[var(--k-text)] text-[var(--k-work-bg)]" : "text-[var(--k-muted)]"}`} onClick={() => setMobileView("list")} type="button" aria-pressed={mobileView === "list"}><List className="size-4" /> Results</button>
        </div>

        <div data-grid-map-ledger className="grid overflow-hidden border border-[var(--k-line)] bg-[var(--k-public-surface)] lg:grid-cols-[1.35fr_.65fr]">
          <div className={`${mobileView === "map" ? "block" : "hidden"} min-w-0 lg:block`}>
            <GoogleGridMap onLocationChange={setUserLocation} onPointSelect={selectFromMap} points={rankedMapped} selectedPointId={selectedVisiblePointId} />
          </div>

          <aside className={`${mobileView === "list" ? "block" : "hidden"} min-w-0 border-t border-[var(--k-line)] bg-[var(--k-public-surface)] lg:block lg:border-l lg:border-t-0`}>
            <div className="border-b border-[var(--k-line)] p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[var(--k-muted)]">Discovery inventory</p>{userLocation && <p className="mt-2 text-xs font-bold text-[var(--k-accent)]">Mapped results sorted by calculated distance</p>}</div>
                {userLocation && <label className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--k-muted)]">Distance<select aria-label="Map search radius" className="mt-1 block h-11 border border-[var(--k-line)] bg-[var(--k-public-surface)] px-3 text-xs font-bold normal-case tracking-normal text-[var(--k-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-accent)]" value={radiusMiles ?? "all"} onChange={(event) => setRadiusMiles(event.target.value === "all" ? null : Number(event.target.value))}><option value="5">Within 5 mi</option><option value="10">Within 10 mi</option><option value="25">Within 25 mi</option><option value="50">Within 50 mi</option><option value="100">Within 100 mi</option><option value="all">Any distance</option></select></label>}
              </div>
              {radiusActive && (hiddenMappedCount > 0 || unpinnedCount > 0) && <p className="mt-3 text-xs leading-5 text-[#8a641f]">{hiddenMappedCount > 0 ? `${hiddenMappedCount} mapped result${hiddenMappedCount === 1 ? " is" : "s are"} outside this radius. ` : ""}{unpinnedCount > 0 ? `${unpinnedCount} city/state or service-area result${unpinnedCount === 1 ? " is" : "s are"} excluded because exact distance cannot be calculated.` : ""}</p>}
            </div>

            <div className="max-h-[500px] overflow-auto" aria-label="Grid spatial results">
              {rankedMapped.map((resource) => <article className={`border-b border-[var(--k-line)] px-5 py-5 transition-colors sm:px-6 ${selectedPointId === resource.id ? "bg-[var(--k-public-raised)]" : "bg-[var(--k-public-surface)]"}`} id={`grid-map-result-${resource.id}`} key={`mapped-resource-${resource.id}`}>
                <button className="min-h-11 w-full text-left" onClick={() => selectPoint(resource.id)} type="button">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-extrabold text-[var(--k-text)]">{resource.title}</h3><p className="mt-1 text-xs text-[var(--k-muted)]">{[resource.city, resource.state].filter(Boolean).join(", ") || humanize(resource.category)}</p></div><MapPin className="size-4 shrink-0 text-[var(--k-accent)]" /></div>
                  <div className="mt-3 flex flex-wrap gap-2"><span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">Demonstration resource record</span>{resource.distanceMiles != null && <span className="border border-[var(--k-line)] bg-[var(--k-public-raised)] px-2 py-1 text-xs font-bold text-[var(--k-text)]">{resource.distanceMiles.toFixed(1)} mi</span>}</div>
                  <p className="mt-3 text-xs font-extrabold text-[var(--k-accent)]">Center on map →</p>
                </button>
                <Link className="mt-2 inline-flex min-h-11 items-center text-xs font-extrabold text-[var(--k-text)] underline decoration-[var(--k-accent)] decoration-2 underline-offset-4" href={`/login?returnTo=${encodeURIComponent(`/grid/resources/request/${resource.id}?from=map`)}`}>Start governed request</Link>
              </article>)}

              {!radiusActive && locations.map((location) => <article className="border-b border-[var(--k-line)] px-5 py-5 sm:px-6" key={`location-${location.id}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-extrabold text-[var(--k-text)]">{location.name}</h3><p className="mt-1 text-xs text-[var(--k-muted)]">{[location.city, location.state].filter(Boolean).join(", ") || location.locationType}</p></div><Building2 className="size-4 text-[var(--k-accent)]" /></div><div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-[var(--k-muted)]">{location.roomTypes.slice(0, 3).map((room) => <span key={room}>{room}</span>)}{location.chairRentalAvailable && <span className="font-bold text-[var(--k-accent)]">Chair rental</span>}</div><p className="mt-3 text-sm font-bold tabular-nums text-[var(--k-text)]">{money(location.hourlyRateCents) ? `${money(location.hourlyRateCents)}/hr` : money(location.dailyRateCents) ? `${money(location.dailyRateCents)}/day` : "Rate on request"}</p><Link className="mt-2 inline-flex min-h-11 items-center text-xs font-extrabold text-[var(--k-accent)]" href={`/grid/browse?intent=space&q=${encodeURIComponent(location.city ?? location.name)}`}>Explore location →</Link><p className="mt-2 text-xs leading-5 text-[#8a641f]">No pin shown until this legacy location supplies reviewed coordinates.</p></article>)}

              {!radiusActive && providers.map((provider) => <article className="border-b border-[var(--k-line)] px-5 py-5 sm:px-6" key={`provider-${provider.id}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-extrabold text-[var(--k-text)]">{provider.serviceName}</h3><p className="mt-1 text-xs text-[var(--k-muted)]">{provider.providerName} · {humanize(provider.providerType)}</p></div><BriefcaseBusiness className="size-4 text-[var(--k-accent)]" /></div><div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-[var(--k-muted)]">{provider.onCallNow && <span className="font-bold text-emerald-700">Available now</span>}{provider.states.slice(0, 3).map((state) => <span key={state}>{state}</span>)}</div><p className="mt-2 text-xs leading-5 text-[#8a641f]">Professional service area is shown without an exact public location pin.</p></article>)}

              {!radiusActive && unmappedResources.slice(0, 20).map((resource) => <article className="border-b border-[var(--k-line)] px-5 py-5 sm:px-6" key={`resource-${resource.id}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-extrabold text-[var(--k-text)]">{resource.title}</h3><p className="mt-1 text-xs text-[var(--k-muted)]">{[resource.city, resource.state].filter(Boolean).join(", ") || humanize(resource.resourceType)}</p></div><MapPin className="size-4 text-[var(--k-premium)]" /></div><p className="mt-3 text-xs leading-5 text-[#8a641f]">Published, but not pinned because a reviewed map position has not been supplied.</p></article>)}

              {radiusActive && rankedMapped.length === 0 && <div className="p-10 text-center"><Radar className="mx-auto size-7 text-[var(--k-accent)]" /><p className="mt-5 text-sm font-extrabold text-[var(--k-text)]">No mapped resources are inside this radius.</p><p className="mt-3 text-xs leading-6 text-[var(--k-muted)]">Widen the distance filter or choose Any distance. Grid does not pull unpinned inventory into an exact-radius result.</p></div>}

              {!hasInventory && <div className="p-10 text-center"><Radar className="mx-auto size-7 text-[var(--k-accent)]" /><p className="mt-5 text-sm font-extrabold text-[var(--k-text)]">You are early.</p><p className="mt-3 text-xs leading-6 text-[var(--k-muted)]">There is no reviewed public Grid inventory here yet. As people and organizations publish real availability, it will appear around your location.</p><Link className="mt-5 inline-flex min-h-11 items-center text-xs font-extrabold text-[var(--k-accent)]" href="/grid/join">Be one of the first to add something →</Link></div>}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
