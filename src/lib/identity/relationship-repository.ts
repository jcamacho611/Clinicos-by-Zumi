import "server-only";

import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type OrganizationMembershipView = {
  id: string;
  organizationId: string;
  membershipType: string;
  roleKey: string | null;
  status: string;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type LocationAssignmentView = {
  id: string;
  membershipId: string;
  locationId: string;
  roleKey: string | null;
  professionKey: string | null;
  status: string;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type PersonContext = {
  personId: string;
  displayName: string | null;
  legacyUserId: string;
  /**
   * Organization id carried by the effective legacy-user membership projection.
   * This is provenance/context only. Current session tenant authority continues to
   * come from the validated legacy User.organizationId until a separately reviewed
   * active-context authorization migration is implemented.
   */
  legacyMembershipOrganizationId: string;
  activeMemberships: OrganizationMembershipView[];
};

export class IdentityRelationshipConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdentityRelationshipConflictError";
  }
}

type RelationshipWriteClient = Pick<
  Prisma.TransactionClient,
  "user" | "person" | "organizationMembership"
>;

type EnsureOrganizationRelationshipInput = {
  userId: string;
  organizationId: string;
  membershipType: string;
  roleKey: string | null;
  status: string;
  sourceType: string;
  sourceReference: string;
};

export type EnsuredOrganizationRelationship = {
  personId: string;
  relationshipId: string;
  organizationId: string;
  membershipType: string;
  status: string;
};

export function buildEffectiveRelationshipWhere(at: Date) {
  return {
    status: "active",
    effectiveFrom: { lte: at },
    OR: [
      { effectiveTo: null },
      { effectiveTo: { gt: at } },
    ],
  };
}

const membershipSelect = {
  id: true,
  organizationId: true,
  membershipType: true,
  roleKey: true,
  status: true,
  effectiveFrom: true,
  effectiveTo: true,
} as const satisfies Prisma.OrganizationMembershipSelect;

const assignmentSelect = {
  id: true,
  membershipId: true,
  locationId: true,
  roleKey: true,
  professionKey: true,
  status: true,
  effectiveFrom: true,
  effectiveTo: true,
} as const satisfies Prisma.LocationAssignmentSelect;

type MembershipRow = Prisma.OrganizationMembershipGetPayload<{ select: typeof membershipSelect }>;
type AssignmentRow = Prisma.LocationAssignmentGetPayload<{ select: typeof assignmentSelect }>;

function toMembershipView(row: MembershipRow): OrganizationMembershipView {
  return {
    id: row.id,
    organizationId: row.organizationId,
    membershipType: row.membershipType,
    roleKey: row.roleKey,
    status: row.status,
    effectiveFrom: row.effectiveFrom.toISOString(),
    effectiveTo: row.effectiveTo?.toISOString() ?? null,
  };
}

function toAssignmentView(row: AssignmentRow): LocationAssignmentView {
  return {
    id: row.id,
    membershipId: row.membershipId,
    locationId: row.locationId,
    roleKey: row.roleKey,
    professionKey: row.professionKey,
    status: row.status,
    effectiveFrom: row.effectiveFrom.toISOString(),
    effectiveTo: row.effectiveTo?.toISOString() ?? null,
  };
}

function relationshipIdFor(input: Pick<EnsureOrganizationRelationshipInput, "userId" | "organizationId" | "membershipType">) {
  const digest = createHash("sha256")
    .update(`${input.userId}\u0000${input.organizationId}\u0000${input.membershipType}`)
    .digest("hex")
    .slice(0, 24);
  return `orgrel_${digest}`;
}

function assertMembershipCompatibility(
  relationship: {
    personId: string;
    organizationId: string;
    legacyUserId: string | null;
    membershipType: string;
    roleKey: string | null;
    status: string;
    sourceType: string;
    sourceReference: string | null;
  },
  expected: {
    personId: string;
    organizationId: string;
    legacyUserId: string;
    membershipType: string;
    roleKey: string | null;
    status: string;
    sourceType: string;
    sourceReference: string;
  },
) {
  if (
    relationship.personId !== expected.personId ||
    relationship.organizationId !== expected.organizationId ||
    relationship.legacyUserId !== expected.legacyUserId ||
    relationship.membershipType !== expected.membershipType ||
    relationship.roleKey !== expected.roleKey ||
    relationship.status !== expected.status ||
    relationship.sourceType !== expected.sourceType ||
    relationship.sourceReference !== expected.sourceReference
  ) {
    throw new IdentityRelationshipConflictError(
      "Universal identity relationship conflicts with the existing legacy-user mapping.",
    );
  }
}

/**
 * Attach relationship context to the universal identity layer without changing the
 * legacy User record or any authenticated session authority. Callers that are already
 * inside a transaction should pass that transaction client so identity provenance and
 * the domain write succeed or fail together.
 */
