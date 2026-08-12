import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { providerReadyForGrid } from "@/lib/grid-rules";
import { canTransitionGridDemand, gridOfferSchema, type GridOfferInput } from "@/lib/grid/transaction-flow";
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

function requireGridPermission(session: ClinicSession, action: "read" | "create") {
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
    ORDER BY "updatedAt" DESC
    LIMIT 100
  `);
  return rows.map(serializeOffer);
}

async function validateSelectedSupply(client: Prisma.TransactionClient, session: ClinicSession, input: GridOfferInput) {
  if (input.providerId && input.serviceListingId) {
    const service = await client.gridServiceListing.findFirst({
      where: { id: input.serviceListingId, providerId: input.providerId, status: "active" },
      include: { provider: { include: { credentials: true } } },
    });
    if (!service || !providerReadyForGrid(service.provider)) {
      throw new NetworkAccessError("The selected provider/service is no longer eligible for this Grid offer.", 409);
    }
  }

  if (input.locationId) {
    const location = await client.location.findFirst({
      where: {
        id: input.locationId,
        status: "active",
        OR: [{ organizationId: session.organizationId }, { marketplaceVisible: true }],
      },
      select: { id: true },
    });
    if (!location) throw new NetworkAccessError("The selected Grid location is unavailable.", 409);
  }
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
    if (!['open', 'matched'].includes(demand.status)) {
      throw new NetworkAccessError(`Grid demand in ${demand.status} state cannot receive a new offer.`, 409);
    }

    await validateSelectedSupply(tx, session, input);

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
        "id", "organizationId", "demandId", "createdBy", "providerId", "serviceListingId", "locationId",
        "resourceKind", "resourceReference", "offeredStartAt", "offeredEndAt", "grossAmountCents",
        "depositAmountCents", "note", "status", "expiresAt", "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${session.organizationId}, ${demand.id}, ${session.userId}, ${input.providerId ?? null},
        ${input.serviceListingId ?? null}, ${input.locationId ?? null}, ${input.resourceKind ?? null},
        ${input.resourceReference ?? null}, ${new Date(input.offeredStartAt)},
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
