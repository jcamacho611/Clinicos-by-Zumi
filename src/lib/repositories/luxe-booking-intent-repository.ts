import "server-only";

import { RiskLevel } from "@prisma/client";
import { db } from "@/lib/db";
import { configuredLuxeBookingReviewMinutes } from "@/lib/luxe-booking-config";

const LUXE_ORGANIZATION_SLUG = process.env.LUXE_MEDI_ORGANIZATION_SLUG?.trim() || "luxe-medi";
const TERMINAL_LEAD_STATUSES = new Set(["lost", "completed"]);
const TERMINAL_BOOKING_STATUSES = new Set(["booked", "completed"]);

function earlierDate(existing: Date | null, candidate: Date) {
  return !existing || existing > candidate ? candidate : existing;
}

async function resolveActiveLuxeLead(tx: Parameters<Parameters<typeof db.$transaction>[0]>[0], leadId: string) {
  const organization = await tx.organization.findUnique({
    where: { slug: LUXE_ORGANIZATION_SLUG },
    select: { id: true, status: true },
  });
  if (!organization || organization.status !== "active") return { organization: null, lead: null };
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
  return { organization, lead };
}

async function ensureBookingVerificationTask(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  input: {
    organizationId: string;
    leadId: string;
    leadName: string;
    serviceInterest: string | null;
    assignedTo: string | null;
    dueAt: Date;
    observed: boolean;
  },
) {
  const existingTask = await tx.task.findFirst({
    where: {
      organizationId: input.organizationId,
      status: { not: "completed" },
      category: "lead_booking",
      details: { contains: `lead:${input.leadId}` },
    },
    select: { id: true, dueAt: true, ownerId: true },
  });

  if (existingTask) {
    return tx.task.update({
      where: { id: existingTask.id },
      data: {
        dueAt: earlierDate(existingTask.dueAt, input.dueAt),
        ownerId: existingTask.ownerId ?? input.assignedTo,
      },
      select: { id: true },
    });
  }

  return tx.task.create({
    data: {
      organizationId: input.organizationId,
      category: "lead_booking",
      title: input.observed ? `Verify observed booking for ${input.leadName}` : `Verify booking completion for ${input.leadName}`,
      details: input.observed
        ? `lead:${input.leadId} The external booking source reported a booking for ${input.serviceInterest ?? "a Luxe service"}. Confirm authoritative appointment evidence before marking booked, and verify payment separately. A booking notification is not payment proof.`
        : `lead:${input.leadId} Booking flow was opened for ${input.serviceInterest ?? "a Luxe service"}. Verify authoritative booking/deposit evidence before marking this lead booked or paid. If completion cannot be verified by the due time, review for human follow-up according to consent and channel rules.`,
      ownerId: input.assignedTo,
      priority: "high",
      riskLevel: RiskLevel.NEEDS_STAFF,
      dueAt: input.dueAt,
      status: "open",
      createdBy: null,
    },
    select: { id: true },
  });
}

export async function recordLuxeBookingStart(leadId: string, destinationHost: string) {
  const now = new Date();
  const reviewDueAt = new Date(now.getTime() + configuredLuxeBookingReviewMinutes() * 60 * 1000);

  return db.$transaction(async (tx) => {
    const { organization, lead } = await resolveActiveLuxeLead(tx, leadId);
    if (!organization) return { tracked: false as const, reason: "organization_unavailable" as const };
    if (!lead) return { tracked: false as const, reason: "lead_not_found" as const };
    if (TERMINAL_LEAD_STATUSES.has(lead.status) || TERMINAL_BOOKING_STATUSES.has(lead.bookingStatus)) {
      return { tracked: false as const, reason: "lead_closed" as const };
    }

    const firstStart = !(await tx.leadEvent.findFirst({
      where: { organizationId: organization.id, leadId: lead.id, eventType: "booking_started" },
      select: { id: true },
    }));

    const nextFollowUp = earlierDate(lead.followUpDueAt, reviewDueAt);
    await tx.lead.update({
      where: { id: lead.id },
      data: {
        bookingStatus: lead.bookingStatus === "observed" ? "observed" : "started",
        followUpDueAt: nextFollowUp,
      },
    });

    const task = await ensureBookingVerificationTask(tx, {
      organizationId: organization.id,
      leadId: lead.id,
      leadName: lead.name,
      serviceInterest: lead.serviceInterest,
      assignedTo: lead.assignedTo,
      dueAt: reviewDueAt,
      observed: lead.bookingStatus === "observed",
    });

    if (firstStart) {
      await tx.leadEvent.create({
        data: {
          organizationId: organization.id,
          leadId: lead.id,
          eventType: "booking_started",
          fromStatus: lead.bookingStatus,
          toStatus: lead.bookingStatus === "observed" ? "observed" : "started",
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

export async function recordLuxeBookingObservation(
  leadId: string,
  input: { source: string; orderReference?: string | null; appointmentText?: string | null },
) {
  const now = new Date();
  const reviewDueAt = new Date(now.getTime() + Math.min(15, configuredLuxeBookingReviewMinutes()) * 60 * 1000);

  return db.$transaction(async (tx) => {
    const { organization, lead } = await resolveActiveLuxeLead(tx, leadId);
    if (!organization) return { tracked: false as const, reason: "organization_unavailable" as const };
    if (!lead) return { tracked: false as const, reason: "lead_not_found" as const };
    if (TERMINAL_LEAD_STATUSES.has(lead.status) || TERMINAL_BOOKING_STATUSES.has(lead.bookingStatus)) {
      return { tracked: false as const, reason: "lead_closed" as const };
    }

    const existingObservation = await tx.leadEvent.findFirst({
      where: { organizationId: organization.id, leadId: lead.id, eventType: "booking_observed" },
      select: { id: true },
    });

    await tx.lead.update({
      where: { id: lead.id },
      data: {
        bookingStatus: "observed",
        followUpDueAt: earlierDate(lead.followUpDueAt, reviewDueAt),
      },
    });

    const task = await ensureBookingVerificationTask(tx, {
      organizationId: organization.id,
      leadId: lead.id,
      leadName: lead.name,
      serviceInterest: lead.serviceInterest,
      assignedTo: lead.assignedTo,
      dueAt: reviewDueAt,
      observed: true,
    });

    if (!existingObservation) {
      await tx.leadEvent.create({
        data: {
          organizationId: organization.id,
          leadId: lead.id,
          eventType: "booking_observed",
          fromStatus: lead.bookingStatus,
          toStatus: "observed",
          note: "An external booking source reported a booking. Human verification is still required; payment remains separate.",
          metadata: {
            source: input.source,
            orderReference: input.orderReference ?? null,
            appointmentText: input.appointmentText?.slice(0, 300) ?? null,
            taskId: task.id,
            bookingVerified: false,
            paymentVerified: false,
          },
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          actorType: "system",
          action: "luxe.booking_observed",
          resourceType: "lead",
          resourceId: lead.id,
          metadata: {
            source: input.source,
            orderReference: input.orderReference ?? null,
            taskId: task.id,
            bookingVerified: false,
            paymentVerified: false,
          },
        },
      });
    }

    return { tracked: true as const, firstObservation: !existingObservation, taskId: task.id, reviewDueAt };
  });
}
