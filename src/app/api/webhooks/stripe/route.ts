import { NextResponse } from "next/server";
import { recordCommercialPaymentEvidence } from "@/lib/commercial/payment-evidence-repository";
import {
  constructVerifiedLiveStripeEvent,
  normalizeStripeWebhookEvent,
  stripeLivePaymentStatus,
} from "@/lib/commercial/payment-connectors/stripe";
import { isKlinikosRecurringStripeEventCandidate } from "@/lib/commercial/stripe-recurring-event-candidate";
import {
  processVerifiedStripeClinicSubscriptionEvent,
  StripeClinicSubscriptionError,
} from "@/lib/commercial/stripe-clinic-subscriptions";

export const runtime = "nodejs";

const json = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

function manualServiceSale(event: { data: { object: unknown } }) {
  const object = event.data.object as { metadata?: Record<string, string> | null } | null;
  return object?.metadata?.klinikos_sale_mode === "manual_service";
}

/**
 * Stripe is the caller here, not a product UI. Even so, the public webhook must not
 * become a discovery endpoint for Klinikos product keys, organization IDs,
 * entitlement state, idempotency state, reconciliation policy, or internal processor
 * results. A valid accepted event receives only `{ received: true }`.
 */
export async function POST(request: Request) {
  const status = stripeLivePaymentStatus();
  if (!status.processorVerification) {
    return json({ error: "Webhook processing is temporarily unavailable." }, 503);
  }

  const signature = request.headers.get("stripe-signature")?.trim();
  if (!signature) return json({ error: "Webhook signature is required." }, 400);

  const rawBody = await request.text();
  let event;
  try {
    event = constructVerifiedLiveStripeEvent({ rawBody, signature });
  } catch {
    return json({ error: "Webhook signature or payload is invalid." }, 400);
  }

  // The production endpoint is intentionally live-only. Test-mode work uses an
  // explicit test key/secret outside this route and can never settle live intent.
  if (!event.livemode) return json({ error: "Webhook event was rejected." }, 409);

  // Manually fulfilled service Payment Links are acknowledged so Stripe does not
  // retry them forever, but they cannot grant software entitlement automatically.
  if (manualServiceSale(event)) return json({ received: true });

  // Recurring Clinic OS billing remains isolated from one-time payment evidence.
  if (["invoice.paid", "invoice.payment_failed", "customer.subscription.deleted"].includes(event.type)) {
    if (!isKlinikosRecurringStripeEventCandidate(event)) return json({ received: true });

    try {
      const recurring = await processVerifiedStripeClinicSubscriptionEvent(event, rawBody);
      if (!recurring) {
        return json({ error: "Webhook evidence could not be correlated." }, 409);
      }
      return json({ received: true });
    } catch (error) {
      if (error instanceof StripeClinicSubscriptionError) {
        return json(
          { error: "Subscription evidence could not be processed." },
          error.status >= 500 ? error.status : 409,
        );
      }
      return json({ error: "Subscription evidence could not be processed." }, 500);
    }
  }

  const evidence = normalizeStripeWebhookEvent(event, rawBody);
  if (!evidence) return json({ received: true });

  try {
    await recordCommercialPaymentEvidence(evidence);
    return json({ received: true });
  } catch {
    return json({ error: "Payment evidence could not be recorded." }, 500);
  }
}
