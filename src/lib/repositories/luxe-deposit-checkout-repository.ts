import "server-only";

import { Prisma, RiskLevel } from "@prisma/client";
import { db } from "@/lib/db";
import { configuredLuxeBookingReviewMinutes } from "@/lib/luxe-booking-config";

const LUXE_ORGANIZATION_SLUG = process.env.LUXE_MEDI_ORGANIZATION_SLUG?.trim() || "luxe-medi";
const TERMINAL_LEAD_STATUSES = new Set(["lost", "completed"]);
const EVIDENCE_BACKED_PAYMENT_STATUSES = new Set(["manual_reconciled", "processor_verified"]);

export async function recordLuxeDepositCheckoutStarted(input: {
  leadId: string;
  externalCheckoutId: string;
  amountCents: number;
}) {
  const organization = await db.organization.findUnique({
    where: { slug: LUXE_ORGANIZATION_SLUG },
    select: { id: true, status: true },
  });
  if (!organization || organization.status !== "active") return { recorded: false as const, reason: "organization_unavailable" as const };

  return db.$transaction(async (tx) => {
    const lead = await tx.lead.findFirst({
      where: { id: input.leadId, organizationId: organization.id },
      select: {
        id: true,
        name: true,
        status: true,
        paymentStatus: true,
        bookingStatus: true,
        assignedTo: true,
        followUpDueAt: true,
        serviceInterest: true,
      },
    });
    if (!lead || TERMINAL_LEAD_STATUSES.has(lead.status)) return { recorded: false as const, reason: "lead_unavailable" as const };

    const prior = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id"
      FROM "lead_events"
      WHERE "organizationId" = ${organization.id}
        AND "leadId" = ${lead.id}
        AND "eventType" = 'deposit_checkout_started'
        AND "metadata"->>'externalCheckoutId' = ${input.externalCheckoutId}
      LIMIT 1
    `);
    if (prior[0]) return { recorded: true as const, idempotent: true as const, eventId: prior[0].id };

    const now = new Date();
    const reviewDueAt = new Date(now.getTime() + configuredLuxeBookingReviewMinutes() * 60 * 1000);
    const nextFollowUp = !lead.followUpDueAt || lead.followUpDueAt > reviewDueAt ? reviewDueAt : lead.followUpDueAt;
    const nextPaymentStatus = EVIDENCE_BACKED_PAYMENT_STATUSES.has(lead.paymentStatus) ? lead.paymentStatus : "checkout_started";

    await tx.lead.update({
      where: { id: lead.id },
      data: {
        paymentStatus: nextPaymentStatus,
        followUpDueAt: nextFollowUp,
      },
    });

    const openBookingTask = await tx.task.findFirst({
      where: {
        organizationId: organization.id,
        category: "lead_booking",
        status: { not: "completed" },
        details: { contains: `lead:${lead.id}` },
      },
      select: { id: true, dueAt: true },
    });
    let taskId = openBookingTask?.id ?? null;
    if (openBookingTask) {
      if (!openBookingTask.dueAt || openBookingTask.dueAt > reviewDueAt) {
        await tx.task.update({ where: { id: openBookingTask.id }, data: { dueAt: reviewDueAt, priority: "high" } });
      }
    } else {
      const task = await tx.task.create({
        data: {
          organizationId: organization.id,
          category: "lead_booking",
          title: `Check deposit/booking progress for ${lead.name}`,
          details: `lead:${lead.id} A secure Stripe deposit checkout was opened for ${lead.serviceInterest ?? "a Luxe service"}. No payment or appointment is assumed. Verify processor/booking evidence or follow up according to consent rules if the customer does not complete the flow.`,
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
        eventType: "deposit_checkout_started",
        fromStatus: lead.paymentStatus,
        toStatus: nextPaymentStatus,
        note: "A secure Stripe deposit checkout was created. This is not payment or booking confirmation.",
        metadata: {
          provider: "stripe",
          externalCheckoutId: input.externalCheckoutId,
          amountCents: input.amountCents,
          currency: "USD",
          paymentKind: "deposit",
          paymentVerified: false,
          bookingVerified: false,
          bookingStatus: lead.bookingStatus,
          taskId,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        actorType: "system",
        action: "luxe.deposit_checkout_started",
        resourceType: "lead",
        resourceId: lead.id,
        metadata: {
          eventId: event.id,
          provider: "stripe",
          externalCheckoutId: input.externalCheckoutId,
          amountCents: input.amountCents,
          paymentVerified: false,
          bookingVerified: false,
          taskId,
        },
      },
    });

    return { recorded: true as const, idempotent: false as const, eventId: event.id, taskId };
  });
}
