import { NextResponse } from "next/server";
import { z } from "zod";

import { getClinicSession } from "@/lib/auth/session";
import { resolveEduIdentity } from "@/lib/edu/edu-session";
import { transitionWorkforceCurriculumVersion } from "@/lib/edu/workforce-curriculum-repository";
import { curriculumVersionStatuses } from "@/lib/edu/workforce-curriculum-versioning";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

const transitionSchema = z.object({
  toStatus: z.enum(curriculumVersionStatuses),
});

function replyError(message: string, status: 400 | 401 | 403 | 404 | 409) {
  return NextResponse.json({ error: message }, { status, headers: PRIVATE_NO_STORE_HEADERS });
}

export async function PATCH(request: Request, context: { params: Promise<{ versionId: string }> }) {
  const session = await getClinicSession();
  if (!session) return replyError("Authentication required.", 401);
  const identity = await resolveEduIdentity();
  if (!identity?.institutionId) return replyError("A Klinikos EDU institution context is required.", 403);

  const parsed = transitionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return replyError("Invalid curriculum status transition.", 400);
  const { versionId } = await context.params;

  try {
    const version = await transitionWorkforceCurriculumVersion(identity, {
      versionId,
      toStatus: parsed.data.toStatus,
    });
    return NextResponse.json({ version }, { headers: PRIVATE_NO_STORE_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Curriculum version could not be updated.";
    const status = message.includes("authority") || message.includes("approval") ? 403 : message.includes("not found") ? 404 : 409;
    return replyError(message, status);
  }
}
