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
