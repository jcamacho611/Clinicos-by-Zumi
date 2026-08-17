import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { listCareCoordinationWorkspace } from "@/lib/repositories/care-coordination-repository";
import { createTaskForOrganization } from "@/lib/repositories/task-creation-repository";
import { createTaskSchema } from "@/lib/task-create-rules";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "tasks", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try { const data = await listCareCoordinationWorkspace(session.organizationId, session.userId); return NextResponse.json({ data: { tasks: data.tasks, notifications: data.notifications } }, { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return networkAccessErrorResponse(error); }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "tasks", "create", { request });
  if (denied) return denied;

  const parsed = createTaskSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid task title, category, priority, and optional due time." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });

  try {
    const task = await createTaskForOrganization(session, parsed.data);
    return NextResponse.json({ data: task }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
