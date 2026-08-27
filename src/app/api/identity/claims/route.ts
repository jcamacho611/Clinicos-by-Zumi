import { NextResponse } from "next/server";
import { getAuthenticationSession } from "@/lib/auth/session";
import {
  listRelationshipClaimsForPerson,
  submitRelationshipClaim,
} from "@/lib/identity/relationship-claim-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function GET() {
  const session = await getAuthenticationSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    return NextResponse.json({
      data: await listRelationshipClaimsForPerson(session),
    });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await getAuthenticationSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const input = await request.json().catch(() => null);
    const data = await submitRelationshipClaim(session, input);
    return NextResponse.json({
      data,
      message: "Claim submitted. This records a relationship assertion for review and does not grant protected organization access.",
    }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
