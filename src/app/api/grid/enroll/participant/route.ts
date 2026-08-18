import { NextResponse } from "next/server";
import { checkGridEnrollmentRateLimit, recordGridEnrollmentAttempt } from "@/lib/auth/rate-limit";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { createExternalGridParticipantEnrollment } from "@/lib/grid/external-participant-enrollment";
import { parseGridPublicAssent, recordGridPublicAssent } from "@/lib/legal/grid-public-assent";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Grid signup requires the connected Klinikos database." }, { status: 503 });
  }

  const metadata = requestMetadata(request);
  const key = metadata.ipAddress ?? "unknown";
  const limit = checkGridEnrollmentRateLimit(key);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many Grid signup attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }
  recordGridEnrollmentAttempt(key);

  try {
    const rawInput = await request.json().catch(() => null);
    const assent = parseGridPublicAssent(rawInput);
    await recordGridPublicAssent(assent, metadata, "grid-participant-enrollment-clickwrap");
    const data = await createExternalGridParticipantEnrollment(rawInput);
    return NextResponse.json(
      {
        data,
        message: "Grid account created and the first resource was submitted for review.",
      },
      { status: 201 },
    );
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
