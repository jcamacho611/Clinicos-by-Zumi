import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { correctLabResult } from "@/lib/repositories/lab-repository";

export async function POST(request: Request, { params }: { params: Promise<{ labResultId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "labs", "sign")) return NextResponse.json({ error: "Provider review permission is required." }, { status: 403 });
  try {
    const { labResultId } = await params;
    return NextResponse.json({ data: await correctLabResult(session, labResultId, await request.json()) }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
