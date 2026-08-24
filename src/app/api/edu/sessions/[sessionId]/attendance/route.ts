import { NextResponse } from "next/server";
import { z } from "zod";

import { getClinicSession } from "@/lib/auth/session";
import { listSessionAttendance, verifySessionAttendance } from "@/lib/edu/workforce-delivery-repository";
import { canVerifyWorkforceAttendance } from "@/lib/edu/workforce-delivery-records";
import { resolveEduIdentity } from "@/lib/edu/edu-session";

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

const attendanceSchema = z.object({
  enrollmentId: z.string().trim().min(1).max(128),
  status: z.enum(["present", "absent", "partial", "excused", "unverified"]),
  evidenceSource: z.string().trim().min(2).max(120),
  minutesPresent: z.number().int().min(0).max(1440).nullable().optional(),
  evidenceNote: z.string().trim().max(500).nullable().optional(),
});

function deny(message: string, status: 400 | 401 | 403 | 404 | 409) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE });
}

export async function GET(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const session = await getClinicSession();
  if (!session) return deny("Authentication required.", 401);
  const identity = await resolveEduIdentity();
  if (!identity) return deny("No Klinikos EDU identity is associated with this account.", 403);
  const { sessionId } = await context.params;

  try {
    const attendance = await listSessionAttendance(identity, sessionId);
    return NextResponse.json({ attendance }, { headers: NO_STORE });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attendance could not be loaded.";
    return deny(message, message.includes("not permitted") ? 403 : 404);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const session = await getClinicSession();
  if (!session) return deny("Authentication required.", 401);
  const identity = await resolveEduIdentity();
  if (!identity) return deny("No Klinikos EDU identity is associated with this account.", 403);
  if (!canVerifyWorkforceAttendance(identity.role)) return deny("Only instructors and education administrators can verify attendance.", 403);

  const parsed = attendanceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return deny("Invalid attendance request.", 400);
  const { sessionId } = await context.params;

  try {
    const attendance = await verifySessionAttendance(identity, { sessionId, ...parsed.data });
    return NextResponse.json({ attendance }, { headers: NO_STORE });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attendance could not be saved.";
    const status = message.includes("not permitted") || message.includes("authority") ? 403 : message.includes("not found") ? 404 : 409;
    return deny(message, status);
  }
}
