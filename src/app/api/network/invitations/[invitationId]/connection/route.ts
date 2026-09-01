import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createNetworkConnectionFromInvitation } from "@/lib/repositories/network-directory-repository";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ invitationId: string }> },
) {
  const session = await getClinicSession();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401, headers: PRIVATE_NO_STORE_HEADERS },
    );
  }
  const { invitationId } = await params;
  const denied = await enforceApiPermission(session, "network", "create", {
    request,
    resourceId: invitationId,
  });
  if (denied) return denied;

  try {
    const connection = await createNetworkConnectionFromInvitation(
      session,
      invitationId,
      await request.json(),
    );
    return NextResponse.json({
      data: {
        id: connection.id,
        status: connection.status,
        allowedPurposes: connection.allowedPurposes,
        receivingApprovalRequired: connection.status === "pending",
      },
    }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
