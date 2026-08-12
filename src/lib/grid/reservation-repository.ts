import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { KLINIKOS_GODADDY_PAYLINK } from "@/lib/commercial/klinikos-commercial";
import { db } from "@/lib/db";
import { canTransitionGridDemand } from "@/lib/grid/transaction-flow";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type AcceptedOfferRow = {
  id: string;
  organizationId: string;
  demandId: string;
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
  status: string;
};

type ReservationRow = {
  id: string;
  organizationId: string;
  demandId: string;
  offerId: string;
  createdBy: string;
  providerId: string | null;
  serviceListingId: string | null;
  locationId: string | null;
  resourceKind: string | null;
  resourceReference: string | null;
  reservedStartAt: Date;
  reservedEndAt: Date | null;
  grossAmountCents: number;
  depositAmountCents: number;
  locationPayableCents: number;
  paymentStatus: string;
  status: string;
  fulfillmentStatus: string;
  legacyGridRequestId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function requireGridPermission(session: ClinicSession, action: "read" | "create") {
  if (!can(session.role, "network", action) && !can(session.role, "grid", action)) {
    throw new NetworkAccessError("Grid reservation access is not permitted for this role.", 403);
  }
}

async function requireSyntheticOrganization(organizationId: string) {
  const organization = await db.organization.findUnique({ where: { id: organizationId }, select: { demoMode: true, status: true } });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  if (!organization.demoMode) throw new NetworkAccessError("Grid reservations require production review before live regulated transactions can be used.", 409);
}

function serializeReservation(row: ReservationRow) {
  return {
    ...row,
    reservedStartAt: row.reservedStartAt.toISOString(),
    reservedEndAt: row.reservedEndAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    paymentAction: row.paymentStatus === "manual_link_required"
      ? { type: "godaddy_checkout", url: KLINIKOS_GODADDY_PAYLINK, amountDueCents: row.depositAmountCents }
      : null,
  };
}

export async function listGridReservations(session: ClinicSession) {
  requireGridPermission(session, "read");
  const rows = await db.$queryRaw<ReservationRow[]>(Prisma.sql`
    SELECT * FROM "GridReservationRecord"
    WHERE "organizationId" = ${session.organizationId}
    ORDER BY "updatedAt" DESC
    LIMIT 100
  `);
  return rows.map(serializeReservation);
}

async function takeResourceLocks(client: Prisma.TransactionClient, offer: AcceptedOfferRow) {
  const keys = [
    offer.providerId ? `grid:provider:${offer.providerId}` : null,
    offer.locationId ? `grid:location:${offer.locationId}` : null,
    offer.resourceReference ? `grid:resource:${offer.resourceKind ?? "generic"}:${offer.resourceReference}` : null,
  ].filter((value): value is string => Boolean(value));

  for (const key of keys.sort()) await client.$queryRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${key}))`);
}

async function assertUniversalReservationAvailable(client: Prisma.TransactionClient, offer: AcceptedOfferRow) {
  const start = offer.offeredStartAt;
  const end = offer.offeredEndAt ?? new Date(start.getTime() + 60 * 60 * 1000);

  const conflicts = await client.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "GridReservationRecord"
    WHERE "status" IN ('pending', 'held', 'consumed')
      AND (
        (${offer.providerId} IS NOT NULL AND "providerId" = ${offer.providerId})
        OR (${offer.locationId} IS NOT NULL AND "locationId" = ${offer.locationId})
        OR (${offer.resourceReference} IS NOT NULL AND "resourceKind" = ${offer.resourceKind} AND "resourceReference" = ${offer.resourceReference})
      )
      AND "reservedStartAt" < ${end}
      AND COALESCE("reservedEndAt", "reservedStartAt" + INTERVAL '1 hour') > ${start}
    LIMIT 1
  `);
  if (conflicts.length) throw new NetworkAccessError("The selected Grid resource is no longer available for that time.", 409);

  const overlapTargets: Prisma.GridRequestWhereInput[] = [];
  if (offer.providerId) overlapTargets.push({ providerId: offer.providerId });
  if (offer.locationId) overlapTargets.push({ locationId: offer.locationId });
  if (overlapTargets.length) {
    const legacy = await client.gridRequest.findFirst({
      where: {
        status: { in: ["accepted", "provider_review", "location_review", "credential_check", "pending_deposit", "confirmed"] },
        OR: overlapTargets,
        requestedStartAt: { lt: end },
        AND: [{ OR: [{ requestedEndAt: { gt: start } }, { requestedEndAt: null, requestedStartAt: { gt: new Date(start.getTime() - 60 * 60 * 1000) } }] }],
      },
      select: { id: true },
    });
    if (legacy) throw new NetworkAccessError("The selected provider or location is already committed during that time.", 409);
  }
}

