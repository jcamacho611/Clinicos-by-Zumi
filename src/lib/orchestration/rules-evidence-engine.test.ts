import { describe, expect, it } from "vitest";
import {
  evaluateGovernedRule,
  type GovernedEvidenceRecord,
  type GovernedRuleDefinition,
} from "@/lib/orchestration/rules-evidence-engine";

const now = new Date("2026-08-18T12:00:00Z");

function rule(overrides: Partial<GovernedRuleDefinition> = {}): GovernedRuleDefinition {
  return {
    id: "rule-quality-1",
    key: "quality.generic.followup",
    version: "2026.1",
    title: "Generic quality follow-up evidence",
    description: "Synthetic rule used to prove deterministic Rules & Evidence behavior.",
    domain: "quality",
    authority: "organizational",
    sourceRef: "internal:test",
    subjectType: "patient",
    status: "active",
    effectiveFrom: new Date("2026-01-01T00:00:00Z"),
    effectiveTo: null,
    applicability: [{ factKey: "programEligible", operator: "equals", value: true }],
    evidenceRequirements: [{ key: "followup", label: "Follow-up evidence", evidenceTypes: ["followup_record"], maxAgeDays: 365 }],
    closureMode: "all",
    riskClass: "review",
    requiresHumanReview: false,
    ownerRoleKeys: ["quality"],
    ...overrides,
  };
}

function evidence(overrides: Partial<GovernedEvidenceRecord> = {}): GovernedEvidenceRecord {
  return {
    id: "evidence-1",
    subjectType: "patient",
    subjectId: "patient-1",
    organizationId: "org-1",
    evidenceType: "followup_record",
    sourceRef: "encounter:123",
    observedAt: new Date("2026-08-01T12:00:00Z"),
    expiresAt: null,
    attributes: {},
    verifiedBy: "user-1",
    ...overrides,
  };
}

describe("Klinikos Rules & Evidence engine", () => {
  it("does not create a gap when the rule is not applicable", () => {
    const result = evaluateGovernedRule({
      rule: rule(),
      subjectId: "patient-1",
      organizationId: "org-1",
      facts: { programEligible: false },
      evidence: [],
      now,
    });

    expect(result.status).toBe("not_applicable");
    expect(result.applicable).toBe(false);
    expect(result.missingEvidenceKeys).toEqual([]);
  });

  it("creates an explainable gap when applicable evidence is missing", () => {
    const result = evaluateGovernedRule({
      rule: rule(),
      subjectId: "patient-1",
      organizationId: "org-1",
      facts: { programEligible: true },
      evidence: [],
      now,
    });

    expect(result.status).toBe("gap");
    expect(result.missingEvidenceKeys).toEqual(["followup"]);
    expect(result.reasons[0]).toContain("remain unsatisfied");
  });

  it("satisfies a rule only from current matching evidence", () => {
    const result = evaluateGovernedRule({
      rule: rule(),
      subjectId: "patient-1",
      organizationId: "org-1",
      facts: { programEligible: true },
      evidence: [evidence()],
      now,
    });

    expect(result.status).toBe("satisfied");
    expect(result.matchedEvidenceRefs).toEqual(["encounter:123"]);
    expect(result.missingEvidenceKeys).toEqual([]);
  });

  it("does not let stale evidence silently close a current requirement", () => {
    const result = evaluateGovernedRule({
      rule: rule({ evidenceRequirements: [{ key: "followup", label: "Follow-up", evidenceTypes: ["followup_record"], maxAgeDays: 30 }] }),
      subjectId: "patient-1",
      organizationId: "org-1",
      facts: { programEligible: true },
      evidence: [evidence({ observedAt: new Date("2026-01-01T00:00:00Z"), sourceRef: "old:1" })],
      now,
    });

    expect(result.status).toBe("gap");
    expect(result.expiredEvidenceRefs).toEqual(["old:1"]);
    expect(result.missingEvidenceKeys).toEqual(["followup"]);
  });

  it("requires human review when deterministic evidence is complete but policy says review is mandatory", () => {
    const result = evaluateGovernedRule({
      rule: rule({ requiresHumanReview: true, riskClass: "regulated" }),
      subjectId: "patient-1",
      organizationId: "org-1",
      facts: { programEligible: true },
      evidence: [evidence()],
      now,
    });

    expect(result.status).toBe("review_required");
    expect(result.matchedEvidenceRefs).toEqual(["encounter:123"]);
  });

  it("keeps cross-organization and unscoped evidence from closing a tenant requirement", () => {
    const crossTenant = evaluateGovernedRule({
      rule: rule(),
      subjectId: "patient-1",
      organizationId: "org-1",
      facts: { programEligible: true },
      evidence: [evidence({ organizationId: "org-2" })],
      now,
    });
    const unscoped = evaluateGovernedRule({
      rule: rule(),
      subjectId: "patient-1",
      organizationId: "org-1",
      facts: { programEligible: true },
      evidence: [evidence({ organizationId: null })],
      now,
    });

    expect(crossTenant.status).toBe("gap");
    expect(crossTenant.matchedEvidenceRefs).toEqual([]);
    expect(unscoped.status).toBe("gap");
    expect(unscoped.matchedEvidenceRefs).toEqual([]);
  });

  it("treats alternative evidence requirements as satisfied when closure mode is any", () => {
    const alternativeRule = rule({
      closureMode: "any",
      evidenceRequirements: [
        { key: "encounter", label: "Encounter evidence", evidenceTypes: ["followup_record"] },
        { key: "external", label: "External evidence", evidenceTypes: ["external_record"] },
      ],
    });
    const result = evaluateGovernedRule({
      rule: alternativeRule,
      subjectId: "patient-1",
      organizationId: "org-1",
      facts: { programEligible: true },
      evidence: [evidence()],
      now,
    });

    expect(result.status).toBe("satisfied");
    expect(result.missingEvidenceKeys).toEqual([]);
  });
});
