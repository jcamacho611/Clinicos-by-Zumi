import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectSpatialUniverse } from "@/lib/universe/spatial-projection";
import { canonicalEcosystemGraph, CANONICAL_PLANE_IDS } from "@/lib/ecosystem/canonical-ecosystem-graph";
import { resolvePublicRoutePresentation } from "@/lib/screen-experience-route-registry";

const component = fs.readFileSync(
  path.join(process.cwd(), "src/components/universe/spatial-universe.tsx"),
  "utf8",
);
const projection = fs.readFileSync(
  path.join(process.cwd(), "src/lib/universe/spatial-projection.ts"),
  "utf8",
);
const tokens = fs.readFileSync(path.join(process.cwd(), "src/app/design-tokens.css"), "utf8");
const page = fs.readFileSync(
  path.join(process.cwd(), "src/app/ecosystem/universe/page.tsx"),
  "utf8",
);

describe("spatial universe — disclosure boundary", () => {
  it("never ships internal source paths to the browser", () => {
    // The canonical graph cites real files like src/lib/grid/eligibility.ts as
    // evidence. Those paths map where Klinikos keeps its eligibility, matching and
    // composition logic, so the projection must drop them rather than forward them.
    const universe = projectSpatialUniverse();
    const serialized = JSON.stringify(universe);

    expect(serialized).not.toMatch(/src\//);
    expect(serialized).not.toMatch(/prisma/i);
    expect(serialized).not.toMatch(/\.ts\b/);
    expect(serialized).not.toMatch(/migrations/);

    // Proves the guard is exercising something real: the source graph genuinely
    // does carry those paths, so the assertions above are removing them, not
    // passing over an empty field.
    const source = JSON.stringify(canonicalEcosystemGraph.nodes);
    expect(source).toMatch(/src\/lib\/grid/);
    expect(source).toMatch(/prisma/);
  });

  it("keeps the relation vocabulary server-side", () => {
    const universe = projectSpatialUniverse();
    for (const connection of universe.connections) {
      expect(Object.keys(connection).sort()).toEqual(["from", "to"]);
    }
    expect(canonicalEcosystemGraph.edges.length).toBeGreaterThan(0);
    expect(canonicalEcosystemGraph.edges[0]).toHaveProperty("relation");
  });
});

describe("spatial universe — canon", () => {
  it("renders exactly the five canonical planes and never a sixth", () => {
    const universe = projectSpatialUniverse();
    expect(universe.planes).toHaveLength(5);
    expect(universe.planes.map((p) => p.id)).toEqual([...CANONICAL_PLANE_IDS]);
  });

  it("carries every canonical node onto exactly one plane", () => {
    const universe = projectSpatialUniverse();
    const placed = universe.planes.flatMap((p) => p.nodes.map((n) => n.id));
    expect(placed).toHaveLength(canonicalEcosystemGraph.nodes.length);
    expect(new Set(placed).size).toBe(placed.length);
  });

  it("shows intent and reality separately so NOW can never read as live", () => {
    const universe = projectSpatialUniverse();
    const now = universe.planes
      .flatMap((p) => p.nodes)
      .filter((n) => n.strategyState === "NOW" && n.implementationState !== "LIVE_VERIFIED");
    // The graph genuinely contains NOW-but-not-live nodes; the UI must be able to
    // say so, which is why the two states stay separate fields.
    expect(now.length).toBeGreaterThan(0);
    expect(component).toContain("What we intend");
    expect(component).toContain("Where it actually is");
  });

  it("lays every node out deterministically", () => {
    const a = projectSpatialUniverse();
    const b = projectSpatialUniverse();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(projection).not.toMatch(/Math\.random/);
  });
});

describe("spatial universe — material and access", () => {
  it("resolves every colour through the theme, so Marble is real", () => {
    expect(component).not.toMatch(/#[0-9a-fA-F]{6}\b/);
    for (const token of [
      "--k-plane-surface",
      "--k-plane-edge",
      "--k-plane-label",
      "--k-node-core",
      "--k-node-quiet",
      "--k-node-glow",
      "--k-field",
      "--k-depth-veil",
    ]) {
      expect(component.includes(token)).toBe(true);
      // Exactly twice: once in Obsidian, once in Marble. A token defined in only
      // one block is a surface that silently keeps the other material's colour.
      expect(tokens.split(`${token}:`).length - 1).toBe(2);
    }
  });

  it("keeps one DOM tree rather than a mirrored accessible copy", () => {
    // The spatial layer is aria-hidden decoration over real controls; there is no
    // second tree and therefore nothing that can drift out of sync.
    expect(component).toContain('aria-hidden="true"');
    expect(component).toContain("<button");
    expect(component).toContain("aria-live");
    expect(component).not.toMatch(/zustand|three|@react-three/);
  });

  it("yields to reduced motion and unbinds every listener it adds", () => {
    expect(component).toContain("prefers-reduced-motion: reduce");
    expect(component).toContain("removeEventListener");
    // Every addEventListener has a matching removal, so navigating away does not
    // leave a keydown or media-query handler bound to a dead component.
    const added = component.split("addEventListener").length - 1;
    const removed = component.split("removeEventListener").length - 1;
    expect(removed).toBe(added);
  });

  it("runs no continuous render loop, as the approved spatial design requires", () => {
    // The Spatial Living Universe design rules out Three.js, React Three Fiber,
    // canvas and any continuous render loop. Ambient motion is a compositor-driven
    // CSS keyframe instead, so nothing keeps the main thread awake to decorate.
    expect(component).not.toMatch(/requestAnimationFrame|getContext\(|<canvas/);
    expect(component).toContain("k-mote-drift");
    expect(tokens).toContain("@keyframes k-mote-drift");
    // Deterministic, so the field is the same place on every visit.
    // The call form, not the word: the file names Math.random in a comment to say
    // it is deliberately not used.
    expect(component).not.toMatch(/Math\.random\(/);
  });
});

describe("spatial universe — reachable and server-bounded", () => {
  it("is mounted on a real route rather than existing as an unused component", () => {
    // A component nobody can navigate to is not shipped. This asserts the route
    // file both exists and actually renders the universe.
    expect(page).toContain("SpatialUniverse");
    expect(page).toContain("projectSpatialUniverse");
  });

  it("runs the projection on the server so the graph never reaches the browser", () => {
    // No "use client" on the page: the projection executes during render on the
    // server, and only its return value is serialized across the boundary. If
    // this page ever became a Client Component, the canonical graph — evidence
    // paths and all — would be pulled into the browser bundle by its import.
    expect(page).not.toMatch(/^\s*"use client"/m);
    expect(component).toMatch(/^"use client"/);
  });

  it("gives the child route the same public presentation as /ecosystem", () => {
    // Without this the spatial route resolves to no presentation policy, which
    // means no appearance bootstrap and therefore a theme flash on first paint.
    const policy = resolvePublicRoutePresentation("/ecosystem/universe");
    expect(policy).not.toBeNull();
    expect(policy?.id).toBe("ecosystem");
    expect(policy).toMatchObject(resolvePublicRoutePresentation("/ecosystem") ?? {});
  });
});
