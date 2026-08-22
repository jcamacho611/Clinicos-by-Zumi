import { NextResponse } from "next/server";
import { checkSalesIntakeRateLimit, recordSalesIntakeAttempt } from "@/lib/auth/rate-limit";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { applyActivationQualification } from "@/lib/commercial/analysis-activation";

/**
 * Post-payment activation details.
 *
 * Unauthenticated by necessity — the buyer has no Klinikos account yet — so the signed
 * activation reference is the only thing that says which reservation is being described,
 * and it is rate limited like the intake it follows. The route can write clinic
 * qualification and nothing else: payment status, price, eligibility and engagement
 * status are not reachable from here.
 */
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Activation details require PostgreSQL." }, { status: 503 });
  }

  const metadata = requestMetadata(request);
  const key = metadata.ipAddress ?? "unknown";
  const limit = checkSalesIntakeRateLimit(key);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } },
    );
  }
  recordSalesIntakeAttempt(key);

  const body = await request.json().catch(() => null) as { token?: string; qualification?: unknown } | null;
  const result = await applyActivationQualification(body?.token, body?.qualification ?? {});

  if (!result.ok) {
    // Both failures answer the same way. Distinguishing "no such reservation" from
    // "bad signature" would let someone probe which references exist.
    return NextResponse.json({ error: "This activation link is not valid." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json({ data: { nextAction: result.nextAction } }, { headers: { "Cache-Control": "no-store" } });
}
