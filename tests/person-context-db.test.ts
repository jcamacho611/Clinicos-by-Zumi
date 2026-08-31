import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { loadPersonContextInputByLegacyUserId } from "@/lib/identity/person-context-db";

const suffix = "person_context_db_20260829";
const orgAId = `org_a_${suffix}`;
const orgBId = `org_b_${suffix}`;
const locationAId = `location_a_${suffix}`;
const locationBId = `location_b_${suffix}`;
const userAId = `user_a_${suffix}`;
const userBId = `user_b_${suffix}`;
const personId = `person_${suffix}`;

beforeAll(async () => {
  await db.organization.createMany({
    data: [
      { id: orgAId, name: "Person Context Org A", slug: `person-context-org-a-${suffix}`, clinicType: "clinic" },
      { id: orgBId, name: "Person Context Org B", slug: `person-context-org-b-${suffix}`, clinicType: "clinic" },
    ],
  });

  await db.location.createMany({
    data: [
      { id: locationAId, organizationId: orgAId, name: "Location A" },
      { id: locationBId, organizationId: orgBId, name: "Location B" },
    ],
  });

  await db.user.createMany({
    data: [
      { id: userAId, organizationId: orgAId, email: `a-${suffix}@example.test`, name: "Jordan Lee", roleKey: "provider" },
      { id: userBId, organizationId: orgBId, email: `b-${suffix}@example.test`, name: "Jordan Lee", roleKey: "clinic_owner" },
    ],
  });

  await db.person.create({
    data: {
      id: personId,
      displayName: "Jordan Lee",
      primaryEmail: `person-${suffix}@example.test`,
      memberships: {
        create: [
          {
            id: `mem_a_${suffix}`,
            organizationId: orgAId,
            legacyUserId: userAId,
            membershipType: "organization_user",
            roleKey: "provider",
            locationAssignments: {
              create: {
                id: `assign_a_${suffix}`,
                locationId: locationAId,
                roleKey: "provider",
                professionKey: "rn",
              },
            },
          },
          {
            id: `mem_b_${suffix}`,
            organizationId: orgBId,
            legacyUserId: userBId,
            membershipType: "organization_user",
            roleKey: "clinic_owner",
            locationAssignments: {
              create: {
                id: `assign_b_${suffix}`,
                locationId: locationBId,
                roleKey: "clinic_owner",
              },
            },
          },
        ],
      },
    },
  });
});

afterAll(async () => {
  await db.person.deleteMany({ where: { id: personId } });
  await db.organization.deleteMany({ where: { id: { in: [orgAId, orgBId] } } });
});

describe("Prisma-backed Person context loading", () => {
  it("resolves the durable Person through the explicit unique legacy User membership and returns all memberships", async () => {
    const result = await loadPersonContextInputByLegacyUserId(userAId);

    expect(result?.person).toEqual({
      id: personId,
      displayName: "Jordan Lee",
      status: "active",
    });
    expect(result?.memberships.map(({ organizationId }) => organizationId).sort()).toEqual(
      [orgAId, orgBId].sort(),
    );
    expect(result?.locationAssignments.map(({ locationId }) => locationId).sort()).toEqual(
      [locationAId, locationBId].sort(),
    );
    expect(result?.domainLinks).toEqual(
      expect.arrayContaining([
        { kind: "user", recordId: userAId, organizationId: orgAId },
        { kind: "user", recordId: userBId, organizationId: orgBId },
      ]),
    );
  });

  it("returns null for an unanchored User ID and never guesses identity from name or email", async () => {
    await expect(loadPersonContextInputByLegacyUserId(`missing_${suffix}`)).resolves.toBeNull();
  });
});
