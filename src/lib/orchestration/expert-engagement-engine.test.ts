import { describe, expect, it } from "vitest";
import {
  activateExpertEngagement,
  evaluateExpertEngagementReadiness,
  expertEngagementCompletion,
  scopedAccessGrantForActiveEngagement,
  type ExpertEngagement,
} from "@/lib/orchestration/expert-engagement-engine";
import type { ExpertEngagementNeed } from "@/lib/orchestration/expert-grid-engine";

const now = new Date("2026-08-18T12:00:00Z");

function need(overrides: Partial<ExpertEngagementNeed> = {}): ExpertEngagementNeed {
  return {
    id: "expert-need:org-a:quality.generic:2026.1",
    organizationId: "org-a",
    capabilityKey: "quality.expert.review",
    capabilityDomain: "quality",
    jurisdictionKey: "US-NY",
    remoteAllowed: true,
    onsiteLocationKey: null,
    requiredEvidenceKeys: ["quality-experience"],
    requiredAgreementEvidenceKeys: ["approved-data-services-agreement"],
    requiredDataAccessClass: "limited_phi",
    urgency: "priority",
    maxPriceCents: 150000,
    ...overrides,
  };
}

function engagement(overrides: Partial<ExpertEngagement> = {}): ExpertEngagement {
  return {
    id: "engagement-1",
    organizationId: "org-a",
    expertParticipantId: "expert-1",
    needId: "expert-need:org-a:quality.generic:2026.1",
    state: "proposed",
    terms: {
      organizationAccepted: true,
      expertAccepted: true,
      conflictCleared: true,
      purpose: "Review bounded quality exceptions for Clinic A.",
      startsAt: new Date("2026-08-18T11:00:00Z"),
      endsAt: new Date("2026-09-18T12:00:00Z"),
      allowedCapabilityKeys: ["quality.expert.review"],
      allowedResourceTypes: ["quality_evaluation", "supporting_document"],
      dataAccessClass: "limited_phi",
      minimumNecessaryFields: ["qualityStatus", "evidenceStatus"],
      agreementEvidenceRefs: { "approved-data-services-agreement": "agreement:1" },
      scopedAuthorizationApprovedBy: "owner-1",
      scopedAuthorizationApprovedAt: new Date("2026-08-18T11:30:00Z"),
    },
    createdAt: new Date("2026-08-18T10:00:00Z"),
    activatedAt: null,
    completedAt: null,
    ...overrides,
  };
}

describe("Expert Grid governed engagement", () => {
  it("requires match eligibility, bilateral terms, conflict clearance, purpose, agreements, and scoped access", () => {
    const result = evaluateExpertEngagementReadiness({ engagement: engagement(), need: need(), matchEligible: true, now });
    expect(result.ready).toBe(true);
    expect(result.blockers).toEqual([]);
  });

  it("blocks PHI-class activation without explicit scoped authorization", () => {
    const result = evaluateExpertEngagementReadiness({
      engagement: engagement({
        terms: {
          ...engagement().terms,
          scopedAuthorizationApprovedBy: null,
          scopedAuthorizationApprovedAt: null,
        },
      }),
      need: need(),
      matchEligible: true,
      now,
    });

    expect(result.ready).toBe(false);
    expect(result.blockers).toContain("Explicit scoped data-access authorization is required.");
  });

  it("blocks activation when a policy-required agreement evidence key is missing", () => {
    const result = evaluateExpertEngagementReadiness({
      engagement: engagement({ terms: { ...engagement().terms, agreementEvidenceRefs: {} } }),
      need: need(),
      matchEligible: true,
      now,
    });

    expect(result.ready).toBe(false);
    expect(result.blockers).toContain("Required agreement evidence is missing: approved-data-services-agreement.");
  });

  it("does not allow a wider data-access class than the approved Grid need", () => {
    const result = evaluateExpertEngagementReadiness({
      engagement: engagement({ terms: { ...engagement().terms, dataAccessClass: "phi" } }),
      need: need(),
      matchEligible: true,
      now,
    });

    expect(result.ready).toBe(false);
    expect(result.blockers).toContain("Engagement data-access class must exactly match the approved Grid need before activation.");
  });

  it("creates a bounded authorization envelope only after governed activation and revalidation", () => {
    expect(scopedAccessGrantForActiveEngagement({ engagement: engagement(), need: need(), matchEligible: true, now })).toBeNull();

    const activated = activateExpertEngagement({ engagement: engagement(), need: need(), matchEligible: true, now });
    expect(activated.activated).toBe(true);
    const grant = scopedAccessGrantForActiveEngagement({ engagement: activated.engagement, need: need(), matchEligible: true, now });

    expect(grant).toMatchObject({
      organizationId: "org-a",
      expertParticipantId: "expert-1",
      dataAccessClass: "limited_phi",
      capabilityKeys: ["quality.expert.review"],
    });
    expect(grant?.minimumNecessaryFields).toEqual(["qualityStatus", "evidenceStatus"]);
  });

  it("revokes access when current governed policy no longer validates the active engagement", () => {
    const active = { ...engagement(), state: "active" as const, activatedAt: now };

    expect(scopedAccessGrantForActiveEngagement({ engagement: active, need: need(), matchEligible: false, now })).toBeNull();
    expect(scopedAccessGrantForActiveEngagement({
      engagement: { ...active, terms: { ...active.terms, agreementEvidenceRefs: {} } },
      need: need(),
      matchEligible: true,
      now,
    })).toBeNull();
  });

  it("requires attributable deliverable evidence and preserves organization review", () => {
    const active = { ...engagement(), state: "active" as const, activatedAt: now };
    const missing = expertEngagementCompletion({ engagement: active, deliverableEvidenceRefs: [], requiresOrganizationReview: true, now });
    expect(missing.ok).toBe(false);

    const submitted = expertEngagementCompletion({
      engagement: active,
      deliverableEvidenceRefs: ["deliverable:1"],
      requiresOrganizationReview: true,
      now,
    });
    expect(submitted.ok).toBe(true);
    expect(submitted.engagement.state).toBe("review_required");
    expect(submitted.engagement.completedAt).toBeNull();
  });
});
