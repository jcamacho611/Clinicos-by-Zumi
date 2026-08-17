import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const mapSource = readFileSync(join(process.cwd(), "src/components/grid/google-grid-map.tsx"), "utf8");
const canon = readFileSync(join(process.cwd(), "docs/GRID_LOCATION_PROVIDER_CANON.md"), "utf8");

describe("Grid primary map provider", () => {
  it("does not require a Google credential for the primary map path", () => {
    expect(mapSource).toContain("tiles.openfreemap.org/styles/liberty");
    expect(mapSource).toContain("maplibre-gl");
    expect(mapSource).not.toContain("maps.googleapis.com/maps/api/js");
    expect(mapSource).not.toContain("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
  });

  it("keeps browser geolocation explicit and permission-driven", () => {
    expect(mapSource).toContain("navigator.geolocation.getCurrentPosition");
    expect(mapSource).toContain("Use my location");
    expect(mapSource).toContain("PERMISSION_DENIED");
  });

  it("retains an OpenStreetMap emergency fallback", () => {
    expect(mapSource).toContain("openStreetMapUrl");
    expect(mapSource).toContain("Primary map provider failed; geographic fallback is active.");
  });

  it("documents Google as optional rather than a Grid launch dependency", () => {
    expect(canon).toContain("Google Maps is not a Klinikos Grid launch dependency");
    expect(canon).toContain("Blank optional variables must not break Grid");
  });
});
