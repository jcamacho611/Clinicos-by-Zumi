import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { createExpertSupportRequest } from "@/lib/repositories/expert-support-repository";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

const NO_STORE = PRIVATE_NO_STORE_HEADERS;

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  const denied = await enforceApiPermission(session, "network", "create", { request, resourceId: "expert-support" });
  if (denied) return denied;

  const result = await createExpertSupportRequest(session, await request.json().catch(() => null));
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason === "not_authorized" ? "Access denied." : "Review the request and try again." },
      { status: result.reason === "not_authorized" ? 403 : 400, headers: NO_STORE },
    );
  }
  return NextResponse.json({ data: result.request }, { status: 201, headers: NO_STORE });
}
