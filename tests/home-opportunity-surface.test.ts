import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(join(process.cwd(), "src/app/(platform)/dashboard/page.tsx"), "utf8");
const rail = readFileSync(join(process.cwd(), "src/lib/home/operating-rail.ts"), "utf8");

const livingHome = readFileSync(join(process.cwd(), "src/components/clinic/living-home.tsx"), "utf8");
const operations = readFileSync(join(process.cwd(), "src/components/clinic/living-home-operations.tsx"), "utf8");

describe("Living Home opportunity truth", () => {
  it("shows no role-template opportunity anywhere on Home", () => {
    // This was previously enforced by hiding the stale section with a CSS selector at
    // composition time. The section no longer exists: Home renders the server-owned
    // rail's opportunity directly, and an honest empty state when there is none, so
    // there is nothing left to hide. The guard follows the outcome — a role-derived
    // opportunity must not reach the surface — rather than the mechanism.
    const surface = livingHome + operations;
    expect(surface).not.toContain("opportunityForRole");
    expect(surface).not.toContain("Put unused capacity to work.");
    expect(surface).toContain("Nothing is open right now.");

    // The opportunity Home does render comes from the server rail, not from the role.
    expect(dashboard).toContain("opportunity={rail.opportunity}");
    expect(dashboard).toContain("getHomeOperatingRail(session)");
  });

  it("allows a live opportunity only from persisted Grid offers, escalations, or tasks", () => {
    expect(rail).toContain('kind: "grid_offer_decision"');
    expect(rail).toContain('kind: "open_escalation"');
    expect(rail).toContain('kind: "open_task"');
    expect(rail).toContain("let opportunity: HomeOpportunity | null = null");
  });
});
