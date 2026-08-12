import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { providerReadyForGrid } from "@/lib/grid-rules";
import { verifyGridResourceForTransaction } from "@/lib/grid/resource-transaction-policy";
import {
  canTransitionGridDemand,
  canTransitionGridOffer,
  gridOfferDecisionSchema,
  gridOfferSchema,
  type GridOfferInput,
} from "@/lib/grid/transaction-flow";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type DemandRow = { id: string; status: string; kind: string };
type OfferRow = {
  id: string;
  organizationId: string;
  demandId: string;
  createdBy: string;
  destinationOrganizationId: string | null;
  senderOrganizationId: string | null;
  recipientOrganizationId: string | null;
  parentOfferId: string | null;
  version: number;
  providerId: string | null;
  serviceListingId: string | null;
  locationId: string | null;
  resourceKind: string | null;
  resourceReference: string | null;
  offeredStartAt: Date;
  offeredEndAt: Date | null;
  grossAmountCents: number;
  depositAmountCents: number;
  locationPayableCents: number;
  note: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function requirePermission(session: ClinicSession, action: "read" | "create" | "update") {
  if (session.role === "contractor") return;
  if (!can(session.role, "network", action) && !can(session.role, "grid", action)) {
    throw new NetworkAccessError("Grid offer access is not permitted for this role.", 403);
  }
}

async function requireSyntheticOrganization(organizationId: string) {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { demoMode: true, status: true },
  });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  if (!organization.demoMode) throw new NetworkAccessError("Grid offers require production review before live regulated transactions can be used.", 409);
}

