import { describe, expect, it } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";
import type { GovernedRuleEvaluation } from "@/lib/orchestration/rules-evidence-engine";
import {
  resolveTrustedZumiQualityAssurance,
  trustedQualityAssuranceInstruction,
} from "@/features/zumi/trusted-orchestration";

const now = new Date("2026-08-18T12:00:00Z");

function session(role: ClinicSession["role"] = "quality"): ClinicSession {
  return {
    sessionId: "session-1",
    userId: "user-1",
    organizationId: "org-a",
    organizationName: "Clinic A",
    organizationSlug: "clinic-a",
    email: "quality@example.invalid",
    name: "Quality Reviewer",
    role,
    demo: true,
    expiresAt: now.getTime() + 60_000,
  };
}

function evaluation(overrides: Partial<GovernedRuleEvaluation> = {}): GovernedRuleEvaluation {
  return {
    id: "rule-1:patient-secret:2026.1",
    ruleId: "rule-1",
    ruleKey: "quality.generic",
    ruleVersion: "2026.1",
    ruleTitle: "Generic quality requirement",
    domain: "quality",
    subjectType: "patient",
    subjectId: "patient-secret",
    organizationId: "org-a",
    status: "gap",
    riskClass: "review",
    applicable: true,
    matchedEvidenceRefs: ["secret-evidence-ref"],
    expiredEvidenceRefs: [],
    missingEvidenceKeys: ["followup"],
    reasons: ["Follow-up evidence is missing."],
    ownerRoleKeys: ["quality"],
    // Relative to the real clock, because urgency is computed against it. An absolute
    // date here made the test decay: once 2026-08-20 passed, "priority" (due within a
    // week) silently became "urgent" (already overdue) and the failure looked like a
    // regression rather than a stale fixture.
    dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    evaluatedAt: now,
    ...overrides,
  };
}

describe("trusted Zumi Quality Guardian bridge", () => {
  it("returns aggregate/action state without subject ids or evidence references", () => {
    const result = resolveTrustedZumiQualityAssurance({
      session: session("quality"),
      evaluations: [evaluation()],
      internalQualityCapabilityAvailable: true,
    });

    expect(result.available).toBe(true);
    expect(result.snapshot?.openGaps).toBe(1);
    expect(result.nextActions[0].capabilityKey).toBe("quality.assurance.manage");
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("patient-secret");
    expect(serialized).not.toContain("secret-evidence-ref");
  });

  it("refuses quality state when the session role lacks quality read access", () => {
    const result = resolveTrustedZumiQualityAssurance({
      session: session("front_desk"),
      evaluations: [evaluation()],
      internalQualityCapabilityAvailable: true,
    });

    expect(result.available).toBe(false);
    expect(result.snapshot).toBeNull();
    expect(result.nextActions).toEqual([]);
  });

  it("surfaces only safe Expert Grid need metadata when internal capability is missing", () => {
    const result = resolveTrustedZumiQualityAssurance({
      session: session("clinic_owner"),
      evaluations: [evaluation()],
      internalQualityCapabilityAvailable: false,
      jurisdictionKey: "US-NY",
      requiredExpertEvidenceKeys: ["quality-experience"],
      requiredAgreementEvidenceKeys: ["approved-expert-services-agreement"],
    });

    expect(result.available).toBe(true);
    expect(result.expertNeeds).toEqual([
      {
        capabilityKey: "quality.expert.remediation",
        capabilityDomain: "quality",
        urgency: "priority",
        requiredDataAccessClass: "deidentified",
      },
    ]);
    expect(result.nextActions[0].capabilityKey).toBe("grid.request.create");
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("patient-secret");
    expect(serialized).not.toContain("approved-expert-services-agreement");
  });

  it("instructs the model not to reinterpret aggregate operational state as program compliance", () => {
    const result = resolveTrustedZumiQualityAssurance({
      session: session("quality"),
      evaluations: [evaluation()],
      internalQualityCapabilityAvailable: true,
    });
    const instruction = trustedQualityAssuranceInstruction(result);

    expect(instruction).toContain("open gaps=1");
    expect(instruction).toContain("not a blanket claim of CMS, NCQA, HEDIS");
    expect(instruction).not.toContain("patient-secret");
  });
});
