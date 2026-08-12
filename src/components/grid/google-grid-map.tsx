"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Navigation, ShieldCheck } from "lucide-react";

type GridMapPoint = {
  id: string;
  title: string;
  category: string;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
};

type LatLngLiteral = { lat: number; lng: number };

type MapBounds = {
  extend(position: LatLngLiteral): void;
};

type MapInstance = {
  fitBounds(bounds: MapBounds, padding?: number): void;
};

type MarkerInstance = {
  map: MapInstance | null;
};

type GoogleMapsNamespace = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => MapInstance;
  LatLngBounds: new () => MapBounds;
  marker: {
    AdvancedMarkerElement: new (options: {
      map: MapInstance;
      position: LatLngLiteral;
      title: string;
    }) => MarkerInstance;
  };
};

declare global {
  interface Window {
    google?: { maps: GoogleMapsNamespace };
    __klinikosGridMapReady?: () => void;
  }
}

const SCRIPT_ID = "klinikos-google-maps";

function loadGoogleMaps(apiKey: string) {
  return new Promise<GoogleMapsNamespace>((resolve, reject) => {
    if (window.google?.maps?.marker?.AdvancedMarkerElement) {
      resolve(window.google.maps);
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const done = () => {
      if (window.google?.maps?.marker?.AdvancedMarkerElement) resolve(window.google.maps);
      else reject(new Error("Google Maps loaded without the marker library."));
    };

    window.__klinikosGridMapReady = done;
    if (existing) {
      existing.addEventListener("error", () => reject(new Error("Google Maps could not be loaded.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&v=weekly&libraries=marker&callback=__klinikosGridMapReady`;
    script.addEventListener("error", () => reject(new Error("Google Maps could not be loaded.")), { once: true });
    document.head.appendChild(script);
  });
}

export function GoogleGridMap({ points }: { points: GridMapPoint[] }) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<MarkerInstance[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "unconfigured" | "error">("idle");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() ?? "";
  const usablePoints = useMemo(
    () => points.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude)),
    [points],
  );

  useEffect(() => {
    if (!apiKey || !mapId || usablePoints.length === 0 || !elementRef.current) {
      setState("unconfigured");
      return;
    }

    let cancelled = false;
    setState("loading");

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (cancelled || !elementRef.current) return;
        for (const marker of markersRef.current) marker.map = null;
        markersRef.current = [];

        const first = usablePoints[0];
        const map = new maps.Map(elementRef.current, {
          center: { lat: first.latitude, lng: first.longitude },
          zoom: usablePoints.length === 1 ? 12 : 9,
          mapId,
          clickableIcons: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        });
        const bounds = new maps.LatLngBounds();

        for (const point of usablePoints) {
          const position = { lat: point.latitude, lng: point.longitude };
          bounds.extend(position);
          markersRef.current.push(new maps.marker.AdvancedMarkerElement({
            map,
            position,
            title: `${point.title}${point.city || point.state ? ` · ${[point.city, point.state].filter(Boolean).join(", ")}` : ""}`,
          }));
        }
        if (usablePoints.length > 1) map.fitBounds(bounds, 64);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
      for (const marker of markersRef.current) marker.map = null;
      markersRef.current = [];
    };
  }, [apiKey, mapId, usablePoints]);

  if (state === "unconfigured") {
    return <div className="grid min-h-[420px] place-items-center bg-[#eef3f6] p-8 text-center">
      <div className="max-w-md">
        <MapPin className="mx-auto size-8 text-[#174ea6]" />
        <p className="mt-4 text-sm font-extrabold text-[#0b1220]">Geographic map waiting for real coordinates</p>
        <p className="mt-2 text-[12px] leading-6 text-[#5b6675]">Grid will not manufacture map pins. Add reviewed resources with latitude/longitude and configure the Maps browser key + map ID to activate the geographic view.</p>
      </div>
    </div>;
  }

  return <div className="relative min-h-[420px] bg-[#eef3f6]">
    <div ref={elementRef} className="absolute inset-0" aria-label="Klinikos Grid geographic map" />
    {state === "loading" && <div className="absolute inset-0 grid place-items-center bg-white/75"><p className="text-xs font-extrabold text-[#174ea6]">Loading geographic Grid…</p></div>}
    {state === "error" && <div className="absolute inset-0 grid place-items-center bg-[#eef3f6] p-8 text-center"><div><ShieldCheck className="mx-auto size-7 text-[#9a7a1f]" /><p className="mt-4 text-sm font-extrabold text-[#0b1220]">Map unavailable</p><p className="mt-2 max-w-sm text-[12px] leading-6 text-[#5b6675]">The listing results remain available below. Grid does not substitute synthetic coordinates when the map provider fails.</p></div></div>}
    {state === "ready" && <div className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 border border-[#d5dae0] bg-white/95 px-3 py-2 text-[10px] font-bold text-[#5b6675] shadow-sm"><Navigation className="size-3.5 text-[#174ea6]" /> Real reviewed resource coordinates</div>}
  </div>;
}

export type { GridMapPoint };
