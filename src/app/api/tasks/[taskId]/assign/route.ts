import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { recordTrustedPathDomainEvent } from "@/lib/orchestration/path-domain-event-bridge";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

const assignTaskSchema = z.object({ ownerId: z.string().trim().min(1).max(64) });

export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { taskId } = await params;
  const denied = await enforceApiPermission(session, "tasks", "update", { request, resourceId: taskId });
  if (denied) return denied;

  try {
    const input = assignTaskSchema.parse(await request.json());
    const [task, owner] = await Promise.all([
      db.task.findFirst({ where: { id: taskId, organizationId: session.organizationId } }),
      db.user.findFirst({ where: { id: input.ownerId, organizationId: session.organizationId, status: "active" }, select: { id: true, name: true } }),
    ]);
    if (!task) throw new NetworkAccessError("Task not found for this organization.", 404);
    if (!owner) throw new NetworkAccessError("Task owner must be an active user in this organization.", 400);

    const updated = await db.task.update({ where: { id: task.id }, data: { ownerId: owner.id } });
    await db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "task.assigned",
        resourceType: "task",
        resourceId: task.id,
        patientId: task.patientId,
        changes: { ownerId: { from: task.ownerId, to: owner.id } },
        metadata: { ownerName: owner.name, containsPhi: false },
      },
    });
    await recordTrustedPathDomainEvent(session, {
      eventType: "task.assigned",
      sourceType: "task",
      sourceId: task.id,
      metadata: { ownerId: owner.id },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
