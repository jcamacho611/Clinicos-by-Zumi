import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { getEligibleGridResourceForTransaction } from "@/lib/grid/resource-repository";
import { canTransitionGridOffer, gridOfferDecisionSchema } from "@/lib/grid/transaction-flow";
import { transitionGridOffer } from "@/lib/grid/offer-repository";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type GenericOfferRow = {
  id: string;
  organizationId: string;
  demandId: string;
  senderOrganizationId: string | null;
  recipientOrganizationId: string | null;
  resourceKind: string | null;
  resourceReference: string | null;
  offeredStartAt: Date;
  offeredEndAt: Date | null;
  status: string;
  expiresAt: Date;
  version: number;
};

async function requireSyntheticOrganization(organizationId: string) {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { status: true, demoMode: true },
  });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  if (!organization.demoMode) throw new NetworkAccessError("Universal Grid resource offers require production review before live regulated use.", 409);
}

export async function transitionGridOfferWithUniversalResources(
  session: ClinicSession,
  offerId: string,
  rawInput: unknown,
) {
  const decision = gridOfferDecisionSchema.parse(rawInput);
  if (decision.targetStatus !== "accepted") return transitionGridOffer(session, offerId, rawInput);

  const preview = await db.$queryRaw<GenericOfferRow[]>(Prisma.sql`
    SELECT "id", "organizationId", "demandId", "senderOrganizationId", "recipientOrganizationId",
           "resourceKind", "resourceReference", "offeredStartAt", "offeredEndAt", "status", "expiresAt", "version"
    FROM "GridOfferRecord"
    WHERE "id" = ${offerId}
      AND (
        "organizationId" = ${session.organizationId}
        OR "senderOrganizationId" = ${session.organizationId}
        OR "recipientOrganizationId" = ${session.organizationId}
      )
    LIMIT 1
  `);
  const initial = preview[0];
  if (!initial?.resourceReference || !initial.resourceKind) return transitionGridOffer(session, offerId, rawInput);

  await requireSyntheticOrganization(session.organizationId);

  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<GenericOfferRow[]>(Prisma.sql`
      SELECT "id", "organizationId", "demandId", "senderOrganizationId", "recipientOrganizationId",
             "resourceKind", "resourceReference", "offeredStartAt", "offeredEndAt", "status", "expiresAt", "version"
      FROM "GridOfferRecord"
      WHERE "id" = ${offerId}
        AND (
          "organizationId" = ${session.organizationId}
          OR "senderOrganizationId" = ${session.organizationId}
          OR "recipientOrganizationId" = ${session.organizationId}
        )
      FOR UPDATE
    `);
    const offer = rows[0];
    if (!offer) throw new NetworkAccessError("Grid offer not found.", 404);
    if (offer.recipientOrganizationId !== session.organizationId) {
      throw new NetworkAccessError("Only the current offer recipient can accept it.", 403);
    }
    if (offer.expiresAt.getTime() <= Date.now()) throw new NetworkAccessError("This Grid offer has expired and cannot be accepted.", 409);
    if (!canTransitionGridOffer(offer.status, "accepted")) {
      throw new NetworkAccessError(`Grid offer cannot move from ${offer.status} to accepted.`, 409);
    }

    const end = offer.offeredEndAt ?? new Date(offer.offeredStartAt.getTime() + 60 * 60 * 1000);
    const resource = await getEligibleGridResourceForTransaction(tx, {
      resourceId: offer.resourceReference,
      resourceType: offer.resourceKind,
      recipientOrganizationId: offer.recipientOrganizationId,
      startsAt: offer.offeredStartAt,
      endsAt: end,
    });

    await tx.$queryRaw(Prisma.sql`
      SELECT "id" FROM "GridDemandRecord" WHERE "id" = ${offer.demandId} FOR UPDATE
    `);
    const accepted = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id" FROM "GridOfferRecord"
      WHERE "demandId" = ${offer.demandId} AND "status" = 'accepted' AND "id" <> ${offer.id}
      LIMIT 1
    `);
    if (accepted.length) throw new NetworkAccessError("This Grid demand already has an accepted offer.", 409);

    await tx.$executeRaw(Prisma.sql`
      UPDATE "GridOfferRecord"
      SET "status" = 'accepted', "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${offer.id}
    `);
    await tx.$executeRaw(Prisma.sql`
      UPDATE "GridDemandRecord"
      SET "acceptedOfferId" = ${offer.id}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${offer.demandId} AND "organizationId" = ${offer.organizationId}
    `);

    const metadata = JSON.stringify({
      demandId: offer.demandId,
      resourceId: resource.id,
      resourceType: resource.resourceType,
      policyClass: resource.policyClass,
      ownerOrganizationId: resource.organizationId,
      version: offer.version,
      universalResourceVerified: true,
    });
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "GridOfferEventRecord" (
        "id", "organizationId", "offerId", "actorId", "action", "fromStatus", "toStatus", "note", "metadata", "createdAt"
      ) VALUES (
        ${randomUUID()}, ${offer.organizationId}, ${offer.id}, ${session.userId}, 'grid.offer.accepted',
        ${offer.status}, 'accepted', ${decision.note}, CAST(${metadata} AS JSONB), CURRENT_TIMESTAMP
      )
    `);
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "grid.offer_accepted",
        resourceType: "grid_offer",
        resourceId: offer.id,
        metadata: {
          ownerOrganizationId: offer.organizationId,
          demandId: offer.demandId,
          fromStatus: offer.status,
          toStatus: "accepted",
          resourceId: resource.id,
          resourceType: resource.resourceType,
          policyClass: resource.policyClass,
          universalResourceVerified: true,
        },
      },
    });

    return {
      offerId: offer.id,
      demandId: offer.demandId,
      status: "accepted",
      resourceId: resource.id,
      resourceType: resource.resourceType,
      policyClass: resource.policyClass,
      recipientOrganizationId: offer.recipientOrganizationId,
    };
  });
}
