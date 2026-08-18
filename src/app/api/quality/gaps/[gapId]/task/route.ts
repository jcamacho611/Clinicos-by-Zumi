import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";
import {
  materializeQualityGapTask,
  QualityTaskMaterializationError,
} from "@/lib/repositories/quality-task-materialization-repository";

const NO_STORE = PRIVATE_NO_STORE_HEADERS;
const bodySchema = z.object({
  ownerId: z.string().trim().min(1).max(128).optional().nullable(),
});

export async function POST(request: Request, { params }: { params: Promise<{ gapId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });

  const { gapId } = await params;
  const qualityDenied = await enforceApiPermission(session, "quality", "update", { request, resourceId: gapId });
  if (qualityDenied) return qualityDenied;
  const taskDenied = await enforceApiPermission(session, "tasks", "create", { request, resourceId: `quality-gap:${gapId}` });
  if (taskDenied) return taskDenied;

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quality follow-up request." }, { status: 400, headers: NO_STORE });
  }

  try {
    const result = await materializeQualityGapTask(session, {
      gapId,
      ownerId: parsed.data.ownerId,
    });
    return NextResponse.json({
      data: {
        taskId: result.taskId,
        taskStatus: result.taskStatus,
        ownerAssigned: Boolean(result.ownerId),
        created: result.created,
        idempotent: result.idempotent,
        requiresReview: result.requiresReview,
      },
    }, { status: result.created ? 201 : 200, headers: NO_STORE });
  } catch (error) {
    if (error instanceof QualityTaskMaterializationError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: NO_STORE });
    }
    return NextResponse.json({ error: "Quality follow-up work could not be prepared." }, { status: 503, headers: NO_STORE });
  }
}
