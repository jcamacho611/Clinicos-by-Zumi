import { NextResponse } from "next/server";
import { recordCommercialPaymentEvidence } from "@/lib/commercial/payment-evidence-repository";
import {
  constructVerifiedLiveStripeEvent,
  normalizeStripeWebhookEvent,
  stripeLivePaymentStatus,
} from "@/lib/commercial/payment-connectors/stripe";
import { reconcileVerifiedAnalysisPayment } from "@/lib/commercial/sales-payment-fulfillment";
import { isKlinikosRecurringStripeEventCandidate } from "@/lib/commercial/stripe-recurring-event-candidate";
import {
  processVerifiedStripeClinicSubscriptionEvent,
  StripeClinicSubscriptionError,
} from "@/lib/commercial/stripe-clinic-subscriptions";
import {
  isLuxeStripeDepositEvent,
  isLuxeStripeDepositRefundEvent,
  normalizeVerifiedLuxeStripeDepositEvent,
  normalizeVerifiedLuxeStripeRefundEvent,
} from "@/lib/luxe-stripe-deposit";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import { recordProcessorVerifiedLuxeStripeDeposit } from "@/lib/repositories/luxe-processor-payment-evidence-repository";
import { recordProcessorVerifiedLuxeStripeRefund } from "@/lib/repositories/luxe-refund-evidence-repository";

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

  // Luxe refunds are identified from the Charge metadata copied by Stripe from
  // the Checkout-created PaymentIntent. They remain separate from SaaS/commercial
  // entitlement events and reduce acquisition revenue only through durable signed
  // refund evidence.
  if (isLuxeStripeDepositRefundEvent(event)) {
    try {
      const refund = normalizeVerifiedLuxeStripeRefundEvent(event);
      const result = await recordProcessorVerifiedLuxeStripeRefund(refund);
      return json({
        received: true,
        supported: true,
        luxeDepositRefund: true,
        amountRefundedCents: result.amountRefundedCents,
        paymentStatus: result.paymentStatus,
        idempotent: result.idempotent,
      });
    } catch (error) {
      if (error instanceof NetworkAccessError) {
        return json({ error: "Luxe Stripe refund evidence needs reconciliation before it can be attributed." }, error.status >= 500 ? error.status : 409);
      }
      return json({ error: "Luxe Stripe refund evidence could not be processed." }, 500);
    }
  }

  // Luxe deposits use the same signed Stripe ingress as Klinikos commercial
  // payments, but their evidence belongs to the clinic's acquisition ledger.
  // The opaque journey correlation never grants booking authority: a paid deposit
  // verifies money only, while appointment confirmation remains a separate human/
  // booking-provider state.
  if (isLuxeStripeDepositEvent(event)) {
    try {
      const deposit = normalizeVerifiedLuxeStripeDepositEvent(event);
      const result = await recordProcessorVerifiedLuxeStripeDeposit(deposit);
      return json({
        received: true,
        supported: true,
        luxeDeposit: true,
        outcome: deposit.outcome,
        recorded: result.recorded,
        idempotent: "idempotent" in result ? result.idempotent : false,
      });
    } catch (error) {
      if (error instanceof NetworkAccessError) {
        return json({ error: "Luxe Stripe deposit evidence needs reconciliation before it can be attributed." }, error.status >= 500 ? error.status : 409);
      }
      return json({ error: "Luxe Stripe deposit evidence could not be processed." }, 500);
    }
  }

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

  // Recurring Clinic OS billing is intentionally isolated from the one-time
  // Checkout evidence normalizer. A signed invoice.paid can activate/renew only
  // after it matches the opaque server-owned clinic plan intent. Failed invoices
  // do not extend access; signed subscription deletion revokes the matching plan.
  if (["invoice.paid", "invoice.payment_failed", "customer.subscription.deleted"].includes(event.type)) {
    if (!isKlinikosRecurringStripeEventCandidate(event)) {
      return json({ received: true, supported: false, unrelatedRecurringEvent: true });
    }
    try {
      const recurring = await processVerifiedStripeClinicSubscriptionEvent(event, rawBody);
      if (!recurring) {
        return json({ error: "Stripe subscription event is missing required Klinikos correlation metadata." }, 409);
      }
      return json({ received: true, supported: true, recurring: true, ...recurring });
    } catch (error) {
      if (error instanceof StripeClinicSubscriptionError) return json({ error: error.message }, error.status >= 500 ? error.status : 409);
      return json({ error: "Stripe subscription evidence could not be processed." }, 500);
    }
  }

  const evidence = normalizeStripeWebhookEvent(event, rawBody);
  if (!evidence) return json({ received: true, supported: false });

  try {
    const result = await recordCommercialPaymentEvidence(evidence);
    let salesFulfillment = null;

    // The payment ledger remains authoritative. Only after a signed processor
    // success has been applied do we ask the sales subsystem to resolve the exact
    // checkout_ready reservation by its opaque checkout-intent correlation.
    // Reconciliation failure never downgrades or erases real collected-money truth.
    if (
      result.status === "applied"
      && evidence.processorVerified
      && evidence.outcome === "succeeded"
      && evidence.checkoutIntentId
      && result.organizationId
    ) {
      salesFulfillment = await reconcileVerifiedAnalysisPayment({
        checkoutIntentId: evidence.checkoutIntentId,
        organizationId: result.organizationId,
        paymentEventId: result.eventId,
        provider: evidence.provider,
        amountCents: evidence.amountCents,
      }).catch(() => ({ status: "reconciliation_required" as const }));
    }

    return json({
      received: true,
      supported: true,
      status: result.status,
      idempotent: result.idempotent,
      salesFulfillment: salesFulfillment?.status ?? null,
    });
  } catch {
    return json({ error: "Stripe evidence could not be recorded." }, 500);
  }
}
