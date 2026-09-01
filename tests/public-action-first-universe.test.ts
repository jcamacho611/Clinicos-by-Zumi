import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { klinikosPathCatalog } from "@/lib/paths/catalog";
import {
  PUBLIC_LIVING_UNIVERSE_ACTIONS,
  projectPublicLivingUniverse,
} from "@/lib/orchestration/public-living-universe";

/**
 * The approved frontend law is action-first:
 *
 *   Users never pick a Klinikos module. They tell Klinikos what they need, what they
 *   have, or what they are trying to become.
 *
 * The page people land on used to end in a module list — Klinikos, Zumi, Grid, EDU —
 * which is the module-first shape that law forbids, and which is why the site read as a
 * brochure no matter how much shipped underneath it.
 *
 * These guard the replacement: everyday language on the surface, the server-owned Path
 * catalog underneath, and no orchestration in the browser bundle.
 */

const page = readFileSync("src/app/page.tsx", "utf8");
const stage = readFileSync("src/components/marketing/public-living-universe-stage.tsx", "utf8");

describe("public action-first Living Universe", () => {
  it("puts the action-first stage on the page people land on", () => {
    expect(page).toContain("PublicLivingUniverse");
    // The module list is the shape the law forbids. It must not come back.
    expect(page).not.toContain("EcosystemHierarchy");
  });

  it("offers what a person would actually say, not a list of module names", () => {
    for (const action of PUBLIC_LIVING_UNIVERSE_ACTIONS) {
      // Everyday first-person phrasing. "I can take students" is exactly how someone
      // offers teaching capacity, so the opener list covers ability as well as need.
      expect(action.label, `${action.id}: not everyday language`).toMatch(
        /^(?:I need\b|I have\b|I want\b|I can\b|Help me\b|Why\b)/i,
      );
      // A product name is a module label, not something a person says they need.
      expect(action.label).not.toMatch(/\b(?:Grid|Zumi|EDU|Klinikos|EHR|RCM|dashboard|module|portal)\b/i);
    }
  });

  it("resolves every offered action to a real Path in the server-owned catalog", () => {
    const known = new Set(klinikosPathCatalog.map((path) => path.id));
    for (const action of PUBLIC_LIVING_UNIVERSE_ACTIONS) {
      expect(known.has(action.pathId), `${action.id} -> unknown path ${action.pathId}`).toBe(true);
    }
  });

  it("reports each Path's real availability rather than an encouraging one", () => {
    const projection = projectPublicLivingUniverse();
    for (const item of projection) {
      const path = klinikosPathCatalog.find((candidate) => candidate.id === item.pathId);
      expect(path, `${item.pathId} missing from catalog`).toBeDefined();
      // The catalog is the authority. The surface may rename it for a reader, never
      // upgrade it: a path that requires verification cannot be shown as ready now.
      expect(item.availability).toBe(path?.availability);
      expect(item.steps.length).toBe(path?.nodes.length);
    }
  });

  it("carries the governing sentence with every action", () => {
    // Each Path states what governs it. Dropping that on the public surface is how a
    // product starts implying it can grant things it cannot.
    for (const item of projectPublicLivingUniverse()) {
      expect(item.governance.length, `${item.pathId}: no governance sentence`).toBeGreaterThan(20);
    }
  });

  it("keeps the routing engine and the Path catalog out of the browser bundle", () => {
    expect(stage.startsWith('"use client"')).toBe(true);
    // A value import of either would ship Klinikos routing logic to every visitor. The
    // server projects; the client receives plain data and nothing else.
    expect(stage).not.toMatch(/import\s*\{[^}]*\bklinikosPathCatalog\b[^}]*\}\s*from/);
    expect(stage).not.toMatch(/import\s*\{[^}]*\bresolvePublicLivingIntent\b[^}]*\}\s*from/);
    expect(stage).not.toMatch(/\bprojectPublicLivingUniverse\s*\(/);
  });
});
