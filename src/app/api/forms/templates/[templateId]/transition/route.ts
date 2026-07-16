import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionFormTemplate } from "@/lib/repositories/form-repository";

export async function POST(request: Request, { params }: { params: Promise<{ templateId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "forms", "manage")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try { return NextResponse.json({ data: await transitionFormTemplate(session, (await params).templateId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
