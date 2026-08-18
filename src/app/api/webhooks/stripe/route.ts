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

function manualServiceSaleMetadata(event: { data: { object: unknown } }) {
  const object = event.data.object as { metadata?: Record<string, string> | null } | null;
  const metadata = object?.metadata;
  if (!metadata || metadata.klinikos_sale_mode !== "manual_service") return null;
  return {
    productKey: metadata.klinikos_product_key?.trim() || null,
    offerKey: metadata.klinikos_offer_key?.trim() || null,
  };
}

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

  // Sales may use a deliberately tagged Stripe Payment Link for a manually
  // fulfilled service such as the Clinic Operating Analysis. Those payments are
  // real Stripe transactions, but they do not carry the per-buyer opaque Klinikos
  // checkout intent that authorizes software entitlement changes. Acknowledge the
  // signed Stripe event so Stripe does not retry forever, while keeping the event
  // outside the automatic entitlement rail. Staff reconcile the sale from Stripe.
  const manualSale = manualServiceSaleMetadata(event);
  if (manualSale) {
    return json({
      received: true,
      supported: false,
      manualReconciliation: true,
      productKey: manualSale.productKey,
      offerKey: manualSale.offerKey,
    });
  }

  const evidence = normalizeStripeWebhookEvent(event, rawBody);
  if (!evidence) return json({ received: true, supported: false });

  try {
    const result = await recordCommercialPaymentEvidence(evidence);
    return json({ received: true, supported: true, status: result.status, idempotent: result.idempotent });
  } catch {
    return json({ error: "Stripe evidence could not be recorded." }, 500);
  }
}
