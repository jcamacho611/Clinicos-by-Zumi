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

type LngLat = [number, number];
type Bounds = [LngLat, LngLat];

type MapLibreMap = {
  addControl(control: unknown, position?: string): void;
  fitBounds(bounds: Bounds, options?: { padding?: number; maxZoom?: number }): void;
  on(eventName: "error", handler: () => void): void;
  once(eventName: "load", handler: () => void): void;
  remove(): void;
};

type MapLibreMarker = {
  addTo(map: MapLibreMap): MapLibreMarker;
  getElement(): HTMLElement;
  remove(): void;
  setLngLat(position: LngLat): MapLibreMarker;
};

type MapLibreNamespace = {
  Map: new (options: {
    container: HTMLElement;
    style: string;
    center: LngLat;
    zoom: number;
    attributionControl?: boolean;
  }) => MapLibreMap;
  Marker: new (options?: { color?: string }) => MapLibreMarker;
  NavigationControl: new (options?: { showCompass?: boolean; showZoom?: boolean }) => unknown;
  FullscreenControl: new () => unknown;
};

declare global {
  interface Window {
    maplibregl?: MapLibreNamespace;
  }
}

const MAPLIBRE_VERSION = "5.24.0";
const MAPLIBRE_SCRIPT_ID = "klinikos-maplibre-js";
const MAPLIBRE_CSS_ID = "klinikos-maplibre-css";
const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const UNITED_STATES_CENTER = { latitude: 39.8283, longitude: -98.5795 };

