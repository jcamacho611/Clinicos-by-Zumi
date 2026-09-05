import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PLANE_LANGUAGE, planeLanguage } from "@/lib/universe/plane-language";
import {
  CANONICAL_PLANE_IDS,
  canonicalEcosystemGraph,
} from "@/lib/ecosystem/canonical-ecosystem-graph";
import { projectSpatialUniverse } from "@/lib/universe/spatial-projection";

const projectionSource = readFileSync("src/lib/universe/spatial-projection.ts", "utf8");
const memberSource = readFileSync("src/lib/member/member-home-repository.ts", "utf8");

describe("one plane language", () => {
  it("covers exactly the five canonical planes, in the graph's order", () => {
    expect(PLANE_LANGUAGE.map((plane) => plane.id)).toEqual([...CANONICAL_PLANE_IDS]);
    expect(PLANE_LANGUAGE.map((plane) => plane.label)).toEqual(
      canonicalEcosystemGraph.planes.map((plane) => plane.label),
    );
    expect(PLANE_LANGUAGE.map((plane) => plane.ordinal)).toEqual(["01", "02", "03", "04", "05"]);
  });

  it("carries both registers for every plane, and never an empty one", () => {
    // Two registers of one fact: `meaning` is what a person is told on arrival,
    // `governance` is which states the plane keeps separate. A plane missing
    // either would silently render a blank layer somewhere.
    for (const plane of PLANE_LANGUAGE) {
      expect(plane.meaning.trim().length, plane.id).toBeGreaterThan(0);
      expect(plane.governance.trim().length, plane.id).toBeGreaterThan(0);
      expect(plane.meaning).not.toBe(plane.governance);
    }
  });

  it("is the only place either surface gets plane wording from", () => {
    // The regression this exists to prevent: the public map and the member's
    // Living Home each held their own Record<CanonicalPlaneId, string> of plane
    // descriptions. They had already drifted. Neither may hold one again.
    for (const source of [projectionSource, memberSource]) {
      expect(source).not.toMatch(/Record<CanonicalPlaneId,\s*string>\s*=\s*\{/);
      expect(source).toContain("plane-language");
    }
  });

  it("feeds the public universe the plain-language register", () => {
    const universe = projectSpatialUniverse();
    for (const plane of universe.planes) {
      expect(plane.meaning).toBe(planeLanguage(plane.id).meaning);
      // The public map must not be handed the governance register, which is
      // written for someone who already knows what a claim state is.
      expect(plane.meaning).not.toBe(planeLanguage(plane.id).governance);
    }
  });

  it("refuses to invent language for a plane that is not canonical", () => {
    // Proves the lookup actually guards rather than returning a blank record.
    expect(() => planeLanguage("sixth_plane" as never)).toThrow(/No language for plane/);
  });
});