function serialize(row: OfferRow) {
  return {
    ...row,
    offeredStartAt: row.offeredStartAt.toISOString(),
    offeredEndAt: row.offeredEndAt?.toISOString() ?? null,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listGridOffers(session: ClinicSession) {
  requirePermission(session, "read");
  const rows = await db.$queryRaw<OfferRow[]>(Prisma.sql`
    SELECT * FROM "GridOfferRecord"
    WHERE "organizationId" = ${session.organizationId}
       OR "senderOrganizationId" = ${session.organizationId}
       OR "recipientOrganizationId" = ${session.organizationId}
    ORDER BY "updatedAt" DESC
    LIMIT 100
  `);
  return rows.map(serialize);
}

async function validateOrganization(client: Prisma.TransactionClient, organizationId: string) {
  const organization = await client.organization.findFirst({
    where: { id: organizationId, status: "active", demoMode: true },
    select: { id: true },
  });
  if (!organization) throw new NetworkAccessError("The selected Grid counterparty is unavailable in this synthetic environment.", 409);
  return organization.id;
}

async function verifySupply(
  client: Prisma.TransactionClient,
  input: GridOfferInput,
  allowedLocationOrganizationIds: string[],
) {
  let primaryOwnerOrganizationId: string | null = null;
  const registerOwner = (organizationId: string) => {
    if (primaryOwnerOrganizationId && primaryOwnerOrganizationId !== organizationId) {
      throw new NetworkAccessError("This offer combines resources owned by different organizations. Use the multi-party composition/agreement pathway before sending it.", 409);
    }
    primaryOwnerOrganizationId = organizationId;
  };

  if (input.providerId && input.serviceListingId) {
    const service = await client.gridServiceListing.findFirst({
      where: { id: input.serviceListingId, providerId: input.providerId, status: "active" },
      include: { provider: { include: { credentials: true } } },
    });
    if (!service || !providerReadyForGrid(service.provider)) {
      throw new NetworkAccessError("The selected provider/service is no longer eligible for this Grid offer.", 409);
    }
    registerOwner(service.organizationId);
  }

  if (input.locationId) {
    const location = await client.location.findFirst({
      where: {
        id: input.locationId,
        status: "active",
        OR: [
          { marketplaceVisible: true },
          ...allowedLocationOrganizationIds.map((organizationId) => ({ organizationId })),
        ],
      },
      select: { id: true, organizationId: true },
    });
    if (!location) throw new NetworkAccessError("The selected Grid location is unavailable.", 409);
    registerOwner(location.organizationId);
  }

  if (input.resourceReference || input.resourceKind) {
    if (!input.resourceReference || !input.resourceKind) {
      throw new NetworkAccessError("Generic Grid resource kind and reference must be supplied together.", 400);
    }
    const resource = await verifyGridResourceForTransaction(client, {
      resourceId: input.resourceReference,
      resourceKind: input.resourceKind,
      startsAt: new Date(input.offeredStartAt),
      endsAt: input.offeredEndAt ? new Date(input.offeredEndAt) : null,
      requesterOrganizationIds: allowedLocationOrganizationIds,
    });
    registerOwner(resource.organizationId);
  }

  if (input.recipientOrganizationId) await validateOrganization(client, input.recipientOrganizationId);
  return primaryOwnerOrganizationId;
}

async function appendEvent(
  client: Prisma.TransactionClient,
  input: {
    organizationId: string;
    offerId: string;
    actorId: string;
    action: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    note?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const metadata = JSON.stringify(input.metadata ?? {});
  await client.$executeRaw(Prisma.sql`
    INSERT INTO "GridOfferEventRecord" (
      "id", "organizationId", "offerId", "actorId", "action", "fromStatus", "toStatus", "note", "metadata", "createdAt"
    ) VALUES (
      ${randomUUID()}, ${input.organizationId}, ${input.offerId}, ${input.actorId}, ${input.action},
      ${input.fromStatus ?? null}, ${input.toStatus ?? null}, ${input.note ?? null},
      CAST(${metadata} AS JSONB), CURRENT_TIMESTAMP
    )
  `);
}

export async function createGridOffer(session: ClinicSession, rawInput: unknown) {
  requirePermission(session, "create");
  await requireSyntheticOrganization(session.organizationId);
  const input = gridOfferSchema.parse(rawInput);

  return db.$transaction(async (tx) => {
    const demands = await tx.$queryRaw<DemandRow[]>(Prisma.sql`
      SELECT "id", "status", "kind" FROM "GridDemandRecord"
      WHERE "id" = ${input.demandId} AND "organizationId" = ${session.organizationId}
      FOR UPDATE
    `);
    const demand = demands[0];
    if (!demand) throw new NetworkAccessError("Saved Grid demand not found.", 404);
    if (!["open", "matched"].includes(demand.status)) {
      throw new NetworkAccessError(`Grid demand in ${demand.status} state cannot receive a new offer.`, 409);
    }

    const primaryOwner = await verifySupply(tx, input, [session.organizationId]);
    let recipientOrganizationId = input.recipientOrganizationId ?? primaryOwner;
    if (!recipientOrganizationId) throw new NetworkAccessError("A verified recipient organization is required before a Grid offer can be sent.", 409);
    recipientOrganizationId = await validateOrganization(tx, recipientOrganizationId);
    if (input.recipientOrganizationId && primaryOwner && input.recipientOrganizationId !== primaryOwner) {
      throw new NetworkAccessError("The selected recipient does not own the primary Grid resource in this offer.", 409);
    }

    if (demand.status === "open") {
      if (!canTransitionGridDemand("open", "matched")) throw new NetworkAccessError("Grid demand cannot enter matched state.", 409);
      await tx.$executeRaw(Prisma.sql`
        UPDATE "GridDemandRecord" SET "status" = 'matched', "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${demand.id} AND "organizationId" = ${session.organizationId}
      `);
      await tx.auditLog.create({
        data: {
          organizationId: session.organizationId,
          actorId: session.userId,
          actorType: "user",
          action: "grid.demand_matched",
          resourceType: "grid_demand",
          resourceId: demand.id,
          metadata: { fromStatus: "open", toStatus: "matched", supplySelected: true },
        },
      });
    }
    if (!canTransitionGridDemand("matched", "offered")) throw new NetworkAccessError("Grid demand cannot enter offered state.", 409);

    const id = randomUUID();
    const rows = await tx.$queryRaw<OfferRow[]>(Prisma.sql`
      INSERT INTO "GridOfferRecord" (
        "id", "organizationId", "demandId", "createdBy", "destinationOrganizationId",
        "senderOrganizationId", "recipientOrganizationId", "parentOfferId", "version",
        "providerId", "serviceListingId", "locationId", "resourceKind", "resourceReference",
        "offeredStartAt", "offeredEndAt", "grossAmountCents", "depositAmountCents", "locationPayableCents", "note",
        "status", "expiresAt", "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${session.organizationId}, ${demand.id}, ${session.userId}, ${recipientOrganizationId},
        ${session.organizationId}, ${recipientOrganizationId}, null, 1,
        ${input.providerId ?? null}, ${input.serviceListingId ?? null}, ${input.locationId ?? null},
        ${input.resourceKind ?? null}, ${input.resourceReference ?? null}, ${new Date(input.offeredStartAt)},
        ${input.offeredEndAt ? new Date(input.offeredEndAt) : null}, ${input.grossAmountCents},
        ${input.depositAmountCents}, ${input.locationPayableCents}, ${input.note}, 'sent', ${new Date(input.expiresAt)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `);
    const created = rows[0];
    if (!created) throw new NetworkAccessError("Grid offer could not be created.", 500);

    await tx.$executeRaw(Prisma.sql`
      UPDATE "GridDemandRecord"
      SET "status" = 'offered',
          "selectedProviderId" = ${input.providerId ?? null},
          "selectedServiceListingId" = ${input.serviceListingId ?? null},
          "selectedLocationId" = ${input.locationId ?? null},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${demand.id} AND "organizationId" = ${session.organizationId}
    `);

    await appendEvent(tx, {
      organizationId: session.organizationId,
      offerId: id,
      actorId: session.userId,
      action: "grid.offer.sent",
      toStatus: "sent",
      note: input.note,
      metadata: { demandId: demand.id, senderOrganizationId: session.organizationId, recipientOrganizationId, version: 1 },
    });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "grid.offer_created",
        resourceType: "grid_offer",
        resourceId: id,
        metadata: {
          demandId: demand.id,
          demandKind: demand.kind,
          senderOrganizationId: session.organizationId,
          recipientOrganizationId,
          providerId: input.providerId ?? null,
          serviceListingId: input.serviceListingId ?? null,
          locationId: input.locationId ?? null,
          resourceKind: input.resourceKind ?? null,
          resourceReference: input.resourceReference ?? null,
          grossAmountCents: input.grossAmountCents,
          depositAmountCents: input.depositAmountCents,
          locationPayableCents: input.locationPayableCents,
          status: "sent",
          syntheticDemo: true,
          universalResourceVerified: Boolean(input.resourceReference),
        },
      },
    });
    return serialize(created);
  });
}

