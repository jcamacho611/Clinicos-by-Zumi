import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createRecordRequest, listNetworkAccessWorkspace } from "@/lib/repositories/network-access-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "network", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const workspace = await listNetworkAccessWorkspace(session.organizationId);
    const response = NextResponse.json({ data: workspace.requests, count: workspace.requests.length });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "network", "create")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const recordRequest = await createRecordRequest(session, await request.json());
    return NextResponse.json({ data: recordRequest }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
