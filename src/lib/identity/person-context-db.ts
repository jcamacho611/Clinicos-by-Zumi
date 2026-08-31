import "server-only";

import { db } from "@/lib/db";
import {
  loadPersonContextInputByLegacyUserIdWith,
  type PersonContextDataSource,
  type StoredPersonContextRow,
} from "@/lib/identity/person-context-repository";

const prismaPersonContextDataSource: PersonContextDataSource = {
  async findPersonByLegacyUserId(legacyUserId): Promise<StoredPersonContextRow | null> {
    const anchoredMemberships = await db.organizationMembership.findMany({
      where: { legacyUserId },
      take: 2,
      orderBy: { createdAt: "asc" },
      select: {
        person: {
          select: {
            id: true,
            displayName: true,
            status: true,
            memberships: {
              orderBy: [{ organizationId: "asc" }, { createdAt: "asc" }],
              select: {
                id: true,
                personId: true,
                organizationId: true,
                legacyUserId: true,
                membershipType: true,
                roleKey: true,
                status: true,
                effectiveFrom: true,
                effectiveTo: true,
                locationAssignments: {
                  orderBy: [{ locationId: "asc" }, { createdAt: "asc" }],
                  select: {
                    id: true,
                    membershipId: true,
                    locationId: true,
                    roleKey: true,
                    professionKey: true,
                    status: true,
                    effectiveFrom: true,
                    effectiveTo: true,
                  },
                },
              },
            },
            relationships: {
              orderBy: [{ createdAt: "asc" }],
              select: {
                id: true,
                personId: true,
                relationshipType: true,
                organizationId: true,
                status: true,
                verificationState: true,
                domainKind: true,
                domainRecordId: true,
                effectiveFrom: true,
                effectiveTo: true,
              },
            },
          },
        },
      },
    });

    if (anchoredMemberships.length === 0) return null;
    if (anchoredMemberships.length > 1) {
      throw new Error(
        `Ambiguous Person anchor for legacy user ${legacyUserId}: more than one organization membership references the same legacy User.`,
      );
    }

    return anchoredMemberships[0]?.person ?? null;
  },
};

/**
 * Load the durable Person context through the explicit legacy User anchor created by
 * the universal identity foundation.
 *
 * The lookup intentionally uses OrganizationMembership.legacyUserId rather than
 * names or emails. The current model indexes this field but does not make it unique,
 * so the loader queries at most two matches and fails closed if the data is ambiguous.
 * This function only loads context; it does not infer professional, clinical,
 * billing, organization-binding, or other consequential authority.
 */
export async function loadPersonContextInputByLegacyUserId(legacyUserId: string) {
  return loadPersonContextInputByLegacyUserIdWith(
    prismaPersonContextDataSource,
    legacyUserId,
  );
}
