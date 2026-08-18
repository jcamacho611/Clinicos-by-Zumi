import { describe, expect, it } from "vitest";
import {
  qualityExpertEscalationReason,
  qualityExpertNeedFromEvaluation,
} from "@/lib/orchestration/quality-expert-routing-engine";
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
    organizationId: "org-a",
    status: "review_required",
    riskClass: "review",
    applicable: true,
    matchedEvidenceRefs: ["doc:1"],
    expiredEvidenceRefs: [],
    missingEvidenceKeys: [],
    reasons: ["Human review required."],
    ownerRoleKeys: ["quality"],
    dueAt: new Date("2026-08-20T12:00:00Z"),
    evaluatedAt: now,
    ...overrides,
  };
}

describe("Quality to Expert Grid routing", () => {
  it("creates an expert demand when the clinic lacks internal capability", () => {
    const need = qualityExpertNeedFromEvaluation({
      evaluation: evaluation(),
      internalCapabilityAvailable: false,
      jurisdictionKey: "US-NY",
      requiredExpertEvidenceKeys: ["quality-experience"],
      requiredDataAccessClass: "limited_phi",
      now,
    });

    expect(need).toMatchObject({
      organizationId: "org-a",
      capabilityKey: "quality.expert.review",
      capabilityDomain: "quality",
      jurisdictionKey: "US-NY",
      urgency: "priority",
      requiredDataAccessClass: "limited_phi",
    });
  });

  it("keeps work internal when the clinic already has capable staff", () => {
    expect(qualityExpertNeedFromEvaluation({
      evaluation: evaluation(),
      internalCapabilityAvailable: true,
      now,
    })).toBeNull();
  });

  it("does not create expert demand for satisfied or non-applicable rules", () => {
    expect(qualityExpertNeedFromEvaluation({
      evaluation: evaluation({ status: "satisfied" }),
      internalCapabilityAvailable: false,
      now,
    })).toBeNull();

    expect(qualityExpertNeedFromEvaluation({
      evaluation: evaluation({ status: "not_applicable", applicable: false }),
      internalCapabilityAvailable: false,
      now,
    })).toBeNull();
  });

  it("does not attach patient facts or evidence references to the Grid demand", () => {
    const need = qualityExpertNeedFromEvaluation({
      evaluation: evaluation({ matchedEvidenceRefs: ["secret:patient-document"] }),
      internalCapabilityAvailable: false,
      now,
    });

    expect(JSON.stringify(need)).not.toContain("secret:patient-document");
    expect(JSON.stringify(need)).not.toContain("patient-1");
  });

  it("explains why expert escalation exists", () => {
    expect(qualityExpertEscalationReason(evaluation())).toContain("Authorized expert review");
    expect(qualityExpertEscalationReason(evaluation({ status: "gap", missingEvidenceKeys: ["a", "b"] }))).toContain("2 governed evidence requirement");
  });
});
