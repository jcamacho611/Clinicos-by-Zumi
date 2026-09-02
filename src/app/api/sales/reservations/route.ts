import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { checkSalesIntakeRateLimit, recordSalesIntakeAttempt } from "@/lib/auth/rate-limit";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createPublicDemoReservation, listSalesDemoWorkspace } from "@/lib/repositories/sales-demo-repository";

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "sales", "read", { request });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await listSalesDemoWorkspace(session) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "First-value requests require the PostgreSQL sales workspace." }, { status: 503 });
  }

  const metadata = requestMetadata(request);
  const key = metadata.ipAddress ?? "unknown";
  const limit = checkSalesIntakeRateLimit(key);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } },
    );
  }
  recordSalesIntakeAttempt(key);

  try {
    const result = await createPublicDemoReservation(await request.json().catch(() => null), metadata);
    return NextResponse.json(
      {
        data: {
          ...result,
          paymentRequested: false,
          meetingScheduled: false,
          nextAction:
            "Human-review the unfinished-work map and produce one bounded first useful result. Advance a paid capability only after additional economic value is demonstrated.",
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
