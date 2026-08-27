import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { IdentityRelationshipConflictError } from "@/lib/identity/relationship-repository";

type PersonResolutionClient = Pick<
  Prisma.TransactionClient,
  "user" | "person" | "organizationMembership"
>;

export type ResolvedLegacyPerson = {
  personId: string;
  legacyUser: {
    id: string;
    organizationId: string;
    email: string;
    name: string;
    roleKey: string;
    status: string;
  };
};

export async function resolveUniversalPersonForLegacyUser(
  userId: string,
  client: PersonResolutionClient = db,
): Promise<ResolvedLegacyPerson> {
  const legacyUser = await client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      organizationId: true,
      email: true,
      name: true,
      roleKey: true,
      status: true,
    },
  });

  if (!legacyUser || legacyUser.status !== "active") {
    throw new IdentityRelationshipConflictError(
      "Legacy user is unavailable for universal identity resolution.",
    );
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
      person.id === deterministicPersonId
      && (person.sourceType !== "legacy_user" || person.sourceReference !== legacyUser.id)
    ) {
      throw new IdentityRelationshipConflictError(
        "Deterministic universal person id is bound to incompatible identity provenance.",
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

  const baseline = {
    personId,
    organizationId: legacyUser.organizationId,
    legacyUserId: legacyUser.id,
    membershipType: "organization_user",
    roleKey: legacyUser.roleKey,
    status: legacyUser.status,
    sourceType: "legacy_user",
    sourceReference: legacyUser.id,
  };

  const existingBaseline = await client.organizationMembership.upsert({
    where: { id: `orgmem_${legacyUser.id}` },
    update: {},
    create: { id: `orgmem_${legacyUser.id}`, ...baseline },
  });

  if (
    existingBaseline.personId !== baseline.personId
    || existingBaseline.organizationId !== baseline.organizationId
    || existingBaseline.legacyUserId !== baseline.legacyUserId
    || existingBaseline.membershipType !== baseline.membershipType
    || existingBaseline.roleKey !== baseline.roleKey
    || existingBaseline.status !== baseline.status
    || existingBaseline.sourceType !== baseline.sourceType
    || existingBaseline.sourceReference !== baseline.sourceReference
  ) {
    throw new IdentityRelationshipConflictError(
      "Universal identity baseline conflicts with the existing legacy-user mapping.",
    );
  }

  return { personId, legacyUser };
}
