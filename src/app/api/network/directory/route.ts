import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { listNetworkDirectory } from "@/lib/repositories/network-directory-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "network", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const data = await listNetworkDirectory(session.organizationId);
    const response = NextResponse.json({ data });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
