import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionImagingOrder } from "@/lib/repositories/imaging-repository";

export async function POST(request: Request, { params }: { params: Promise<{ imagingOrderId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "imaging", "update")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try {
    const { imagingOrderId } = await params;
    return NextResponse.json({ data: await transitionImagingOrder(session, imagingOrderId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
