import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const shell = read("src/components/clinic/app-shell.tsx");
const rail = read("src/components/clinic/home-operating-rail.tsx");
const railRepository = read("src/lib/home/operating-rail.ts");

describe("authenticated action center", () => {
  it("wires the former decorative bell to the real persisted operating rail", () => {
    // The bell pointed at an anchor on Home. That was better than a decorative icon,
    // but it meant the action centre was a section competing with the briefing rather
    // than a place you can go, link to, or come back to. It is now a real surface.
    expect(shell).toContain('href="/action-center"');
    expect(shell).toContain('aria-label="Open action center"');
    expect(shell).not.toContain('aria-label="Notifications"');
    expect(shell).not.toContain('href="/dashboard#action-center"');
    // Home keeps its own operating section; the two are no longer the same thing.
    expect(rail).toContain('id="action-center"');
  });

  it("keeps action-center truth backed by persisted tasks, Grid offers, and escalations", () => {
    expect(railRepository).toContain('db.task.count');
    expect(railRepository).toContain('FROM "GridOfferRecord"');
    expect(railRepository).toContain('db.escalation.count');
    expect(railRepository).toContain('opportunity: HomeOpportunity | null');
    expect(rail).toContain("Klinikos leaves the space quiet instead of inventing an opportunity.");
  });
});
