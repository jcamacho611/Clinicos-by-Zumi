import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma, RiskLevel } from "@prisma/client";
import { db } from "@/lib/db";
import { openLuxeAcquisitionJourney } from "@/lib/luxe-acquisition-journey-token";
import { configuredLuxeBookingReviewMinutes } from "@/lib/luxe-booking-config";
import type { NormalizedLuxeStripeRefund } from "@/lib/luxe-stripe-deposit";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

const LUXE_ORGANIZATION_SLUG = process.env.LUXE_MEDI_ORGANIZATION_SLUG?.trim() || "luxe-medi";

type RefundEvidenceRow = {
  id: string;
  leadId: string;
  amountRefundedCents: number;
};

type PaymentEvidenceRow = {
  leadId: string;
  amountCents: number;
  processorVerified: boolean;
};

type LeadReferenceRow = { leadId: string };

async function findExistingRefund(
  tx: Prisma.TransactionClient,
  organizationId: string,
  externalReference: string,
) {
  const rows = await tx.$queryRaw<RefundEvidenceRow[]>(Prisma.sql`
    SELECT "id", "leadId", "amountRefundedCents"
    FROM "luxe_lead_refund_evidence"
    WHERE "organizationId" = ${organizationId}
      AND "provider" = 'stripe'
      AND "externalReference" = ${externalReference}
    LIMIT 1
    FOR UPDATE
  `);
  return rows[0] ?? null;
}

async function findProcessorPayment(
  tx: Prisma.TransactionClient,
  organizationId: string,
  paymentReference: string | null,
) {
  if (!paymentReference) return null;
  const rows = await tx.$queryRaw<PaymentEvidenceRow[]>(Prisma.sql`
    SELECT "leadId", "amountCents", "processorVerified"
    FROM "luxe_lead_payment_evidence"
    WHERE "organizationId" = ${organizationId}
      AND "provider" = 'stripe'
      AND "externalReference" = ${paymentReference}
    LIMIT 1
    FOR UPDATE
  `);
  return rows[0] ?? null;
}

async function findLeadFromProcessorPaymentEvent(
  tx: Prisma.TransactionClient,
  organizationId: string,
  paymentReference: string | null,
) {
  if (!paymentReference) return null;
  const rows = await tx.$queryRaw<LeadReferenceRow[]>(Prisma.sql`
    SELECT "leadId"
    FROM "lead_events"
    WHERE "organizationId" = ${organizationId}
      AND "eventType" = 'payment_verified_processor'
      AND "metadata"->>'provider' = 'stripe'
      AND "metadata"->>'externalPaymentIntentId' = ${paymentReference}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `);
  return rows[0]?.leadId ?? null;
}