export async function createReservationFromAcceptedOffer(session: ClinicSession, offerId: string) {
  requireGridPermission(session, "create");
  await requireSyntheticOrganization(session.organizationId);

  return db.$transaction(async (tx) => {
    const offers = await tx.$queryRaw<AcceptedOfferRow[]>(Prisma.sql`
      SELECT "id", "organizationId", "demandId", "providerId", "serviceListingId", "locationId",
             "resourceKind", "resourceReference", "offeredStartAt", "offeredEndAt",
             "grossAmountCents", "depositAmountCents", "locationPayableCents", "status"
      FROM "GridOfferRecord"
      WHERE "id" = ${offerId} AND "organizationId" = ${session.organizationId}
      FOR UPDATE
    `);
    const offer = offers[0];
    if (!offer) throw new NetworkAccessError("Accepted Grid offer not found for this organization.", 404);
    if (offer.status !== "accepted") throw new NetworkAccessError("Only an accepted Grid offer can be reserved.", 409);
    if (offer.resourceReference) throw new NetworkAccessError("This resource class requires a connected policy verifier before reservation.", 409);

    const existing = await tx.$queryRaw<ReservationRow[]>(Prisma.sql`
      SELECT * FROM "GridReservationRecord" WHERE "offerId" = ${offer.id} LIMIT 1
    `);
    if (existing[0]) return serializeReservation(existing[0]);

    await takeResourceLocks(tx, offer);
    await assertUniversalReservationAvailable(tx, offer);

    const demands = await tx.$queryRaw<Array<{ status: string }>>(Prisma.sql`
      SELECT "status" FROM "GridDemandRecord"
      WHERE "id" = ${offer.demandId} AND "organizationId" = ${session.organizationId}
      FOR UPDATE
    `);
    const demandStatus = demands[0]?.status;
    if (!demandStatus || !canTransitionGridDemand(demandStatus, "reserved")) {
      throw new NetworkAccessError(`Grid demand in ${demandStatus ?? "unknown"} state cannot be reserved.`, 409);
    }

    const requiresDeposit = offer.depositAmountCents > 0;
    const reservationStatus = requiresDeposit ? "pending" : "held";
    const paymentStatus = requiresDeposit ? "manual_link_required" : "not_required";
    const reservationId = randomUUID();

    const rows = await tx.$queryRaw<ReservationRow[]>(Prisma.sql`
      INSERT INTO "GridReservationRecord" (
        "id", "organizationId", "demandId", "offerId", "createdBy", "providerId", "serviceListingId",
        "locationId", "resourceKind", "resourceReference", "reservedStartAt", "reservedEndAt",
        "grossAmountCents", "depositAmountCents", "locationPayableCents", "paymentStatus", "status", "fulfillmentStatus",
        "createdAt", "updatedAt"
      ) VALUES (
        ${reservationId}, ${session.organizationId}, ${offer.demandId}, ${offer.id}, ${session.userId},
        ${offer.providerId}, ${offer.serviceListingId}, ${offer.locationId}, ${offer.resourceKind}, ${offer.resourceReference},
        ${offer.offeredStartAt}, ${offer.offeredEndAt}, ${offer.grossAmountCents}, ${offer.depositAmountCents},
        ${offer.locationPayableCents}, ${paymentStatus}, ${reservationStatus}, 'not_started', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `);
    const reservation = rows[0];
    if (!reservation) throw new NetworkAccessError("Grid reservation could not be created.", 500);

    await tx.$executeRaw(Prisma.sql`
      UPDATE "GridDemandRecord" SET "status" = 'reserved', "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${offer.demandId} AND "organizationId" = ${session.organizationId}
    `);

    await Promise.all([
      tx.auditLog.create({
        data: {
          organizationId: session.organizationId,
          actorId: session.userId,
          actorType: "user",
          action: "grid.reservation_created",
          resourceType: "grid_reservation",
          resourceId: reservationId,
          metadata: {
            demandId: offer.demandId,
            offerId: offer.id,
            status: reservationStatus,
            paymentStatus,
            depositAmountCents: offer.depositAmountCents,
            locationPayableCents: offer.locationPayableCents,
            syntheticDemo: true,
          },
        },
      }),
      tx.$executeRaw(Prisma.sql`
        INSERT INTO "GridOfferEventRecord" (
          "id", "organizationId", "offerId", "actorId", "action", "fromStatus", "toStatus", "note", "metadata", "createdAt"
        ) VALUES (
          ${randomUUID()}, ${session.organizationId}, ${offer.id}, ${session.userId}, 'grid.offer.reservation_created',
          'accepted', 'accepted', 'Accepted offer converted into a Grid reservation hold.',
          CAST(${JSON.stringify({ reservationId, reservationStatus, paymentStatus, locationPayableCents: offer.locationPayableCents })} AS JSONB), CURRENT_TIMESTAMP
        )
      `),
    ]);

    return serializeReservation(reservation);
  });
}
