import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createFormTemplate, listFormWorkspace } from "@/lib/repositories/form-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "forms", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try {
    const data = await listFormWorkspace(session.organizationId);
    const response = NextResponse.json({ data });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) { return networkAccessErrorResponse(error); }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "forms", "create")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try { return NextResponse.json({ data: await createFormTemplate(session, await request.json()) }, { status: 201 }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
