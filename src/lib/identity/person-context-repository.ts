import type { PersonContextInput } from "@/lib/identity/person-context";

export type StoredLocationAssignment = {
  id: string;
  membershipId: string;
  locationId: string;
  roleKey: string | null;
  professionKey: string | null;
  status: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

export type StoredOrganizationMembership = {
  id: string;
  personId: string;
  organizationId: string;
  legacyUserId: string | null;
  membershipType: string;
  roleKey: string | null;
  status: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  locationAssignments: StoredLocationAssignment[];
};

export type StoredPersonContextRow = {
  id: string;
  displayName: string | null;
  status: string;
  memberships: StoredOrganizationMembership[];
};

export type PersonContextDataSource = {
  findPersonByLegacyUserId(legacyUserId: string): Promise<StoredPersonContextRow | null>;
};

/**
 * Converts the already-persisted universal identity foundation into the domain input
 * consumed by resolvePersonExperienceContext.
 *
 * This adapter is deliberately conservative. Today the persisted identity foundation
 * has a durable, explicit legacy User anchor. It does not yet contain explicit durable
 * Patient, Provider, EDU, credential, or semantic relationship links, so this mapper
 * does not manufacture any of them from names/emails or nearby records.
 */
export async function loadPersonContextInputByLegacyUserIdWith(
  dataSource: PersonContextDataSource,
  legacyUserId: string,
): Promise<PersonContextInput | null> {
  const anchor = legacyUserId.trim();
  if (!anchor) return null;

  const row = await dataSource.findPersonByLegacyUserId(anchor);
  if (!row) return null;

  return {
    person: {
      id: row.id,
      displayName: row.displayName,
      status: row.status,
    },
    memberships: row.memberships.map((membership) => ({
      id: membership.id,
      personId: membership.personId,
      organizationId: membership.organizationId,
      legacyUserId: membership.legacyUserId,
      membershipType: membership.membershipType,
      roleKey: membership.roleKey,
      status: membership.status,
      effectiveFrom: membership.effectiveFrom,
      effectiveTo: membership.effectiveTo,
    })),
    locationAssignments: row.memberships.flatMap((membership) =>
      membership.locationAssignments.map((assignment) => ({
        id: assignment.id,
        membershipId: assignment.membershipId,
        locationId: assignment.locationId,
        roleKey: assignment.roleKey,
        professionKey: assignment.professionKey,
        status: assignment.status,
        effectiveFrom: assignment.effectiveFrom,
        effectiveTo: assignment.effectiveTo,
      })),
    ),
    relationships: [],
    domainLinks: row.memberships.flatMap((membership) =>
      membership.legacyUserId
        ? [
            {
              kind: "user" as const,
              recordId: membership.legacyUserId,
              organizationId: membership.organizationId,
            },
          ]
        : [],
    ),
    evidence: [],
  };
}
