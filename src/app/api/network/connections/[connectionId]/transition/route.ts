import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionNetworkConnection } from "@/lib/repositories/network-directory-repository";

export async function POST(request: Request, { params }: { params: Promise<{ connectionId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const { connectionId } = await params;
    const connection = await transitionNetworkConnection(session, connectionId, await request.json());
    return NextResponse.json({ data: connection });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
