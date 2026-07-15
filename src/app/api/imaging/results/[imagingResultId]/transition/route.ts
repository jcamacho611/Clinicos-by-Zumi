import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionImagingResult } from "@/lib/repositories/imaging-repository";

export async function POST(request: Request, { params }: { params: Promise<{ imagingResultId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "imaging", "update")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try {
    const { imagingResultId } = await params;
    return NextResponse.json({ data: await transitionImagingResult(session, imagingResultId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
