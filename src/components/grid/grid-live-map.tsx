"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, List, Map, MapPin, Radar, Users } from "lucide-react";
import { GoogleGridMap, type GridMapPoint } from "@/components/grid/google-grid-map";
import { calculateDistanceMiles, type GridCoordinates } from "@/lib/grid/geo-rules";

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
  const rankedMapped = useMemo(() => mapped
    .map((resource) => ({
      ...resource,
      distanceMiles: userLocation
        ? calculateDistanceMiles(userLocation, { latitude: resource.latitude, longitude: resource.longitude })
        : null,
    }))
    .sort((left, right) => {
      if (left.distanceMiles == null || right.distanceMiles == null) return left.title.localeCompare(right.title);
      return left.distanceMiles - right.distanceMiles || left.title.localeCompare(right.title);
    }), [mapped, userLocation]);
  const unmappedResources = resources.filter((resource) => resource.latitude == null || resource.longitude == null);
  const hasInventory = locations.length + providers.length + resources.length > 0;

  function selectPoint(id: string) {
    setSelectedPointId(id);
    setMobileView("map");
  }

  return (
    <section className="border-b border-[#dfe3e8] bg-[#f5f7f8]">
      <div className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:py-20">
        <div className="mb-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-4xl">
            <p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-[#174ea6]">Around you</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-.05em] text-[#0b1220] sm:text-5xl">One geographic field for real, available healthcare capacity.</h2>
            <p className="mt-5 max-w-3xl text-[13px] leading-7 text-[#5b6675]">Choose location access when you want distance-based results. Grid maps only reviewed resources with supplied coordinates, keeps city/state-only inventory unpinned, and never fills an empty map with invented places.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-bold lg:justify-end"><span className="inline-flex items-center gap-1.5 border border-[#d5dae0] bg-white px-3 py-2 text-[#0b1220]"><MapPin className="size-3.5 text-[#174ea6]" /> {mapped.length} mapped</span><span className="inline-flex items-center gap-1.5 border border-[#d5dae0] bg-white px-3 py-2 text-[#0b1220]"><Building2 className="size-3.5 text-[#174ea6]" /> {locations.length} spaces</span><span className="inline-flex items-center gap-1.5 border border-[#d5dae0] bg-white px-3 py-2 text-[#0b1220]"><Users className="size-3.5 text-[#0f766e]" /> {providers.length} professionals</span></div>
        </div>

        <div className="mb-3 grid grid-cols-2 border border-[#d5dae0] bg-white lg:hidden">
          <button className={`inline-flex min-h-11 items-center justify-center gap-2 text-xs font-extrabold ${mobileView === "map" ? "bg-[#174ea6] text-white" : "text-[#5b6675]"}`} onClick={() => setMobileView("map")} type="button"><Map className="size-4" /> Map</button>
          <button className={`inline-flex min-h-11 items-center justify-center gap-2 text-xs font-extrabold ${mobileView === "list" ? "bg-[#174ea6] text-white" : "text-[#5b6675]"}`} onClick={() => setMobileView("list")} type="button"><List className="size-4" /> Results</button>
        </div>

        <div className="grid overflow-hidden border border-[#d5dae0] bg-white lg:grid-cols-[1.35fr_.65fr]">
          <div className={`${mobileView === "map" ? "block" : "hidden"} lg:block`}>
            <GoogleGridMap onLocationChange={setUserLocation} points={mapped} selectedPointId={selectedPointId} />
          </div>

          <aside className={`${mobileView === "list" ? "block" : "hidden"} border-t border-[#d5dae0] bg-white lg:block lg:border-l lg:border-t-0`}>
            <div className="border-b border-[#e6e9ee] p-6"><p className="text-[12px] font-extrabold uppercase tracking-[.14em] text-[#5b6675]">Published inventory</p>{userLocation && <p className="mt-2 text-[12px] font-bold text-[#174ea6]">Mapped results sorted by real distance</p>}</div>
            <div className="max-h-[460px] overflow-auto">
              {rankedMapped.map((resource) => <article className={`border-b p-6 ${selectedPointId === resource.id ? "border-[#174ea6] bg-[#174ea6]/[.04]" : "border-[#e6e9ee]"}`} key={`mapped-resource-${resource.id}`}><button className="w-full text-left" onClick={() => selectPoint(resource.id)} type="button"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-extrabold text-[#0b1220]">{resource.title}</h3><p className="mt-1 text-[11px] text-[#5b6675]">{[resource.city, resource.state].filter(Boolean).join(", ") || humanize(resource.category)}</p></div><MapPin className="size-4 shrink-0 text-[#174ea6]" /></div><div className="mt-4 flex flex-wrap gap-2"><span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-[12px] font-bold text-emerald-800">Reviewed public resource</span>{resource.distanceMiles != null && <span className="border border-[#174ea6]/20 bg-[#174ea6]/[.05] px-2 py-1 text-[12px] font-bold text-[#174ea6]">{resource.distanceMiles.toFixed(1)} mi</span>}</div><p className="mt-4 text-[11px] font-extrabold text-[#174ea6]">Center on map →</p></button><Link className="mt-3 inline-flex min-h-11 items-center text-[11px] font-extrabold text-[#0b1220] underline decoration-[#174ea6] decoration-2 underline-offset-4" href={`/login?returnTo=${encodeURIComponent(`/grid/resources/request/${resource.id}?from=map`)}`}>Start governed request</Link></article>)}

              {locations.map((location) => <article className="border-b border-[#e6e9ee] p-6" key={`location-${location.id}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-extrabold text-[#0b1220]">{location.name}</h3><p className="mt-1 text-[11px] text-[#5b6675]">{[location.city, location.state].filter(Boolean).join(", ") || location.locationType}</p></div><Building2 className="size-4 text-[#174ea6]" /></div><div className="mt-4 flex flex-wrap gap-1.5">{location.roomTypes.slice(0, 3).map((room) => <span className="border border-[#e6e9ee] px-2 py-1 text-[12px] font-semibold text-[#5b6675]" key={room}>{room}</span>)}{location.chairRentalAvailable && <span className="border border-[#174ea6]/20 bg-[#174ea6]/[.05] px-2 py-1 text-[12px] font-bold text-[#174ea6]">Chair rental</span>}</div><p className="mt-4 text-[12px] font-bold text-[#0b1220]">{money(location.hourlyRateCents) ? `${money(location.hourlyRateCents)}/hr` : money(location.dailyRateCents) ? `${money(location.dailyRateCents)}/day` : "Rate on request"}</p><Link className="mt-4 inline-flex text-[11px] font-extrabold text-[#174ea6]" href={`/grid/browse?intent=space&q=${encodeURIComponent(location.city ?? location.name)}`}>Explore location →</Link><p className="mt-3 text-[12px] leading-5 text-[#6f6240]">No pin shown until this legacy location supplies reviewed coordinates.</p></article>)}

              {providers.map((provider) => <article className="border-b border-[#e6e9ee] p-6" key={`provider-${provider.id}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-extrabold text-[#0b1220]">{provider.serviceName}</h3><p className="mt-1 text-[11px] text-[#5b6675]">{provider.providerName} · {humanize(provider.providerType)}</p></div><BriefcaseBusiness className="size-4 text-[#0f766e]" /></div><div className="mt-4 flex flex-wrap gap-1.5">{provider.onCallNow && <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-[12px] font-bold text-emerald-800">Available now</span>}{provider.states.slice(0, 3).map((state) => <span className="border border-[#e6e9ee] px-2 py-1 text-[12px] font-semibold text-[#5b6675]" key={state}>{state}</span>)}</div><p className="mt-3 text-[12px] leading-5 text-[#6f6240]">Professional service area is shown without an exact public location pin.</p></article>)}

              {unmappedResources.slice(0, 20).map((resource) => <article className="border-b border-[#e6e9ee] p-6" key={`resource-${resource.id}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-extrabold text-[#0b1220]">{resource.title}</h3><p className="mt-1 text-[11px] text-[#5b6675]">{[resource.city, resource.state].filter(Boolean).join(", ") || humanize(resource.resourceType)}</p></div><MapPin className="size-4 text-[#9a7a1f]" /></div><p className="mt-4 text-[12px] leading-5 text-[#6f6240]">Published, but not pinned because a reviewed map position has not been supplied.</p></article>)}

              {!hasInventory && <div className="p-10 text-center"><Radar className="mx-auto size-7 text-[#174ea6]" /><p className="mt-5 text-sm font-extrabold text-[#0b1220]">You are early.</p><p className="mt-3 text-[12px] leading-6 text-[#5b6675]">There is no reviewed public Grid inventory here yet. As people and organizations publish real availability, it will appear around your location.</p><Link className="mt-5 inline-flex text-[11px] font-extrabold text-[#174ea6]" href="/grid/join">Be one of the first to add something →</Link></div>}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
