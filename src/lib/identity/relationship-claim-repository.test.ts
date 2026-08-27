import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  personFindMany: vi.fn(),
  personCreate: vi.fn(),
  membershipFindMany: vi.fn(),
  membershipFindFirst: vi.fn(),
  membershipUpsert: vi.fn(),
  membershipUpdate: vi.fn(),
  organizationFindFirst: vi.fn(),
  providerFindFirst: vi.fn(),
  providerUpdate: vi.fn(),
  claimFindFirst: vi.fn(),
  claimFindMany: vi.fn(),
  claimCreate: vi.fn(),
  claimUpdate: vi.fn(),
  taskCreate: vi.fn(),
  taskUpdateMany: vi.fn(),
  auditCreate: vi.fn(),
  authCredentialUpdate: vi.fn(),
  authSessionUpdate: vi.fn(),
}));

const tx = {
  user: { findUnique: mocks.userFindUnique, update: mocks.userUpdate },
  person: { findMany: mocks.personFindMany, create: mocks.personCreate },
  organizationMembership: {
    findMany: mocks.membershipFindMany,
    findFirst: mocks.membershipFindFirst,
    upsert: mocks.membershipUpsert,
    update: mocks.membershipUpdate,
  },
  organization: { findFirst: mocks.organizationFindFirst },
  provider: { findFirst: mocks.providerFindFirst, update: mocks.providerUpdate },
  relationshipClaim: {
    findFirst: mocks.claimFindFirst,
    findMany: mocks.claimFindMany,
    create: mocks.claimCreate,
    update: mocks.claimUpdate,
  },
  task: { create: mocks.taskCreate, updateMany: mocks.taskUpdateMany },
  auditLog: { create: mocks.auditCreate },
  authCredential: { update: mocks.authCredentialUpdate },
  authSession: { update: mocks.authSessionUpdate },
};

vi.mock("@/lib/db", () => ({
  db: {
    ...tx,
    $transaction: mocks.transaction,
  },
}));

async function loadRepository() {
  return vi.importActual<Record<string, unknown>>("@/lib/identity/relationship-claim-repository");
}

const claimantSession: ClinicSession = {
  sessionId: "session_claimant",
  userId: "user_claimant",
  organizationId: "org_home",
  organizationName: "Home Clinic",
  organizationSlug: "home-clinic",
  email: "claimant@example.test",
  name: "Claimant",
  role: "provider",
  demo: false,
  expiresAt: 2_000_000_000,
};

const reviewerSession: ClinicSession = {
  sessionId: "session_reviewer",
  userId: "user_reviewer",
  organizationId: "org_target",
  organizationName: "Target Clinic",
  organizationSlug: "target-clinic",
  email: "reviewer@example.test",
  name: "Reviewer",
  role: "clinic_owner",
  demo: false,
  expiresAt: 2_000_000_000,
};

function legacyUser(id = "user_claimant", organizationId = "org_home") {
  return {
    id,
    organizationId,
    email: id === "user_reviewer" ? "reviewer@example.test" : "claimant@example.test",
    name: id === "user_reviewer" ? "Reviewer" : "Claimant",
    roleKey: id === "user_reviewer" ? "clinic_owner" : "provider",
    status: "active",
  };
}

function primeUniversalIdentity(userId = "user_claimant", organizationId = "org_home") {
  mocks.userFindUnique.mockResolvedValue(legacyUser(userId, organizationId));
  mocks.membershipFindMany.mockResolvedValue([]);
  mocks.personFindMany.mockResolvedValue([]);
  mocks.personCreate.mockImplementation(async ({ data }) => data);
  mocks.membershipUpsert.mockImplementation(async ({ where, create }) => ({ id: where.id, ...create }));
}

function claimRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "claim_1",
    personId: "person_user_claimant",
    legacyUserId: "user_claimant",
    claimType: "organization_owner",
    targetType: "existing_organization",
    targetOrganizationId: "org_target",
    targetProviderId: null,
    claimedOrganizationName: null,
    claimedRoleKey: "clinic_owner",
    lifecycleStatus: "active",
    verificationStatus: "submitted",
    sourceType: "user_assertion",
    sourceReference: "session:session_claimant",
    submittedAt: new Date("2026-08-27T20:00:00.000Z"),
    reviewedAt: null,
    reviewedBy: null,
    reviewNote: null,
    rejectionReason: null,
    createdAt: new Date("2026-08-27T20:00:00.000Z"),
    updatedAt: new Date("2026-08-27T20:00:00.000Z"),
    ...overrides,
  };
}

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.transaction.mockImplementation(async (callback) => callback(tx));
});

describe("relationship claim repository", () => {
  it("submits an existing-organization claim for the exact authenticated user without mutating legacy authority", async () => {
    const repository = await loadRepository();
    const submit = repository.submitRelationshipClaim as (session: ClinicSession, input: unknown) => Promise<Record<string, unknown>>;

    primeUniversalIdentity();
    mocks.organizationFindFirst.mockResolvedValue({ id: "org_target", status: "active", name: "Target Clinic" });
    mocks.claimFindMany.mockResolvedValue([]);
    mocks.claimCreate.mockImplementation(async ({ data }) => claimRow(data));
    mocks.taskCreate.mockResolvedValue({ id: "task_1" });
    mocks.auditCreate.mockResolvedValue({ id: "audit_1" });

    const result = await submit(claimantSession, {
      claimType: "organization_owner",
      targetType: "existing_organization",
      targetOrganizationId: "org_target",
      claimedRoleKey: "clinic_owner",
    });

    expect(mocks.userFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "user_claimant" } }));
    expect(mocks.organizationFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "org_target", status: "active" },
    }));
    expect(mocks.claimCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        personId: "person_user_claimant",
        legacyUserId: "user_claimant",
        verificationStatus: "submitted",
        lifecycleStatus: "active",
      }),
    }));
    expect(mocks.membershipUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        personId: "person_user_claimant",
        organizationId: "org_target",
        membershipType: "organization_claimant",
        status: "pending_verification",
        sourceType: "relationship_claim",
      }),
    }));
    expect(mocks.taskCreate).toHaveBeenCalled();
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "identity.relationship_claim_submitted", resourceType: "relationship_claim" }),
    }));
    expect(mocks.userUpdate).not.toHaveBeenCalled();
    expect(mocks.authCredentialUpdate).not.toHaveBeenCalled();
    expect(mocks.authSessionUpdate).not.toHaveBeenCalled();
    expect(mocks.providerUpdate).not.toHaveBeenCalled();
    expect(result).toMatchObject({ id: "claim_1", verificationStatus: "submitted" });
  });

  it("returns an equivalent active claim deterministically and rejects conflicting active claims", async () => {
    const repository = await loadRepository();
    const submit = repository.submitRelationshipClaim as (session: ClinicSession, input: unknown) => Promise<Record<string, unknown>>;

    primeUniversalIdentity();
    mocks.organizationFindFirst.mockResolvedValue({ id: "org_target", status: "active", name: "Target Clinic" });
    mocks.claimFindMany.mockResolvedValue([claimRow()]);

    const existing = await submit(claimantSession, {
      claimType: "organization_owner",
      targetType: "existing_organization",
      targetOrganizationId: "org_target",
      claimedRoleKey: "clinic_owner",
    });
    expect(existing).toMatchObject({ id: "claim_1" });
    expect(mocks.claimCreate).not.toHaveBeenCalled();

    mocks.claimFindMany.mockResolvedValue([claimRow({ claimType: "organization_admin" })]);
    await expect(submit(claimantSession, {
      claimType: "organization_owner",
      targetType: "existing_organization",
      targetOrganizationId: "org_target",
      claimedRoleKey: "clinic_owner",
    })).rejects.toThrow(/conflict|review/i);
  });

  it("fails closed for unavailable targets, demo sessions, and ambiguous universal identity", async () => {
    const repository = await loadRepository();
    const submit = repository.submitRelationshipClaim as (session: ClinicSession, input: unknown) => Promise<Record<string, unknown>>;

    await expect(submit({ ...claimantSession, demo: true }, {
      claimType: "organization_owner",
      targetType: "existing_organization",
      targetOrganizationId: "org_target",
    })).rejects.toThrow(/demo|authenticated|production/i);

    primeUniversalIdentity();
    mocks.organizationFindFirst.mockResolvedValue(null);
    await expect(submit(claimantSession, {
      claimType: "organization_owner",
      targetType: "existing_organization",
      targetOrganizationId: "org_missing",
    })).rejects.toThrow(/organization|target|available/i);

    mocks.organizationFindFirst.mockResolvedValue({ id: "org_target", status: "active", name: "Target Clinic" });
    mocks.membershipFindMany.mockResolvedValue([{ personId: "person_a" }]);
    mocks.personFindMany.mockResolvedValue([{ id: "person_b", sourceType: "legacy_user", sourceReference: "user_claimant" }]);
    await expect(submit(claimantSession, {
      claimType: "organization_owner",
      targetType: "existing_organization",
      targetOrganizationId: "org_target",
    })).rejects.toThrow(/identity|person|ambiguous|review/i);
  });

  it("verifies only through an independently authorized reviewer in the target organization", async () => {
    const repository = await loadRepository();
    const review = repository.reviewRelationshipClaim as (session: ClinicSession, claimId: string, input: unknown) => Promise<Record<string, unknown>>;

    mocks.claimFindFirst.mockResolvedValue(claimRow({ verificationStatus: "in_review" }));
    mocks.userFindUnique.mockResolvedValue(legacyUser("user_reviewer", "org_target"));
    mocks.claimUpdate.mockImplementation(async ({ data }) => claimRow({ ...data }));
    mocks.membershipFindFirst.mockResolvedValue({ id: "orgclaim_1", personId: "person_user_claimant", organizationId: "org_target", membershipType: "organization_claimant", status: "pending_verification" });
    mocks.membershipUpdate.mockImplementation(async ({ data }) => ({ id: "orgclaim_1", ...data }));
    mocks.taskUpdateMany.mockResolvedValue({ count: 1 });
    mocks.auditCreate.mockResolvedValue({ id: "audit_review" });

    const result = await review(reviewerSession, "claim_1", { action: "verify", note: "Authority evidence reviewed." });

    expect(mocks.claimUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ verificationStatus: "verified", reviewedBy: "user_reviewer" }),
    }));
    expect(mocks.membershipUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ membershipType: "verified_organization_owner", status: "verified_relationship" }),
    }));
    expect(mocks.userUpdate).not.toHaveBeenCalled();
    expect(mocks.authSessionUpdate).not.toHaveBeenCalled();
    expect(result).toMatchObject({ id: "claim_1", verificationStatus: "verified" });
  });

  it("rejects self-review, cross-tenant review, and roles without identity manage authority", async () => {
    const repository = await loadRepository();
    const review = repository.reviewRelationshipClaim as (session: ClinicSession, claimId: string, input: unknown) => Promise<Record<string, unknown>>;

    mocks.claimFindFirst.mockResolvedValue(claimRow({ verificationStatus: "in_review" }));

    await expect(review({ ...reviewerSession, userId: "user_claimant" }, "claim_1", { action: "verify", note: "Self review" })).rejects.toThrow(/self|own claim|review/i);
    await expect(review({ ...reviewerSession, organizationId: "org_other" }, "claim_1", { action: "verify", note: "Wrong tenant" })).rejects.toThrow(/organization|tenant|target/i);
    await expect(review({ ...reviewerSession, role: "provider" }, "claim_1", { action: "verify", note: "No manage permission" })).rejects.toThrow(/permission|manage|review/i);
  });
});
