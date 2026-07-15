import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createImagingResult } from "@/lib/repositories/imaging-repository";

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "imaging", "create")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try {
    return NextResponse.json({ data: await createImagingResult(session, await request.json()) }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
