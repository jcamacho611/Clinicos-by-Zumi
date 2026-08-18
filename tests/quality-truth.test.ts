import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicRole } from "@/lib/auth/rbac";

const measureFindMany = vi.fn();
const gapFindMany = vi.fn();
const statusGroupBy = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    qualityMeasure: { findMany: (...a: unknown[]) => measureFindMany(...a) },
    qualityGap: { findMany: (...a: unknown[]) => gapFindMany(...a) },
    patientQualityStatus: { groupBy: (...a: unknown[]) => statusGroupBy(...a) },
  },
}));

const { getQualityPicture } = await import("@/lib/quality/quality-attention");

const owner = { organizationId: "org-1", role: "clinic_owner" as ClinicRole };

beforeEach(() => {
  measureFindMany.mockReset().mockResolvedValue([]);
  gapFindMany.mockReset().mockResolvedValue([]);
  statusGroupBy.mockReset().mockResolvedValue([]);
});

describe("quality reports rows, not invented numbers", () => {
  it("distinguishes 'not measured' from 'nothing open'", async () => {
    // The screen this replaces showed 78% compliance and 30 open gaps on an
    // organization whose quality tables are empty. "Unmeasured" and "clean" are
    // different facts and a clinic owner has to be able to tell them apart.
    const picture = await getQualityPicture(owner);
    expect(picture.configured).toBe(false);
    expect(picture.everythingCurrent).toBe(false);
    expect(picture.attention).toEqual([]);
    // Nothing was invented to fill the space.
    expect(picture.measures).toEqual([]);
  });

  it("reports everything current only when measures exist and no gap is open", async () => {
    measureFindMany.mockResolvedValue([{ id: "m1", name: "Diabetes follow-up" }]);
    const picture = await getQualityPicture(owner);
    expect(picture.configured).toBe(true);
    expect(picture.everythingCurrent).toBe(true);
  });

  it("counts open gaps per measure and names the records the count came from", async () => {
    measureFindMany.mockResolvedValue([{ id: "m1", name: "Diabetes follow-up" }]);
    gapFindMany.mockResolvedValue([
      { id: "g1", measureId: "m1", dueAt: null, impact: "high" },
      { id: "g2", measureId: "m1", dueAt: null, impact: "medium" },
    ]);
    const picture = await getQualityPicture(owner);

    expect(picture.attention).toHaveLength(1);
    const item = picture.attention[0];
    expect(item.count).toBe(2);
    // A count that cannot produce its records is an assertion, not evidence.
    expect(item.recordIds).toEqual(["g1", "g2"]);
    expect(item.count).toBe(item.recordIds.length);
    expect(item.action.href).toContain("m1");
  });

  it("treats an overdue gap as critical and dates it from the earliest one", async () => {
    const now = new Date("2026-03-10T00:00:00Z");
    measureFindMany.mockResolvedValue([{ id: "m1", name: "Blood pressure" }]);
    gapFindMany.mockResolvedValue([
      { id: "g1", measureId: "m1", dueAt: new Date("2026-03-01T00:00:00Z"), impact: "low" },
      { id: "g2", measureId: "m1", dueAt: new Date("2026-03-08T00:00:00Z"), impact: "low" },
    ]);
    const picture = await getQualityPicture(owner, now);

    expect(picture.attention[0].severity).toBe("critical");
    expect(picture.attention[0].due).toEqual({ kind: "overdue", since: new Date("2026-03-01T00:00:00Z") });
    // Reporting the most recent due date would understate how long people have waited.
  });

  it("returns null measures for a role that cannot read quality, rather than zero", async () => {
    const picture = await getQualityPicture({ organizationId: "org-1", role: "contractor" });
    // Zero would claim this clinic is clean. Null says "you cannot see this", which is
    // the truth, and stops the query from running at all.
    expect(picture.measures).toBeNull();
    expect(measureFindMany).not.toHaveBeenCalled();
  });

  it("scopes every read to the caller's organization", async () => {
    measureFindMany.mockResolvedValue([{ id: "m1", name: "X" }]);
    await getQualityPicture(owner);
    for (const call of [measureFindMany, gapFindMany, statusGroupBy]) {
      expect(call).toHaveBeenCalled();
      const where = (call.mock.calls[0][0] as { where: { organizationId?: string } }).where;
      expect(where.organizationId).toBe("org-1");
    }
  });
});

describe("the quality surface carries no fabricated data", () => {
  const read = (relative: string) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");
  const source = read("src/components/clinic/workspaces/quality.tsx");
  const revenue = read("src/components/clinic/workspaces/revenue.tsx");
  // The rule is about what the surface renders. A comment explaining which invented
  // numbers were removed is documentation, not data, so comments are stripped before
  // matching — otherwise recording the fix would look identical to still shipping it.
  const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const sourceCode = stripComments(source);
  const revenueCode = stripComments(revenue);

  it("no longer ships the hardcoded measure table", () => {
    // The exact literals that used to be rendered as this clinic's own performance.
    for (const invented of ["rate: 74", "target: 80", '"78%"', "Diabetes A1C control", "qualityGaps"]) {
      expect(sourceCode, `quality surface still renders ${invented}`).not.toContain(invented);
      expect(revenueCode, `revenue workspace still renders ${invented}`).not.toContain(invented);
    }
  });

  it("says what an empty state means rather than showing a zeroed dashboard", () => {
    expect(source).toContain("No measures are configured.");
    expect(source).toContain("not zero gaps");
    expect(source).toContain("Everything is current.");
  });

  it("uses the shared design tokens rather than a generic grey palette", () => {
    expect(source).toContain("var(--text-primary)");
    expect(source).toContain("var(--surface-secondary)");
    expect(sourceCode).not.toMatch(/text-slate-\d|bg-slate-\d/);
  });

  it("does not rely on colour alone to say something is overdue", () => {
    expect(source).toContain("Overdue");
    expect(source).toContain("Needs review");
    expect(source).toContain("TriangleAlert");
  });
});
