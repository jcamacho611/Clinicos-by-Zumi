"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, ExternalLink, LoaderCircle, MapPin, Navigation, ShieldCheck } from "lucide-react";
import { openStreetMapUrl, type GridCoordinates } from "@/lib/grid/geo-rules";

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
  addListener?: (eventName: "click", handler: () => void) => { remove(): void };
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
const UNITED_STATES_CENTER = { latitude: 39.8283, longitude: -98.5795 };

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

type LocationState = "idle" | "locating" | "found" | "denied" | "unavailable";

export function GoogleGridMap({
  points,
  selectedPointId,
  onLocationChange,
  onPointSelect,
}: {
  points: GridMapPoint[];
  selectedPointId?: string | null;
  onLocationChange?: (location: GridCoordinates | null) => void;
  onPointSelect?: (pointId: string) => void;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<MarkerInstance[]>([]);
  const [providerState, setProviderState] = useState<"fallback" | "loading" | "google">("fallback");
  const [providerError, setProviderError] = useState(false);
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [userLocation, setUserLocation] = useState<GridCoordinates | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() ?? "";
  const usablePoints = useMemo(
    () => points.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude)),
    [points],
  );
  const selectedPoint = usablePoints.find((point) => point.id === selectedPointId) ?? null;
  const fallbackCenter = userLocation
    ?? (selectedPoint ? { latitude: selectedPoint.latitude, longitude: selectedPoint.longitude } : null)
    ?? (usablePoints[0] ? { latitude: usablePoints[0].latitude, longitude: usablePoints[0].longitude } : null)
    ?? UNITED_STATES_CENTER;
  const fallbackHasMarker = Boolean(userLocation || selectedPoint || usablePoints[0]);

  useEffect(() => {
    if (!apiKey || !mapId || !elementRef.current) {
      setProviderState("fallback");
      return;
    }

    let cancelled = false;
    setProviderState("loading");
    setProviderError(false);

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (cancelled || !elementRef.current) return;
        for (const marker of markersRef.current) marker.map = null;
        markersRef.current = [];

        const firstPoint = selectedPoint ?? usablePoints[0];
        const center = userLocation
          ? { lat: userLocation.latitude, lng: userLocation.longitude }
          : firstPoint
            ? { lat: firstPoint.latitude, lng: firstPoint.longitude }
            : { lat: UNITED_STATES_CENTER.latitude, lng: UNITED_STATES_CENTER.longitude };
        const map = new maps.Map(elementRef.current, {
          center,
          zoom: userLocation || firstPoint ? 11 : 4,
          mapId,
          clickableIcons: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        });
        const bounds = new maps.LatLngBounds();
        let boundCount = 0;

        if (userLocation) {
          const position = { lat: userLocation.latitude, lng: userLocation.longitude };
          bounds.extend(position);
          boundCount += 1;
          markersRef.current.push(new maps.marker.AdvancedMarkerElement({ map, position, title: "You are here" }));
        }

        for (const point of usablePoints) {
          const position = { lat: point.latitude, lng: point.longitude };
          bounds.extend(position);
          boundCount += 1;
          const marker = new maps.marker.AdvancedMarkerElement({
            map,
            position,
            title: `${point.title}${point.city || point.state ? ` · ${[point.city, point.state].filter(Boolean).join(", ")}` : ""}`,
          });
          marker.addListener?.("click", () => onPointSelect?.(point.id));
          markersRef.current.push(marker);
        }
        if (boundCount > 1 && !selectedPoint) map.fitBounds(bounds, 72);
        setProviderState("google");
      })
      .catch(() => {
        if (!cancelled) {
          setProviderError(true);
          setProviderState("fallback");
        }
      });

    return () => {
      cancelled = true;
      for (const marker of markersRef.current) marker.map = null;
      markersRef.current = [];
    };
  }, [apiKey, mapId, onPointSelect, selectedPoint, usablePoints, userLocation]);

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationState("unavailable");
      onLocationChange?.(null);
      return;
    }
    setLocationState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setUserLocation(location);
        setLocationState("found");
        onLocationChange?.(location);
      },
      (reason) => {
        setLocationState(reason.code === reason.PERMISSION_DENIED ? "denied" : "unavailable");
        onLocationChange?.(null);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }

  const fallbackTitle = userLocation
    ? "Map centered on your permission-derived location"
    : selectedPoint
      ? `Map centered on ${selectedPoint.title}`
      : usablePoints.length
        ? "Map centered on reviewed Grid inventory"
        : "Map ready for your location";

  return <div className="relative min-h-[460px] overflow-hidden bg-[#eef3f6]">
    <iframe
      className={`absolute inset-0 size-full border-0 ${providerState === "fallback" ? "block" : "hidden"}`}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox="allow-scripts allow-same-origin allow-popups"
      src={openStreetMapUrl(fallbackCenter, true, fallbackHasMarker)}
      title={fallbackTitle}
    />
    <div ref={elementRef} className={`absolute inset-0 ${providerState === "fallback" ? "invisible" : "visible"}`} aria-label="Klinikos Grid map showing your location and reviewed resources" />

    <div className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
      <button className="inline-flex min-h-11 items-center gap-2 border border-[#cbd3dd] bg-white px-4 text-[11px] font-extrabold text-[#0b1220] shadow-sm hover:border-[#174ea6] disabled:cursor-wait" disabled={locationState === "locating"} onClick={requestLocation} type="button">
        {locationState === "locating" ? <LoaderCircle className="size-4 animate-spin text-[#174ea6]" /> : <Crosshair className="size-4 text-[#174ea6]" />}
        {locationState === "found" ? "Centered on you" : "Use my location"}
      </button>
      {providerState === "fallback" && <a className="inline-flex min-h-11 items-center gap-2 border border-[#cbd3dd] bg-white px-3 text-[10px] font-bold text-[#5b6675] shadow-sm hover:text-[#0b1220]" href={openStreetMapUrl(fallbackCenter, false, fallbackHasMarker)} rel="noreferrer" target="_blank">Open full map <ExternalLink className="size-3.5" /></a>}
    </div>

    {providerState === "loading" && <div className="absolute inset-0 grid place-items-center bg-white/75"><p className="text-xs font-extrabold text-[#174ea6]">Opening the connected Grid map…</p></div>}

    <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-2 border border-[#d5dae0] bg-white/95 px-3 py-2 text-[10px] font-bold text-[#5b6675] shadow-sm">
        {locationState === "found" ? <Navigation className="size-3.5 text-[#174ea6]" /> : locationState === "denied" || locationState === "unavailable" ? <ShieldCheck className="size-3.5 text-[#9a7a1f]" /> : <MapPin className="size-3.5 text-[#174ea6]" />}
        {locationState === "found"
          ? "Real distance is now calculated from your location"
          : locationState === "denied"
            ? "Location was not shared · browse by listed city and state"
            : locationState === "unavailable"
              ? "Device location is unavailable · listed inventory remains visible"
              : usablePoints.length
                ? "Choose location access for real distance"
                : "No reviewed public Grid pins yet"}
      </span>
      {providerError && <span className="border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-900">Connected map provider failed; geographic fallback is active.</span>}
    </div>
  </div>;
}

export type { GridMapPoint };
