import "server-only";

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
  defaultOrganizationId: string;
  activeMemberships: OrganizationMembershipView[];
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
  const legacyMembership = await db.organizationMembership.findFirst({
    where: {
      legacyUserId: userId,
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
    defaultOrganizationId: legacyMembership.organizationId,
    activeMemberships: await listActiveOrganizationMemberships(legacyMembership.person.id, at),
  };
}
