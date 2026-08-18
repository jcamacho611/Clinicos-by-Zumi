import "server-only";

import { RiskLevel } from "@prisma/client";
import { db } from "@/lib/db";
import { configuredLuxeBookingReviewMinutes } from "@/lib/luxe-booking-config";

const LUXE_ORGANIZATION_SLUG = process.env.LUXE_MEDI_ORGANIZATION_SLUG?.trim() || "luxe-medi";
const TERMINAL_LEAD_STATUSES = new Set(["lost", "completed"]);
const TERMINAL_BOOKING_STATUSES = new Set(["booked", "completed"]);

export async function recordLuxeBookingStart(leadId: string, destinationHost: string) {
  const now = new Date();
  const reviewDueAt = new Date(now.getTime() + configuredLuxeBookingReviewMinutes() * 60 * 1000);

  return db.$transaction(async (tx) => {
    const organization = await tx.organization.findUnique({
      where: { slug: LUXE_ORGANIZATION_SLUG },
      select: { id: true, status: true },
    });
    if (!organization || organization.status !== "active") return { tracked: false as const, reason: "organization_unavailable" as const };

    const lead = await tx.lead.findFirst({
      where: { id: leadId, organizationId: organization.id },
      select: {
        id: true,
        name: true,
        status: true,
        bookingStatus: true,
        assignedTo: true,
        followUpDueAt: true,
        serviceInterest: true,
      },
    });
    if (!lead) return { tracked: false as const, reason: "lead_not_found" as const };
    if (TERMINAL_LEAD_STATUSES.has(lead.status) || TERMINAL_BOOKING_STATUSES.has(lead.bookingStatus)) {
      return { tracked: false as const, reason: "lead_closed" as const };
    }

    const firstStart = !(await tx.leadEvent.findFirst({
      where: { organizationId: organization.id, leadId: lead.id, eventType: "booking_started" },
      select: { id: true },
    }));

    const nextFollowUp = !lead.followUpDueAt || lead.followUpDueAt > reviewDueAt ? reviewDueAt : lead.followUpDueAt;
    await tx.lead.update({
      where: { id: lead.id },
      data: {
        bookingStatus: "started",
        followUpDueAt: nextFollowUp,
      },
    });

    const existingTask = await tx.task.findFirst({
      where: {
        organizationId: organization.id,
        status: { not: "completed" },
        category: "lead_booking",
        details: { contains: `lead:${lead.id}` },
      },
      select: { id: true, dueAt: true, ownerId: true },
    });

    const task = existingTask
      ? await tx.task.update({
          where: { id: existingTask.id },
          data: {
            dueAt: !existingTask.dueAt || existingTask.dueAt > reviewDueAt ? reviewDueAt : existingTask.dueAt,
            ownerId: existingTask.ownerId ?? lead.assignedTo,
          },
          select: { id: true },
        })
      : await tx.task.create({
          data: {
            organizationId: organization.id,
            category: "lead_booking",
            title: `Verify booking completion for ${lead.name}`,
            details: `lead:${lead.id} Booking flow was opened for ${lead.serviceInterest ?? "a Luxe service"}. Verify authoritative booking/deposit evidence before marking this lead booked or paid. If completion cannot be verified by the due time, review for human follow-up according to consent and channel rules.`,
            ownerId: lead.assignedTo,
            priority: "high",
            riskLevel: RiskLevel.NEEDS_STAFF,
            dueAt: reviewDueAt,
            status: "open",
            createdBy: null,
          },
          select: { id: true },
        });

    if (firstStart) {
      await tx.leadEvent.create({
        data: {
          organizationId: organization.id,
          leadId: lead.id,
          eventType: "booking_started",
          fromStatus: lead.bookingStatus,
          toStatus: "started",
          note: "The customer opened the configured external booking flow. This is not booking or payment confirmation.",
          metadata: {
            destinationHost,
            taskId: task.id,
            bookingVerified: false,
            paymentVerified: false,
            humanReviewDueAt: reviewDueAt.toISOString(),
          },
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          actorType: "system",
          action: "luxe.booking_started",
          resourceType: "lead",
          resourceId: lead.id,
          metadata: {
            destinationHost,
            taskId: task.id,
            bookingVerified: false,
            paymentVerified: false,
          },
        },
      });
    }

    return { tracked: true as const, firstStart, taskId: task.id, reviewDueAt };
  });
}
