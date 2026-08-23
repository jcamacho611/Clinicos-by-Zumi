import { NextResponse } from "next/server";
import { z } from "zod";

import { getClinicSession } from "@/lib/auth/session";
import { resolveEduIdentity } from "@/lib/edu/edu-session";
import { recordKnowledgeAssessmentAttempt } from "@/lib/edu/workforce-knowledge-repository";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

const createSchema = z.object({
  courseId: z.string().trim().min(1).max(128),
  cohortId: z.string().trim().min(1).max(128),
  enrollmentId: z.string().trim().min(1).max(128),
  sessionId: z.string().trim().min(1).max(128).nullable().optional(),
  assessmentKey: z.string().trim().min(1).max(120),
  phase: z.enum(["pre", "post"]),
  attemptNumber: z.number().int().min(1).max(20).optional(),
  pointsAwarded: z.number().int().min(0).max(10000),
  pointsPossible: z.number().int().min(1).max(10000),
});

function fail(message: string, status: 400 | 401 | 403 | 404 | 409) {
  return NextResponse.json({ error: message }, { status, headers: PRIVATE_NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return fail("Authentication required.", 401);
  const identity = await resolveEduIdentity();
  if (!identity?.institutionId) return fail("A Klinikos EDU institution context is required.", 403);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.pointsAwarded > parsed.data.pointsPossible) {
    return fail("Invalid knowledge assessment record.", 400);
  }

  try {
    const attempt = await recordKnowledgeAssessmentAttempt(identity, parsed.data);
    return NextResponse.json({ attempt }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Knowledge assessment evidence could not be recorded.";
    const status = message.includes("authority") ? 403 : message.includes("not valid") || message.includes("not found") ? 404 : 409;
    return fail(message, status);
  }
}
