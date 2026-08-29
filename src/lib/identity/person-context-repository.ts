import type {
  PersonContextInput,
  PersonDomainLink,
  VerificationState,
} from "@/lib/identity/person-context";

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

export type StoredPersonRelationship = {
  id: string;
  personId: string;
  relationshipType: string;
  organizationId: string | null;
  status: string;
  verificationState: string;
  domainKind: string | null;
  domainRecordId: string | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

export type StoredPersonContextRow = {
  id: string;
  displayName: string | null;
  status: string;
  memberships: StoredOrganizationMembership[];
  relationships: StoredPersonRelationship[];
};

export type PersonContextDataSource = {
  findPersonByLegacyUserId(legacyUserId: string): Promise<StoredPersonContextRow | null>;
};

const verificationStates = new Set<VerificationState>([
  "claimed",
  "verified",
  "rejected",
  "expired",
  "unknown",
]);

function normalizeVerificationState(value: string): VerificationState {
  return verificationStates.has(value as VerificationState)
    ? (value as VerificationState)
    : "unknown";
}

function normalizeDomainKind(value: string): PersonDomainLink["kind"] {
  switch (value) {
    case "user":
    case "patient":
    case "provider":
    case "education_enrollment":
    case "other":
      return value;
    default:
      return "other";
  }
}

/**
 * Converts the persisted universal identity foundation into the domain input consumed
 * by resolvePersonExperienceContext.
 *
 * The adapter accepts only explicit durable anchors. It never manufactures Patient,
 * Provider, EDU, credential, or semantic relationships from names, emails, roles, or
 * nearby records. Relationships and linked records remain context/evidence only and
 * do not create consequential authority.
 */
export async function loadPersonContextInputByLegacyUserIdWith(
  dataSource: PersonContextDataSource,
  legacyUserId: string,
): Promise<PersonContextInput | null> {
  const anchor = legacyUserId.trim();
  if (!anchor) return null;

  const row = await dataSource.findPersonByLegacyUserId(anchor);
  if (!row) return null;

  const relationships = row.relationships.map((relationship) => ({
    id: relationship.id,
    personId: relationship.personId,
    relationshipType: relationship.relationshipType,
    organizationId: relationship.organizationId,
    status: relationship.status,
    verificationState: normalizeVerificationState(relationship.verificationState),
    effectiveFrom: relationship.effectiveFrom,
    effectiveTo: relationship.effectiveTo,
  }));

  const membershipLinks: PersonDomainLink[] = row.memberships.flatMap((membership) =>
    membership.legacyUserId
      ? [
          {
            kind: "user" as const,
            recordId: membership.legacyUserId,
            organizationId: membership.organizationId,
          },
        ]
      : [],
  );

  const relationshipLinks: PersonDomainLink[] = row.relationships.flatMap((relationship) =>
    relationship.domainKind && relationship.domainRecordId
      ? [
          {
            kind: normalizeDomainKind(relationship.domainKind),
            recordId: relationship.domainRecordId,
            organizationId: relationship.organizationId,
          },
        ]
      : [],
  );

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
    relationships,
    domainLinks: [...membershipLinks, ...relationshipLinks],
    evidence: [],
  };
}
