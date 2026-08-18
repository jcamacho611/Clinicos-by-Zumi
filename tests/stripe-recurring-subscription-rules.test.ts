import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import {
  buildStripeSubscriptionCheckoutSessionParams,
  normalizeStripeClinicSubscriptionSignal,
  stripeRecurringSubscriptionStatus,
} from "@/lib/commercial/stripe-clinic-subscriptions";

function stripeEvent(input: { type: string; object: Record<string, unknown>; id?: string }) {
  return {
    id: input.id ?? "evt_subscription",
    object: "event",
    type: input.type,
    livemode: true,
    data: { object: input.object },
  } as unknown as Stripe.Event;
}

const metadata = {
  klinikos_checkout_intent_id: "11111111-1111-4111-8111-111111111111",
  klinikos_checkout_state: "opaque_state_123",
  klinikos_product_key: "clinic_core",
};

describe("Stripe recurring clinic subscription rules", () => {
  it("requires an explicit recurring enablement gate in addition to live key and signed webhook readiness", () => {
    expect(stripeRecurringSubscriptionStatus({
      STRIPE_SECRET_KEY: "sk_live_test",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
    } as NodeJS.ProcessEnv).processorVerification).toBe(false);

    const ready = stripeRecurringSubscriptionStatus({
      STRIPE_SECRET_KEY: "sk_live_test",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      KLINIKOS_STRIPE_RECURRING_ENABLED: "true",
    } as NodeJS.ProcessEnv);
    expect(ready.processorVerification).toBe(true);
    expect(ready.missing).toEqual([]);
  });

  it("creates monthly hosted Checkout from the server-owned amount and propagates only opaque correlation metadata", () => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const params = buildStripeSubscriptionCheckoutSessionParams({
      productKey: "clinic_core",
      productLabel: "Klinikos Core",
      amountCents: 79_900,
      currency: "USD",
      email: "owner@example.test",
      intentId: metadata.klinikos_checkout_intent_id,
      state: metadata.klinikos_checkout_state,
      expiresAt,
      returnUrl: "https://klinikos.io/payments/success?state=opaque_state_123",
    });

    expect(params.mode).toBe("subscription");
    expect(params.line_items?.[0]).toMatchObject({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: 79_900,
        recurring: { interval: "month" },
      },
    });
    expect(params.metadata).toEqual(metadata);
    expect(params.subscription_data?.metadata).toEqual(metadata);
    expect(params.payment_intent_data).toBeUndefined();
    expect(JSON.stringify(params.metadata)).not.toContain("owner@example.test");
  });

  it("normalizes a paid subscription invoice using subscription metadata and one unambiguous service period", () => {
    const start = 1_787_011_200;
    const end = start + 30 * 24 * 60 * 60;
    const event = stripeEvent({
      type: "invoice.paid",
      id: "evt_invoice_paid",
      object: {
        id: "in_paid",
        customer: "cus_live",
        amount_paid: 79_900,
        currency: "usd",
        parent: {
          type: "subscription_details",
          subscription_details: { subscription: "sub_live", metadata },
        },
        lines: {
          data: [{
            amount: 79_900,
            parent: { type: "subscription_item_details" },
            period: { start, end },
          }],
        },
      },
    });

    const signal = normalizeStripeClinicSubscriptionSignal(event, JSON.stringify(event));
    expect(signal).toMatchObject({
      kind: "invoice_paid",
      stripeEventId: "evt_invoice_paid",
      checkoutIntentId: metadata.klinikos_checkout_intent_id,
      checkoutState: metadata.klinikos_checkout_state,
      productKey: "clinic_core",
      externalCustomerId: "cus_live",
      externalSubscriptionId: "sub_live",
      amountCents: 79_900,
      currency: "usd",
    });
    expect(signal?.periodStartsAt?.getTime()).toBe(start * 1000);
    expect(signal?.periodEndsAt?.getTime()).toBe(end * 1000);
  });

  it("fails closed when a paid invoice lacks correlation metadata or has ambiguous service periods", () => {
    const base = {
      id: "in_bad",
      customer: "cus_live",
      amount_paid: 79_900,
      currency: "usd",
      parent: { type: "subscription_details", subscription_details: { subscription: "sub_live", metadata } },
    };
    const missingMetadata = stripeEvent({
      type: "invoice.paid",
      object: { ...base, parent: { type: "subscription_details", subscription_details: { subscription: "sub_live", metadata: {} } }, lines: { data: [] } },
    });
    expect(normalizeStripeClinicSubscriptionSignal(missingMetadata, JSON.stringify(missingMetadata))).toBeNull();

    const ambiguous = stripeEvent({
      type: "invoice.paid",
      object: {
        ...base,
        lines: { data: [
          { amount: 40_000, parent: { type: "subscription_item_details" }, period: { start: 100, end: 200 } },
          { amount: 39_900, parent: { type: "subscription_item_details" }, period: { start: 200, end: 300 } },
        ] },
      },
    });
    expect(normalizeStripeClinicSubscriptionSignal(ambiguous, JSON.stringify(ambiguous))).toBeNull();
  });

  it("represents a failed recurring invoice as failure evidence with no entitlement period requirement", () => {
    const event = stripeEvent({
      type: "invoice.payment_failed",
      object: {
        id: "in_failed",
        customer: "cus_live",
        amount_due: 79_900,
        currency: "usd",
        parent: { type: "subscription_details", subscription_details: { subscription: "sub_live", metadata } },
        lines: { data: [] },
      },
    });
    expect(normalizeStripeClinicSubscriptionSignal(event, JSON.stringify(event))).toMatchObject({
      kind: "invoice_failed",
      amountCents: 79_900,
      externalSubscriptionId: "sub_live",
      periodStartsAt: null,
      periodEndsAt: null,
    });
  });

  it("correlates signed subscription deletion through the same opaque metadata without payment data", () => {
    const event = stripeEvent({
      type: "customer.subscription.deleted",
      id: "evt_subscription_deleted",
      object: { id: "sub_live", customer: "cus_live", metadata },
    });
    expect(normalizeStripeClinicSubscriptionSignal(event, JSON.stringify(event))).toMatchObject({
      kind: "subscription_deleted",
      stripeEventId: "evt_subscription_deleted",
      productKey: "clinic_core",
      externalSubscriptionId: "sub_live",
      amountCents: null,
      currency: null,
    });
  });
});
