import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import {
  isLuxeStripeDepositEvent,
  luxeStripeDepositStatus,
  normalizeVerifiedLuxeStripeDepositEvent,
} from "@/lib/luxe-stripe-deposit";

function checkoutEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_live_luxe_deposit",
    type: "checkout.session.completed",
    livemode: true,
    created: 1787079000,
    data: {
      object: {
        id: "cs_live_luxe_deposit",
        mode: "payment",
        payment_status: "paid",
        amount_total: 15000,
        currency: "usd",
        payment_intent: "pi_live_luxe_deposit",
        metadata: {
          klinikos_sale_mode: "luxe_deposit",
          klinikos_luxe_journey: "opaque-journey-token",
          klinikos_luxe_expected_amount_cents: "15000",
          klinikos_luxe_payment_kind: "deposit",
        },
        ...overrides,
      },
    },
  } as unknown as Stripe.Event;
}

describe("Luxe Stripe deposit adapter", () => {
  it("stays unavailable until live Stripe verification and a server-owned amount are configured", () => {
    expect(luxeStripeDepositStatus({} as NodeJS.ProcessEnv).available).toBe(false);
    const configured = luxeStripeDepositStatus({
      STRIPE_SECRET_KEY: "sk_live_example",
      STRIPE_WEBHOOK_SECRET: "whsec_example",
      LUXE_MEDI_STRIPE_DEPOSIT_CENTS: "15000",
    } as NodeJS.ProcessEnv);
    expect(configured.available).toBe(true);
    expect(configured.publicCheckoutAvailable).toBe(false);
    expect(configured.amountCents).toBe(15000);
  });

  it("requires an explicit opt-in before exposing immediate public deposit checkout", () => {
    const configured = luxeStripeDepositStatus({
      STRIPE_SECRET_KEY: "sk_live_example",
      STRIPE_WEBHOOK_SECRET: "whsec_example",
      LUXE_MEDI_STRIPE_DEPOSIT_CENTS: "15000",
      LUXE_MEDI_STRIPE_DEPOSIT_PUBLIC_ENABLED: "true",
    } as NodeJS.ProcessEnv);
    expect(configured.publicCheckoutAvailable).toBe(true);
  });

  it("recognizes only explicitly tagged Luxe deposit checkout events", () => {
    expect(isLuxeStripeDepositEvent(checkoutEvent())).toBe(true);
    expect(isLuxeStripeDepositEvent(checkoutEvent({ metadata: {} }))).toBe(false);
  });

  it("normalizes a paid live Checkout event without exposing booking authority", () => {
    const normalized = normalizeVerifiedLuxeStripeDepositEvent(checkoutEvent());
    expect(normalized.outcome).toBe("succeeded");
    expect(normalized.externalReference).toBe("pi_live_luxe_deposit");
    expect(normalized.alternateExternalReference).toBe("cs_live_luxe_deposit");
    expect(normalized.amountCents).toBe(15000);
    expect(normalized.currency).toBe("USD");
    expect("bookingStatus" in normalized).toBe(false);
  });

  it("does not call an unpaid completed Checkout session successful", () => {
    const normalized = normalizeVerifiedLuxeStripeDepositEvent(checkoutEvent({ payment_status: "unpaid" }));
    expect(normalized.outcome).toBe("pending");
  });

  it("rejects amount tampering against server-created signed metadata", () => {
    expect(() => normalizeVerifiedLuxeStripeDepositEvent(checkoutEvent({ amount_total: 14999 }))).toThrow(/amount/i);
  });

  it("rejects test-mode evidence even when it carries Luxe metadata", () => {
    const event = checkoutEvent() as unknown as { livemode: boolean };
    event.livemode = false;
    expect(() => normalizeVerifiedLuxeStripeDepositEvent(event as unknown as Stripe.Event)).toThrow(/Test-mode/i);
  });
});
