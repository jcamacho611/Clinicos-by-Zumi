import { describe, expect, it } from "vitest";
import {
  evaluateExpertGridEligibility,
  expertGridEngagementRequiresScopedAccess,
  rankExpertGridMatches,
  type ExpertEngagementNeed,
  type ExpertGridProfile,
} from "@/lib/orchestration/expert-grid-engine";

function need(overrides: Partial<ExpertEngagementNeed> = {}): ExpertEngagementNeed {
  return {
    id: "need-quality-1",
    organizationId: "org-a",
    capabilityKey: "quality.audit.readiness",
    capabilityDomain: "quality",
    jurisdictionKey: "US-NY",
    remoteAllowed: true,
    onsiteLocationKey: "brooklyn",
    requiredEvidenceKeys: ["quality-experience"],
    requiredAgreementEvidenceKeys: ["approved-data-services-agreement"],
    requiredDataAccessClass: "limited_phi",
    urgency: "priority",
    maxPriceCents: 150000,
    ...overrides,
  };
}

function expert(overrides: Partial<ExpertGridProfile> = {}): ExpertGridProfile {
  return {
    id: "expert-1",
    participantId: "participant-1",
    organizationId: null,
    displayName: "Quality specialist",
    capabilityKeys: ["quality.audit.readiness"],
    capabilityDomains: ["quality"],
    jurisdictionKeys: ["US-NY"],
    verifiedEvidenceKeys: ["quality-experience"],
    available: true,
    remoteAvailable: true,
    onsiteLocationKeys: ["brooklyn"],
    approvedDataAccessClass: "limited_phi",
    conflictedOrganizationIds: [],
    outcomeScore: 0.9,
    completedEngagements: 18,
    priceCents: 100000,
    ...overrides,
  };
}

describe("Grid expert capability matching", () => {
  it("matches a verified expert when hard capability, jurisdiction, access, and conflict checks pass", () => {
    const result = evaluateExpertGridEligibility({ need: need(), expert: expert() });
    expect(result.eligible).toBe(true);
    expect(result.blockers).toEqual([]);
  });

  it("does not let reputation or price override missing hard evidence", () => {
    const blocked = expert({
      id: "blocked",
      verifiedEvidenceKeys: [],
      outcomeScore: 1,
      completedEngagements: 500,
      priceCents: 1,
    });
    const eligible = expert({ id: "eligible", outcomeScore: 0.2, completedEngagements: 1, priceCents: 140000 });

    const ranked = rankExpertGridMatches({ need: need(), experts: [blocked, eligible] });

    expect(ranked[0].id).toBe("eligible");
    expect(ranked[0].eligible).toBe(true);
    expect(ranked.find((match) => match.id === "blocked")?.eligible).toBe(false);
  });

  it("blocks conflict-of-interest matches", () => {
    const result = evaluateExpertGridEligibility({
      need: need(),
      expert: expert({ conflictedOrganizationIds: ["org-a"] }),
    });

    expect(result.eligible).toBe(false);
    expect(result.blockers).toContain("Conflict-of-interest policy blocks this organization match.");
  });

  it("blocks experts whose approved data-access class is below the engagement requirement", () => {
    const result = evaluateExpertGridEligibility({
      need: need({ requiredDataAccessClass: "phi" }),
      expert: expert({ approvedDataAccessClass: "deidentified" }),
    });

    expect(result.eligible).toBe(false);
    expect(result.blockers.some((blocker) => blocker.includes("below required phi"))).toBe(true);
  });

  it("keeps sensitive engagement access as a separate governed step after matching", () => {
    expect(expertGridEngagementRequiresScopedAccess(need())).toBe(true);
    expect(expertGridEngagementRequiresScopedAccess(need({ requiredDataAccessClass: "none" }))).toBe(false);
  });
});
