import { describe, expect, it } from "vitest";
import {
  qualityGuardianBrief,
  qualityGuardianNextActions,
  qualityGuardianReviewItem,
  qualityGuardianSnapshot,
} from "@/lib/orchestration/quality-guardian-engine";
import type { GovernedRuleEvaluation } from "@/lib/orchestration/rules-evidence-engine";

const now = new Date("2026-08-18T12:00:00Z");

function evaluation(overrides: Partial<GovernedRuleEvaluation> = {}): GovernedRuleEvaluation {
  return {
    id: "rule-1:patient-1:2026.1",
    ruleId: "rule-1",
    ruleKey: "quality.generic",
    ruleVersion: "2026.1",
    ruleTitle: "Generic quality requirement",
    domain: "quality",
    subjectType: "patient",
    subjectId: "patient-1",
    organizationId: "org-1",
    status: "gap",
    riskClass: "review",
    applicable: true,
    matchedEvidenceRefs: [],
    expiredEvidenceRefs: [],
    missingEvidenceKeys: ["required-evidence"],
    reasons: ["1 evidence requirement(s) remain unsatisfied."],
    ownerRoleKeys: ["quality"],
    dueAt: new Date("2026-08-20T12:00:00Z"),
    evaluatedAt: now,
    ...overrides,
  };
}

describe("Zumi Quality Guardian orchestration", () => {
  it("summarizes gaps, review work, due-soon work, and overdue work without inventing completion", () => {
    const snapshot = qualityGuardianSnapshot([
      evaluation(),
      evaluation({ id: "review", status: "review_required", missingEvidenceKeys: [], matchedEvidenceRefs: ["doc:1"] }),
      evaluation({ id: "done", status: "satisfied", dueAt: null, missingEvidenceKeys: [] }),
      evaluation({ id: "late", dueAt: new Date("2026-08-10T12:00:00Z") }),
      evaluation({ id: "n/a", applicable: false, status: "not_applicable", dueAt: null }),
    ], now);

    expect(snapshot).toEqual({
      evaluated: 5,
      applicable: 4,
      satisfied: 1,
      openGaps: 2,
      reviewRequired: 1,
      overdue: 1,
      dueSoon: 2,
    });
  });

  it("turns open quality work into prioritized Klinikos next actions", () => {
    const actions = qualityGuardianNextActions([
      evaluation({ id: "routine", riskClass: "review", dueAt: new Date("2026-10-01T00:00:00Z") }),
      evaluation({ id: "urgent", riskClass: "regulated", dueAt: new Date("2026-08-17T00:00:00Z") }),
      evaluation({ id: "done", status: "satisfied", missingEvidenceKeys: [], dueAt: null }),
    ], now);

    expect(actions).toHaveLength(2);
    expect(actions[0].sourceId).toBe("urgent");
    expect(actions[0].capabilityKey).toBe("quality.resolve");
    expect(actions[0].blockers).toEqual(["Missing evidence: required-evidence"]);
  });

  it("creates a human-review queue item only when deterministic policy requires review", () => {
    expect(qualityGuardianReviewItem({ evaluation: evaluation(), requestedBy: "zumi-system", now })).toBeNull();

    const item = qualityGuardianReviewItem({
      evaluation: evaluation({ status: "review_required", riskClass: "regulated", matchedEvidenceRefs: ["encounter:123"], missingEvidenceKeys: [] }),
      requestedBy: "zumi-system",
      reviewerId: "quality-reviewer-1",
      now,
    });

    expect(item?.state).toBe("pending");
    expect(item?.assignedTo).toBe("quality-reviewer-1");
    expect(item?.evidenceRefs).toEqual(["encounter:123"]);
    expect(item?.actionKey).toBe("quality.rule.close");
  });

  it("produces a Zumi-ready brief from deterministic evaluation results", () => {
    const brief = qualityGuardianBrief([
      evaluation({ id: "a" }),
      evaluation({ id: "b", status: "satisfied", missingEvidenceKeys: [], dueAt: null }),
    ], now);

    expect(brief.needsAttention).toBe(1);
    expect(brief.highestPriorityAction?.sourceId).toBe("a");
  });
});
