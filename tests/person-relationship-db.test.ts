import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { loadPersonContextInputByLegacyUserId } from "@/lib/identity/person-context-db";
import { resolvePersonExperienceContext } from "@/lib/identity/person-context";

const suffix = "person_relationship_db_20260829";
const organizationId = `org_${suffix}`;
const userId = `user_${suffix}`;
const personId = `person_${suffix}`;
const membershipId = `membership_${suffix}`;
const relationshipId = `relationship_${suffix}`;
const providerRecordId = `provider_${suffix}`;
const effectiveFrom = new Date("2026-08-29T11:00:00.000Z");
const selectionAt = new Date("2026-08-29T12:00:00.000Z");

beforeAll(async () => {
  await db.organization.create({
    data: {
      id: organizationId,
      name: "Person Relationship Org",
      slug: `person-relationship-${suffix}`,
      clinicType: "clinic",
    },
  });

  await db.user.create({
    data: {
      id: userId,
      organizationId,
      email: `${suffix}@example.test`,
      name: "Jordan Lee",
      roleKey: "provider",
    },
  });

  await db.person.create({
    data: {
      id: personId,
      displayName: "Jordan Lee",
      primaryEmail: `${suffix}-person@example.test`,
      memberships: {
        create: {
          id: membershipId,
          organizationId,
          legacyUserId: userId,
          membershipType: "organization_user",
          roleKey: "provider",
          effectiveFrom,
        },
      },
    },
  });

  await db.personRelationship.create({
    data: {
      id: relationshipId,
      personId,
      relationshipType: "professional",
      organizationId,
      status: "active",
      verificationState: "verified",
      domainKind: "provider",
      domainRecordId: providerRecordId,
      sourceType: "explicit_link",
      sourceReference: providerRecordId,
      evidenceReference: `credential_evidence_${suffix}`,
      effectiveFrom,
    },
  });
});

afterAll(async () => {
  await db.personRelationship.deleteMany({ where: { personId } });
  await db.person.deleteMany({ where: { id: personId } });
  await db.organization.deleteMany({ where: { id: organizationId } });
});

describe("persisted Person relationships", () => {
  it("loads explicit semantic/domain relationships without manufacturing authority", async () => {
    const input = await loadPersonContextInputByLegacyUserId(userId);

    expect(input?.relationships).toEqual([
      expect.objectContaining({
        id: relationshipId,
        personId,
        relationshipType: "professional",
        organizationId,
        status: "active",
        verificationState: "verified",
      }),
    ]);
    expect(input?.domainLinks).toEqual(
      expect.arrayContaining([
        { kind: "user", recordId: userId, organizationId },
        { kind: "provider", recordId: providerRecordId, organizationId },
      ]),
    );

    expect(input).not.toBeNull();
    if (!input) return;

    const resolved = resolvePersonExperienceContext(input, {
      organizationId,
      locationId: null,
      purpose: "provide_care",
      at: selectionAt,
    });

    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    expect(resolved.context.relationships).toEqual([
      expect.objectContaining({ id: relationshipId, grantsAuthority: false }),
    ]);
    expect(resolved.context.inferredAuthority).toEqual({
      professional: false,
      clinical: false,
      billing: false,
      organizationBinding: false,
    });
  });
});
