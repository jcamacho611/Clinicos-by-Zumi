import "server-only";

import { cache } from "react";
import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import type { IdentityContext, KlinikosOrganizationType, KlinikosRoleKey, MembershipGrant } from "@/lib/identity/types";

const LEGACY_ROLE_MAP: Record<string, KlinikosRoleKey> = {
  clinic_owner: "clinic_owner",
  administrator: "administrator",
  provider: "provider",
  clinical_staff: "clinical_staff",
  front_desk: "front_desk",
  biller: "biller",
  contractor: "contractor",
  viewer: "viewer",
};

function asRole(value: string): KlinikosRoleKey | null {
  return LEGACY_ROLE_MAP[value] ?? null;
}

function asOrganizationType(value: string): KlinikosOrganizationType {
  switch (value) {
    case "medical_spa": return "medical_spa";
    case "healthcare_network": return "healthcare_network";
    case "educational_institution": return "educational_institution";
    case "facility_partner": return "facility_partner";
    case "service_partner": return "service_partner";
    case "platform": return "platform";
    default: return "clinic";
  }
}

export type ResolvedIdentityContext = IdentityContext & {
  memberships: MembershipGrant[];
  legacyUserId?: string;
};

/**
 * Resolve the universal Klinikos identity context for an existing clinic session.
 *
 * Migration rule: new identity/membership rows are authoritative when present. Until
 * every legacy user is backfilled, the current clinic session is exposed as a single
 * compatibility membership so working clinic flows are not broken.
 */
export const resolveIdentityContextForSession = cache(async (session: ClinicSession): Promise<ResolvedIdentityContext> => {
  const linked = await db.identityLink.findFirst({
    where: { legacyType: "user", legacyId: session.userId },
    include: {
      identity: {
        include: {
          memberships: {
            where: { status: "active" },
            include: { organization: true, roleAssignments: true },
          },
        },
      },
    },
  }).catch(() => null);

  if (linked?.identity) {
    const memberships: MembershipGrant[] = linked.identity.memberships.map((membership) => ({
      membershipId: membership.id,
      identityId: linked.identity.id,
      organizationId: membership.organizationId,
      organizationType: asOrganizationType(membership.organization.clinicType),
      roles: membership.roleAssignments.map((assignment) => assignment.roleKey as KlinikosRoleKey),
      status: membership.status as MembershipGrant["status"],
    }));

    const preferred = memberships.find((membership) => membership.organizationId === session.organizationId) ?? memberships[0];
    return {
      identityId: linked.identity.id,
      email: linked.identity.email,
      activeMembershipId: preferred?.membershipId,
      activeOrganizationId: preferred?.organizationId,
      activeRoles: preferred?.roles ?? [],
      memberships,
      legacyUserId: session.userId,
    };
  }

  const role = asRole(session.role);
  const compatibilityMembership: MembershipGrant = {
    membershipId: `legacy:${session.userId}:${session.organizationId}`,
    identityId: `legacy:${session.userId}`,
    organizationId: session.organizationId,
    organizationType: "clinic",
    roles: role ? [role] : [],
    status: "active",
  };

  return {
    identityId: compatibilityMembership.identityId,
    email: session.email,
    activeMembershipId: compatibilityMembership.membershipId,
    activeOrganizationId: compatibilityMembership.organizationId,
    activeRoles: compatibilityMembership.roles,
    memberships: [compatibilityMembership],
    legacyUserId: session.userId,
  };
});

export function selectMembership(context: ResolvedIdentityContext, membershipId: string) {
  const membership = context.memberships.find((candidate) => candidate.membershipId === membershipId && candidate.status === "active");
  if (!membership) return null;
  return {
    ...context,
    activeMembershipId: membership.membershipId,
    activeOrganizationId: membership.organizationId,
    activeRoles: membership.roles,
  } satisfies ResolvedIdentityContext;
}
