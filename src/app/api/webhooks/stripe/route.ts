import { NextResponse } from "next/server";
import { processVerifiedStripeEvent, verifyStripeWebhookSignature } from "@/lib/commercial/stripe-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public Stripe event destination.
 *
 * No session/cookie auth belongs here; authenticity is the Stripe HMAC signature over
 * the untouched raw request body. Unsupported but correctly signed event types are
 * acknowledged without mutating Klinikos financial state.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const verification = verifyStripeWebhookSignature({
    rawBody,
    signatureHeader: request.headers.get("stripe-signature"),
  });

  if (!verification.ok) {
    const unavailable = verification.reason === "missing_secret";
    return NextResponse.json(
      { error: unavailable ? "Stripe webhook verification is not configured." : "Invalid Stripe webhook signature." },
      { status: unavailable ? 503 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await processVerifiedStripeEvent({ rawBody, verifiedMode: verification.mode });
    return NextResponse.json(
      { received: true, handled: result.handled, eventType: result.eventType },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    // Deliberately avoid echoing provider payloads, metadata, buyer data or secret
    // diagnostics. A 500 asks Stripe to retry a valid event after the transient or
    // internal truth-layer failure is corrected.
    return NextResponse.json(
      { error: "Stripe event could not be reconciled safely." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
