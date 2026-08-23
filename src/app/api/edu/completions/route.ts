import { NextResponse } from "next/server";
import { z } from "zod";

import { getClinicSession } from "@/lib/auth/session";
import { resolveEduIdentity } from "@/lib/edu/edu-session";
import { finalizeEnrollmentCompletion } from "@/lib/edu/workforce-completion-repository";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

const finalizeSchema = z.object({
  enrollmentId: z.string().trim().min(1).max(128),
  minimumAttendancePercent: z.number().min(0).max(100).optional(),
  requiredKnowledgePairs: z.number().int().min(0).max(20).optional(),
});

function fail(message: string, status: 400 | 401 | 403 | 404 | 409) {
  return NextResponse.json({ error: message }, { status, headers: PRIVATE_NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return fail("Authentication required.", 401);
  const identity = await resolveEduIdentity();
  if (!identity?.institutionId) return fail("A Klinikos EDU institution context is required.", 403);

  const parsed = finalizeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Invalid completion request.", 400);

  try {
    const completion = await finalizeEnrollmentCompletion(identity, parsed.data);
    return NextResponse.json({ completion }, { headers: PRIVATE_NO_STORE_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Completion could not be finalized.";
    const status = message.includes("authority") ? 403 : message.includes("not found") ? 404 : 409;
    return fail(message, status);
  }
}