function loadMapLibre() {
  return new Promise<MapLibreNamespace>((resolve, reject) => {
    if (window.maplibregl) {
      resolve(window.maplibregl);
      return;
    }

    if (!document.getElementById(MAPLIBRE_CSS_ID)) {
      const stylesheet = document.createElement("link");
      stylesheet.id = MAPLIBRE_CSS_ID;
      stylesheet.rel = "stylesheet";
      stylesheet.href = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`;
      document.head.appendChild(stylesheet);
    }

    const loaded = () => {
      if (window.maplibregl) resolve(window.maplibregl);
      else reject(new Error("MapLibre loaded without exposing its browser runtime."));
    };

    const existing = document.getElementById(MAPLIBRE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", loaded, { once: true });
      existing.addEventListener("error", () => reject(new Error("MapLibre could not be loaded.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = MAPLIBRE_SCRIPT_ID;
    script.async = true;
    script.src = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`;
    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", () => reject(new Error("MapLibre could not be loaded.")), { once: true });
    document.head.appendChild(script);
  });
}

function boundsFor(points: GridCoordinates[]) {
  if (!points.length) return null;
  let minLatitude = points[0].latitude;
  let maxLatitude = points[0].latitude;
  let minLongitude = points[0].longitude;
  let maxLongitude = points[0].longitude;

  for (const point of points.slice(1)) {
    minLatitude = Math.min(minLatitude, point.latitude);
    maxLatitude = Math.max(maxLatitude, point.latitude);
    minLongitude = Math.min(minLongitude, point.longitude);
    maxLongitude = Math.max(maxLongitude, point.longitude);
  }

  return [[minLongitude, minLatitude], [maxLongitude, maxLatitude]] as Bounds;
}

type LocationState = "idle" | "locating" | "found" | "denied" | "unavailable";
type ProviderState = "fallback" | "loading" | "openfreemap";

/**
 * Legacy export name retained to avoid a destructive cross-file rename while Grid is
 * under active convergence. The implementation is provider-neutral and uses
 * MapLibre/OpenFreeMap as the primary map path. Google credentials are not required.
 */
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
  const [providerState, setProviderState] = useState<ProviderState>("loading");
  const [providerError, setProviderError] = useState(false);
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [userLocation, setUserLocation] = useState<GridCoordinates | null>(null);
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
    if (!elementRef.current) return;

    let cancelled = false;
    let loaded = false;
    let map: MapLibreMap | null = null;
    const markers: MapLibreMarker[] = [];
    let loadTimer: ReturnType<typeof setTimeout> | null = null;

    setProviderState("loading");
    setProviderError(false);

    loadMapLibre()
      .then((maplibre) => {
        if (cancelled || !elementRef.current) return;
        const firstPoint = selectedPoint ?? usablePoints[0];
        const center: LngLat = userLocation
          ? [userLocation.longitude, userLocation.latitude]
          : firstPoint
            ? [firstPoint.longitude, firstPoint.latitude]
            : [UNITED_STATES_CENTER.longitude, UNITED_STATES_CENTER.latitude];

        map = new maplibre.Map({
          container: elementRef.current,
          style: OPENFREEMAP_STYLE,
          center,
          zoom: userLocation || firstPoint ? 11 : 4,
          attributionControl: true,
        });
        map.addControl(new maplibre.NavigationControl({ showCompass: true, showZoom: true }), "bottom-right");
        map.addControl(new maplibre.FullscreenControl(), "bottom-right");

        const failBeforeLoad = () => {
          if (cancelled || loaded) return;
          setProviderError(true);
          setProviderState("fallback");
        };
        map.on("error", failBeforeLoad);
        loadTimer = setTimeout(failBeforeLoad, 10_000);
        map.once("load", () => {
          if (cancelled) return;
          loaded = true;
          if (loadTimer) clearTimeout(loadTimer);
          setProviderState("openfreemap");
        });

        const visibleCoordinates: GridCoordinates[] = [];
        if (userLocation) {
          visibleCoordinates.push(userLocation);
          const marker = new maplibre.Marker({ color: "#e6817b" })
            .setLngLat([userLocation.longitude, userLocation.latitude])
            .addTo(map);
          const element = marker.getElement();
          element.style.width = "44px";
          element.style.height = "44px";
          element.style.display = "grid";
          element.style.placeItems = "center";
          element.setAttribute("title", "You are here");
          element.setAttribute("aria-label", "You are here");
          markers.push(marker);
        }

        for (const point of usablePoints) {
          visibleCoordinates.push(point);
          const marker = new maplibre.Marker({ color: point.id === selectedPointId ? "#702631" : "#b9575b" })
            .setLngLat([point.longitude, point.latitude])
            .addTo(map);
          const element = marker.getElement();
          const label = `${point.title}${point.city || point.state ? ` · ${[point.city, point.state].filter(Boolean).join(", ")}` : ""}`;
          element.style.width = "44px";
          element.style.height = "44px";
          element.style.display = "grid";
          element.style.placeItems = "center";
          element.setAttribute("title", label);
          element.setAttribute("aria-label", label);
          element.setAttribute("role", "button");
          element.setAttribute("tabindex", "0");
          const select = () => onPointSelect?.(point.id);
          element.addEventListener("click", select);
          element.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              select();
            }
          });
          markers.push(marker);
        }

        const bounds = boundsFor(visibleCoordinates);
        if (bounds && visibleCoordinates.length > 1 && !selectedPoint) {
          map.fitBounds(bounds, { padding: 72, maxZoom: 13 });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProviderError(true);
          setProviderState("fallback");
        }
      });

    return () => {
      cancelled = true;
      if (loadTimer) clearTimeout(loadTimer);
      for (const marker of markers) marker.remove();
      map?.remove();
    };
  }, [onPointSelect, selectedPoint, selectedPointId, usablePoints, userLocation]);

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

  return <div className="relative min-h-[460px] overflow-hidden bg-[var(--k-public-raised)]">
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
      <button className="inline-flex min-h-11 items-center gap-2 border border-[var(--k-line)] bg-[var(--k-public-surface)] px-4 text-xs font-extrabold text-[var(--k-text)] shadow-sm hover:border-[var(--k-accent)] disabled:cursor-wait" disabled={locationState === "locating"} onClick={requestLocation} type="button">
        {locationState === "locating" ? <LoaderCircle className="size-4 animate-spin text-[var(--k-accent)]" /> : <Crosshair className="size-4 text-[var(--k-accent)]" />}
        {locationState === "found" ? "Centered on you" : "Use my location"}
      </button>
      {providerState === "fallback" && <a className="inline-flex min-h-11 items-center gap-2 border border-[var(--k-line)] bg-[var(--k-public-surface)] px-3 text-xs font-bold text-[var(--k-muted)] shadow-sm hover:text-[var(--k-text)]" href={openStreetMapUrl(fallbackCenter, false, fallbackHasMarker)} rel="noreferrer" target="_blank">Open full map <ExternalLink className="size-3.5" /></a>}
    </div>

    {providerState === "loading" && <div className="absolute inset-0 grid place-items-center bg-[var(--k-public-surface)]/80"><p className="text-xs font-extrabold text-[var(--k-accent)]">Opening the Grid map…</p></div>}

    <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-2 border border-[var(--k-line)] bg-[var(--k-public-surface)]/95 px-3 py-2 text-xs font-bold text-[var(--k-muted)] shadow-sm">
        {locationState === "found" ? <Navigation className="size-3.5 text-[var(--k-accent)]" /> : locationState === "denied" || locationState === "unavailable" ? <ShieldCheck className="size-3.5 text-[var(--k-premium)]" /> : <MapPin className="size-3.5 text-[var(--k-accent)]" />}
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
      {providerState === "openfreemap" && <span className="border border-[var(--k-line)] bg-[var(--k-public-surface)]/95 px-3 py-2 text-xs font-bold text-[var(--k-muted)] shadow-sm">OpenFreeMap · no Google credential required</span>}
      {providerError && <span className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">Primary map provider failed; geographic fallback is active.</span>}
    </div>
  </div>;
}

export type { GridMapPoint };
