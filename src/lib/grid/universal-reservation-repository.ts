import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { KLINIKOS_GODADDY_PAYLINK } from "@/lib/commercial/klinikos-commercial";
import { db } from "@/lib/db";
import { getEligibleGridResourceForTransaction } from "@/lib/grid/resource-repository";
import { canTransitionGridDemand } from "@/lib/grid/transaction-flow";
import { createReservationFromAcceptedOffer } from "@/lib/grid/reservation-repository";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type OfferRow = {
  id: string;
  organizationId: string;
  demandId: string;
  recipientOrganizationId: string | null;
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
  createdAt: Date;
  updatedAt: Date;
};

function requirePermission(session: ClinicSession) {
  if (!can(session.role, "grid", "create") && !can(session.role, "network", "create")) {
    throw new NetworkAccessError("Grid reservation access is not permitted for this role.", 403);
  }
}

async function requireSyntheticOrganization(organizationId: string) {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { status: true, demoMode: true },
  });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  if (!organization.demoMode) throw new NetworkAccessError("Universal Grid reservations require production review before live regulated use.", 409);
}

function serialize(row: ReservationRow) {
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

export async function createUniversalReservationFromAcceptedOffer(session: ClinicSession, offerId: string) {
  requirePermission(session);

  const preview = await db.$queryRaw<OfferRow[]>(Prisma.sql`
    SELECT "id", "organizationId", "demandId", "recipientOrganizationId", "resourceKind", "resourceReference",
           "offeredStartAt", "offeredEndAt", "grossAmountCents", "depositAmountCents", "locationPayableCents", "status"
    FROM "GridOfferRecord"
    WHERE "id" = ${offerId} AND "organizationId" = ${session.organizationId}
    LIMIT 1
  `);
  const initial = preview[0];
  if (!initial?.resourceReference || !initial.resourceKind) {
    return createReservationFromAcceptedOffer(session, offerId);
  }

  await requireSyntheticOrganization(session.organizationId);

  return db.$transaction(async (tx) => {
    const offers = await tx.$queryRaw<OfferRow[]>(Prisma.sql`
      SELECT "id", "organizationId", "demandId", "recipientOrganizationId", "resourceKind", "resourceReference",
             "offeredStartAt", "offeredEndAt", "grossAmountCents", "depositAmountCents", "locationPayableCents", "status"
      FROM "GridOfferRecord"
      WHERE "id" = ${offerId} AND "organizationId" = ${session.organizationId}
      FOR UPDATE
    `);
    const offer = offers[0];
    if (!offer) throw new NetworkAccessError("Accepted Grid offer not found for this organization.", 404);
    if (offer.status !== "accepted") throw new NetworkAccessError("Only an accepted Grid offer can be reserved.", 409);
    if (!offer.resourceReference || !offer.resourceKind) throw new NetworkAccessError("Universal Grid resource reference is missing.", 409);

    const existing = await tx.$queryRaw<ReservationRow[]>(Prisma.sql`
      SELECT * FROM "GridReservationRecord" WHERE "offerId" = ${offer.id} LIMIT 1
    `);
    if (existing[0]) return serialize(existing[0]);

    const end = offer.offeredEndAt ?? new Date(offer.offeredStartAt.getTime() + 60 * 60 * 1000);
    const lockKey = `grid:resource:${offer.resourceKind}:${offer.resourceReference}`;
    await tx.$queryRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`);

    const resource = await getEligibleGridResourceForTransaction(tx, {
      resourceId: offer.resourceReference,
      resourceType: offer.resourceKind,
      recipientOrganizationId: offer.recipientOrganizationId,
      startsAt: offer.offeredStartAt,
      endsAt: end,
    });
    const slotCapacity = resource.matchingAvailability.length
      ? Math.max(...resource.matchingAvailability.map((slot) => slot.capacity))
      : resource.capacity;
    const effectiveCapacity = Math.max(1, Math.min(resource.capacity, slotCapacity));

    const overlaps = await tx.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS "count"
      FROM "GridReservationRecord"
      WHERE "resourceKind" = ${offer.resourceKind}
        AND "resourceReference" = ${offer.resourceReference}
        AND "status" IN ('pending', 'held', 'consumed')
        AND "reservedStartAt" < ${end}
        AND COALESCE("reservedEndAt", "reservedStartAt" + INTERVAL '1 hour') > ${offer.offeredStartAt}
    `);
    if ((overlaps[0]?.count ?? 0) >= effectiveCapacity) {
      throw new NetworkAccessError("This Grid resource has no remaining capacity during the requested window.", 409);
    }

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
        "id", "organizationId", "demandId", "offerId", "createdBy", "resourceKind", "resourceReference",
        "reservedStartAt", "reservedEndAt", "grossAmountCents", "depositAmountCents", "locationPayableCents",
        "paymentStatus", "status", "fulfillmentStatus", "createdAt", "updatedAt"
      ) VALUES (
        ${reservationId}, ${session.organizationId}, ${offer.demandId}, ${offer.id}, ${session.userId},
        ${offer.resourceKind}, ${offer.resourceReference}, ${offer.offeredStartAt}, ${offer.offeredEndAt},
        ${offer.grossAmountCents}, ${offer.depositAmountCents}, ${offer.locationPayableCents},
        ${paymentStatus}, ${reservationStatus}, 'not_started', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `);
    const reservation = rows[0];
    if (!reservation) throw new NetworkAccessError("Grid reservation could not be created.", 500);

    await tx.$executeRaw(Prisma.sql`
      UPDATE "GridDemandRecord"
      SET "status" = 'reserved', "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${offer.demandId} AND "organizationId" = ${session.organizationId}
    `);

    const eventMetadata = JSON.stringify({
      reservationId,
      resourceId: resource.id,
      resourceType: resource.resourceType,
      policyClass: resource.policyClass,
      effectiveCapacity,
      occupiedBeforeReservation: overlaps[0]?.count ?? 0,
      reservationStatus,
      paymentStatus,
    });
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "GridOfferEventRecord" (
        "id", "organizationId", "offerId", "actorId", "action", "fromStatus", "toStatus", "note", "metadata", "createdAt"
      ) VALUES (
        ${randomUUID()}, ${session.organizationId}, ${offer.id}, ${session.userId}, 'grid.offer.reservation_created',
        'accepted', 'accepted', 'Approved universal Grid resource capacity reserved.', CAST(${eventMetadata} AS JSONB), CURRENT_TIMESTAMP
      )
    `);
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "grid.universal_resource_reserved",
        resourceType: "grid_reservation",
        resourceId: reservationId,
        metadata: {
          demandId: offer.demandId,
          offerId: offer.id,
          gridResourceId: resource.id,
          gridResourceType: resource.resourceType,
          policyClass: resource.policyClass,
          effectiveCapacity,
          occupiedBeforeReservation: overlaps[0]?.count ?? 0,
          status: reservationStatus,
          paymentStatus,
          syntheticDemo: true,
        },
      },
    });

    return serialize(reservation);
  });
}
