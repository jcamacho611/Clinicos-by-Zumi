import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { klinikosPathCatalog } from "@/lib/paths/catalog";
import {
  PUBLIC_LIVING_UNIVERSE_ACTIONS,
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
const gateway = readFileSync("src/components/marketing/public-living-gateway.tsx", "utf8");
const stage = readFileSync("src/components/marketing/public-living-universe-stage.tsx", "utf8");

describe("public action-first Living Universe", () => {
  it("puts the action-first stage on the page people land on", () => {
    expect(page).toContain("PublicLivingGateway");
    expect(page).not.toContain("<PublicLivingUniverse />");
    expect(gateway).toContain('data-living-universe-stage="true"');
    expect(gateway).toContain("PublicLivingUniverseObjectStage");
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

  it("keeps each offered Path governed without shipping a dead second selector", () => {
    for (const action of PUBLIC_LIVING_UNIVERSE_ACTIONS) {
      const path = klinikosPathCatalog.find((candidate) => candidate.id === action.pathId);
      expect(path?.governance.length, `${action.pathId}: no governance sentence`).toBeGreaterThan(20);
    }
    expect(existsSync("src/components/marketing/public-living-universe.tsx")).toBe(false);
    expect(stage).not.toContain("PublicLivingUniverseStage");
    expect(stage).not.toContain("setSelectedId");
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
