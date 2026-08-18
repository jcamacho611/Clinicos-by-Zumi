export type GridCoordinates = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_MILES = 3_958.8;

function radians(value: number) {
  return value * Math.PI / 180;
}

type GridCoordinateInput = {
  latitude?: number | null;
  longitude?: number | null;
};

type GridGeographicOrigin = GridCoordinateInput & {
  radiusMiles?: number | null;
  state?: string | null;
};

type GridGeographicCandidate = GridCoordinateInput & {
  state?: string | null;
};

export function isGridCoordinates(value: GridCoordinateInput | null | undefined): value is GridCoordinates {
  return Boolean(
    value
    && Number.isFinite(value.latitude)
    && Number.isFinite(value.longitude)
    && value.latitude! >= -90
    && value.latitude! <= 90
    && value.longitude! >= -180
    && value.longitude! <= 180,
  );
}

export function calculateDistanceMiles(origin: GridCoordinates, destination: GridCoordinates) {
  const latitudeDelta = radians(destination.latitude - origin.latitude);
  const longitudeDelta = radians(destination.longitude - origin.longitude);
  const originLatitude = radians(origin.latitude);
  const destinationLatitude = radians(destination.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function rankGridCoordinatesByDistance<T extends GridCoordinates>(
  candidates: readonly T[],
  origin: GridCoordinates | null,
  radiusMiles: number | null,
) {
  const boundedRadius = origin && radiusMiles != null && Number.isFinite(radiusMiles) && radiusMiles >= 0
    ? radiusMiles
    : null;

  return candidates
    .map((candidate, originalIndex) => ({
      ...candidate,
      originalIndex,
      distanceMiles: origin ? calculateDistanceMiles(origin, candidate) : null,
    }))
    .filter((candidate) => boundedRadius == null || candidate.distanceMiles! <= boundedRadius)
    .sort((left, right) => {
      if (left.distanceMiles == null || right.distanceMiles == null) return left.originalIndex - right.originalIndex;
      return left.distanceMiles - right.distanceMiles || left.originalIndex - right.originalIndex;
    })
    .map(({ originalIndex: _originalIndex, ...candidate }) => candidate);
}

/**
 * Geographic hard-gate selection for saved Grid demand.
 *
 * When a permission-derived coordinate origin and radius are present, the radius is
 * authoritative. A state text mismatch must not eliminate a nearby resource across
 * a state boundary, and a stale/default state value must not override real distance.
 * If coordinate-radius matching is unavailable, state remains the coarse fallback.
 */
export function evaluateGridGeographicScope(origin: GridGeographicOrigin, candidate: GridGeographicCandidate) {
  const radiusMiles = origin.radiusMiles;
  const radiusMode = isGridCoordinates(origin)
    && Number.isFinite(radiusMiles)
    && radiusMiles! >= 0;

  if (radiusMode) {
    if (!isGridCoordinates(candidate)) {
      return { eligible: false, distanceMiles: null, mode: "radius" as const };
    }
    const distanceMiles = calculateDistanceMiles(origin, candidate);
    return {
      eligible: distanceMiles <= radiusMiles!,
      distanceMiles,
      mode: "radius" as const,
    };
  }

  const stateMismatch = Boolean(
    origin.state
    && candidate.state
    && origin.state.toLowerCase() !== candidate.state.toLowerCase(),
  );
  return {
    eligible: !stateMismatch,
    distanceMiles: null,
    mode: "state" as const,
  };
}

/**
 * Public discovery does not need a building-level GPS reading. Three decimal
 * places is approximately a city-block level position at US latitudes; exact
 * stored coordinates remain available to governed server-side matching.
 */
export function publicGridCoordinate(value: number | null, decimals = 3) {
  if (value == null || !Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function openStreetMapUrl(center: GridCoordinates, embed: boolean, showMarker: boolean) {
  const latitudeDelta = center.latitude > 70 || center.latitude < -70 ? 0.18 : 0.11;
  const longitudeDelta = 0.16;
  if (!embed) {
    return showMarker
      ? `https://www.openstreetmap.org/?mlat=${center.latitude}&mlon=${center.longitude}#map=12/${center.latitude}/${center.longitude}`
      : `https://www.openstreetmap.org/#map=4/${center.latitude}/${center.longitude}`;
  }
  const bbox = [
    Math.max(-180, center.longitude - longitudeDelta),
    Math.max(-90, center.latitude - latitudeDelta),
    Math.min(180, center.longitude + longitudeDelta),
    Math.min(90, center.latitude + latitudeDelta),
  ].join(",");
  const marker = showMarker ? `&marker=${center.latitude}%2C${center.longitude}` : "";
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik${marker}`;
}
