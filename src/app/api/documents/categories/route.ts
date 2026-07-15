import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createDocumentCategory } from "@/lib/repositories/document-repository";

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { return NextResponse.json({ data: await createDocumentCategory(session, await request.json()) }, { status: 201 }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
