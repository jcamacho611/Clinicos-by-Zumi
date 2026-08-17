import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(join(process.cwd(), "src/app/(platform)/dashboard/page.tsx"), "utf8");
const rail = readFileSync(join(process.cwd(), "src/lib/home/operating-rail.ts"), "utf8");

describe("Living Home opportunity truth", () => {
  it("suppresses the historical role-template opportunity in favor of the server-owned rail", () => {
    expect(dashboard).toContain("[&_[aria-labelledby=opportunity-title]]:hidden");
    expect(dashboard).toContain("<HomeOperatingRailPanel rail={operatingRail} />");
  });

  it("allows a live opportunity only from persisted Grid offers, escalations, or tasks", () => {
    expect(rail).toContain('kind: "grid_offer_decision"');
    expect(rail).toContain('kind: "open_escalation"');
    expect(rail).toContain('kind: "open_task"');
    expect(rail).toContain("let opportunity: HomeOpportunity | null = null");
  });
});
