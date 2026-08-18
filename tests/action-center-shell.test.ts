import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const shell = read("src/components/clinic/app-shell.tsx");
const rail = read("src/components/clinic/home-operating-rail.tsx");
const railRepository = read("src/lib/home/operating-rail.ts");

describe("authenticated action center", () => {
  it("wires the former decorative bell to the real persisted operating rail", () => {
    expect(shell).toContain('href="/dashboard#action-center"');
    expect(shell).toContain('aria-label="Open action center"');
    expect(shell).not.toContain('aria-label="Notifications"');
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
