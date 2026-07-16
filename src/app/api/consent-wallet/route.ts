import { NextResponse } from "next/server";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { listPassportWorkspace, updateConsentWallet } from "@/lib/repositories/passport-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "consents", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });
  try { const data = await listPassportWorkspace(session.organizationId); return NextResponse.json({ data: { wallets: data.wallets, consents: data.consents } }, { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return networkAccessErrorResponse(error); }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { return NextResponse.json({ data: await updateConsentWallet(session, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
