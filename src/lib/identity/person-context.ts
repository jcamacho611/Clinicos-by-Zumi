export type VerificationState = "claimed" | "verified" | "rejected" | "expired" | "unknown";

export type PersonIdentity = {
  id: string;
  displayName: string | null;
  status: string;
};

export type PersonMembership = {
  id: string;
  personId: string;
  organizationId: string;
  legacyUserId: string | null;
  membershipType: string;
  roleKey: string | null;
  status: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

export type PersonLocationAssignment = {
  id: string;
  membershipId: string;
  locationId: string;
  roleKey: string | null;
  professionKey: string | null;
  status: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

export type PersonRelationship = {
  id: string;
  personId: string;
  relationshipType: string;
  organizationId: string | null;
  status: string;
  verificationState: VerificationState;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

export type PersonDomainLink = {
  kind: "user" | "patient" | "provider" | "education_enrollment" | "other";
  recordId: string;
  organizationId: string | null;
};

export type PersonEvidenceSignal = {
  id: string;
  kind: "resume_claim" | "education_completion" | "professional_credential" | "other";
  verificationState: VerificationState;
};

export type PersonContextInput = {
  person: PersonIdentity;
  memberships: PersonMembership[];
  locationAssignments: PersonLocationAssignment[];
  relationships: PersonRelationship[];
  domainLinks: PersonDomainLink[];
  evidence: PersonEvidenceSignal[];
};

export type PersonContextSelection = {
  organizationId: string | null;
  locationId: string | null;
  purpose: string;
  at: Date;
  membershipId?: string | null;
};

export type PersonContextFailureReason =
  | "person_inactive"
  | "organization_required"
  | "purpose_required"
  | "membership_not_found"
  | "membership_inactive"
  | "membership_ambiguous"
  | "location_not_assigned";

export type PersonExperienceContext = {
  personId: string;
  membershipId: string;
  organizationId: string;
  locationId: string | null;
  purpose: string;
  membershipRoleKey: string | null;
  locationRoleKey: string | null;
  locationProfessionKey: string | null;
  availableOrganizationIds: string[];
  domainLinks: PersonDomainLink[];
  relationships: Array<PersonRelationship & { grantsAuthority: false }>;
  evidence: Array<PersonEvidenceSignal & { grantsAuthority: false }>;
  inferredAuthority: {
    professional: false;
    clinical: false;
    billing: false;
    organizationBinding: false;
  };
};

export type PersonContextResult =
  | { ok: true; context: PersonExperienceContext }
  | { ok: false; reason: PersonContextFailureReason };

function isEffective(record: { status: string; effectiveFrom: Date; effectiveTo: Date | null }, at: Date) {
  if (record.status !== "active") return false;
  if (record.effectiveFrom.getTime() > at.getTime()) return false;
  if (record.effectiveTo && record.effectiveTo.getTime() <= at.getTime()) return false;
  return true;
}

function uniqueInOrder(values: string[]) {
  return [...new Set(values)];
}

/**
 * Resolve one explicit operating context for a durable Person.
 *
 * This is deliberately not an authorization engine. Membership, location labels,
 * relationships, legacy record links, resumes, EDU completions and credentials are
 * context/evidence inputs only. Consequential authority remains owned by the existing
 * deterministic authorization, credential, clinical, billing and policy engines.
 */
export function resolvePersonExperienceContext(
  input: PersonContextInput,
  selection: PersonContextSelection,
): PersonContextResult {
  if (input.person.status !== "active") return { ok: false, reason: "person_inactive" };

  const organizationId = selection.organizationId?.trim() ?? "";
  if (!organizationId) return { ok: false, reason: "organization_required" };

  const purpose = selection.purpose.trim();
  if (!purpose) return { ok: false, reason: "purpose_required" };

  const personMemberships = input.memberships.filter((membership) => membership.personId === input.person.id);
  const organizationMemberships = personMemberships.filter(
    (membership) => membership.organizationId === organizationId,
  );
  if (organizationMemberships.length === 0) return { ok: false, reason: "membership_not_found" };

  const activeMemberships = organizationMemberships.filter((membership) => isEffective(membership, selection.at));
  if (activeMemberships.length === 0) return { ok: false, reason: "membership_inactive" };

  let membership: PersonMembership | undefined;
  if (selection.membershipId) {
    membership = activeMemberships.find((candidate) => candidate.id === selection.membershipId);
    if (!membership) return { ok: false, reason: "membership_inactive" };
  } else if (activeMemberships.length === 1) {
    membership = activeMemberships[0];
  } else {
    return { ok: false, reason: "membership_ambiguous" };
  }

  if (!membership) return { ok: false, reason: "membership_inactive" };

  const locationId = selection.locationId?.trim() || null;
  const activeAssignments = input.locationAssignments.filter(
    (assignment) => assignment.membershipId === membership.id && isEffective(assignment, selection.at),
  );
  const locationAssignment = locationId
    ? activeAssignments.find((assignment) => assignment.locationId === locationId)
    : undefined;

  if (locationId && !locationAssignment) return { ok: false, reason: "location_not_assigned" };

  const availableOrganizationIds = uniqueInOrder(
    personMemberships
      .filter((candidate) => isEffective(candidate, selection.at))
      .map((candidate) => candidate.organizationId),
  );

  const relationships = input.relationships
    .filter(
      (relationship) =>
        relationship.personId === input.person.id &&
        isEffective(relationship, selection.at) &&
        (relationship.organizationId === organizationId || relationship.organizationId === null),
    )
    .map((relationship) => ({ ...relationship, grantsAuthority: false as const }));

  // Legacy/domain links are intentionally scoped to the selected organization. A
  // context switch therefore recomputes this list instead of carrying records from
  // the prior tenant into the new experience.
  const domainLinks = input.domainLinks.filter((link) => link.organizationId === organizationId);

  // Evidence may inform a downstream verification engine, but the existence or even
  // verification of an artifact is not itself permission to practice, bill, bind an
  // organization, or access clinical data.
  const evidence = input.evidence.map((signal) => ({ ...signal, grantsAuthority: false as const }));

  return {
    ok: true,
    context: {
      personId: input.person.id,
      membershipId: membership.id,
      organizationId,
      locationId,
      purpose,
      membershipRoleKey: membership.roleKey,
      locationRoleKey: locationAssignment?.roleKey ?? null,
      locationProfessionKey: locationAssignment?.professionKey ?? null,
      availableOrganizationIds,
      domainLinks,
      relationships,
      evidence,
      inferredAuthority: {
        professional: false,
        clinical: false,
        billing: false,
        organizationBinding: false,
      },
    },
  };
}

export function projectPublicPatientIdentity(_person: PersonIdentity): null {
  // Patient identity is never a public marketplace projection by default.
  return null;
}

export type PublicProfessionalProjectionInput = {
  person: PersonIdentity;
  relationship: PersonRelationship | undefined;
  eligibility: {
    verified: boolean;
    eligible: boolean;
  };
  publicFields: {
    displayName: string;
    headline: string;
  };
};

export type PublicProfessionalProjection = {
  personId: string;
  displayName: string;
  headline: string;
  relationshipId: string;
};

const professionalRelationshipTypes = new Set([
  "professional",
  "contractor",
  "preceptor",
  "educator",
  "expert",
]);

export function projectPublicProfessionalIdentity(
  input: PublicProfessionalProjectionInput,
): PublicProfessionalProjection | null {
  const { person, relationship, eligibility, publicFields } = input;

  if (person.status !== "active") return null;
  if (!relationship) return null;
  if (relationship.personId !== person.id) return null;
  if (relationship.status !== "active") return null;
  if (!professionalRelationshipTypes.has(relationship.relationshipType)) return null;
  if (relationship.verificationState !== "verified") return null;
  if (!eligibility.verified || !eligibility.eligible) return null;

  const displayName = publicFields.displayName.trim();
  const headline = publicFields.headline.trim();
  if (!displayName || !headline) return null;

  return {
    personId: person.id,
    displayName,
    headline,
    relationshipId: relationship.id,
  };
}
