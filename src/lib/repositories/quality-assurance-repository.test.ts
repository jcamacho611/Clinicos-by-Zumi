import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";

const qualityGapFindMany = vi.fn();
const qualityMeasureFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    qualityGap: { findMany: (...args: unknown[]) => qualityGapFindMany(...args) },
    qualityMeasure: { findMany: (...args: unknown[]) => qualityMeasureFindMany(...args) },
  },
}));

const { loadPersistedActiveQualityGapEvaluations } = await import("@/lib/repositories/quality-assurance-repository");

const now = new Date("2026-08-18T12:00:00Z");

function session(role: ClinicSession["role"] = "quality"): ClinicSession {
  return {
    sessionId: "session-1",
    userId: "user-1",
    organizationId: "org-a",
    organizationName: "Clinic A",
    organizationSlug: "clinic-a",
    email: "quality@example.invalid",
    name: "Quality User",
    role,
    demo: true,
    expiresAt: now.getTime() + 60_000,
  };
}

function gap(overrides: Record<string, unknown> = {}) {
  return {
    id: "gap-1",
    organizationId: "org-a",
    patientId: "patient-secret",
    measureId: "measure-1",
    dueAt: new Date("2026-08-20T12:00:00Z"),
    impact: "high",
    status: "open",
    closedAt: null,
    createdAt: new Date("2026-08-01T12:00:00Z"),
    updatedAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  qualityGapFindMany.mockReset().mockResolvedValue([]);
  qualityMeasureFindMany.mockReset().mockResolvedValue([]);
});

describe("persisted QualityGap assurance adapter", () => {
  it("fails closed before touching the database when the role cannot read quality", async () => {
    const result = await loadPersistedActiveQualityGapEvaluations(session("front_desk"));

    expect(result.authorized).toBe(false);
    expect(result.evaluations).toEqual([]);
    expect(qualityGapFindMany).not.toHaveBeenCalled();
  });

  it("queries only the active organization's unresolved persisted gap backlog", async () => {
    qualityGapFindMany.mockResolvedValue([gap()]);
    qualityMeasureFindMany.mockResolvedValue([{
      id: "measure-1",
      organizationId: "org-a",
      key: "quality.internal.followup",
      name: "Internal follow-up quality measure",
      version: "2026.1",
      definition: {},
      status: "active",
      createdAt: now,
      updatedAt: now,
    }]);

    const result = await loadPersistedActiveQualityGapEvaluations(session("quality"));

    expect(result.authorized).toBe(true);
    expect(result.complete).toBe(true);
    expect(result.evaluations).toHaveLength(1);
    expect(result.evaluations[0]).toMatchObject({
      organizationId: "org-a",
      subjectId: "patient-secret",
      ruleKey: "quality.internal.followup",
      ruleVersion: "2026.1",
      status: "gap",
      riskClass: "review",
    });
    expect(qualityGapFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { organizationId: "org-a", status: { not: "closed" } },
      take: 2001,
    }));
    expect(qualityMeasureFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ organizationId: "org-a" }),
    }));
    expect(result.warnings[0]).toContain("persisted active QualityGap backlog");
  });

  it("refuses to produce a partial aggregate when the bounded loader would truncate", async () => {
    qualityGapFindMany.mockResolvedValue(Array.from({ length: 2001 }, (_, index) => gap({ id: `gap-${index}` })));

    const result = await loadPersistedActiveQualityGapEvaluations(session("quality"));

    expect(result.complete).toBe(false);
    expect(result.evaluations).toEqual([]);
    expect(result.warnings[0]).toContain("exceeds the bounded 2000-record");
    expect(qualityMeasureFindMany).not.toHaveBeenCalled();
  });

  it("keeps an unresolved gap visible when its measure mapping is missing", async () => {
    qualityGapFindMany.mockResolvedValue([gap({ measureId: "missing-measure" })]);
    qualityMeasureFindMany.mockResolvedValue([]);

    const result = await loadPersistedActiveQualityGapEvaluations(session("quality"));

    expect(result.complete).toBe(true);
    expect(result.evaluations[0].ruleKey).toBe("legacy.unmapped.missing-measure");
    expect(result.evaluations[0].ruleTitle).toBe("Unmapped persisted quality gap");
    expect(result.warnings.some((warning) => warning.includes("1 active quality gap"))).toBe(true);
  });

  it("does not elevate a persisted gap row into satisfied evidence", async () => {
    qualityGapFindMany.mockResolvedValue([gap({ status: "scheduled" })]);
    qualityMeasureFindMany.mockResolvedValue([]);

    const result = await loadPersistedActiveQualityGapEvaluations(session("quality"));

    expect(result.evaluations[0].status).toBe("gap");
    expect(result.evaluations[0].matchedEvidenceRefs).toEqual([]);
    expect(result.evaluations[0].reasons.join(" ")).toContain("does not by itself prove");
  });
});
