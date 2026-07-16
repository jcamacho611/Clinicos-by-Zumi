import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createInventoryItem, listInventoryWorkspace, recordInventoryTransaction } from "@/lib/repositories/inventory-repository";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { return NextResponse.json({ data: await listInventoryWorkspace(session) }, { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return networkAccessErrorResponse(error); }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const body = await request.json();
    return NextResponse.json({ data: body.action === "transaction" ? await recordInventoryTransaction(session, body) : await createInventoryItem(session, body) }, { status: body.action === "transaction" ? 200 : 201 });
  } catch (error) { return networkAccessErrorResponse(error); }
}
