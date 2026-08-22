import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import {
  isLuxeStripeDepositEvent,
  isLuxeStripeDepositRefundEvent,
  luxeStripeDepositStatus,
  normalizeVerifiedLuxeStripeDepositEvent,
  normalizeVerifiedLuxeStripeRefundEvent,
} from "@/lib/luxe-stripe-deposit";

const luxeMetadata = {
  klinikos_sale_mode: "luxe_deposit",
  klinikos_luxe_journey: "opaque-journey-token",
  klinikos_luxe_expected_amount_cents: "15000",
  klinikos_luxe_payment_kind: "deposit",
};

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
        metadata: luxeMetadata,
        ...overrides,
      },
    },
  } as unknown as Stripe.Event;
}

function refundEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_live_luxe_refund",
    type: "charge.refunded",
    livemode: true,
    created: 1787079600,
    data: {
      object: {
        id: "ch_live_luxe_deposit",
        amount: 15000,
        amount_refunded: 5000,
        currency: "usd",
        payment_intent: "pi_live_luxe_deposit",
        metadata: luxeMetadata,
        ...overrides,
      },
    },
  } as unknown as Stripe.Event;
}

describe("Luxe Stripe deposit adapter", () => {
  it("stays unavailable until live Stripe verification and a server-owned amount are configured", () => {
    expect(luxeStripeDepositStatus({} as unknown as NodeJS.ProcessEnv).available).toBe(false);
    const configured = luxeStripeDepositStatus({
      STRIPE_SECRET_KEY: "sk_live_example",
      STRIPE_WEBHOOK_SECRET: "whsec_example",
      LUXE_MEDI_STRIPE_DEPOSIT_CENTS: "15000",
    } as unknown as NodeJS.ProcessEnv);
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
    } as unknown as NodeJS.ProcessEnv);
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

  it("rejects test-mode payment evidence even when it carries Luxe metadata", () => {
    const event = checkoutEvent() as unknown as { livemode: boolean };
    event.livemode = false;
    expect(() => normalizeVerifiedLuxeStripeDepositEvent(event as unknown as Stripe.Event)).toThrow(/Test-mode/i);
  });

  it("recognizes and normalizes a signed partial refund as cumulative refund evidence", () => {
    expect(isLuxeStripeDepositRefundEvent(refundEvent())).toBe(true);
    const normalized = normalizeVerifiedLuxeStripeRefundEvent(refundEvent());
    expect(normalized).toMatchObject({
      externalReference: "ch_live_luxe_deposit",
      paymentExternalReference: "pi_live_luxe_deposit",
      amountRefundedCents: 5000,
      originalAmountCents: 15000,
      currency: "USD",
      journeyToken: "opaque-journey-token",
    });
  });

  it("normalizes a full refund without treating it as booking cancellation", () => {
    const normalized = normalizeVerifiedLuxeStripeRefundEvent(refundEvent({ amount_refunded: 15000 }));
    expect(normalized.amountRefundedCents).toBe(15000);
    expect("bookingStatus" in normalized).toBe(false);
    expect("bookingCancelled" in normalized).toBe(false);
  });

  it("rejects refund amount or charge amount inconsistencies", () => {
    expect(() => normalizeVerifiedLuxeStripeRefundEvent(refundEvent({ amount_refunded: 15001 }))).toThrow(/refunded amount/i);
    expect(() => normalizeVerifiedLuxeStripeRefundEvent(refundEvent({ amount: 14000 }))).toThrow(/charge amount/i);
  });

  it("rejects test-mode refund evidence", () => {
    const event = refundEvent() as unknown as { livemode: boolean };
    event.livemode = false;
    expect(() => normalizeVerifiedLuxeStripeRefundEvent(event as unknown as Stripe.Event)).toThrow(/Test-mode/i);
  });
});
