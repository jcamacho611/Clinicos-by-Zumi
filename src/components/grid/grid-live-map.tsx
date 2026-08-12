"use client";

import Link from "next/link";
import { Building2, MapPin, Navigation, Radar, Users } from "lucide-react";

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

function pseudoPosition(seed: string, index: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const left = 12 + ((hash + index * 17) % 74);
  const top = 14 + (((hash >> 4) + index * 23) % 66);
  return { left: `${left}%`, top: `${top}%` };
}

function money(cents: number | null) {
  if (cents == null) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export function GridLiveMap({ locations, providers }: { locations: MapLocation[]; providers: MapProvider[] }) {
  const hasInventory = locations.length + providers.length > 0;

  return (
    <section className="border-b border-[#dfe3e8] bg-[#edf2f5]">
      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:py-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#174ea6]">Live Grid map</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.05em] text-[#0b1220] sm:text-4xl">Start with what is available around you.</h2>
            <p className="mt-3 max-w-3xl text-[13px] leading-6 text-[#5b6675]">Marketplace-visible locations and currently published provider service areas are shown here. Exact travel and route intelligence can be upgraded when a map provider is connected.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-bold"><span className="inline-flex items-center gap-1.5 border border-[#d5dae0] bg-white px-3 py-2 text-[#0b1220]"><Building2 className="size-3.5 text-[#174ea6]" /> {locations.length} spaces</span><span className="inline-flex items-center gap-1.5 border border-[#d5dae0] bg-white px-3 py-2 text-[#0b1220]"><Users className="size-3.5 text-[#0f766e]" /> {providers.length} provider listings</span></div>
        </div>

        <div className="grid overflow-hidden border border-[#d5dae0] bg-white lg:grid-cols-[1.3fr_.7fr]">
          <div className="relative min-h-[460px] overflow-hidden bg-[#dfe8ec]">
            <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(23,78,166,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(23,78,166,.08)_1px,transparent_1px)] [background-size:42px_42px]" />
            <div className="absolute inset-8 rounded-[48%_52%_45%_55%/45%_45%_55%_55%] border border-[#9bb3bf] bg-[#f4f7f8] shadow-[inset_0_0_80px_rgba(23,78,166,.05)]" />
            <div className="absolute left-[18%] top-[28%] h-px w-[58%] -rotate-[14deg] bg-[#9bb3bf]/60" />
            <div className="absolute left-[36%] top-[16%] h-[58%] w-px rotate-[8deg] bg-[#9bb3bf]/60" />
            {locations.map((location, index) => {
              const pos = pseudoPosition(`${location.name}-${location.city}-${location.state}`, index);
              return <Link aria-label={`View ${location.name}`} className="group absolute z-10 -translate-x-1/2 -translate-y-1/2" href={`/grid/browse?intent=space&q=${encodeURIComponent(location.city ?? location.name)}`} key={location.id} style={pos}>
                <span className="grid size-9 place-items-center rounded-full border-4 border-white bg-[#174ea6] text-white shadow-lg transition group-hover:scale-110"><MapPin className="size-4" /></span>
                <span className="pointer-events-none absolute left-1/2 top-11 hidden w-48 -translate-x-1/2 border border-[#d5dae0] bg-white p-3 text-left shadow-xl group-hover:block"><b className="block text-xs text-[#0b1220]">{location.name}</b><small className="mt-1 block text-[10px] text-[#5b6675]">{[location.city, location.state].filter(Boolean).join(", ") || "Location"}{location.chairRentalAvailable ? " · Chair rental" : ""}</small></span>
              </Link>;
            })}
            {providers.map((provider, index) => {
              const pos = pseudoPosition(`${provider.providerName}-${provider.states.join("-")}`, index + 100);
              return <Link aria-label={`View ${provider.providerName}`} className="group absolute z-10 -translate-x-1/2 -translate-y-1/2" href={`/grid/browse?intent=provider&q=${encodeURIComponent(provider.providerName)}`} key={provider.id} style={pos}>
                <span className="grid size-8 place-items-center rounded-full border-4 border-white bg-[#0f766e] text-white shadow-lg transition group-hover:scale-110"><Users className="size-3.5" /></span>
              </Link>;
            })}
            {!hasInventory && <div className="absolute inset-0 z-10 grid place-items-center p-8 text-center"><div><Radar className="mx-auto size-8 text-[#174ea6]" /><p className="mt-4 text-sm font-extrabold text-[#0b1220]">No public Grid inventory yet</p><p className="mx-auto mt-2 max-w-sm text-[12px] leading-6 text-[#5b6675]">The map fills automatically when reviewed spaces and provider listings become marketplace-visible.</p></div></div>}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 border border-[#d5dae0] bg-white/95 px-3 py-2 text-[10px] font-bold text-[#5b6675]"><Navigation className="size-3.5 text-[#174ea6]" /> Map-first Grid discovery · route API pending</div>
          </div>

          <aside className="border-t border-[#d5dae0] bg-white lg:border-l lg:border-t-0">
            <div className="border-b border-[#e6e9ee] p-5"><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#5b6675]">Spaces on Grid</p></div>
            <div className="max-h-[460px] overflow-auto">
              {locations.length ? locations.map((location) => <article className="border-b border-[#e6e9ee] p-5" key={location.id}><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-extrabold text-[#0b1220]">{location.name}</h3><p className="mt-1 text-[11px] text-[#5b6675]">{[location.city, location.state].filter(Boolean).join(", ") || location.locationType}</p></div><Building2 className="size-4 text-[#174ea6]" /></div><div className="mt-3 flex flex-wrap gap-1.5">{location.roomTypes.slice(0, 3).map((room) => <span className="border border-[#e6e9ee] px-2 py-1 text-[10px] font-semibold text-[#5b6675]" key={room}>{room}</span>)}{location.chairRentalAvailable && <span className="border border-[#174ea6]/20 bg-[#174ea6]/[.05] px-2 py-1 text-[10px] font-bold text-[#174ea6]">Chair rental</span>}</div><p className="mt-3 text-[12px] font-bold text-[#0b1220]">{money(location.hourlyRateCents) ? `${money(location.hourlyRateCents)}/hr` : money(location.dailyRateCents) ? `${money(location.dailyRateCents)}/day` : "Rate on request"}</p><Link className="mt-3 inline-flex text-[11px] font-extrabold text-[#174ea6]" href={`/grid/browse?intent=space&q=${encodeURIComponent(location.city ?? location.name)}`}>Explore nearby →</Link></article>) : <div className="p-6 text-[12px] leading-6 text-[#5b6675]">No marketplace-visible spaces are published yet.</div>}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
