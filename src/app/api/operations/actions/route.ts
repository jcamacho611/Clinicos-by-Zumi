import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { decideAction } from "@/lib/operations/followup-service";

/**
 * Record an owner's decision on a prepared action.
 *
 * The organization comes from the session and is applied to the lookup, so an action
 * belonging to another clinic is simply not found. The request cannot name a tenant,
 * a user, or a resulting state.
 */

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

const bodySchema = z.object({
  actionId: z.string().trim().min(1).max(64),
  decision: z.enum(["confirm", "dismiss"]),
});

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!can(session.role, "tasks", "update")) {
    return NextResponse.json({ error: "Access denied." }, { status: 403, headers: NO_STORE });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: NO_STORE });

  const result = await decideAction({
    organizationId: session.organizationId,
    actionId: parsed.data.actionId,
    userId: session.userId,
    decision: parsed.data.decision,
  });

  if (!result.ok) return NextResponse.json({ error: "That action was not found." }, { status: 404, headers: NO_STORE });
  return NextResponse.json({ data: { state: result.state } }, { headers: NO_STORE });
}
