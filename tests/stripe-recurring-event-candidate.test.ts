import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { isKlinikosRecurringStripeEventCandidate } from "@/lib/commercial/stripe-recurring-event-candidate";

function event(type: string, object: Record<string, unknown>) {
  return { id: "evt_test", object: "event", type, livemode: true, data: { object } } as unknown as Stripe.Event;
}

describe("Stripe recurring event candidate filter", () => {
  it("ignores unrelated account invoices so the webhook does not create retry storms", () => {
    expect(isKlinikosRecurringStripeEventCandidate(event("invoice.paid", {
      id: "in_unrelated",
      parent: { type: "subscription_details", subscription_details: { subscription: "sub_other", metadata: {} } },
    }))).toBe(false);
  });

  it("treats even partially tagged Klinikos recurring metadata as ours so malformed events fail closed", () => {
    expect(isKlinikosRecurringStripeEventCandidate(event("invoice.paid", {
      id: "in_partial",
      parent: {
        type: "subscription_details",
        subscription_details: { metadata: { klinikos_checkout_intent_id: "intent_only" } },
      },
    }))).toBe(true);
  });

  it("recognizes subscription deletion only when Klinikos correlation metadata is present", () => {
    expect(isKlinikosRecurringStripeEventCandidate(event("customer.subscription.deleted", {
      id: "sub_other",
      metadata: {},
    }))).toBe(false);
    expect(isKlinikosRecurringStripeEventCandidate(event("customer.subscription.deleted", {
      id: "sub_klinikos",
      metadata: { klinikos_product_key: "clinic_core" },
    }))).toBe(true);
  });
});
