import { describe, expect, it } from "vitest";
import {
  calculateDistanceMiles,
  evaluateGridGeographicScope,
  isGridCoordinates,
  openStreetMapUrl,
  publicGridCoordinate,
} from "@/lib/grid/geo-rules";

describe("Grid geographic rules", () => {
  it("calculates a real-world radius with the Haversine formula", () => {
    const miles = calculateDistanceMiles(
      { latitude: 40.7128, longitude: -74.006 },
      { latitude: 40.6782, longitude: -73.9442 },
    );

    expect(miles).toBeGreaterThan(3.9);
    expect(miles).toBeLessThan(4.5);
  });

  it("rejects incomplete or out-of-range coordinate pairs", () => {
    expect(isGridCoordinates({ latitude: 40.7 })).toBe(false);
    expect(isGridCoordinates({ latitude: 91, longitude: -74 })).toBe(false);
    expect(isGridCoordinates({ latitude: 40.7, longitude: -74 })).toBe(true);
  });

  it("uses coordinate radius instead of state text when a real origin exists", () => {
    const nearbyAcrossState = evaluateGridGeographicScope(
      { latitude: 40.7, longitude: -74, radiusMiles: 10, state: "NY" },
      { latitude: 40.71, longitude: -74.01, state: "NJ" },
    );
    const coarseOnly = evaluateGridGeographicScope(
      { state: "NY" },
      { state: "NJ" },
    );

    expect(nearbyAcrossState.mode).toBe("radius");
    expect(nearbyAcrossState.eligible).toBe(true);
    expect(nearbyAcrossState.distanceMiles).toBeLessThan(2);
    expect(coarseOnly).toEqual({ eligible: false, distanceMiles: null, mode: "state" });
  });

  it("requires candidate coordinates when a saved need uses a radius", () => {
    expect(evaluateGridGeographicScope(
      { latitude: 40.7, longitude: -74, radiusMiles: 25, state: "NY" },
      { state: "NY" },
    )).toEqual({ eligible: false, distanceMiles: null, mode: "radius" });
  });

  it("reduces coordinate precision for public discovery", () => {
    expect(publicGridCoordinate(40.7128123)).toBe(40.713);
    expect(publicGridCoordinate(-74.0060712)).toBe(-74.006);
    expect(publicGridCoordinate(null)).toBeNull();
  });

  it("never draws a marker on the empty-market default", () => {
    const center = { latitude: 39.8283, longitude: -98.5795 };
    expect(openStreetMapUrl(center, true, false)).not.toContain("marker=");
    expect(openStreetMapUrl(center, true, true)).toContain("marker=");
  });
});
