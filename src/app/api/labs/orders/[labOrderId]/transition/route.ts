import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionLabOrder } from "@/lib/repositories/lab-repository";

export async function POST(request: Request, { params }: { params: Promise<{ labOrderId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "labs", "update")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try {
    const { labOrderId } = await params;
    return NextResponse.json({ data: await transitionLabOrder(session, labOrderId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
