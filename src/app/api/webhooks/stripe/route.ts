import { NextResponse } from "next/server";
import { recordCommercialPaymentEvidence } from "@/lib/commercial/payment-evidence-repository";
import {
  constructVerifiedLiveStripeEvent,
  normalizeStripeWebhookEvent,
  stripeLivePaymentStatus,
} from "@/lib/commercial/payment-connectors/stripe";

export const runtime = "nodejs";

const json = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const status = stripeLivePaymentStatus();
  if (!status.processorVerification) {
    return json({ error: "Stripe live webhook verification is not configured." }, 503);
  }

  const signature = request.headers.get("stripe-signature")?.trim();
  if (!signature) return json({ error: "Stripe signature is required." }, 400);

  const rawBody = await request.text();
  let event;
  try {
    event = constructVerifiedLiveStripeEvent({ rawBody, signature });
  } catch {
    return json({ error: "Stripe webhook signature or payload is invalid." }, 400);
  }

  // The production endpoint is intentionally live-only. Test-mode work uses an
  // explicit test key/secret outside this route and can never settle live intent.
  if (!event.livemode) return json({ error: "Test-mode Stripe events cannot enter the live payment rail." }, 409);

  const evidence = normalizeStripeWebhookEvent(event, rawBody);
  if (!evidence) return json({ received: true, supported: false });

  try {
    const result = await recordCommercialPaymentEvidence(evidence);
    return json({ received: true, supported: true, status: result.status, idempotent: result.idempotent });
  } catch {
    return json({ error: "Stripe evidence could not be recorded." }, 500);
  }
}
