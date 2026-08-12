"use client";

import Link from "next/link";
import { Building2, MapPin, Radar, Users } from "lucide-react";
import { GoogleGridMap, type GridMapPoint } from "@/components/grid/google-grid-map";

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

export function GridLiveMap({ locations, providers, resources }: { locations: MapLocation[]; providers: MapProvider[]; resources: MapResource[] }) {
  const mapped: GridMapPoint[] = resources.flatMap((resource) => {
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
  });
  const unmappedResources = resources.filter((resource) => resource.latitude == null || resource.longitude == null);
  const hasInventory = locations.length + providers.length + resources.length > 0;

  return (
    <section className="border-b border-[#dfe3e8] bg-[#edf2f5]">
      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:py-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#174ea6]">Geographic Grid</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.05em] text-[#0b1220] sm:text-4xl">See reviewed capacity where it actually exists.</h2>
            <p className="mt-3 max-w-3xl text-[13px] leading-6 text-[#5b6675]">Only resources with real stored coordinates are pinned. City/state-only inventory stays in the results list until its owner supplies a map position. Grid never invents geography.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-bold"><span className="inline-flex items-center gap-1.5 border border-[#d5dae0] bg-white px-3 py-2 text-[#0b1220]"><MapPin className="size-3.5 text-[#174ea6]" /> {mapped.length} mapped resources</span><span className="inline-flex items-center gap-1.5 border border-[#d5dae0] bg-white px-3 py-2 text-[#0b1220]"><Building2 className="size-3.5 text-[#174ea6]" /> {locations.length} marketplace spaces</span><span className="inline-flex items-center gap-1.5 border border-[#d5dae0] bg-white px-3 py-2 text-[#0b1220]"><Users className="size-3.5 text-[#0f766e]" /> {providers.length} provider listings</span></div>
        </div>

        <div className="grid overflow-hidden border border-[#d5dae0] bg-white lg:grid-cols-[1.3fr_.7fr]">
          <GoogleGridMap points={mapped} />

          <aside className="border-t border-[#d5dae0] bg-white lg:border-l lg:border-t-0">
            <div className="border-b border-[#e6e9ee] p-5"><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#5b6675]">Location inventory</p></div>
            <div className="max-h-[460px] overflow-auto">
              {locations.map((location) => <article className="border-b border-[#e6e9ee] p-5" key={`location-${location.id}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-extrabold text-[#0b1220]">{location.name}</h3><p className="mt-1 text-[11px] text-[#5b6675]">{[location.city, location.state].filter(Boolean).join(", ") || location.locationType}</p></div><Building2 className="size-4 text-[#174ea6]" /></div><div className="mt-3 flex flex-wrap gap-1.5">{location.roomTypes.slice(0, 3).map((room) => <span className="border border-[#e6e9ee] px-2 py-1 text-[10px] font-semibold text-[#5b6675]" key={room}>{room}</span>)}{location.chairRentalAvailable && <span className="border border-[#174ea6]/20 bg-[#174ea6]/[.05] px-2 py-1 text-[10px] font-bold text-[#174ea6]">Chair rental</span>}</div><p className="mt-3 text-[12px] font-bold text-[#0b1220]">{money(location.hourlyRateCents) ? `${money(location.hourlyRateCents)}/hr` : money(location.dailyRateCents) ? `${money(location.dailyRateCents)}/day` : "Rate on request"}</p><Link className="mt-3 inline-flex text-[11px] font-extrabold text-[#174ea6]" href={`/grid/browse?intent=space&q=${encodeURIComponent(location.city ?? location.name)}`}>Explore location →</Link></article>)}

              {unmappedResources.slice(0, 20).map((resource) => <article className="border-b border-[#e6e9ee] p-5" key={`resource-${resource.id}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-extrabold text-[#0b1220]">{resource.title}</h3><p className="mt-1 text-[11px] text-[#5b6675]">{[resource.city, resource.state].filter(Boolean).join(", ") || resource.resourceType.replaceAll("_", " ")}</p></div><MapPin className="size-4 text-[#9a7a1f]" /></div><p className="mt-3 text-[10px] leading-5 text-[#6f6240]">Published, but not pinned because exact coordinates are not stored.</p></article>)}

              {!hasInventory && <div className="p-7 text-center"><Radar className="mx-auto size-7 text-[#174ea6]" /><p className="mt-4 text-sm font-extrabold text-[#0b1220]">No public Grid inventory yet</p><p className="mt-2 text-[12px] leading-6 text-[#5b6675]">Reviewed and published resources will appear here without synthetic fallback data.</p></div>}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
