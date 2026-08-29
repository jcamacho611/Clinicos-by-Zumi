"use client";

import { useCallback, useMemo, useState } from "react";
import { Building2, List, Map, MapPin, Radar, Search, Sparkles, Users } from "lucide-react";
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

type ActiveGridContext = {
  intent: string;
  query: string;
};

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

function demandKind(intent: string) {
  const allowed = new Set(["work", "provider", "space", "product", "equipment", "service", "network", "education", "organization", "referral"]);
  return allowed.has(intent) ? intent : "service";
}

function focusGridComposer() {
  const composer = document.getElementById("grid-exchange-query") as HTMLTextAreaElement | null;
  composer?.scrollIntoView({ behavior: "smooth", block: "center" });
  composer?.focus();
}

export function GridLiveMap({
  activeContext,
  locations,
  providers,
  resources,
}: {
  activeContext: ActiveGridContext;
  locations: MapLocation[];
  providers: MapProvider[];
  resources: MapResource[];
}) {
  const [userLocation, setUserLocation] = useState<GridCoordinates | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [radiusMiles, setRadiusMiles] = useState<number | null>(10);
  const [saveState, setSaveState] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
  const radiusActive = userLocation !== null && radiusMiles !== null;
  const selectedVisiblePointId = rankedMapped.some((point) => point.id === selectedPointId) ? selectedPointId : null;
  const nothingMatches = rankedMapped.length === 0 && locations.length + providers.length + unmappedResources.length === 0;

  const selectPoint = useCallback((id: string) => {
    setSelectedPointId(id);
    setMobileView("map");
  }, []);

  const selectFromMap = useCallback((id: string) => {
    setSelectedPointId(id);
    setMobileView("list");
    requestAnimationFrame(() => document.getElementById(`grid-map-result-${id}`)?.scrollIntoView({ block: "nearest" }));
  }, []);

  async function keepNeedActive() {
    const query = activeContext.query.trim();
    if (!query) {
      setSaveState("Describe the need first so Klinikos has something truthful to keep active.");
      focusGridComposer();
      return;
    }

    setSaving(true);
    setSaveState(null);
    try {
      const response = await fetch("/api/grid/demands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: demandKind(activeContext.intent),
          title: query.slice(0, 160),
          description: `Active Grid need: ${query}`.slice(0, 2000),
          category: activeContext.intent === "all" ? "general" : activeContext.intent,
          radiusMiles: radiusMiles ?? 10,
          quantity: 1,
          requiresClinicalEligibility: ["work", "provider", "referral"].includes(activeContext.intent),
          requirements: [],
          status: "open",
          visibility: "matched_only",
        }),
      });

      if (response.status === 401) {
        const returnTo = `${window.location.pathname}${window.location.search}`;
        window.location.assign(`/access?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSaveState(typeof payload.error === "string" ? payload.error : "This need could not be kept active safely.");
        return;
      }
      setSaveState("Need active. Klinikos recorded it through the governed Grid demand rail.");
    } catch {
      setSaveState("The need could not be saved right now. Nothing was fabricated or marked active.");
    } finally {
      setSaving(false);
    }
  }

  const visibleCount = rankedMapped.length + (radiusActive ? 0 : locations.length + providers.length + unmappedResources.length);

  return (
    <section className="bg-[#050303] px-4 py-4 text-[#f8efed] sm:px-6 lg:px-8" data-grid-spatial-workspace>
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-3 grid grid-cols-2 overflow-hidden border border-[#e28b85]/12 bg-[#090506] lg:hidden">
          <button className={`inline-flex min-h-11 items-center justify-center gap-2 text-xs font-semibold ${mobileView === "map" ? "bg-[#e6817b] text-[#19090b]" : "text-[#a8908b]"}`} onClick={() => setMobileView("map")} type="button" aria-pressed={mobileView === "map"}><Map className="size-4" /> Map</button>
          <button className={`inline-flex min-h-11 items-center justify-center gap-2 text-xs font-semibold ${mobileView === "list" ? "bg-[#e6817b] text-[#19090b]" : "text-[#a8908b]"}`} onClick={() => setMobileView("list")} type="button" aria-pressed={mobileView === "list"}><List className="size-4" /> Matches</button>
        </div>

        <div className="grid min-h-[66vh] overflow-hidden border border-[#e28b85]/12 bg-[#080405] lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,.65fr)]">
          <div className={`${mobileView === "map" ? "block" : "hidden"} min-w-0 bg-[#070405] lg:block`}>
            <GoogleGridMap
              onLocationChange={setUserLocation}
              onPointSelect={selectFromMap}
              points={rankedMapped}
              selectedPointId={selectedVisiblePointId}
            />
          </div>

          <aside aria-label="Grid match inspector" className={`${mobileView === "list" ? "block" : "hidden"} min-w-0 border-t border-[#e28b85]/12 bg-[#0a0507] lg:block lg:border-l lg:border-t-0`}>
            <div className="flex min-h-16 items-center justify-between gap-3 border-b border-[#e28b85]/12 px-5 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#e6817b]">Matches</p>
                <p className="mt-1 text-xs text-[#927d79]">{visibleCount} real published result{visibleCount === 1 ? "" : "s"}</p>
              </div>
              <label className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#806d69]">
                Radius
                <select aria-label="Map search radius" className="ml-2 h-10 border border-[#e28b85]/12 bg-[#100708] px-2 text-xs font-semibold normal-case tracking-normal text-[#e7d4d1]" value={radiusMiles ?? "all"} onChange={(event) => setRadiusMiles(event.target.value === "all" ? null : Number(event.target.value))}>
                  <option value="5">5 mi</option>
                  <option value="10">10 mi</option>
                  <option value="25">25 mi</option>
                  <option value="50">50 mi</option>
                  <option value="100">100 mi</option>
                  <option value="all">Any</option>
                </select>
              </label>
            </div>

            <div className="max-h-[62vh] overflow-auto" aria-label="Grid spatial results">
              {rankedMapped.map((resource) => (
                <article className={`border-b border-[#e28b85]/10 px-5 py-5 ${selectedPointId === resource.id ? "bg-[#14090b]" : "bg-[#0a0507]"}`} id={`grid-map-result-${resource.id}`} key={resource.id}>
                  <button className="min-h-11 w-full text-left" onClick={() => selectPoint(resource.id)} type="button">
                    <div className="flex items-start justify-between gap-3">
                      <div><h3 className="text-sm font-semibold text-[#fff8f6]">{resource.title}</h3><p className="mt-1 text-xs text-[#8f7773]">{[resource.city, resource.state].filter(Boolean).join(", ") || humanize(resource.category)}</p></div>
                      <MapPin className="size-4 shrink-0 text-[#e6817b]" />
                    </div>
                    <p className="mt-3 text-xs text-[#bca5a1]">Reviewed public resource{resource.distanceMiles != null ? ` · ${resource.distanceMiles.toFixed(1)} mi` : ""}</p>
                  </button>
                </article>
              ))}

              {!radiusActive && locations.map((location) => (
                <article className="border-b border-[#e28b85]/10 px-5 py-5" key={`location-${location.id}`}>
                  <div className="flex items-start gap-3"><Building2 className="mt-0.5 size-4 text-[#e6817b]" /><div><h3 className="text-sm font-semibold text-[#fff8f6]">{location.name}</h3><p className="mt-1 text-xs text-[#8f7773]">{[location.city, location.state].filter(Boolean).join(", ") || location.locationType}</p><p className="mt-2 text-xs text-[#806d69]">No pin until reviewed coordinates are supplied.</p></div></div>
                </article>
              ))}

              {!radiusActive && providers.map((provider) => (
                <article className="border-b border-[#e28b85]/10 px-5 py-5" key={`provider-${provider.id}`}>
                  <div className="flex items-start gap-3"><Users className="mt-0.5 size-4 text-[#e6817b]" /><div><h3 className="text-sm font-semibold text-[#fff8f6]">{provider.serviceName}</h3><p className="mt-1 text-xs text-[#8f7773]">{provider.providerName} · {humanize(provider.providerType)}</p><p className="mt-2 text-xs text-[#806d69]">Service-area inventory stays unpinned without an exact reviewed position.</p></div></div>
                </article>
              ))}

              {!radiusActive && unmappedResources.map((resource) => (
                <article className="border-b border-[#e28b85]/10 px-5 py-5" key={`unmapped-${resource.id}`}>
                  <h3 className="text-sm font-semibold text-[#fff8f6]">{resource.title}</h3>
                  <p className="mt-1 text-xs text-[#8f7773]">{[resource.city, resource.state].filter(Boolean).join(", ") || humanize(resource.resourceType)}</p>
                  <p className="mt-2 text-xs text-[#806d69]">Published, but not pinned without reviewed coordinates.</p>
                </article>
              ))}

              {(nothingMatches || (radiusActive && rankedMapped.length === 0)) ? (
                <div className="p-7 sm:p-9">
                  <Radar className="size-6 text-[#e6817b]" />
                  <h3 className="mt-4 text-lg font-medium tracking-[-.02em] text-[#fff8f6]">Nothing currently matches within 10 miles.</h3>
                  <p className="mt-2 text-xs leading-6 text-[#8f7773]">Grid is showing only real published capacity. It will not invent supply to fill this state.</p>
                  <div className="mt-6 grid gap-2 sm:grid-cols-2">
                    <button className="min-h-11 border border-[#e28b85]/16 bg-[#12090b] px-3 text-xs font-semibold text-[#f0d8d4] disabled:opacity-50" disabled={saving} onClick={keepNeedActive} type="button">{saving ? "Saving…" : "Keep this need active"}</button>
                    <button className="min-h-11 border border-[#e28b85]/16 bg-[#12090b] px-3 text-xs font-semibold text-[#f0d8d4]" onClick={() => setRadiusMiles(25)} type="button">Expand area</button>
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#e28b85]/16 bg-[#12090b] px-3 text-xs font-semibold text-[#f0d8d4]" onClick={focusGridComposer} type="button"><Search className="size-3.5" />Adjust time</button>
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#e6817b] px-3 text-xs font-semibold text-[#19090b]" onClick={focusGridComposer} type="button"><Sparkles className="size-3.5" />Ask Zumi</button>
                  </div>
                  {saveState ? <p aria-live="polite" className="mt-4 text-xs leading-5 text-[#c7aaa6]">{saveState}</p> : null}
                </div>
              ) : null}
            </div>
          </aside>
        </div>

        <div className="flex flex-col gap-3 border-x border-b border-[#e28b85]/12 bg-[#0d0608] px-4 py-3 sm:flex-row sm:items-center sm:justify-between" data-grid-context-bar>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#e6817b]">Discovery</p>
            <p className="mt-1 truncate text-xs text-[#cbb4b0]">{activeContext.query || "Tell Grid what you need or what you have."}</p>
          </div>
          <p className="text-[10px] uppercase tracking-[.14em] text-[#725f5b]">{humanize(activeContext.intent)} · {radiusMiles == null ? "any distance" : `${radiusMiles} mi`}</p>
        </div>
      </div>
    </section>
  );
}
