import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { gridFulfillmentDecisionSchema } from "@/lib/grid/fulfillment-rules";
import { canTransitionGridFulfillment, canTransitionGridReservation } from "@/lib/grid/transaction-state";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type FulfillmentRow = {
  id: string;
  organizationId: string;
  offerId: string;
  status: "pending" | "held" | "released" | "consumed" | "expired";
  paymentStatus: string;
  fulfillmentStatus: "not_started" | "checked_in" | "in_progress" | "fulfilled" | "partial" | "failed" | "disputed";
  senderOrganizationId: string | null;
  recipientOrganizationId: string | null;
  updatedAt: Date;
};

function requirePermission(session: ClinicSession) {
  if (!can(session.role, "network", "update") && !can(session.role, "grid", "update")) {
    throw new NetworkAccessError("Grid fulfillment access is not permitted for this role.", 403);
  }
}

async function requireSyntheticOrganization(organizationId: string) {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { demoMode: true, status: true },
  });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  if (!organization.demoMode) throw new NetworkAccessError("Grid fulfillment requires production review before live regulated transactions can be used.", 409);
}

export async function transitionGridFulfillment(session: ClinicSession, reservationId: string, rawInput: unknown) {
  requirePermission(session);
  await requireSyntheticOrganization(session.organizationId);
  const decision = gridFulfillmentDecisionSchema.parse(rawInput);

  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<FulfillmentRow[]>(Prisma.sql`
      SELECT r."id", r."organizationId", r."offerId", r."status", r."paymentStatus", r."fulfillmentStatus",
             o."senderOrganizationId", o."recipientOrganizationId", r."updatedAt"
      FROM "GridReservationRecord" r
      JOIN "GridOfferRecord" o ON o."id" = r."offerId"
      WHERE r."id" = ${reservationId}
        AND (
          r."organizationId" = ${session.organizationId}
          OR o."senderOrganizationId" = ${session.organizationId}
          OR o."recipientOrganizationId" = ${session.organizationId}
        )
      FOR UPDATE OF r
    `);
    const reservation = rows[0];
    if (!reservation) throw new NetworkAccessError("Grid reservation not found.", 404);

    if (!canTransitionGridFulfillment(reservation.fulfillmentStatus, decision.targetStatus)) {
      throw new NetworkAccessError(
        `Grid fulfillment cannot move from ${reservation.fulfillmentStatus} to ${decision.targetStatus}.`,
        409,
      );
    }

    if (decision.targetStatus === "checked_in") {
      if (reservation.status !== "held") {
        throw new NetworkAccessError("A reservation must be held before fulfillment can begin.", 409);
      }
      if (reservation.paymentStatus === "manual_link_required") {
        throw new NetworkAccessError("Required deposit evidence must be reconciled before check-in.", 409);
      }
      if (!canTransitionGridReservation("held", "consumed")) {
        throw new NetworkAccessError("Reservation cannot be consumed for fulfillment.", 409);
      }
    } else if (reservation.status !== "consumed") {
      throw new NetworkAccessError("Fulfillment can only advance after the reservation has been consumed at check-in.", 409);
    }

    const reservationStatus = decision.targetStatus === "checked_in" ? "consumed" : reservation.status;
    const updatedRows = await tx.$queryRaw<FulfillmentRow[]>(Prisma.sql`
      UPDATE "GridReservationRecord" r
      SET "status" = ${reservationStatus},
          "fulfillmentStatus" = ${decision.targetStatus},
          "updatedAt" = CURRENT_TIMESTAMP
      FROM "GridOfferRecord" o
      WHERE r."id" = ${reservation.id} AND o."id" = r."offerId"
      RETURNING r."id", r."organizationId", r."offerId", r."status", r."paymentStatus", r."fulfillmentStatus",
                o."senderOrganizationId", o."recipientOrganizationId", r."updatedAt"
    `);
    const updated = updatedRows[0];
    if (!updated) throw new NetworkAccessError("Grid fulfillment transition could not be recorded.", 500);

    const metadata = JSON.stringify({
      evidenceReference: decision.evidenceReference ?? null,
      reservationStatusBefore: reservation.status,
      reservationStatusAfter: reservationStatus,
    });
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "GridFulfillmentEventRecord" (
        "id", "organizationId", "reservationId", "actorId", "action", "fromStatus", "toStatus", "note", "metadata", "createdAt"
      ) VALUES (
        ${randomUUID()}, ${reservation.organizationId}, ${reservation.id}, ${session.userId},
        ${`grid.fulfillment.${decision.targetStatus}`}, ${reservation.fulfillmentStatus}, ${decision.targetStatus},
        ${decision.note}, CAST(${metadata} AS JSONB), CURRENT_TIMESTAMP
      )
    `);

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: `grid.fulfillment_${decision.targetStatus}`,
        resourceType: "grid_reservation",
        resourceId: reservation.id,
        metadata: {
          ownerOrganizationId: reservation.organizationId,
          offerId: reservation.offerId,
          fromStatus: reservation.fulfillmentStatus,
          toStatus: decision.targetStatus,
          reservationStatusBefore: reservation.status,
          reservationStatusAfter: reservationStatus,
          evidenceReference: decision.evidenceReference ?? null,
          note: decision.note,
        },
      },
    });

    return {
      reservationId: updated.id,
      reservationStatus: updated.status,
      paymentStatus: updated.paymentStatus,
      fulfillmentStatus: updated.fulfillmentStatus,
      updatedAt: updated.updatedAt.toISOString(),
    };
  });
}
