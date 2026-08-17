import { describe, expect, it } from "vitest";
import {
  calculateDistanceMiles,
  evaluateGridGeographicScope,
  isGridCoordinates,
  openStreetMapUrl,
  publicGridCoordinate,
  rankGridCoordinatesByDistance,
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

  it("keeps public map results and the distance ledger on the same radius", () => {
    const ranked = rankGridCoordinatesByDistance([
      { id: "far", latitude: 41.2, longitude: -74 },
      { id: "near", latitude: 40.71, longitude: -74.01 },
      { id: "closest", latitude: 40.701, longitude: -74.001 },
    ], { latitude: 40.7, longitude: -74 }, 10);

    expect(ranked.map((candidate) => candidate.id)).toEqual(["closest", "near"]);
    expect(ranked.every((candidate) => candidate.distanceMiles != null && candidate.distanceMiles <= 10)).toBe(true);
  });

  it("preserves published order and avoids fake distance without a permission-derived origin", () => {
    expect(rankGridCoordinatesByDistance([
      { id: "first", latitude: 40.7, longitude: -74 },
      { id: "second", latitude: 41.2, longitude: -74 },
    ], null, 25)).toEqual([
      { id: "first", latitude: 40.7, longitude: -74, distanceMiles: null },
      { id: "second", latitude: 41.2, longitude: -74, distanceMiles: null },
    ]);
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
