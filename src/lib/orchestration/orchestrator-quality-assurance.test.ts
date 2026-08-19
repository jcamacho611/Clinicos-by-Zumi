import { describe, expect, it } from "vitest";
import type { ActorContext } from "@/lib/orchestration/contracts";
import { orchestrateQualityAssurance } from "@/lib/orchestration/orchestrator";
import type { GovernedRuleEvaluation } from "@/lib/orchestration/rules-evidence-engine";

const now = new Date("2026-08-18T12:00:00Z");

function context(overrides: Partial<ActorContext> = {}): ActorContext {
  return {
    actorId: "user-1",
    actorKind: "user",
    userId: "user-1",
    organizationId: "org-a",
    contextKind: "clinic",
    roleKeys: ["clinic_owner", "owner"],
    permissionKeys: ["quality:read", "quality:update", "quality:manage"],
    ...overrides,
  };
}

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
    organizationId: "org-a",
    status: "gap",
    riskClass: "review",
    applicable: true,
    matchedEvidenceRefs: [],
    expiredEvidenceRefs: [],
    missingEvidenceKeys: ["followup"],
    reasons: ["Follow-up evidence is missing."],
    ownerRoleKeys: ["quality"],
    dueAt: new Date("2026-08-20T12:00:00Z"),
    evaluatedAt: now,
    ...overrides,
  };
}

describe("trusted quality assurance orchestration", () => {
  it("fails closed when the active context cannot read quality state", () => {
    const result = orchestrateQualityAssurance({
      context: context({ roleKeys: ["front_desk"], permissionKeys: [] }),
      evaluations: [evaluation()],
      internalQualityCapabilityAvailable: true,
      now,
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(["Quality assurance access is not authorized for the active context."]);
    expect(result.value).toBeUndefined();
  });

  it("excludes another tenant before producing a Zumi-ready snapshot or action", () => {
    const result = orchestrateQualityAssurance({
      context: context(),
      evaluations: [
        evaluation(),
        evaluation({ id: "other:patient-secret", organizationId: "org-b", subjectId: "patient-secret" }),
      ],
      internalQualityCapabilityAvailable: true,
      now,
    });

    expect(result.ok).toBe(true);
    expect(result.value?.snapshot.evaluated).toBe(1);
    expect(result.value?.nextActions).toHaveLength(1);
    expect(result.warnings[0]).toContain("1 out-of-scope or unscoped");
    expect(JSON.stringify(result.value)).not.toContain("patient-secret");
  });

  it("routes internal quality remediation through permission-gated quality capability", () => {
    const result = orchestrateQualityAssurance({
      context: context(),
      evaluations: [evaluation()],
      internalQualityCapabilityAvailable: true,
      now,
    });

    expect(result.ok).toBe(true);
    expect(result.value?.expertNeeds).toEqual([]);
    expect(result.value?.nextActions[0]).toMatchObject({
      capabilityKey: "quality.assurance.manage",
      href: "/tasks",
      state: "recommended",
    });
  });

  it("keeps regulated closure in human review even when the caller has quality:manage", () => {
    const result = orchestrateQualityAssurance({
      context: context(),
      evaluations: [evaluation({
        id: "review:patient-1",
        status: "review_required",
        riskClass: "regulated",
        missingEvidenceKeys: [],
        matchedEvidenceRefs: ["encounter:123"],
      })],
      internalQualityCapabilityAvailable: true,
      now,
    });

    expect(result.ok).toBe(true);
    expect(result.value?.nextActions[0].capabilityKey).toBe("quality.assurance.review");
    expect(result.value?.nextActions[0].state).toBe("review_required");
    expect(result.value?.blockers.some((blocker) => blocker.code === "human_review_required")).toBe(true);
  });

  it("blocks review for a user who can update quality work but cannot manage review", () => {
    const result = orchestrateQualityAssurance({
      context: context({ roleKeys: ["provider"], permissionKeys: ["quality:read", "quality:update"] }),
      evaluations: [evaluation({ status: "review_required", riskClass: "regulated", missingEvidenceKeys: [], matchedEvidenceRefs: ["doc:1"] })],
      internalQualityCapabilityAvailable: true,
      now,
    });

    expect(result.ok).toBe(true);
    expect(result.value?.nextActions[0].state).toBe("blocked");
    expect(result.value?.blockers.some((blocker) => blocker.code === "missing_permission:quality:manage")).toBe(true);
  });

  it("escalates to a deduplicated Expert Grid need only when internal capability is unavailable", () => {
    const result = orchestrateQualityAssurance({
      context: context(),
      evaluations: [
        evaluation({ id: "rule-1:patient-1:2026.1", subjectId: "patient-1" }),
        evaluation({ id: "rule-1:patient-2:2026.1", subjectId: "patient-2", riskClass: "regulated" }),
      ],
      internalQualityCapabilityAvailable: false,
      jurisdictionKey: "US-NY",
      requiredExpertEvidenceKeys: ["quality-experience"],
      requiredAgreementEvidenceKeys: ["approved-expert-services-agreement"],
      now,
    });

    expect(result.ok).toBe(true);
    expect(result.value?.expertNeeds).toHaveLength(1);
    expect(result.value?.expertNeeds[0].requiredAgreementEvidenceKeys).toEqual(["approved-expert-services-agreement"]);
    expect(result.value?.nextActions).toHaveLength(1);
    expect(result.value?.nextActions[0]).toMatchObject({
      capabilityKey: "grid.request.create",
      href: "/grid/requests",
      state: "recommended",
    });
    const serialized = JSON.stringify(result.value?.expertNeeds);
    expect(serialized).not.toContain("patient-1");
    expect(serialized).not.toContain("patient-2");
    expect(serialized).not.toContain("followup");
  });

  it("requires an active organization context", () => {
    const result = orchestrateQualityAssurance({
      context: context({ organizationId: null }),
      evaluations: [evaluation()],
      internalQualityCapabilityAvailable: true,
      now,
    });

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("active organization context");
  });
});
