import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { loadPersonContextInputByLegacyUserId } from "@/lib/identity/person-context-db";

const suffix = "person_context_ambiguity_20260829";
const orgId = `org_${suffix}`;
const userId = `user_${suffix}`;
const personAId = `person_a_${suffix}`;
const personBId = `person_b_${suffix}`;

beforeAll(async () => {
  await db.organization.create({
    data: {
      id: orgId,
      name: "Person Context Ambiguity Org",
      slug: `person-context-ambiguity-${suffix}`,
      clinicType: "clinic",
    },
  });

  await db.user.create({
    data: {
      id: userId,
      organizationId: orgId,
      email: `${suffix}@example.test`,
      name: "Ambiguous Anchor",
      roleKey: "provider",
    },
  });

  await db.person.create({
    data: {
      id: personAId,
      displayName: "Person A",
      memberships: {
        create: {
          id: `mem_a_${suffix}`,
          organizationId: orgId,
          legacyUserId: userId,
          membershipType: "organization_user",
        },
      },
    },
  });

  await db.person.create({
    data: {
      id: personBId,
      displayName: "Person B",
      memberships: {
        create: {
          id: `mem_b_${suffix}`,
          organizationId: orgId,
          legacyUserId: userId,
          membershipType: "organization_user",
        },
      },
    },
  });
});

afterAll(async () => {
  await db.person.deleteMany({ where: { id: { in: [personAId, personBId] } } });
  await db.organization.deleteMany({ where: { id: orgId } });
});

describe("Prisma-backed Person anchor ambiguity", () => {
  it("fails closed when one legacy User anchor points to more than one Person", async () => {
    await expect(loadPersonContextInputByLegacyUserId(userId)).rejects.toThrow(
      "Ambiguous Person anchor",
    );
  });
});
