import { NextResponse } from "next/server";
import { z } from "zod";

import { getClinicSession } from "@/lib/auth/session";
import { resolveEduIdentity } from "@/lib/edu/edu-session";
import {
  createWorkforceCurriculumVersion,
  listWorkforceCurriculumVersions,
} from "@/lib/edu/workforce-curriculum-repository";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

const createSchema = z.object({
  courseId: z.string().trim().min(1).max(128),
  version: z.string().trim().min(1).max(80),
  changeSummary: z.string().trim().max(1200).nullable().optional(),
});

function replyError(message: string, status: 400 | 401 | 403 | 404 | 409) {
  return NextResponse.json({ error: message }, { status, headers: PRIVATE_NO_STORE_HEADERS });
}

export async function GET() {
  const session = await getClinicSession();
  if (!session) return replyError("Authentication required.", 401);
  const identity = await resolveEduIdentity();
  if (!identity?.institutionId) return replyError("A Klinikos EDU institution context is required.", 403);

  const versions = await listWorkforceCurriculumVersions(identity);
  return NextResponse.json({ versions }, { headers: PRIVATE_NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return replyError("Authentication required.", 401);
  const identity = await resolveEduIdentity();
  if (!identity?.institutionId) return replyError("A Klinikos EDU institution context is required.", 403);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return replyError("Invalid curriculum version request.", 400);

  try {
    const version = await createWorkforceCurriculumVersion(identity, parsed.data);
    return NextResponse.json({ version }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Curriculum version could not be created.";
    const status = message.includes("authority") ? 403 : message.includes("not found") ? 404 : 409;
    return replyError(message, status);
  }
}
