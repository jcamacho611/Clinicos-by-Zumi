import { NextResponse } from "next/server";
import { checkGridEnrollmentRateLimit, recordGridEnrollmentAttempt } from "@/lib/auth/rate-limit";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { getAuthenticationSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createIdentitySafeGridContractorEnrollment } from "@/lib/repositories/grid-enrollment-repository";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "GRID enrollment requires the connected Clinicos database." }, { status: 503 });
  const metadata = requestMetadata(request);
  const key = metadata.ipAddress ?? "unknown";
  const limit = checkGridEnrollmentRateLimit(key);
  if (!limit.allowed) return NextResponse.json({ error: "Too many GRID enrollment attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  recordGridEnrollmentAttempt(key);
  try {
    const session = await getAuthenticationSession();
    const identityProof = session && !session.demo ? {
      userId: session.userId,
      email: session.email,
    } : null;
    const input = await request.json().catch(() => null);
    return NextResponse.json({
      data: await createIdentitySafeGridContractorEnrollment(input, identityProof),
      message: "Application submitted for human credential and malpractice review.",
    }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
