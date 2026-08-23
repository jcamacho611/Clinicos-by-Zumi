import { NextResponse } from "next/server";
import { z } from "zod";

import { getClinicSession } from "@/lib/auth/session";
import { createWorkforceSession, listWorkforceSessions } from "@/lib/edu/workforce-delivery-repository";
import { canManageWorkforceSession } from "@/lib/edu/workforce-delivery-records";
import { resolveEduIdentity } from "@/lib/edu/edu-session";

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

const createSessionSchema = z.object({
  cohortId: z.string().trim().min(1).max(128),
  title: z.string().trim().min(1).max(180),
  deliveryMode: z.enum(["in_person", "live_remote", "hybrid"]),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  curriculumVersion: z.string().trim().max(80).nullable().optional(),
  materialVersion: z.string().trim().max(80).nullable().optional(),
  locationLabel: z.string().trim().max(240).nullable().optional(),
  remoteJoinProvider: z.string().trim().max(120).nullable().optional(),
  backupInstructorUserId: z.string().trim().max(128).nullable().optional(),
});

function deny(message: string, status: 400 | 401 | 403 | 409) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE });
}

export async function GET() {
  const session = await getClinicSession();
  if (!session) return deny("Authentication required.", 401);
  const identity = await resolveEduIdentity();
  if (!identity) return deny("No Klinikos EDU identity is associated with this account.", 403);

  const sessions = await listWorkforceSessions(identity);
  return NextResponse.json({ sessions }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return deny("Authentication required.", 401);
  const identity = await resolveEduIdentity();
  if (!identity) return deny("No Klinikos EDU identity is associated with this account.", 403);
  if (!canManageWorkforceSession(identity.role)) return deny("Only instructors and education administrators can schedule workforce sessions.", 403);

  const parsed = createSessionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return deny("Invalid session request.", 400);

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (endsAt <= startsAt) return deny("Session end must be after session start.", 409);

  try {
    const created = await createWorkforceSession(identity, { ...parsed.data, startsAt, endsAt });
    return NextResponse.json({ session: created }, { status: 201, headers: NO_STORE });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Session could not be created.";
    return deny(message, message.includes("not permitted") || message.includes("authority") ? 403 : 409);
  }
}
