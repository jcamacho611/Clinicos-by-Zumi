import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionFormSubmission } from "@/lib/repositories/form-repository";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "forms", "update")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try { return NextResponse.json({ data: await transitionFormSubmission(session, (await params).submissionId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