export async function ensureOrganizationRelationshipForLegacyUser(
  input: EnsureOrganizationRelationshipInput,
  client: RelationshipWriteClient = db,
): Promise<EnsuredOrganizationRelationship> {
  const legacyUser = await client.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      organizationId: true,
      email: true,
      name: true,
      roleKey: true,
      status: true,
    },
  });
  if (!legacyUser) {
    throw new IdentityRelationshipConflictError("Legacy user is unavailable for identity relationship attachment.");
  }

  const deterministicPersonId = `person_${legacyUser.id}`;
  const [legacyMemberships, personCandidates] = await Promise.all([
    client.organizationMembership.findMany({
      where: { legacyUserId: legacyUser.id },
      select: { personId: true },
    }),
    client.person.findMany({
      where: {
        OR: [
          { id: deterministicPersonId },
          { sourceType: "legacy_user", sourceReference: legacyUser.id },
        ],
      },
      select: { id: true, sourceType: true, sourceReference: true },
    }),
  ]);

  for (const person of personCandidates) {
    if (
      person.id === deterministicPersonId &&
      (person.sourceType !== "legacy_user" || person.sourceReference !== legacyUser.id)
    ) {
      throw new IdentityRelationshipConflictError(
        "Deterministic universal person id is already bound to incompatible identity provenance.",
      );
    }
  }

  const candidateIds = new Set<string>();
  legacyMemberships.forEach(({ personId }) => candidateIds.add(personId));
  personCandidates.forEach(({ id }) => candidateIds.add(id));

  if (candidateIds.size > 1) {
    throw new IdentityRelationshipConflictError(
      "Legacy user resolves to more than one universal person. Human identity review is required.",
    );
  }

  let personId = [...candidateIds][0] ?? deterministicPersonId;
  if (candidateIds.size === 0) {
    const created = await client.person.create({
      data: {
        id: deterministicPersonId,
        displayName: legacyUser.name,
        legalName: null,
        primaryEmail: legacyUser.email,
        status: legacyUser.status,
        sourceType: "legacy_user",
        sourceReference: legacyUser.id,
      },
      select: { id: true },
    });
    personId = created.id;
  }

  const baselineExpected = {
    personId,
    organizationId: legacyUser.organizationId,
    legacyUserId: legacyUser.id,
    membershipType: "organization_user",
    roleKey: legacyUser.roleKey,
    status: legacyUser.status,
    sourceType: "legacy_user",
    sourceReference: legacyUser.id,
  };
  const baseline = await client.organizationMembership.upsert({
    where: { id: `orgmem_${legacyUser.id}` },
    update: {},
    create: {
      id: `orgmem_${legacyUser.id}`,
      ...baselineExpected,
    },
  });
  assertMembershipCompatibility(baseline, baselineExpected);

  const relationshipId = relationshipIdFor(input);
  const targetExpected = {
    personId,
    organizationId: input.organizationId,
    legacyUserId: legacyUser.id,
    membershipType: input.membershipType,
    roleKey: input.roleKey,
    status: input.status,
    sourceType: input.sourceType,
    sourceReference: input.sourceReference,
  };
  const relationship = await client.organizationMembership.upsert({
    where: { id: relationshipId },
    update: {},
    create: {
      id: relationshipId,
      ...targetExpected,
    },
  });
  assertMembershipCompatibility(relationship, targetExpected);

  return {
    personId,
    relationshipId,
    organizationId: relationship.organizationId,
    membershipType: relationship.membershipType,
    status: relationship.status,
  };
}

export async function listActiveOrganizationMemberships(
  personId: string,
  at = new Date(),
): Promise<OrganizationMembershipView[]> {
  const rows = await db.organizationMembership.findMany({
    where: {
      personId,
      ...buildEffectiveRelationshipWhere(at),
    },
    select: membershipSelect,
    orderBy: [{ effectiveFrom: "asc" }, { id: "asc" }],
  });

  return rows.map(toMembershipView);
}

export async function listActiveLocationAssignments(
  membershipId: string,
  at = new Date(),
): Promise<LocationAssignmentView[]> {
  const rows = await db.locationAssignment.findMany({
    where: {
      membershipId,
      ...buildEffectiveRelationshipWhere(at),
    },
    select: assignmentSelect,
    orderBy: [{ effectiveFrom: "asc" }, { id: "asc" }],
  });

  return rows.map(toAssignmentView);
}

export async function getPersonContextForLegacyUser(
  userId: string,
  at = new Date(),
): Promise<PersonContext | null> {
  // Legacy User.organizationId remains current session tenant authority. Resolve it
  // first and use it only to anchor this compatibility projection to the matching
  // backfilled membership; broader memberships remain contextual and cannot switch
  // the session tenant by query order.
  const legacyUser = await db.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });
  if (!legacyUser) return null;

  const legacyMembership = await db.organizationMembership.findFirst({
    where: {
      legacyUserId: userId,
      organizationId: legacyUser.organizationId,
      ...buildEffectiveRelationshipWhere(at),
    },
    select: {
      organizationId: true,
      person: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
    orderBy: [{ effectiveFrom: "asc" }, { id: "asc" }],
  });

  if (!legacyMembership) return null;

  return {
    personId: legacyMembership.person.id,
    displayName: legacyMembership.person.displayName,
    legacyUserId: userId,
    legacyMembershipOrganizationId: legacyMembership.organizationId,
    activeMemberships: await listActiveOrganizationMemberships(legacyMembership.person.id, at),
  };
}
