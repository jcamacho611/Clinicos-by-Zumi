import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  claimStatusForTest,
  ecosystemRealityProjection,
} from "@/lib/living-reality/ecosystem-reality-projection";
import { projectSpatialUniverse } from "@/lib/universe/spatial-projection";
import { canonicalEcosystemGraph } from "@/lib/ecosystem/canonical-ecosystem-graph";

const adapter = readFileSync("src/lib/living-reality/ecosystem-reality-projection.ts", "utf8");
const layout = readFileSync("src/lib/universe/spatial-projection.ts", "utf8");

// The allowlists the merged P16 confidentiality work established. A field added
// to a projection without review shows up here as a failure, not in a bundle.
const NODE_KEYS = ["id", "kind", "label", "state", "summary", "claimStatus", "routeRef"];
const EDGE_KEYS = ["id", "fromId", "toId", "kind", "label"];

describe("public ecosystem speaks the canonical Reality contract", () => {
  it("conforms to the merged node and edge shape exactly", () => {
    const projection = ecosystemRealityProjection();
    expect(projection.nodes.length).toBeGreaterThan(canonicalEcosystemGraph.nodes.length);

    for (const node of projection.nodes) {
      expect(Object.keys(node).sort()).toEqual([...NODE_KEYS].sort());
    }
    for (const edge of projection.edges) {
      expect(Object.keys(edge).sort()).toEqual([...EDGE_KEYS].sort());
      expect(["lens", "path", "relationship"]).toContain(edge.kind);
    }
  });

  it("is the only projection — the depth view is derived, not a second contract", () => {
    // spatial-projection must consume the adapter rather than read the graph
    // itself. Two readers of one graph is how the wording drifted last time.
    expect(layout).toContain("ecosystemRealityProjection");
    expect(layout).not.toContain("canonicalEcosystemGraph.nodes");

    const universe = projectSpatialUniverse();
    const placed = universe.planes.flatMap((p) => p.nodes.map((n) => n.id));
    expect(placed).toHaveLength(canonicalEcosystemGraph.nodes.length);
    // Every laid-out node is a node the contract actually published.
    const published = new Set(universe.reality.nodes.map((n) => n.id));
    for (const id of placed) expect(published.has(id)).toBe(true);
  });

  it("never ships evidence paths, vendors, or legal gates to the browser", () => {
    const serialized = JSON.stringify(ecosystemRealityProjection());
    expect(serialized).not.toMatch(/src\//);
    expect(serialized).not.toMatch(/prisma/i);
    expect(serialized).not.toMatch(/\.ts\b/);
    expect(serialized).not.toMatch(/evidencePaths|externalDependencies|legalSecurityGates/);

    // Proves the guard is pointed at something real: the source graph does carry
    // all three, so stripping them is work the adapter actually performs.
    const source = JSON.stringify(canonicalEcosystemGraph.nodes);
    expect(source).toMatch(/src\/lib\/grid/);
    expect(source).toMatch(/evidencePaths|legalSecurityGates/);
  });

  it("sends an attention level and a reason, never a score", () => {
    // Reconciliation Override /10: the server computes proprietary attention; the
    // browser receives the minimum presentation signal and a plain-language line.
    const projection = ecosystemRealityProjection();
    expect(projection.attention.length).toBeGreaterThan(0);

    for (const entry of projection.attention) {
      expect(["normal", "elevated", "critical"]).toContain(entry.level);
      expect(entry.explanation.trim().length).toBeGreaterThan(0);
      expect(Object.keys(entry).sort()).toEqual(["explanation", "level", "nodeId"]);
    }
    expect(JSON.stringify(projection)).not.toMatch(/"gravity"|"score"|"weight"|"rank"/);
    expect(adapter).not.toMatch(/gravity/);
  });

  it("shows nothing as verified, because nothing in the graph is verified yet", () => {
    const projection = ecosystemRealityProjection();
    const capabilities = projection.nodes.filter((n) => n.kind === "ecosystem_capability");

    // Measured 2026-09-05: 66 canonical capabilities, and not one carries
    // LIVE_VERIFIED. Meanwhile 39 are declared intent "Now". That gap is the
    // whole reason intent and reality are rendered as separate facts, and the
    // product must not paper over it.
    const verified = capabilities.filter((n) => n.claimStatus === "verified");
    expect(verified).toHaveLength(0);
    expect(capabilities.every((n) => n.state !== "Live")).toBe(true);

    const intendedNow = capabilities.filter((n) => n.summary.startsWith("Intent: Now."));
    expect(intendedNow.length).toBeGreaterThan(0);
    // Every one of those reads as something other than live.
    for (const node of intendedNow) expect(node.claimStatus).not.toBe("verified");
  });

  it("would let a genuinely live capability read as verified", () => {
    // The rule above must hold because the graph says so, not because the mapping
    // is incapable of ever reporting verified. This exercises that path directly.
    expect(claimStatusForTest({ implementationState: "LIVE_VERIFIED" })).toBe("verified");
    expect(claimStatusForTest({ implementationState: "PARTIAL" })).toBe("unverified");
    expect(claimStatusForTest({ implementationState: "LEGAL_REVIEW_REQUIRED" })).toBe("in_review");
  });

  it("carries no governed action on a public informational surface", () => {
    expect(ecosystemRealityProjection().precisionActions).toEqual([]);
  });
});
