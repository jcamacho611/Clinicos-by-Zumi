import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicRole } from "@/lib/auth/rbac";

const findMany = vi.fn();
vi.mock("@/lib/db", () => ({ db: { appointment: { findMany: (...a: unknown[]) => findMany(...a) } } }));
const { getInsightsPicture } = await import("@/lib/insights/observations");

const owner = { organizationId: "org-1", role: "clinic_owner" as ClinicRole };
const now = new Date("2026-06-15T12:00:00Z");

/** n appointments spread across weekdays, so no single day looks quiet by accident. */
function spread(n: number, status = "COMPLETED") {
  return Array.from({ length: n }, (_, index) => ({
    startsAt: new Date(now.getTime() - (index + 1) * 86_400_000),
    status,
  }));
}

beforeEach(() => findMany.mockReset().mockResolvedValue([]));

describe("insights never describe a trend they cannot support", () => {
  it("separates 'not enough history' from 'nothing is wrong'", async () => {
    findMany.mockResolvedValue(spread(5));
    const picture = await getInsightsPicture(owner, now);
    // Six rows is an anecdote. Reporting a pattern from it is how a dashboard starts
    // lying on its first day, and an owner cannot tell by looking.
    expect(picture.baselineEstablished).toBe(false);
    expect(picture.observations).toEqual([]);
    expect(picture.sampleSize).toBe(5);
  });

  it("reports a clean read as a baseline that exists, not as missing data", async () => {
    findMany.mockResolvedValue(spread(30));
    const picture = await getInsightsPicture(owner, now);
    expect(picture.baselineEstablished).toBe(true);
  });

  it("shows the count behind every claim it makes", async () => {
    findMany.mockResolvedValue([...spread(20), ...spread(6, "NO_SHOW")]);
    const picture = await getInsightsPicture(owner, now);
    for (const observation of picture.observations ?? []) {
      // A conclusion a person cannot check is an assertion.
      expect(observation.evidence).toMatch(/\d/);
      expect(observation.headline.length).toBeGreaterThan(20);
    }
  });

  it("raises a no-show pattern only once it is above noise", async () => {
    findMany.mockResolvedValue([...spread(48), ...spread(1, "NO_SHOW")]);
    const rare = await getInsightsPicture(owner, now);
    expect(rare.observations?.some((observation) => observation.id === "no-show-rate")).toBe(false);

    findMany.mockResolvedValue([...spread(30), ...spread(10, "NO_SHOW")]);
    const common = await getInsightsPicture(owner, now);
    expect(common.observations?.some((observation) => observation.id === "no-show-rate")).toBe(true);
  });

  it("returns null rather than an empty page for a role that cannot read the data", async () => {
    const picture = await getInsightsPicture({ organizationId: "org-1", role: "contractor" }, now);
    // Zero observations would claim this clinic is clean to someone not allowed to know.
    expect(picture.observations).toBeNull();
    expect(findMany).not.toHaveBeenCalled();
  });

  it("scopes every read to the caller's organization and a bounded window", async () => {
    findMany.mockResolvedValue(spread(20));
    await getInsightsPicture(owner, now);
    const where = (findMany.mock.calls[0][0] as { where: { organizationId: string; startsAt: { gte: Date } } }).where;
    expect(where.organizationId).toBe("org-1");
    expect(where.startsAt.gte.getTime()).toBeLessThan(now.getTime());
  });

  it("invents no money, time or return figures", async () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/lib/insights/observations.ts"), "utf8");
    const surface = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/workspaces/insights.tsx"), "utf8");
    const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const fabricated of ["ROI", "revenueRecovered", "hoursSaved", "estimatedValue", "formatCurrency", "Cents"]) {
      expect(code(source), `observations compute ${fabricated}`).not.toContain(fabricated);
      expect(code(surface), `the surface renders ${fabricated}`).not.toContain(fabricated);
    }
    // A literal money figure. Matching a bare "$" would flag every template literal,
    // which is why this looks for a dollar sign against a number or an interpolation.
    for (const text of [code(source), code(surface)]) {
      expect(text).not.toMatch(/\$\s*\d/);
      expect(text).not.toMatch(/\$\$\{/);
    }
  });
});

describe("the insights surface is reachable and governed", () => {
  it("is a registered workspace with its own access rule", () => {
    const renderer = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/workspace-renderer.tsx"), "utf8");
    const rules = fs.readFileSync(path.join(process.cwd(), "src/lib/auth/workspace-authorization.ts"), "utf8");
    // Without both, /insights fell through the catch-all and 404'd for every role.
    expect(renderer).toContain('"insights"');
    expect(renderer).toContain("InsightsWorkspace");
    expect(rules).toContain("insights: { all:");
  });

  it("leads with a conclusion rather than a metric wall", () => {
    const surface = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/workspaces/insights.tsx"), "utf8");
    expect(surface).toContain("Klinikos noticed");
    expect(surface).toContain("Not enough history yet.");
    expect(surface).toContain("Nothing stands out.");
  });
});
