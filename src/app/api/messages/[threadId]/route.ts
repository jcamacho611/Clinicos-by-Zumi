import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { createInternalMessageSchema } from "@/lib/internal-message-rules";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createInternalMessage } from "@/lib/repositories/internal-message-repository";

export async function POST(request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "messages", "create", { request });
  if (denied) return denied;
  const parsed = createInternalMessageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter an internal message." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  const { threadId } = await params;
  try {
    return NextResponse.json({ data: await createInternalMessage(session, threadId, parsed.data) }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
