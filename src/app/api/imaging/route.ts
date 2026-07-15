import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { listImagingWorkspace } from "@/lib/repositories/imaging-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "imaging", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try {
    const response = NextResponse.json({ data: await listImagingWorkspace(session.organizationId) });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
