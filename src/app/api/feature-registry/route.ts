import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { getPriorityZeroRegistrySummary, listPriorityZeroRegistry } from "@/lib/repositories/feature-registry-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "registry", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  const [data, summary] = await Promise.all([
    listPriorityZeroRegistry(),
    getPriorityZeroRegistrySummary(),
  ]);
  const response = NextResponse.json({ data, summary, organizationId: session.organizationId, priority: "P0" });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
