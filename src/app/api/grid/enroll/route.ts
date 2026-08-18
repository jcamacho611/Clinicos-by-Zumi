import { NextResponse } from "next/server";
import { checkGridEnrollmentRateLimit, recordGridEnrollmentAttempt } from "@/lib/auth/rate-limit";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { parseGridPublicAssent, recordGridPublicAssent } from "@/lib/legal/grid-public-assent";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createGridContractorEnrollment } from "@/lib/repositories/grid-repository";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "GRID enrollment requires the connected Clinicos database." }, { status: 503 });
  const metadata = requestMetadata(request);
  const key = metadata.ipAddress ?? "unknown";
  const limit = checkGridEnrollmentRateLimit(key);
  if (!limit.allowed) return NextResponse.json({ error: "Too many GRID enrollment attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  recordGridEnrollmentAttempt(key);
  try {
    const rawInput = await request.json().catch(() => null);
    const assent = parseGridPublicAssent(rawInput);
    await recordGridPublicAssent(assent, metadata, "grid-professional-enrollment-clickwrap");
    return NextResponse.json({ data: await createGridContractorEnrollment(rawInput), message: "Application submitted for human credential and malpractice review." }, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
