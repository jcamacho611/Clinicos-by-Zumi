import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";
import type { GovernedRuleEvaluation } from "@/lib/orchestration/rules-evidence-engine";

const loadPersisted = vi.fn();

vi.mock("@/lib/repositories/quality-assurance-repository", () => ({
  loadPersistedActiveQualityGapEvaluations: (...args: unknown[]) => loadPersisted(...args),
}));

const { isQualityGuardianQuestion, loadZumiQualityGuardianContext } = await import("@/features/zumi/quality-guardian-context");

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

function evaluation(): GovernedRuleEvaluation {
  return {
    id: "persisted-quality-gap:secret-gap",
    ruleId: "measure-1",
    ruleKey: "quality.internal.followup",
    ruleVersion: "2026.1",
    ruleTitle: "Internal follow-up quality measure",
    domain: "quality",
    subjectType: "patient",
    subjectId: "patient-secret",
    organizationId: "org-a",
    status: "gap",
    riskClass: "review",
    applicable: true,
    matchedEvidenceRefs: ["secret-evidence"],
    expiredEvidenceRefs: [],
    missingEvidenceKeys: ["persisted_quality_gap_evidence"],
    reasons: ["A persisted quality gap is open and requires governed follow-up."],
    ownerRoleKeys: ["quality"],
    dueAt: new Date("2026-08-20T12:00:00Z"),
    evaluatedAt: now,
  };
}

beforeEach(() => {
  loadPersisted.mockReset().mockResolvedValue({
    authorized: true,
    complete: true,
    evaluations: [evaluation()],
    warnings: ["Coverage is limited to the persisted active QualityGap backlog."],
    coverage: "persisted_active_quality_gap_backlog",
  });
});

describe("Zumi Quality Guardian context loader", () => {
  it("recognizes quality-specific questions without loading quality data for unrelated turns", async () => {
    expect(isQualityGuardianQuestion("How are our quality gaps looking? ")).toBe(true);
    expect(isQualityGuardianQuestion("What does HEDIS mean for us? ")).toBe(true);
    expect(isQualityGuardianQuestion("Show CMS quality measures")).toBe(true);
    expect(isQualityGuardianQuestion("Book a room in Brooklyn")).toBe(false);

    const unrelated = await loadZumiQualityGuardianContext({ session: session(), question: "Book a room in Brooklyn" });
    expect(unrelated).toBeNull();
    expect(loadPersisted).not.toHaveBeenCalled();
  });

  it("projects persisted gap state into safe aggregate quality context", async () => {
    const context = await loadZumiQualityGuardianContext({ session: session(), question: "What quality gaps need attention?" });

    expect(context?.requested).toBe(true);
    expect(context?.quality.available).toBe(true);
    expect(context?.quality.snapshot?.openGaps).toBe(1);
    expect(context?.quality.internalCapabilityAvailable).toBeNull();
    expect(context?.quality.expertNeeds).toEqual([]);
    expect(context?.quality.warnings.some((warning) => warning.includes("Expert Grid escalation was not attempted"))).toBe(true);
    const serialized = JSON.stringify(context);
    expect(serialized).not.toContain("patient-secret");
    expect(serialized).not.toContain("secret-evidence");
    expect(serialized).not.toContain("secret-gap");
  });

  it("returns an unavailable quality context rather than a partial aggregate when the loader is incomplete", async () => {
    loadPersisted.mockResolvedValue({
      authorized: true,
      complete: false,
      evaluations: [],
      warnings: ["The active quality-gap backlog exceeds the bounded loader."],
      coverage: "persisted_active_quality_gap_backlog",
    });

    const context = await loadZumiQualityGuardianContext({ session: session(), question: "Quality dashboard status" });

    expect(context?.quality.available).toBe(false);
    expect(context?.quality.snapshot).toBeNull();
    expect(context?.quality.warnings[0]).toContain("exceeds the bounded loader");
  });
});
