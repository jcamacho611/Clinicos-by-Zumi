import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { canUseBreakGlass } from "@/lib/network-access-rules";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { startBreakGlassAccess } from "@/lib/repositories/network-access-repository";

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canUseBreakGlass(session.role)) return NextResponse.json({ error: "Break-glass access requires a provider or administrator role." }, { status: 403 });

  try {
    const grant = await startBreakGlassAccess(session, await request.json());
    return NextResponse.json({
      data: grant,
      warning: "Emergency access was logged, source-clinic alerts were created, and access will expire automatically.",
    }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
