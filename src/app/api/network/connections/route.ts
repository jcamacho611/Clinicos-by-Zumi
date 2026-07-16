import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createNetworkConnection } from "@/lib/repositories/network-directory-repository";

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "network", "create")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const connection = await createNetworkConnection(session, await request.json());
    return NextResponse.json({ data: connection }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
