import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { providerReadyForGrid } from "@/lib/grid-rules";
import {
  canTransitionGridDemand,
  canTransitionGridOffer,
  gridOfferDecisionSchema,
  gridOfferSchema,
  type GridOfferInput,
} from "@/lib/grid/transaction-flow";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type DemandStateRow = {
  id: string;
  status: string;
  kind: string;
};

type GridOfferRow = {
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
  note: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function requireGridPermission(session: ClinicSession, action: "read" | "create" | "update") {
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

function serializeOffer(row: GridOfferRow) {
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
  requireGridPermission(session, "read");
  const rows = await db.$queryRaw<GridOfferRow[]>(Prisma.sql`
    SELECT *
    FROM "GridOfferRecord"
    WHERE "organizationId" = ${session.organizationId}
       OR "senderOrganizationId" = ${session.organizationId}
       OR "recipientOrganizationId" = ${session.organizationId}
    ORDER BY "updatedAt" DESC
    LIMIT 100
  `);
  return rows.map(serializeOffer);
}

async function validateCounterpartyOrganization(client: Prisma.TransactionClient, organizationId: string) {
  const organization = await client.organization.findFirst({
    where: { id: organizationId, status: "active", demoMode: true },
    select: { id: true },
  });
  if (!organization) throw new NetworkAccessError("The selected Grid counterparty is unavailable in this synthetic environment.", 409);
  return organization.id;
}

async function validateSelectedSupply(client: Prisma.TransactionClient, session: ClinicSession, input: GridOfferInput) {
  let derivedRecipientOrganizationId: string | null = null;

  if (input.providerId && input.serviceListingId) {
    const service = await client.gridServiceListing.findFirst({
      where: { id: input.serviceListingId, providerId: input.providerId, status: "active" },
      include: { provider: { include: { credentials: true } } },
    });
    if (!service || !providerReadyForGrid(service.provider)) {
      throw new NetworkAccessError("The selected provider/service is no longer eligible for this Grid offer.", 409);
    }
    derivedRecipientOrganizationId = service.organizationId;
  }

  if (input.locationId) {
    const location = await client.location.findFirst({
      where: {
        id: input.locationId,
        status: "active",
        OR: [{ organizationId: session.organizationId }, { marketplaceVisible: true }],
      },
      select: { id: true, organizationId: true },
    });
    if (!location) throw new NetworkAccessError("The selected Grid location is unavailable.", 409);
    if (!derivedRecipientOrganizationId) derivedRecipientOrganizationId = location.organizationId;
  }

  if (input.recipientOrganizationId) {
    const explicitRecipient = await validateCounterpartyOrganization(client, input.recipientOrganizationId);
    if (derivedRecipientOrganizationId && explicitRecipient !== derivedRecipientOrganizationId) {
      throw new NetworkAccessError("The selected recipient does not own the primary Grid resource in this offer.", 409);
    }
    derivedRecipientOrganizationId = explicitRecipient;
  }

  if (!derivedRecipientOrganizationId) {
    throw new NetworkAccessError("A verified recipient organization is required before a Grid offer can be sent.", 409);
  }

  return derivedRecipientOrganizationId;
}

async function appendOfferEvent(
  client: Prisma.TransactionClient,
  input: { organizationId: string; offerId: string; actorId: string; action: string; fromStatus?: string | null; toStatus?: string | null; note?: string | null; metadata?: Record<string, unknown> },
) {
  const metadata = input.metadata ? JSON.stringify(input.metadata) : null;
  await client.$executeRaw(Prisma.sql`
    INSERT INTO "GridOfferEventRecord" (
      "id", "organizationId", "offerId", "actorId", "action", "fromStatus", "toStatus", "note", "metadata", "createdAt"
    ) VALUES (
      ${randomUUID()}, ${input.organizationId}, ${input.offerId}, ${input.actorId}, ${input.action},
      ${input.fromStatus ?? null}, ${input.toStatus ?? null}, ${input.note ?? null},
      ${metadata ? Prisma.sql`CAST(${metadata} AS JSONB)` : null}, CURRENT_TIMESTAMP
    )
  `);
}

export async function createGridOffer(session: ClinicSession, rawInput: unknown) {
  requireGridPermission(session, "create");
  await requireSyntheticOrganization(session.organizationId);
  const input = gridOfferSchema.parse(rawInput);

  return db.$transaction(async (tx) => {
    const demandRows = await tx.$queryRaw<DemandStateRow[]>(Prisma.sql`
      SELECT "id", "status", "kind"
      FROM "GridDemandRecord"
      WHERE "id" = ${input.demandId} AND "organizationId" = ${session.organizationId}
      FOR UPDATE
    `);
    const demand = demandRows[0];
    if (!demand) throw new NetworkAccessError("Saved Grid demand not found.", 404);
    if (!["open", "matched"].includes(demand.status)) {
      throw new NetworkAccessError(`Grid demand in ${demand.status} state cannot receive a new offer.`, 409);
    }

    const recipientOrganizationId = await validateSelectedSupply(tx, session, input);

    if (demand.status === "open") {
      if (!canTransitionGridDemand("open", "matched")) throw new NetworkAccessError("Grid demand cannot enter matched state.", 409);
      await tx.$executeRaw(Prisma.sql`
        UPDATE "GridDemandRecord"
        SET "status" = 'matched', "updatedAt" = CURRENT_TIMESTAMP
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
    const rows = await tx.$queryRaw<GridOfferRow[]>(Prisma.sql`
      INSERT INTO "GridOfferRecord" (
        "id", "organizationId", "demandId", "createdBy", "destinationOrganizationId",
        "senderOrganizationId", "recipientOrganizationId", "parentOfferId", "version",
        "providerId", "serviceListingId", "locationId", "resourceKind", "resourceReference",
        "offeredStartAt", "offeredEndAt", "grossAmountCents", "depositAmountCents", "note",
        "status", "expiresAt", "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${session.organizationId}, ${demand.id}, ${session.userId}, ${recipientOrganizationId},
        ${session.organizationId}, ${recipientOrganizationId}, null, 1,
        ${input.providerId ?? null}, ${input.serviceListingId ?? null}, ${input.locationId ?? null},
        ${input.resourceKind ?? null}, ${input.resourceReference ?? null}, ${new Date(input.offeredStartAt)},
        ${input.offeredEndAt ? new Date(input.offeredEndAt) : null}, ${input.grossAmountCents},
        ${input.depositAmountCents}, ${input.note}, 'sent', ${new Date(input.expiresAt)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
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

    await appendOfferEvent(tx, {
      organizationId: session.organizationId,
      offerId: id,
      actorId: session.userId,
      action: "grid.offer.sent",
      fromStatus: null,
      toStatus: "sent",
      note: input.note,
      metadata: { demandId: demand.id, senderOrganizationId: session.organizationId, recipientOrganizationId, version: 1 },
    });

    await Promise.all([
      tx.auditLog.create({
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
            status: "sent",
            syntheticDemo: true,
            manualPolicyReviewRequired: Boolean(input.resourceReference),
          },
        },
      }),
      tx.auditLog.create({
        data: {
          organizationId: session.organizationId,
          actorId: session.userId,
          actorType: "user",
          action: "grid.demand_offered",
          resourceType: "grid_demand",
          resourceId: demand.id,
          metadata: { fromStatus: "matched", toStatus: "offered", offerId: id },
        },
      }),
    ]);

    return serializeOffer(created);
  });
}

export async function transitionGridOffer(session: ClinicSession, offerId: string, rawInput: unknown) {
  requireGridPermission(session, "update");
  await requireSyntheticOrganization(session.organizationId);
  const decision = gridOfferDecisionSchema.parse(rawInput);

  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<GridOfferRow[]>(Prisma.sql`
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
    if (decision.targetStatus === "withdrawn" && !isSender) {
      throw new NetworkAccessError("Only the current offer sender can withdraw it.", 403);
    }
    if (["accepted", "declined", "countered"].includes(decision.targetStatus) && !isRecipient) {
      throw new NetworkAccessError("Only the current offer recipient can make this decision.", 403);
    }

    if (decision.targetStatus === "accepted") {
      if (offer.resourceReference) {
        throw new NetworkAccessError("This resource class still requires a connected policy verifier before acceptance.", 409);
      }
      const revalidationInput = gridOfferSchema.parse({
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
        note: offer.note,
        expiresAt: offer.expiresAt.toISOString(),
      });
      await validateSelectedSupply(tx, session, revalidationInput);
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
      await validateSelectedSupply(tx, session, counterInput);

      await tx.$executeRaw(Prisma.sql`
        UPDATE "GridOfferRecord"
        SET "status" = 'countered', "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${offer.id}
      `);

      const counterId = randomUUID();
      const counterRows = await tx.$queryRaw<GridOfferRow[]>(Prisma.sql`
        INSERT INTO "GridOfferRecord" (
          "id", "organizationId", "demandId", "createdBy", "destinationOrganizationId",
          "senderOrganizationId", "recipientOrganizationId", "parentOfferId", "version",
          "providerId", "serviceListingId", "locationId", "resourceKind", "resourceReference",
          "offeredStartAt", "offeredEndAt", "grossAmountCents", "depositAmountCents", "note",
          "status", "expiresAt", "createdAt", "updatedAt"
        ) VALUES (
          ${counterId}, ${offer.organizationId}, ${offer.demandId}, ${session.userId}, ${offer.senderOrganizationId},
          ${session.organizationId}, ${offer.senderOrganizationId}, ${offer.id}, ${offer.version + 1},
          ${offer.providerId}, ${offer.serviceListingId}, ${decision.counterOffer.locationId ?? offer.locationId},
          ${offer.resourceKind}, ${offer.resourceReference}, ${new Date(decision.counterOffer.offeredStartAt)},
          ${decision.counterOffer.offeredEndAt ? new Date(decision.counterOffer.offeredEndAt) : null},
          ${decision.counterOffer.grossAmountCents}, ${decision.counterOffer.depositAmountCents}, ${decision.counterOffer.note},
          'sent', ${new Date(decision.counterOffer.expiresAt)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
      `);
      const counter = counterRows[0];
      if (!counter) throw new NetworkAccessError("Counteroffer could not be created.", 500);

      await appendOfferEvent(tx, {
        organizationId: offer.organizationId,
        offerId: offer.id,
        actorId: session.userId,
        action: "grid.offer.countered",
        fromStatus: offer.status,
        toStatus: "countered",
        note: decision.note,
        metadata: { counterOfferId: counterId },
      });
      await appendOfferEvent(tx, {
        organizationId: offer.organizationId,
        offerId: counterId,
        actorId: session.userId,
        action: "grid.offer.sent",
        fromStatus: null,
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
      return serializeOffer(counter);
    }

    const updatedRows = await tx.$queryRaw<GridOfferRow[]>(Prisma.sql`
      UPDATE "GridOfferRecord"
      SET "status" = ${decision.targetStatus}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${offer.id}
      RETURNING *
    `);
    const updated = updatedRows[0];
    if (!updated) throw new NetworkAccessError("Grid offer decision could not be recorded.", 500);

    if (decision.targetStatus === "accepted") {
      await tx.$executeRaw(Prisma.sql`
        UPDATE "GridDemandRecord"
        SET "acceptedOfferId" = ${offer.id}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${offer.demandId} AND "organizationId" = ${offer.organizationId}
      `);
    }

    if (["declined", "withdrawn"].includes(decision.targetStatus)) {
      const activeRows = await tx.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS "count"
        FROM "GridOfferRecord"
        WHERE "demandId" = ${offer.demandId} AND "id" <> ${offer.id} AND "status" = 'sent'
      `);
      if ((activeRows[0]?.count ?? 0n) === 0n && canTransitionGridDemand("offered", "matched")) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE "GridDemandRecord"
          SET "status" = 'matched', "acceptedOfferId" = null, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${offer.demandId} AND "organizationId" = ${offer.organizationId} AND "status" = 'offered'
        `);
      }
    }

    await appendOfferEvent(tx, {
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

    return serializeOffer(updated);
  });
}
