import "server-only";

import { db } from "@/lib/db";
import {
  loadPersonContextInputByLegacyUserIdWith,
  type PersonContextDataSource,
  type StoredPersonContextRow,
} from "@/lib/identity/person-context-repository";

const prismaPersonContextDataSource: PersonContextDataSource = {
  async findPersonByLegacyUserId(legacyUserId): Promise<StoredPersonContextRow | null> {
    const anchoredMembership = await db.organizationMembership.findUnique({
      where: { legacyUserId },
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
          },
        },
      },
    });

    return anchoredMembership?.person ?? null;
  },
};

/**
 * Load the durable Person context through the explicit legacy User anchor created by
 * the universal identity foundation.
 *
 * The lookup intentionally uses OrganizationMembership.legacyUserId rather than
 * names or emails. That field is unique in the active Prisma model, so an existing
 * anchor resolves to one durable Person without fuzzy matching or identity merging.
 * This function only loads context; it does not infer professional, clinical,
 * billing, organization-binding, or other consequential authority.
 */
export async function loadPersonContextInputByLegacyUserId(legacyUserId: string) {
  return loadPersonContextInputByLegacyUserIdWith(
    prismaPersonContextDataSource,
    legacyUserId,
  );
}
