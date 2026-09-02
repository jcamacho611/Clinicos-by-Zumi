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

const now = new Date("2026-09-02T04:30:00.000Z");

const terms: ExpertEngagementTerms = {
  organizationAccepted: false,
  expertAccepted: false,
  conflictCleared: false,
  purpose: "Review the clinic's quality documentation workflow and produce a remediation memo.",
  startsAt: new Date("2026-09-03T13:00:00.000Z"),
  endsAt: new Date("2026-09-03T15:00:00.000Z"),
  allowedCapabilityKeys: ["quality_documentation_review"],
  allowedResourceTypes: [],
  dataAccessClass: "none",
  minimumNecessaryFields: [],
  agreementEvidenceRefs: {},
  scopedAuthorizationApprovedBy: null,
  scopedAuthorizationApprovedAt: null,
};

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

describe("durable Expert Grid engagement persistence", () => {
  it("persists a selected eligible expert as a proposed engagement and writes append-only creation history", async () => {
    const result = await createExpertEngagementRecord({
      organizationId: "org_1",
      sourceRequestId: "request_1",
      expertPersonId: "person_expert",
      expertRelationshipId: "relationship_1",
      matchEligible: true,
      terms,
      createdByPersonId: "person_owner",
      occurredAt: now,
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(engagementCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org_1",
        sourceRequestId: "request_1",
        expertPersonId: "person_expert",
        expertRelationshipId: "relationship_1",
        state: "proposed",
        version: 1,
        purpose: terms.purpose,
        dataAccessClass: "none",
      }),
    });
    expect(eventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        engagementId: "engagement_1",
        organizationId: "org_1",
        eventType: "created",
        previousState: null,
        nextState: "proposed",
        actorPersonId: "person_owner",
      }),
    });
    expect(result.state).toBe("proposed");
    expect(result.version).toBe(1);
    expect(result.grantsDataAccess).toBe(false);
  });

  it("fails closed when the selected expert did not pass deterministic Expert Grid eligibility", async () => {
    await expect(
      createExpertEngagementRecord({
        organizationId: "org_1",
        sourceRequestId: "request_1",
        expertPersonId: "person_expert",
        expertRelationshipId: "relationship_1",
        matchEligible: false,
        terms,
        createdByPersonId: "person_owner",
        occurredAt: now,
      }),
    ).rejects.toThrow("Expert Grid eligibility is required before an engagement may be proposed.");

    expect(transaction).not.toHaveBeenCalled();
    expect(engagementCreate).not.toHaveBeenCalled();
  });

  it("rejects cross-organization clinic demand before persistence", async () => {
    requestFindUnique.mockResolvedValue({
      id: "request_1",
      organizationId: "org_other",
      status: "submitted",
      capabilityDomain: "quality",
    });

    await expect(
      createExpertEngagementRecord({
        organizationId: "org_1",
        sourceRequestId: "request_1",
        expertPersonId: "person_expert",
        expertRelationshipId: "relationship_1",
        matchEligible: true,
        terms,
        createdByPersonId: "person_owner",
        occurredAt: now,
      }),
    ).rejects.toThrow("Expert support request does not belong to the engagement organization.");

    expect(engagementCreate).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("rejects an inactive, unverified, or mismatched expert Person relationship", async () => {
    relationshipFindUnique.mockResolvedValue({
      id: "relationship_1",
      personId: "person_other",
      relationshipType: "expert",
      status: "active",
      verificationState: "verified",
    });

    await expect(
      createExpertEngagementRecord({
        organizationId: "org_1",
        sourceRequestId: "request_1",
        expertPersonId: "person_expert",
        expertRelationshipId: "relationship_1",
        matchEligible: true,
        terms,
        createdByPersonId: "person_owner",
        occurredAt: now,
      }),
    ).rejects.toThrow("Expert relationship does not match the selected verified expert Person.");

    expect(engagementCreate).not.toHaveBeenCalled();
  });

  it("persists scope as proposal terms only; creation never manufactures a sensitive-data grant", async () => {
    const phiTerms: ExpertEngagementTerms = {
      ...terms,
      dataAccessClass: "phi",
      allowedResourceTypes: ["quality_case"],
      minimumNecessaryFields: ["measure_status"],
      scopedAuthorizationApprovedBy: "person_owner",
      scopedAuthorizationApprovedAt: now,
    };

    const result = await createExpertEngagementRecord({
      organizationId: "org_1",
      sourceRequestId: "request_1",
      expertPersonId: "person_expert",
      expertRelationshipId: "relationship_1",
      matchEligible: true,
      terms: phiTerms,
      createdByPersonId: "person_owner",
      occurredAt: now,
    });

    expect(result.dataAccessClass).toBe("phi");
    expect(result.grantsDataAccess).toBe(false);
    expect(engagementCreate).toHaveBeenCalledWith({
      data: expect.not.objectContaining({ accessGranted: true }),
    });
  });
});
