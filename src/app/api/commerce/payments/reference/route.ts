import { NextResponse } from "next/server";
import { checkPaidEntryRateLimit, recordPaidEntryAttempt } from "@/lib/auth/rate-limit";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { accessPaymentReferenceSchema } from "@/lib/commerce/access-payment-rules";
import { attachPaymentReference } from "@/lib/commerce/access-payment-service";

/**
 * Buyer-submitted payment reference for the manual return path.
 *
 * Used when a provider webhook is not configured or has not arrived. Submitting a
 * reference never marks a payment as paid: it moves the record to
 * `pending_verification` for a human to confirm.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Payment storage is unavailable." }, { status: 503 });

  const metadata = requestMetadata(request);
  const rateKey = metadata.ipAddress ?? "unknown";
  const limit = checkPaidEntryRateLimit(rateKey);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }
  recordPaidEntryAttempt(rateKey);

  const parsed = accessPaymentReferenceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the email you purchased with and your payment reference." }, { status: 400 });

  const result = await attachPaymentReference(parsed.data);
  if (!result.ok) {
    // Deliberately identical wording for both cases: this endpoint is public, and a
    // distinct "no payment for that email" response would confirm who has purchased.
    return NextResponse.json(
      { error: "We could not match an open purchase for that email. If you have already been verified, no action is needed." },
      { status: 409 },
    );
  }

  return NextResponse.json(
    { ok: true, status: result.payment.status, message: "Reference recorded. A reviewer will confirm your payment." },
    { status: 202, headers: { "Cache-Control": "no-store" } },
  );
}
