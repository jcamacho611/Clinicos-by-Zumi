import { NextResponse } from "next/server";
import { getAuthenticationSession } from "@/lib/auth/session";
import { reviewRelationshipClaim } from "@/lib/identity/relationship-claim-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ claimId: string }> },
) {
  const session = await getAuthenticationSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const { claimId } = await params;
    const input = await request.json().catch(() => null);
    return NextResponse.json({
      data: await reviewRelationshipClaim(session, claimId, input),
    });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
