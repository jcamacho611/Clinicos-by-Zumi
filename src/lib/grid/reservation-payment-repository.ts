import "server-only";

import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { manualGridReservationPaymentSchema } from "@/lib/grid/payment-rules";
import { canTransitionGridReservation } from "@/lib/grid/transaction-state";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type ReservationPaymentRow = {
  id: string;
  organizationId: string;
  demandId: string;
  offerId: string;
  depositAmountCents: number;
  paymentStatus: string;
  status: "pending" | "held" | "released" | "consumed" | "expired";
  paymentReference: string | null;
  paymentRecordedAt: Date | null;
  paymentRecordedBy: string | null;
  updatedAt: Date;
};

function requirePaymentPermission(session: ClinicSession) {
  if (!can(session.role, "network", "update") && !can(session.role, "grid", "update")) {
    throw new NetworkAccessError("Grid payment reconciliation is not permitted for this role.", 403);
  }
}

async function requireSyntheticOrganization(organizationId: string) {
  const organization = await db.organization.findUnique({ where: { id: organizationId }, select: { demoMode: true, status: true } });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  if (!organization.demoMode) throw new NetworkAccessError("Manual Grid payment reconciliation requires production review before live use.", 409);
}

export async function recordManualGridReservationPayment(session: ClinicSession, reservationId: string, rawInput: unknown) {
  requirePaymentPermission(session);
  await requireSyntheticOrganization(session.organizationId);
  const input = manualGridReservationPaymentSchema.parse(rawInput);

  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<ReservationPaymentRow[]>(Prisma.sql`
      SELECT "id", "organizationId", "demandId", "offerId", "depositAmountCents", "paymentStatus", "status",
             "paymentReference", "paymentRecordedAt", "paymentRecordedBy", "updatedAt"
      FROM "GridReservationRecord"
      WHERE "id" = ${reservationId} AND "organizationId" = ${session.organizationId}
      FOR UPDATE
    `);
    const reservation = rows[0];
    if (!reservation) throw new NetworkAccessError("Grid reservation not found.", 404);
    if (reservation.depositAmountCents <= 0) throw new NetworkAccessError("This reservation does not require a deposit.", 409);
    if (reservation.paymentStatus === "recorded_manual") {
      return {
        ...reservation,
        paymentRecordedAt: reservation.paymentRecordedAt?.toISOString() ?? null,
        updatedAt: reservation.updatedAt.toISOString(),
        manualReconciliation: true,
      };
    }
    if (reservation.paymentStatus !== "manual_link_required" || reservation.status !== "pending") {
      throw new NetworkAccessError("This reservation is not waiting for a manually reconciled deposit.", 409);
    }
    if (!canTransitionGridReservation(reservation.status, "held")) {
      throw new NetworkAccessError("Reservation cannot enter held state after payment reconciliation.", 409);
    }

    const updated = await tx.$queryRaw<ReservationPaymentRow[]>(Prisma.sql`
      UPDATE "GridReservationRecord"
      SET "paymentStatus" = 'recorded_manual',
          "paymentReference" = ${input.externalReference},
          "paymentRecordedAt" = CURRENT_TIMESTAMP,
          "paymentRecordedBy" = ${session.userId},
          "status" = 'held',
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${reservation.id}
      RETURNING "id", "organizationId", "demandId", "offerId", "depositAmountCents", "paymentStatus", "status",
                "paymentReference", "paymentRecordedAt", "paymentRecordedBy", "updatedAt"
    `);
    const result = updated[0];
    if (!result) throw new NetworkAccessError("Grid deposit evidence could not be recorded.", 500);

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "grid.reservation_payment_recorded_manual",
        resourceType: "grid_reservation",
        resourceId: reservation.id,
        metadata: {
          demandId: reservation.demandId,
          offerId: reservation.offerId,
          amountCents: reservation.depositAmountCents,
          externalReference: input.externalReference,
          note: input.note,
          fromReservationStatus: reservation.status,
          toReservationStatus: "held",
          paymentStatus: "recorded_manual",
          processorVerification: false,
          manualReconciliation: true,
        },
      },
    });

    return {
      ...result,
      paymentRecordedAt: result.paymentRecordedAt?.toISOString() ?? null,
      updatedAt: result.updatedAt.toISOString(),
      manualReconciliation: true,
    };
  });
}
