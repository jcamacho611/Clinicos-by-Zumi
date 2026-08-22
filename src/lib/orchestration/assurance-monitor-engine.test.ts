import { describe, expect, it } from "vitest";
import {
  assuranceEventsFromEvaluations,
  createAssuranceEvaluationJob,
  nextAssuranceRunAt,
  shouldReevaluateOnDomainEvent,
  type AssuranceMonitorPlan,
} from "@/lib/orchestration/assurance-monitor-engine";
import type { GovernedRuleEvaluation } from "@/lib/orchestration/rules-evidence-engine";

const now = new Date("2026-08-18T12:00:00Z");

function plan(overrides: Partial<AssuranceMonitorPlan> = {}): AssuranceMonitorPlan {
  return {
    id: "quality-plan-1",
    organizationId: "org-a",
    domains: ["quality"],
    ruleKeys: ["quality.generic"],
    enabled: true,
    cadenceMinutes: 60,
    sourceType: "hybrid",
    actorId: "zumi-system",
    ...overrides,
  };
}

function evaluation(overrides: Partial<GovernedRuleEvaluation> = {}): GovernedRuleEvaluation {
  return {
    id: "rule-1:patient-1:2026.1",
    ruleId: "rule-1",
    ruleKey: "quality.generic",
    ruleVersion: "2026.1",
    ruleTitle: "Generic requirement",
    domain: "quality",
    subjectType: "patient",
    subjectId: "patient-1",
    organizationId: "org-a",
    status: "gap",
    riskClass: "review",
    applicable: true,
    matchedEvidenceRefs: [],
    expiredEvidenceRefs: [],
    missingEvidenceKeys: ["evidence"],
    reasons: ["Missing evidence."],
    ownerRoleKeys: ["quality"],
    dueAt: new Date("2026-08-20T12:00:00Z"),
    evaluatedAt: now,
    ...overrides,
  };
}

describe("Klinikos assurance monitor", () => {
  it("creates a retry-bounded workflow job for an enabled plan", () => {
    const job = createAssuranceEvaluationJob({ plan: plan(), now });

    expect(job?.type).toBe("assurance.evaluate-rule-set");
    expect(job?.organizationId).toBe("org-a");
    expect(job?.state).toBe("queued");
    expect(job?.maxAttempts).toBe(4);
  });

  it("does not schedule a disabled plan", () => {
    expect(createAssuranceEvaluationJob({ plan: plan({ enabled: false }), now })).toBeNull();
  });

  it("enforces a minimum monitoring cadence", () => {
    expect(nextAssuranceRunAt(plan({ cadenceMinutes: 1 }), now).toISOString()).toBe("2026-08-18T12:05:00.000Z");
  });

  it("turns gaps into minimum-necessary operational events", () => {
    const events = assuranceEventsFromEvaluations({ evaluations: [evaluation()], actorId: "zumi-system", now });

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("assurance.gap_detected");
    expect(events[0].organizationId).toBe("org-a");
    expect(events[0].payload).toMatchObject({ ruleKey: "quality.generic", status: "gap" });
    expect(events[0].payload).not.toHaveProperty("facts");
  });

  it("supports event-driven reevaluation only inside the configured tenant and domain", () => {
    expect(shouldReevaluateOnDomainEvent({ plan: plan(), eventDomain: "quality", organizationId: "org-a" })).toBe(true);
    expect(shouldReevaluateOnDomainEvent({ plan: plan(), eventDomain: "revenue", organizationId: "org-a" })).toBe(false);
    expect(shouldReevaluateOnDomainEvent({ plan: plan(), eventDomain: "quality", organizationId: "org-b" })).toBe(false);
    expect(shouldReevaluateOnDomainEvent({ plan: plan({ sourceType: "scheduled" }), eventDomain: "quality", organizationId: "org-a" })).toBe(false);
  });
});
