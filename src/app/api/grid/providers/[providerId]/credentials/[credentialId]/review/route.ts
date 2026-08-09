import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { reviewGridCredential } from "@/lib/repositories/grid-repository";

export async function POST(request: Request, { params }: { params: Promise<{ providerId: string; credentialId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { providerId, credentialId } = await params;
  const denied = await enforceApiPermission(session, "credentialing", "manage", { request, resourceId: credentialId });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await reviewGridCredential(session, providerId, credentialId, await request.json()) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