export async function transitionGridOffer(session: ClinicSession, offerId: string, rawInput: unknown) {
  requirePermission(session, "update");
  await requireSyntheticOrganization(session.organizationId);
  const decision = gridOfferDecisionSchema.parse(rawInput);

  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<OfferRow[]>(Prisma.sql`
      SELECT * FROM "GridOfferRecord"
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
    if (offer.expiresAt.getTime() <= Date.now()) throw new NetworkAccessError("This Grid offer has expired and cannot be acted on.", 409);
    if (!canTransitionGridOffer(offer.status, decision.targetStatus)) {
      throw new NetworkAccessError(`Grid offer cannot move from ${offer.status} to ${decision.targetStatus}.`, 409);
    }

    const isSender = offer.senderOrganizationId === session.organizationId;
    const isRecipient = offer.recipientOrganizationId === session.organizationId;
    if (decision.targetStatus === "withdrawn" && !isSender) throw new NetworkAccessError("Only the current offer sender can withdraw it.", 403);
    if (["accepted", "declined", "countered"].includes(decision.targetStatus) && !isRecipient) {
      throw new NetworkAccessError("Only the current offer recipient can make this decision.", 403);
    }

    const allowedLocationOrganizations = [offer.organizationId, offer.senderOrganizationId, offer.recipientOrganizationId]
      .filter((value): value is string => Boolean(value));

    if (decision.targetStatus === "accepted") {
      const revalidation = gridOfferSchema.parse({
        demandId: offer.demandId,
        providerId: offer.providerId,
        serviceListingId: offer.serviceListingId,
        recipientOrganizationId: offer.recipientOrganizationId,
        locationId: offer.locationId,
        resourceKind: offer.resourceKind,
        resourceReference: offer.resourceReference,
        offeredStartAt: offer.offeredStartAt.toISOString(),
        offeredEndAt: offer.offeredEndAt?.toISOString() ?? null,
        grossAmountCents: offer.grossAmountCents,
        depositAmountCents: offer.depositAmountCents,
        locationPayableCents: offer.locationPayableCents,
        note: offer.note,
        expiresAt: offer.expiresAt.toISOString(),
      });
      await verifySupply(tx, revalidation, allowedLocationOrganizations);
      await tx.$queryRaw(Prisma.sql`
        SELECT "id" FROM "GridDemandRecord" WHERE "id" = ${offer.demandId} FOR UPDATE
      `);
      const accepted = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id" FROM "GridOfferRecord"
        WHERE "demandId" = ${offer.demandId} AND "status" = 'accepted' AND "id" <> ${offer.id}
        LIMIT 1
      `);
      if (accepted.length) throw new NetworkAccessError("This Grid demand already has an accepted offer.", 409);
    }

    if (decision.targetStatus === "countered" && decision.counterOffer) {
      const counterInput = gridOfferSchema.parse({
        demandId: offer.demandId,
        providerId: offer.providerId,
        serviceListingId: offer.serviceListingId,
        recipientOrganizationId: offer.senderOrganizationId,
        resourceKind: offer.resourceKind,
        resourceReference: offer.resourceReference,
        ...decision.counterOffer,
      });
      await verifySupply(tx, counterInput, allowedLocationOrganizations);
      await tx.$executeRaw(Prisma.sql`
        UPDATE "GridOfferRecord" SET "status" = 'countered', "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${offer.id}
      `);

      const counterId = randomUUID();
      const counterRows = await tx.$queryRaw<OfferRow[]>(Prisma.sql`
        INSERT INTO "GridOfferRecord" (
          "id", "organizationId", "demandId", "createdBy", "destinationOrganizationId",
          "senderOrganizationId", "recipientOrganizationId", "parentOfferId", "version",
          "providerId", "serviceListingId", "locationId", "resourceKind", "resourceReference",
          "offeredStartAt", "offeredEndAt", "grossAmountCents", "depositAmountCents", "locationPayableCents", "note",
          "status", "expiresAt", "createdAt", "updatedAt"
        ) VALUES (
          ${counterId}, ${offer.organizationId}, ${offer.demandId}, ${session.userId}, ${offer.senderOrganizationId},
          ${session.organizationId}, ${offer.senderOrganizationId}, ${offer.id}, ${offer.version + 1},
          ${offer.providerId}, ${offer.serviceListingId}, ${decision.counterOffer.locationId ?? offer.locationId},
          ${offer.resourceKind}, ${offer.resourceReference}, ${new Date(decision.counterOffer.offeredStartAt)},
          ${decision.counterOffer.offeredEndAt ? new Date(decision.counterOffer.offeredEndAt) : null},
          ${decision.counterOffer.grossAmountCents}, ${decision.counterOffer.depositAmountCents}, ${decision.counterOffer.locationPayableCents},
          ${decision.counterOffer.note}, 'sent', ${new Date(decision.counterOffer.expiresAt)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
      `);
      const counter = counterRows[0];
      if (!counter) throw new NetworkAccessError("Counteroffer could not be created.", 500);
      await appendEvent(tx, {
        organizationId: offer.organizationId,
        offerId: offer.id,
        actorId: session.userId,
        action: "grid.offer.countered",
        fromStatus: offer.status,
        toStatus: "countered",
        note: decision.note,
        metadata: { counterOfferId: counterId },
      });
      await appendEvent(tx, {
        organizationId: offer.organizationId,
        offerId: counterId,
        actorId: session.userId,
        action: "grid.offer.sent",
        toStatus: "sent",
        note: decision.counterOffer.note,
        metadata: { parentOfferId: offer.id, version: offer.version + 1 },
      });
      await tx.auditLog.create({
        data: {
          organizationId: offer.organizationId,
          actorId: session.userId,
          actorType: "user",
          action: "grid.offer_countered",
          resourceType: "grid_offer",
          resourceId: offer.id,
          metadata: { counterOfferId: counterId, fromStatus: offer.status, toStatus: "countered", version: offer.version + 1 },
        },
      });
      return serialize(counter);
    }

    const updatedRows = await tx.$queryRaw<OfferRow[]>(Prisma.sql`
      UPDATE "GridOfferRecord" SET "status" = ${decision.targetStatus}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${offer.id} RETURNING *
    `);
    const updated = updatedRows[0];
    if (!updated) throw new NetworkAccessError("Grid offer decision could not be recorded.", 500);

    if (decision.targetStatus === "accepted") {
      await tx.$executeRaw(Prisma.sql`
        UPDATE "GridDemandRecord" SET "acceptedOfferId" = ${offer.id}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${offer.demandId} AND "organizationId" = ${offer.organizationId}
      `);
    }

    if (["declined", "withdrawn"].includes(decision.targetStatus)) {
      const activeRows = await tx.$queryRaw<Array<{ count: number }>>(Prisma.sql`
        SELECT COUNT(*)::int AS "count" FROM "GridOfferRecord"
        WHERE "demandId" = ${offer.demandId} AND "id" <> ${offer.id} AND "status" = 'sent'
      `);
      if ((activeRows[0]?.count ?? 0) === 0 && canTransitionGridDemand("offered", "matched")) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE "GridDemandRecord" SET "status" = 'matched', "acceptedOfferId" = null, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${offer.demandId} AND "organizationId" = ${offer.organizationId} AND "status" = 'offered'
        `);
      }
    }

    await appendEvent(tx, {
      organizationId: offer.organizationId,
      offerId: offer.id,
      actorId: session.userId,
      action: `grid.offer.${decision.targetStatus}`,
      fromStatus: offer.status,
      toStatus: decision.targetStatus,
      note: decision.note,
    });
    await tx.auditLog.create({
      data: {
        organizationId: offer.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: `grid.offer_${decision.targetStatus}`,
        resourceType: "grid_offer",
        resourceId: offer.id,
        metadata: { fromStatus: offer.status, toStatus: decision.targetStatus, demandId: offer.demandId, version: offer.version },
      },
    });
    return serialize(updated);
  });
}
