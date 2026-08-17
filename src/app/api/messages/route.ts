import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { createInternalThreadSchema } from "@/lib/internal-message-rules";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createInternalThread, listInternalMessagingWorkspace } from "@/lib/repositories/internal-message-repository";

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "messages", "read", { request });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await listInternalMessagingWorkspace(session) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "messages", "create", { request });
  if (denied) return denied;
  const parsed = createInternalThreadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid subject and internal message." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  try {
    return NextResponse.json({ data: await createInternalThread(session, parsed.data) }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
