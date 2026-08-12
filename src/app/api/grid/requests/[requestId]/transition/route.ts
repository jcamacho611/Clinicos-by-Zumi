import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { db } from "@/lib/db";
import { assertGridReservationAvailable } from "@/lib/grid/transaction-service";
import { transitionGridRequest } from "@/lib/repositories/grid-repository";

export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { requestId } = await params;
  const denied = can(session.role, "network", "update")
    ? null
    : await enforceApiPermission(session, "grid", "update", { request, resourceId: requestId });
  if (denied) return denied;

  try {
    const body = await request.json();

    if (body?.targetStatus === "confirmed") {
      const gridRequest = await db.gridRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          providerId: true,
          locationId: true,
          requestedStartAt: true,
          requestedEndAt: true,
        },
      });
      if (!gridRequest) return NextResponse.json({ error: "Grid request not found." }, { status: 404 });

      await assertGridReservationAvailable({
        providerId: gridRequest.providerId,
        locationId: gridRequest.locationId,
        requestedStartAt: gridRequest.requestedStartAt,
        requestedEndAt: gridRequest.requestedEndAt ?? new Date(gridRequest.requestedStartAt.getTime() + 60 * 60 * 1000),
        excludeRequestId: gridRequest.id,
      });
    }

    return NextResponse.json({ data: await transitionGridRequest(session, requestId, body) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
