import "server-only";

import { Prisma, RiskLevel } from "@prisma/client";
import { db } from "@/lib/db";

const LUXE_ORGANIZATION_SLUG = process.env.LUXE_MEDI_ORGANIZATION_SLUG?.trim() || "luxe-medi";

function earlierDate(existing: Date | null, candidate: Date) {
  return !existing || existing > candidate ? candidate : existing;
}

export async function recordLuxeCancellationObservation(
  leadId: string,
  input: {
    source: string;
    orderReference?: string | null;
    conversationReference?: string | null;
    messageText?: string | null;
    linkageMethod: "order_reference" | "unique_contact";
  },
) {
  const now = new Date();
  const dueAt = new Date(now.getTime() + 10 * 60 * 1000);

  return db.$transaction(async (tx: Prisma.TransactionClient) => {
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
        pipelineStage: true,
        bookingStatus: true,
        assignedTo: true,
        followUpDueAt: true,
        serviceInterest: true,
      },
    });
    if (!lead) return { tracked: false as const, reason: "lead_not_found" as const };
    if (["lost", "completed"].includes(lead.status)) return { tracked: false as const, reason: "lead_closed" as const };

    const existingTask = await tx.task.findFirst({
      where: {
        organizationId: organization.id,
        status: { not: "completed" },
        category: { in: ["lead_booking", "lead_reactivation", "lead_follow_up"] },
        details: { contains: `lead:${lead.id}` },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, dueAt: true, ownerId: true },
    });

    const taskDetails = `lead:${lead.id} An external booking source reported a cancellation for ${lead.serviceInterest ?? "a Luxe service"}. Review the source record, customer context, and communication eligibility before outreach. Do not treat this as a no-show or payment failure. Rebook/reactivate only after human review.`;
    const task = existingTask
      ? await tx.task.update({
          where: { id: existingTask.id },
          data: {
            category: "lead_reactivation",
            title: `Review cancellation recovery for ${lead.name}`,
            details: taskDetails,
            ownerId: existingTask.ownerId ?? lead.assignedTo,
            priority: "high",
            riskLevel: RiskLevel.NEEDS_STAFF,
            dueAt: earlierDate(existingTask.dueAt, dueAt),
            status: "open",
            completedAt: null,
          },
          select: { id: true },
        })
      : await tx.task.create({
          data: {
            organizationId: organization.id,
            category: "lead_reactivation",
            title: `Review cancellation recovery for ${lead.name}`,
            details: taskDetails,
            ownerId: lead.assignedTo,
            priority: "high",
            riskLevel: RiskLevel.NEEDS_STAFF,
            dueAt,
            status: "open",
            createdBy: null,
          },
          select: { id: true },
        });

    await tx.lead.update({
      where: { id: lead.id },
      data: {
        pipelineStage: "cancellation_review",
        bookingStatus: "cancellation_observed",
        followUpDueAt: earlierDate(lead.followUpDueAt, dueAt),
      },
    });

    await tx.leadEvent.create({
      data: {
        organizationId: organization.id,
        leadId: lead.id,
        eventType: "booking_cancellation_observed",
        fromStatus: lead.bookingStatus,
        toStatus: "cancellation_observed",
        note: "An external booking source reported a cancellation. Human recovery review is required before outreach or rebooking.",
        metadata: {
          source: input.source,
          linkageMethod: input.linkageMethod,
          orderReference: input.orderReference ?? null,
          conversationReference: input.conversationReference ?? null,
          customerMessage: input.messageText?.slice(0, 300) ?? null,
          taskId: task.id,
          cancellationVerified: false,
          noShowAssumed: false,
          paymentVerified: false,
          automaticOutreachSent: false,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        actorType: "system",
        action: "luxe.booking_cancellation_observed",
        resourceType: "lead",
        resourceId: lead.id,
        changes: {
          pipelineStage: { from: lead.pipelineStage, to: "cancellation_review" },
          bookingStatus: { from: lead.bookingStatus, to: "cancellation_observed" },
        },
        metadata: {
          source: input.source,
          linkageMethod: input.linkageMethod,
          orderReference: input.orderReference ?? null,
          taskId: task.id,
          cancellationVerified: false,
          noShowAssumed: false,
          paymentVerified: false,
        },
      },
    });

    return { tracked: true as const, leadId: lead.id, taskId: task.id, dueAt };
  });
}
