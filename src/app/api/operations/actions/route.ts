import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { decideAction } from "@/lib/operations/followup-service";

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

const bodySchema = z.object({
  actionId: z.string().trim().min(1).max(128),
  decision: z.enum(["confirm", "dismiss"]),
});

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  const denied = await enforceApiPermission(session, "tasks", "update", { request });
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: NO_STORE });

  const result = await decideAction({
    organizationId: session.organizationId,
    actionId: parsed.data.actionId,
    userId: session.userId,
    decision: parsed.data.decision,
  });

  if (!result.ok) return NextResponse.json({ error: "That action was not found." }, { status: 404, headers: NO_STORE });
  return NextResponse.json({ data: result }, { headers: NO_STORE });
}