export async function recordProcessorVerifiedLuxeStripeRefund(input: NormalizedLuxeStripeRefund) {
  const organization = await db.organization.findUnique({
    where: { slug: LUXE_ORGANIZATION_SLUG },
    select: { id: true, status: true },
  });
  if (!organization || organization.status !== "active") {
    throw new NetworkAccessError("Luxe refund evidence is temporarily unavailable.", 503);
  }

  return db.$transaction(async (tx) => {
    // Refunds can occur long after the short-lived acquisition journey expires.
    // Prefer durable processor/payment-event correlation. Use the encrypted journey
    // only as an out-of-order fallback when a refund somehow arrives before the
    // payment webhook has established durable lead evidence.
    const processorPayment = await findProcessorPayment(tx, organization.id, input.paymentExternalReference);
    const eventLeadId = processorPayment
      ? processorPayment.leadId
      : await findLeadFromProcessorPaymentEvent(tx, organization.id, input.paymentExternalReference);
    const journeyLeadId = eventLeadId ? null : openLuxeAcquisitionJourney(input.journeyToken)?.leadId ?? null;
    const leadId = eventLeadId ?? journeyLeadId;
    if (!leadId) throw new NetworkAccessError("Luxe refund correlation could not be resolved.", 409);

    const lead = await tx.lead.findFirst({
      where: { id: leadId, organizationId: organization.id },
      select: {
        id: true,
        name: true,
        paymentStatus: true,
        bookingStatus: true,
        assignedTo: true,
        followUpDueAt: true,
        serviceInterest: true,
      },
    });
    if (!lead) throw new NetworkAccessError("Luxe refund lead correlation could not be resolved.", 409);

    if (processorPayment) {
      if (processorPayment.leadId !== lead.id) {
        throw new NetworkAccessError("The refunded Stripe payment is linked to a different Luxe lead.", 409);
      }
      if (!processorPayment.processorVerified || processorPayment.amountCents !== input.originalAmountCents) {
        throw new NetworkAccessError("The refunded Stripe payment does not match existing processor evidence.", 409);
      }
    }

    const existing = await findExistingRefund(tx, organization.id, input.externalReference);
    if (existing && existing.leadId !== lead.id) {
      throw new NetworkAccessError("This Stripe refund reference is already linked to a different Luxe lead.", 409);
    }
    if (existing && existing.amountRefundedCents >= input.amountRefundedCents) {
      return {
        recorded: true as const,
        idempotent: true as const,
        evidenceId: existing.id,
        amountRefundedCents: existing.amountRefundedCents,
        paymentStatus: lead.paymentStatus,
      };
    }

    let evidenceId = existing?.id ?? randomUUID();
    let previousAmountRefundedCents = existing?.amountRefundedCents ?? 0;
    if (existing) {
      await tx.$executeRaw(Prisma.sql`
        UPDATE "luxe_lead_refund_evidence"
        SET "paymentExternalReference" = ${input.paymentExternalReference},
            "amountRefundedCents" = ${input.amountRefundedCents},
            "receivedAt" = ${input.receivedAt},
            "note" = ${`Stripe signed webhook verified cumulative refund amount. Processor event ${input.eventId}.`},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${existing.id}
      `);
    } else {
      const inserted = await tx.$queryRaw<RefundEvidenceRow[]>(Prisma.sql`
        INSERT INTO "luxe_lead_refund_evidence" (
          "id", "organizationId", "leadId", "provider", "externalReference", "paymentExternalReference",
          "amountRefundedCents", "currency", "evidenceSource", "verificationMethod", "processorVerified", "receivedAt", "note"
        ) VALUES (
          ${evidenceId}, ${organization.id}, ${lead.id}, 'stripe', ${input.externalReference}, ${input.paymentExternalReference},
          ${input.amountRefundedCents}, 'USD', 'stripe_webhook', 'processor_verification', true, ${input.receivedAt},
          ${`Stripe signed webhook verified cumulative refund amount. Processor event ${input.eventId}.`}
        )
        ON CONFLICT ("organizationId", "provider", "externalReference") DO NOTHING
        RETURNING "id", "leadId", "amountRefundedCents"
      `);
      if (!inserted[0]) {
        const concurrent = await findExistingRefund(tx, organization.id, input.externalReference);
        if (!concurrent || concurrent.leadId !== lead.id) {
          throw new NetworkAccessError("Stripe refund evidence could not be resolved after a concurrent insert.", 409);
        }
        if (concurrent.amountRefundedCents >= input.amountRefundedCents) {
          return {
            recorded: true as const,
            idempotent: true as const,
            evidenceId: concurrent.id,
            amountRefundedCents: concurrent.amountRefundedCents,
            paymentStatus: lead.paymentStatus,
          };
        }
        evidenceId = concurrent.id;
        previousAmountRefundedCents = concurrent.amountRefundedCents;
        await tx.$executeRaw(Prisma.sql`
          UPDATE "luxe_lead_refund_evidence"
          SET "paymentExternalReference" = ${input.paymentExternalReference},
              "amountRefundedCents" = ${input.amountRefundedCents},
              "receivedAt" = ${input.receivedAt},
              "note" = ${`Stripe signed webhook verified cumulative refund amount. Processor event ${input.eventId}.`},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${concurrent.id}
        `);
      }
    }

    const nextPaymentStatus = input.amountRefundedCents >= input.originalAmountCents ? "refunded" : "partially_refunded";
    const now = new Date();
    const reviewDueAt = new Date(now.getTime() + Math.min(15, configuredLuxeBookingReviewMinutes()) * 60 * 1000);
    const nextFollowUp = !lead.followUpDueAt || lead.followUpDueAt > reviewDueAt ? reviewDueAt : lead.followUpDueAt;
    await tx.lead.update({
      where: { id: lead.id },
      data: { paymentStatus: nextPaymentStatus, followUpDueAt: nextFollowUp },
    });

    const openTask = await tx.task.findFirst({
      where: {
        organizationId: organization.id,
        category: "lead_booking",
        status: { not: "completed" },
        details: { contains: `lead:${lead.id}` },
      },
      select: { id: true, dueAt: true, ownerId: true },
    });
    let taskId = openTask?.id ?? null;
    if (openTask) {
      await tx.task.update({
        where: { id: openTask.id },
        data: {
          dueAt: !openTask.dueAt || openTask.dueAt > reviewDueAt ? reviewDueAt : openTask.dueAt,
          ownerId: openTask.ownerId ?? lead.assignedTo,
          priority: "high",
        },
      });
    } else {
      const task = await tx.task.create({
        data: {
          organizationId: organization.id,
          category: "lead_booking",
          title: `Review refunded deposit for ${lead.name}`,
          details: `lead:${lead.id} Stripe verified ${nextPaymentStatus.replaceAll("_", " ")} for the Luxe deposit on ${lead.serviceInterest ?? "a Luxe service"}. Review the appointment/customer follow-up separately; a refund does not itself prove booking cancellation or treatment state.`,
          ownerId: lead.assignedTo,
          priority: "high",
          riskLevel: RiskLevel.NEEDS_STAFF,
          dueAt: reviewDueAt,
          status: "open",
          createdBy: null,
        },
      });
      taskId = task.id;
    }

    const event = await tx.leadEvent.create({
      data: {
        organizationId: organization.id,
        leadId: lead.id,
        eventType: "payment_refund_verified_processor",
        fromStatus: lead.paymentStatus,
        toStatus: nextPaymentStatus,
        note: "Stripe signed webhook verified a deposit refund. Booking/treatment state remains separate.",
        metadata: {
          evidenceId,
          provider: "stripe",
          externalReference: input.externalReference,
          paymentExternalReference: input.paymentExternalReference,
          stripeEventId: input.eventId,
          amountRefundedCents: input.amountRefundedCents,
          previousAmountRefundedCents,
          originalAmountCents: input.originalAmountCents,
          currency: input.currency,
          verificationMethod: "processor_verification",
          processorVerified: true,
          bookingStatus: lead.bookingStatus,
          bookingCancelled: false,
          taskId,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        actorType: "system",
        action: "luxe.lead_payment_refund_verified_processor",
        resourceType: "lead",
        resourceId: lead.id,
        metadata: {
          refundEvidenceId: evidenceId,
          refundEventId: event.id,
          provider: "stripe",
          externalReference: input.externalReference,
          paymentExternalReference: input.paymentExternalReference,
          stripeEventId: input.eventId,
          amountRefundedCents: input.amountRefundedCents,
          previousAmountRefundedCents,
          originalAmountCents: input.originalAmountCents,
          verificationMethod: "processor_verification",
          processorVerified: true,
          bookingCancelled: false,
          taskId,
        },
      },
    });

    return {
      recorded: true as const,
      idempotent: false as const,
      evidenceId,
      amountRefundedCents: input.amountRefundedCents,
      paymentStatus: nextPaymentStatus,
      taskId,
    };
  });
}
