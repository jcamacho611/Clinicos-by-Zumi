import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { deleteZumiConversation, getZumiConversation } from "@/features/zumi/conversation-history";
import { ZUMI_BASELINE_PERMISSION } from "@/features/zumi/schemas";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";
import { recordSecurityEvent } from "@/lib/security/events";

const NO_STORE = PRIVATE_NO_STORE_HEADERS;
const idSchema = z.string().trim().min(8).max(100).regex(/^[a-z0-9-]+$/i);

async function authorizedSession() {
  const session = await getClinicSession();
  if (!session) return { ok: false as const, response: NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE }) };
  if (!can(session.role, ZUMI_BASELINE_PERMISSION.resource, ZUMI_BASELINE_PERMISSION.action)) {
    return { ok: false as const, response: NextResponse.json({ error: "Access denied." }, { status: 403, headers: NO_STORE }) };
  }
  return { ok: true as const, session };
}

export async function GET(_request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const auth = await authorizedSession();
  if (!auth.ok) return auth.response;
  const parsed = idSchema.safeParse((await params).conversationId);
  if (!parsed.success) return NextResponse.json({ error: "Invalid conversation reference." }, { status: 400, headers: NO_STORE });

  const conversation = await getZumiConversation(auth.session, parsed.data);
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404, headers: NO_STORE });
  return NextResponse.json({ data: conversation }, { headers: NO_STORE });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const auth = await authorizedSession();
  if (!auth.ok) return auth.response;
  const parsed = idSchema.safeParse((await params).conversationId);
  if (!parsed.success) return NextResponse.json({ error: "Invalid conversation reference." }, { status: 400, headers: NO_STORE });

  const deleted = await deleteZumiConversation(auth.session, parsed.data);
  if (!deleted) return NextResponse.json({ error: "Conversation not found." }, { status: 404, headers: NO_STORE });

  await recordSecurityEvent({
    organizationId: auth.session.organizationId,
    actorId: auth.session.userId,
    action: "zumi.conversation_deleted",
    risk: "LOW",
    resourceType: "ai_conversation",
    resourceId: parsed.data,
  });
  return NextResponse.json({ data: { deleted: true } }, { headers: NO_STORE });
}
