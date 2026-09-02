import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExpertEngagementTerms } from "@/lib/orchestration/expert-engagement-engine";

const requestFindUnique = vi.fn();
const relationshipFindUnique = vi.fn();
const engagementCreate = vi.fn();
const eventCreate = vi.fn();

const tx = {
  expertSupportRequest: { findUnique: (...args: unknown[]) => requestFindUnique(...args) },
  personRelationship: { findUnique: (...args: unknown[]) => relationshipFindUnique(...args) },
  expertEngagement: { create: (...args: unknown[]) => engagementCreate(...args) },
  expertEngagementEvent: { create: (...args: unknown[]) => eventCreate(...args) },
};

const transaction = vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: (callback: (client: typeof tx) => unknown) => transaction(callback),
  },
}));

const { createExpertEngagementRecord } = await import("@/lib/repositories/expert-engagement-repository");

const now = new Date("2026-09-02T04:40:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  requestFindUnique.mockResolvedValue({
    id: "request_1",
    organizationId: "org_1",
    status: "submitted",
    capabilityDomain: "quality",
  });
  relationshipFindUnique.mockResolvedValue({
    id: "relationship_1",
    personId: "person_expert",
    organizationId: null,
    relationshipType: "expert",
    status: "active",
    verificationState: "verified",
  });
  engagementCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({ id: "engagement_1", ...data, createdAt: now, updatedAt: now }),
  );
  eventCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({ id: "event_1", ...data, createdAt: now }),
  );
});

describe("Expert Grid proposal authority hardening", () => {
  it("never accepts caller-supplied acceptance, conflict-clearance, agreement, or scoped-authorization facts at proposal creation", async () => {
    const callerClaimedApprovedTerms: ExpertEngagementTerms = {
      organizationAccepted: true,
      expertAccepted: true,
      conflictCleared: true,
      purpose: "Review the clinic quality workflow.",
      startsAt: new Date("2026-09-03T13:00:00.000Z"),
      endsAt: new Date("2026-09-03T15:00:00.000Z"),
      allowedCapabilityKeys: ["quality_documentation_review"],
      allowedResourceTypes: ["quality_case"],
      dataAccessClass: "phi",
      minimumNecessaryFields: ["measure_status"],
      agreementEvidenceRefs: {
        organizationAgreement: "evidence://caller-supplied/org",
        expertAgreement: "evidence://caller-supplied/expert",
      },
      scopedAuthorizationApprovedBy: "person_owner",
      scopedAuthorizationApprovedAt: now,
    };

    const result = await createExpertEngagementRecord({
      organizationId: "org_1",
      sourceRequestId: "request_1",
      expertPersonId: "person_expert",
      expertRelationshipId: "relationship_1",
      matchEligible: true,
      terms: callerClaimedApprovedTerms,
      createdByPersonId: "person_owner",
      occurredAt: now,
    });

    expect(engagementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationAccepted: false,
        expertAccepted: false,
        conflictCleared: false,
        agreementEvidenceRefs: {},
        scopedAuthorizationApprovedBy: null,
        scopedAuthorizationApprovedAt: null,
        dataAccessClass: "phi",
      }),
    });

    expect(eventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        snapshot: expect.objectContaining({
          organizationAccepted: false,
          expertAccepted: false,
          conflictCleared: false,
          agreementEvidenceRefs: {},
          scopedAuthorizationApprovedBy: null,
          scopedAuthorizationApprovedAt: null,
          grantsDataAccess: false,
        }),
      }),
    });

    expect(result.grantsDataAccess).toBe(false);
  });
});
