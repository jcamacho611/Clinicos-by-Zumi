import "server-only";

import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { luxeLeadClaimDecision } from "@/lib/luxe-lead-ownership-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

const LUXE_ORGANIZATION_SLUG = process.env.LUXE_MEDI_ORGANIZATION_SLUG?.trim() || "luxe-medi";

export async function claimLuxeLead(session: ClinicSession, leadId: string) {
  const organization = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { id: true, slug: true, status: true },
  });
  if (!organization || organization.status !== "active" || organization.slug !== LUXE_ORGANIZATION_SLUG) {
    throw new NetworkAccessError("Luxe lead ownership is not available for this organization.", 404);
  }

  return db.$transaction(async (tx) => {
    const [lead, user] = await Promise.all([
      tx.lead.findFirst({
        where: { id: leadId, organizationId: session.organizationId },
        select: { id: true, assignedTo: true, status: true },
      }),
      tx.user.findFirst({
        where: { id: session.userId, organizationId: session.organizationId, status: "active" },
        select: { id: true },
      }),
    ]);
    if (!lead) throw new NetworkAccessError("Lead not found for this organization.", 404);
    if (!user) throw new NetworkAccessError("Active staff identity is required to claim a lead.", 403);
    if (["lost", "completed"].includes(lead.status)) throw new NetworkAccessError("Closed leads cannot be claimed from the active acquisition queue.", 409);

    const decision = luxeLeadClaimDecision(lead.assignedTo, session.userId);
    if (decision === "owned_by_other") throw new NetworkAccessError("This lead is already assigned to another staff member.", 409);

    const now = new Date();
    if (decision === "claim") {
      await tx.lead.update({ where: { id: lead.id }, data: { assignedTo: session.userId } });
      await tx.leadEvent.create({
        data: {
          organizationId: session.organizationId,
          leadId: lead.id,
          actorId: session.userId,
          eventType: "luxe_lead_claimed",
          fromStatus: "unassigned",
          toStatus: "assigned",
          note: "Lead ownership claimed from Luxe acquisition operations.",
          metadata: { assignedTo: session.userId, claimedAt: now.toISOString() },
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: session.organizationId,
          actorId: session.userId,
          actorType: "user",
          action: "luxe.lead_claimed",
          resourceType: "lead",
          resourceId: lead.id,
          changes: { assignedTo: { from: null, to: session.userId } },
          metadata: { claimedAt: now.toISOString() },
        },
      });
    }

    const taskUpdate = await tx.task.updateMany({
      where: {
        organizationId: session.organizationId,
        status: { not: "completed" },
        category: { in: ["luxe_lead_follow_up", "luxe_consultation", "lead_follow_up", "lead_reactivation", "lead_booking"] },
        details: { contains: `lead:${lead.id}` },
        OR: [{ ownerId: null }, { ownerId: session.userId }],
      },
      data: { ownerId: session.userId },
    });

    return {
      leadId: lead.id,
      assignedTo: session.userId,
      claimed: decision === "claim",
      tasksOwned: taskUpdate.count,
    };
  });
}
