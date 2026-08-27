import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  personFindMany: vi.fn(),
  personCreate: vi.fn(),
  membershipFindMany: vi.fn(),
  membershipUpsert: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: mocks.userFindUnique },
    person: { findMany: mocks.personFindMany, create: mocks.personCreate },
    organizationMembership: {
      findMany: mocks.membershipFindMany,
      upsert: mocks.membershipUpsert,
    },
  },
}));

import {
  buildEffectiveRelationshipWhere,
  ensureOrganizationRelationshipForLegacyUser,
  IdentityRelationshipConflictError,
} from "./relationship-repository";

describe("relationship repository effective-date semantics", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it("requires active status and a relationship that has started but not ended", () => {
    const at = new Date("2026-08-22T12:00:00.000Z");

    expect(buildEffectiveRelationshipWhere(at)).toEqual({
      status: "active",
      effectiveFrom: { lte: at },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gt: at } },
      ],
    });
  });

  it("creates one compatibility person plus baseline and target relationships without changing legacy authority", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "user_1",
      organizationId: "org_home",
      email: "person@example.test",
      name: "Person One",
      roleKey: "administrator",
      status: "active",
    });
    mocks.membershipFindMany.mockResolvedValue([]);
    mocks.personFindMany.mockResolvedValue([]);
    mocks.personCreate.mockImplementation(async ({ data }) => data);
    mocks.membershipUpsert.mockImplementation(async ({ where, create }) => ({ id: where.id, ...create }));

    const result = await ensureOrganizationRelationshipForLegacyUser({
      userId: "user_1",
      organizationId: "org_grid",
      membershipType: "grid_contractor_applicant",
      roleKey: "contractor",
      status: "pending_approval",
      sourceType: "grid_contractor_enrollment",
      sourceReference: "provider_1",
    });

    expect(mocks.personCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        id: "person_user_1",
        sourceType: "legacy_user",
        sourceReference: "user_1",
      }),
    }));
    expect(mocks.membershipUpsert).toHaveBeenCalledTimes(2);
    expect(mocks.membershipUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        personId: "person_user_1",
        organizationId: "org_home",
        legacyUserId: "user_1",
        membershipType: "organization_user",
        roleKey: "administrator",
      }),
    }));
    expect(mocks.membershipUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        personId: "person_user_1",
        organizationId: "org_grid",
        legacyUserId: "user_1",
        membershipType: "grid_contractor_applicant",
        roleKey: "contractor",
        status: "pending_approval",
        sourceReference: "provider_1",
      }),
    }));
    expect(result).toMatchObject({ personId: "person_user_1", organizationId: "org_grid", membershipType: "grid_contractor_applicant" });
  });

  it("fails closed when legacy compatibility signals resolve to different people", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "user_1",
      organizationId: "org_home",
      email: "person@example.test",
      name: "Person One",
      roleKey: "administrator",
      status: "active",
    });
    mocks.membershipFindMany.mockResolvedValue([{ personId: "person_a" }]);
    mocks.personFindMany.mockResolvedValue([{ id: "person_b" }]);

    await expect(ensureOrganizationRelationshipForLegacyUser({
      userId: "user_1",
      organizationId: "org_grid",
      membershipType: "grid_contractor_applicant",
      roleKey: "contractor",
      status: "pending_approval",
      sourceType: "grid_contractor_enrollment",
      sourceReference: "provider_1",
    })).rejects.toBeInstanceOf(IdentityRelationshipConflictError);

    expect(mocks.personCreate).not.toHaveBeenCalled();
    expect(mocks.membershipUpsert).not.toHaveBeenCalled();
  });
});
