import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";
import { recordSecurityEvent } from "@/lib/security/events";
import { ZUMI_BASELINE_PERMISSION } from "@/features/zumi/schemas";
import { forgetZumiMemory, listZumiMemories, rememberForZumi, zumiMemoryKinds } from "@/features/zumi/memory";

const NO_STORE = PRIVATE_NO_STORE_HEADERS;

const writeSchema = z.object({
  kind: z.enum(zumiMemoryKinds),
  title: z.string().trim().min(2).max(120),
  content: z.string().trim().min(2).max(1_500),
  retentionDays: z.number().int().min(1).max(730).optional(),
});

const deleteSchema = z.object({ memoryId: z.string().trim().min(8).max(100) });

async function authorizedSession() {
  const session = await getClinicSession();
  if (!session) return { ok: false as const, response: NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE }) };
  if (!can(session.role, ZUMI_BASELINE_PERMISSION.resource, ZUMI_BASELINE_PERMISSION.action)) {
    return { ok: false as const, response: NextResponse.json({ error: "Access denied." }, { status: 403, headers: NO_STORE }) };
  }
  return { ok: true as const, session };
}

export async function GET() {
  const auth = await authorizedSession();
  if (!auth.ok) return auth.response;
  const memories = await listZumiMemories(auth.session, { take: 50 });
  return NextResponse.json({ data: memories }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  const auth = await authorizedSession();
  if (!auth.ok) return auth.response;
  const parsed = writeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid memory request." }, { status: 400, headers: NO_STORE });

  const result = await rememberForZumi({ session: auth.session, ...parsed.data });
  if (!result.allowed) {
    await recordSecurityEvent({
      organizationId: auth.session.organizationId,
      actorId: auth.session.userId,
      action: "zumi.memory_rejected",
      risk: "MEDIUM",
      resourceType: "ai_memory",
      resourceId: parsed.data.kind,
      metadata: { reason: result.reason },
    });
    return NextResponse.json({ error: result.reason }, { status: 400, headers: NO_STORE });
  }

  await recordSecurityEvent({
    organizationId: auth.session.organizationId,
    actorId: auth.session.userId,
    action: "zumi.memory_saved",
    risk: "LOW",
    resourceType: "ai_memory",
    resourceId: result.id,
    metadata: { kind: parsed.data.kind, expiresAt: result.expiresAt.toISOString() },
  });

  return NextResponse.json({ data: { id: result.id, expiresAt: result.expiresAt.toISOString() } }, { status: 201, headers: NO_STORE });
}

export async function DELETE(request: Request) {
  const auth = await authorizedSession();
  if (!auth.ok) return auth.response;
  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid memory request." }, { status: 400, headers: NO_STORE });

  const forgotten = await forgetZumiMemory(auth.session, parsed.data.memoryId);
  if (!forgotten) return NextResponse.json({ error: "Memory not found." }, { status: 404, headers: NO_STORE });

  await recordSecurityEvent({
    organizationId: auth.session.organizationId,
    actorId: auth.session.userId,
    action: "zumi.memory_forgotten",
    risk: "LOW",
    resourceType: "ai_memory",
    resourceId: parsed.data.memoryId,
  });
  return NextResponse.json({ data: { forgotten: true } }, { headers: NO_STORE });
}
