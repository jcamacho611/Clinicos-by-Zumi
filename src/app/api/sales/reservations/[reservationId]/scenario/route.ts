import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { generateDemoScenario } from "@/lib/repositories/sales-demo-repository";

export async function POST(request: Request, context: { params: Promise<{ reservationId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { reservationId } = await context.params;
  const denied = await enforceApiPermission(session, "sales", "update", { request, resourceId: reservationId });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await generateDemoScenario(session, reservationId) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
