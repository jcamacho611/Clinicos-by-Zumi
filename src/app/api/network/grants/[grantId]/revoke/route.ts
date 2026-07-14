import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { revokeNetworkAccess } from "@/lib/repositories/network-access-repository";

export async function POST(request: Request, { params }: { params: Promise<{ grantId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "network", "update")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const { grantId } = await params;
    const body = await request.json() as { reason?: unknown };
    const grant = await revokeNetworkAccess(session, grantId, typeof body.reason === "string" ? body.reason : "");
    return NextResponse.json({ data: grant });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
