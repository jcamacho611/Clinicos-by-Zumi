import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { canTransitionDemoReservation } from "@/lib/sales-demo-rules";

type SalesPaymentFulfillmentInput = {
  checkoutIntentId: string;
  organizationId: string;
  paymentEventId: string;
  provider: string;
  amountCents: number | null | undefined;
};

type CheckoutReadyEventRow = {
  id: string;
  reservationId: string;
  salesOwnerOrganizationId: string;
};

export type SalesPaymentFulfillmentResult = {
  status: "reserved" | "recorded" | "reconciliation_required" | "idempotent";
  reservationId?: string;
  reservationStatus?: string;
};

/**
 * Bridge a processor-verified one-time Clinic Operating Analysis payment into the
 * exact sales reservation that created the checkout intent.
 *
 * Permanent truth:
 * - browser return != paid
 * - verified payment != arbitrary reservation match
 * - one checkout intent must resolve to exactly one checkout_ready event
 * - amount + sales-owner organization + offer must still match
 * - refund/credited-forward states are never silently rewritten by a late success
 */
export async function reconcileVerifiedAnalysisPayment(
  input: SalesPaymentFulfillmentInput,
): Promise<SalesPaymentFulfillmentResult> {
  if (!input.checkoutIntentId.trim() || !input.organizationId.trim() || !input.paymentEventId.trim()) {
    return { status: "reconciliation_required" };
  }

  return db.$transaction(async (tx) => {
    const matches = await tx.$queryRaw<CheckoutReadyEventRow[]>(Prisma.sql`
      SELECT "id", "reservationId", "salesOwnerOrganizationId"
      FROM "demo_reservation_events"
      WHERE "eventType" = 'checkout_ready'
        AND "salesOwnerOrganizationId" = ${input.organizationId}
        AND "metadata"->>'checkoutIntentId' = ${input.checkoutIntentId}
      ORDER BY "createdAt" DESC
      LIMIT 2
      FOR UPDATE
    `);

    if (matches.length !== 1) {
      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          actorId: null,
          actorType: "system",
          action: "sales.analysis_payment_reconciliation_required",
          resourceType: "commercial_payment_event",
          resourceId: input.paymentEventId,
          metadata: {
            reason: matches.length === 0 ? "checkout_reservation_not_found" : "checkout_reservation_ambiguous",
            checkoutIntentId: input.checkoutIntentId,
            provider: input.provider,
            matchCount: matches.length,
          },
        },
      });
      return { status: "reconciliation_required" };
    }

    const link = matches[0];
    const reservation = await tx.demoReservation.findUnique({
      where: { id: link.reservationId },
      select: {
        id: true,
        salesOwnerOrganizationId: true,
        selectedOffer: true,
        priceCents: true,
        status: true,
        paymentStatus: true,
      },
    });

    const validAmount = Number.isInteger(input.amountCents) && input.amountCents === reservation?.priceCents;
    const validReservation = Boolean(
      reservation
      && reservation.salesOwnerOrganizationId === input.organizationId
      && link.salesOwnerOrganizationId === input.organizationId
      && reservation.selectedOffer === "private_workflow_demo"
      && validAmount,
    );

    if (!validReservation || !reservation) {
      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          actorId: null,
          actorType: "system",
          action: "sales.analysis_payment_reconciliation_required",
          resourceType: "demo_reservation",
          resourceId: link.reservationId,
          metadata: {
            reason: "reservation_scope_offer_or_amount_mismatch",
            checkoutIntentId: input.checkoutIntentId,
            paymentEventId: input.paymentEventId,
            provider: input.provider,
            observedAmountCents: input.amountCents ?? null,
          },
        },
      });
      return { status: "reconciliation_required", reservationId: link.reservationId };
    }

    const priorEvidence = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id"
      FROM "demo_reservation_events"
      WHERE "reservationId" = ${reservation.id}
        AND "eventType" = 'processor_payment_verified'
        AND "metadata"->>'checkoutIntentId' = ${input.checkoutIntentId}
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE
    `);

    if (priorEvidence[0]) {
      return {
        status: "idempotent",
        reservationId: reservation.id,
        reservationStatus: reservation.status,
      };
    }

    if (["refunded", "credited_forward"].includes(reservation.paymentStatus)) {
      await tx.demoReservationEvent.create({
        data: {
          salesOwnerOrganizationId: input.organizationId,
          reservationId: reservation.id,
          actorType: "system",
          eventType: "processor_payment_verified",
          fromStatus: reservation.status,
          toStatus: reservation.status,
          note: "Processor-verified payment arrived after the reservation entered a protected financial state; human reconciliation is required before changing fulfillment.",
          metadata: {
            checkoutIntentId: input.checkoutIntentId,
            paymentEventId: input.paymentEventId,
            provider: input.provider,
            amountCents: input.amountCents ?? null,
            processorVerified: true,
            fulfillmentReviewRequired: true,
            preservedPaymentStatus: reservation.paymentStatus,
          },
        },
      });
      return {
        status: "reconciliation_required",
        reservationId: reservation.id,
        reservationStatus: reservation.status,
      };
    }

    let nextStatus = reservation.status;
    let transitionPath = [reservation.status];

    if (
      reservation.status === "inquiry"
      && canTransitionDemoReservation("inquiry", "qualified")
      && canTransitionDemoReservation("qualified", "reserved")
    ) {
      // Legacy checkout-ready reservations were left at inquiry. Verified payment is
      // enough to traverse the already-approved qualification/reservation path, but
      // we keep the path explicit in durable evidence rather than inventing a direct
      // inquiry -> reserved transition.
      nextStatus = "reserved";
      transitionPath = ["inquiry", "qualified", "reserved"];
    } else if (canTransitionDemoReservation(reservation.status, "reserved")) {
      nextStatus = "reserved";
      transitionPath = [reservation.status, "reserved"];
    }

    const updated = await tx.demoReservation.update({
      where: { id: reservation.id },
      data: {
        paymentStatus: "payment_recorded",
        status: nextStatus,
      },
      select: { id: true, status: true, paymentStatus: true },
    });

    const fulfillmentReviewRequired = nextStatus !== "reserved"
      && !["reserved", "scheduled", "completed", "moved_to_evaluation", "moved_to_founding"].includes(nextStatus);

    await tx.demoReservationEvent.create({
      data: {
        salesOwnerOrganizationId: input.organizationId,
        reservationId: reservation.id,
        actorType: "system",
        eventType: "processor_payment_verified",
        fromStatus: reservation.status,
        toStatus: updated.status,
        note: fulfillmentReviewRequired
          ? "Processor-verified payment was recorded. The current reservation state requires human fulfillment review."
          : "Processor-verified payment was matched to the exact Clinic Operating Analysis reservation and fulfillment was advanced where permitted.",
        metadata: {
          checkoutIntentId: input.checkoutIntentId,
          paymentEventId: input.paymentEventId,
          provider: input.provider,
          amountCents: input.amountCents ?? null,
          processorVerified: true,
          transitionPath,
          fulfillmentReviewRequired,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: null,
        actorType: "system",
        action: "sales.analysis_payment_fulfillment_reconciled",
        resourceType: "demo_reservation",
        resourceId: reservation.id,
        changes: {
          paymentStatus: { from: reservation.paymentStatus, to: updated.paymentStatus },
          status: { from: reservation.status, to: updated.status },
        },
        metadata: {
          checkoutIntentId: input.checkoutIntentId,
          paymentEventId: input.paymentEventId,
          provider: input.provider,
          amountCents: input.amountCents ?? null,
          transitionPath,
          fulfillmentReviewRequired,
        },
      },
    });

    return {
      status: updated.status === "reserved" ? "reserved" : "recorded",
      reservationId: updated.id,
      reservationStatus: updated.status,
    };
  });
}
