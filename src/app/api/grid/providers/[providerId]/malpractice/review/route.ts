import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { reviewGridMalpractice } from "@/lib/repositories/grid-repository";

export async function POST(request: Request, { params }: { params: Promise<{ providerId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { providerId } = await params;
  const denied = await enforceApiPermission(session, "credentialing", "manage", { request, resourceId: providerId });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await reviewGridMalpractice(session, providerId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
