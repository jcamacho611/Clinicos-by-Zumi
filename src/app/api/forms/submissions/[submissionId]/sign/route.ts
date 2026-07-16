import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { signFormSubmission } from "@/lib/repositories/form-repository";

export async function POST(request: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "forms", "update")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    return NextResponse.json({ data: await signFormSubmission(session, (await params).submissionId, await request.json(), { ipAddress: forwarded, userAgent: request.headers.get("user-agent") }) }, { status: 201 });
  } catch (error) { return networkAccessErrorResponse(error); }
}
