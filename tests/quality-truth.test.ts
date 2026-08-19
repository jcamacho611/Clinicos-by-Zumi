import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Quality must never report an unmeasured clinic as a clean one.
 *
 * The surface this once guarded rendered a dashboard written into the source —
 * "78% overall compliance", "30 open care gaps", named patients — on an organization
 * whose quality tables were empty. That surface is gone, replaced by the engine-backed
 * command centre, and this file now guards the property that mattered rather than the
 * implementation that carried it.
 *
 * An empty backlog means two entirely different things depending on whether anything is
 * being measured, and a gap count alone cannot tell them apart.
 */

const read = (relative: string) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");
const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const repository = read("src/lib/repositories/quality-command-center-repository.ts");
const surface = read("src/components/clinic/quality-command-center.tsx");

describe("quality reports rows, not invented performance", () => {
  it("counts configured measures so an unmeasured clinic is distinguishable from a clean one", () => {
    expect(repository).toContain("db.qualityMeasure.count");
    expect(repository).toContain("measuresConfigured");
    // Every return path carries it, including the unauthorized one — otherwise the
    // surface silently falls back to the "on top of the work" wording.
    const returns = repository.match(/coverage: "persisted_active_quality_gap_backlog"/g) ?? [];
    const carried = repository.match(/measuresConfigured/g) ?? [];
    expect(carried.length).toBeGreaterThanOrEqual(returns.length);
  });

  it("says nothing has been evaluated rather than nothing is wrong", () => {
    expect(surface).toContain("Quality is not being measured yet.");
    expect(surface).toContain("not the same as having no gaps");
  });

  it("reads real gap rows and scopes them to the organization", () => {
    expect(repository).toContain("db.qualityGap.findMany");
    expect(repository).toContain("organizationId: session.organizationId");
  });

  it("refuses the whole surface for a role without quality read", () => {
    expect(repository).toContain('can(session.role, "quality", "read")');
    expect(repository).toContain("not authorized for this role");
  });

  it("ships none of the fabricated figures the old surface rendered", () => {
    for (const invented of ["rate: 74", "target: 80", '"78%"', "Diabetes A1C control", "qualityGaps"]) {
      expect(code(surface), `the surface still renders ${invented}`).not.toContain(invented);
    }
    // And the file that carried them is gone rather than merely unwired.
    expect(fs.existsSync(path.join(process.cwd(), "src/components/clinic/workspaces/quality.tsx"))).toBe(false);
  });

  it("keeps exactly one quality surface wired", () => {
    // Two implementations existed briefly: one intercepted the route and the other was
    // dead code that still looked live in the renderer.
    const renderer = read("src/components/clinic/workspace-renderer.tsx");
    const route = read("src/app/(platform)/[workspace]/page.tsx");
    expect(renderer).not.toContain("QualityWorkspace");
    expect(route).toContain("QualityCommandCenter");
  });

  it("does not lead with rules-engine vocabulary", () => {
    for (const jargon in { "rules engine": 1, "evidence closure": 1, "capability registry": 1, "assurance monitor": 1 }) {
      expect(surface.toLowerCase(), `the surface leads with "${jargon}"`).not.toContain(jargon);
    }
  });
});
