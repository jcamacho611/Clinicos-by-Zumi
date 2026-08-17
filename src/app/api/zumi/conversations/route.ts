import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { listZumiConversations } from "@/features/zumi/conversation-history";
import { ZUMI_BASELINE_PERMISSION } from "@/features/zumi/schemas";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

const NO_STORE = PRIVATE_NO_STORE_HEADERS;

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!can(session.role, ZUMI_BASELINE_PERMISSION.resource, ZUMI_BASELINE_PERMISSION.action)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403, headers: NO_STORE });
  }

  const conversations = await listZumiConversations(session, 30);
  return NextResponse.json({ data: conversations }, { headers: NO_STORE });
}
