import Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { recordEvidence } = vi.hoisted(() => ({ recordEvidence: vi.fn() }));

vi.mock("@/lib/commercial/payment-evidence-repository", () => ({
  recordCommercialPaymentEvidence: recordEvidence,
}));

import { POST } from "@/app/api/webhooks/stripe/route";

const webhookSecret = "whsec_unit_test_only";
const signer = new Stripe("sk_test_unit_test_only");

function signedRequest(payload: Record<string, unknown>, signatureOverride?: string) {
  const raw = JSON.stringify(payload);
  const signature = signatureOverride ?? signer.webhooks.generateTestHeaderString({ payload: raw, secret: webhookSecret });
  return new Request("https://klinikos.io/api/webhooks/stripe", {
    method: "POST",
    body: raw,
    headers: { "content-type": "application/json", "stripe-signature": signature },
  });
}

function checkoutEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_checkout_paid",
    object: "event",
    type: "checkout.session.completed",
    livemode: true,
    data: {
      object: {
        id: "cs_live_checkout",
        object: "checkout.session",
        mode: "payment",
        payment_status: "paid",
        amount_total: 50_000,
        currency: "usd",
        client_reference_id: "intent_opaque",
        metadata: {
          klinikos_checkout_intent_id: "intent_opaque",
          klinikos_checkout_state: "state_opaque",
        },
        payment_intent: "pi_live_payment",
        customer: "cus_live_customer",
        customer_details: { email: "private@example.test", name: "Private Buyer" },
        description: "must never be persisted",
      },
    },
    ...overrides,
  };
}

describe("Stripe live webhook boundary", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_live_unit_test_only";
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
    recordEvidence.mockReset();
    recordEvidence.mockResolvedValue({ status: "applied", idempotent: false });
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("accepts a valid signed live Checkout event and records sanitized processor evidence", async () => {
    const response = await POST(signedRequest(checkoutEvent()));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ received: true, supported: true, status: "applied" });
    expect(recordEvidence).toHaveBeenCalledOnce();
    const input = recordEvidence.mock.calls[0][0];
    expect(input).toMatchObject({
      provider: "stripe",
      eventId: "evt_checkout_paid",
      eventType: "checkout.session.completed",
      verified: true,
      processorVerified: true,
      processorMode: "live",
      outcome: "succeeded",
      checkoutIntentId: "intent_opaque",
      externalCheckoutId: "cs_live_checkout",
      externalPaymentIntentId: "pi_live_payment",
      amountCents: 50_000,
      currency: "usd",
    });
    expect(JSON.stringify(input.payload)).not.toMatch(/private@example|Private Buyer|description/i);
  });

  it("rejects an invalid Stripe signature", async () => {
    const response = await POST(signedRequest(checkoutEvent(), "t=1,v1=invalid"));
    expect(response.status).toBe(400);
    expect(recordEvidence).not.toHaveBeenCalled();
  });

  it("rejects an unsigned browser-forged success payload", async () => {
    const response = await POST(new Request("https://klinikos.io/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify(checkoutEvent()),
      headers: { "content-type": "application/json" },
    }));
    expect(response.status).toBe(400);
    expect(recordEvidence).not.toHaveBeenCalled();
  });

  it("returns the idempotent repository result for a replayed Stripe event", async () => {
    recordEvidence
      .mockResolvedValueOnce({ status: "applied", idempotent: false })
      .mockResolvedValueOnce({ status: "applied", idempotent: true });
    expect((await POST(signedRequest(checkoutEvent()))).status).toBe(200);
    const replay = await POST(signedRequest(checkoutEvent()));
    expect(await replay.json()).toMatchObject({ received: true, status: "applied", idempotent: true });
  });

  it("rejects a correctly signed test-mode event at the live endpoint", async () => {
    const response = await POST(signedRequest(checkoutEvent({ livemode: false })));
    expect(response.status).toBe(409);
    expect(recordEvidence).not.toHaveBeenCalled();
  });

  it("records payment failure as failure evidence rather than paid evidence", async () => {
    recordEvidence.mockResolvedValue({ status: "failed", idempotent: false });
    const response = await POST(signedRequest({
      id: "evt_payment_failed",
      object: "event",
      type: "payment_intent.payment_failed",
      livemode: true,
      data: { object: {
        id: "pi_live_failed",
        object: "payment_intent",
        amount: 50_000,
        currency: "usd",
        customer: null,
        status: "requires_payment_method",
        metadata: { klinikos_checkout_intent_id: "intent_opaque", klinikos_checkout_state: "state_opaque" },
      } },
    }));
    expect(response.status).toBe(200);
    expect(recordEvidence.mock.calls[0][0]).toMatchObject({ outcome: "failed", processorMode: "live" });
  });

  it("records a pending dynamic-method Checkout without representing it as paid", async () => {
    recordEvidence.mockResolvedValue({ status: "ignored", idempotent: false });
    const event = checkoutEvent();
    (event.data.object as Record<string, unknown>).payment_status = "unpaid";
    const response = await POST(signedRequest(event));
    expect(response.status).toBe(200);
    expect(recordEvidence.mock.calls[0][0]).toMatchObject({ outcome: "pending", externalCheckoutId: "cs_live_checkout" });
  });

  it("accepts the dynamic-method async success event through the same signed boundary", async () => {
    const response = await POST(signedRequest(checkoutEvent({ type: "checkout.session.async_payment_succeeded" })));
    expect(response.status).toBe(200);
    expect(recordEvidence.mock.calls[0][0]).toMatchObject({
      eventType: "checkout.session.async_payment_succeeded",
      outcome: "succeeded",
      checkoutIntentId: "intent_opaque",
    });
  });

  it("keeps a dynamic-method async failure unpaid through the same signed boundary", async () => {
    recordEvidence.mockResolvedValue({ status: "failed", idempotent: false });
    const response = await POST(signedRequest(checkoutEvent({ type: "checkout.session.async_payment_failed" })));
    expect(response.status).toBe(200);
    expect(recordEvidence.mock.calls[0][0]).toMatchObject({
      eventType: "checkout.session.async_payment_failed",
      outcome: "failed",
      checkoutIntentId: "intent_opaque",
    });
  });

  it("records refund evidence without representing it as a new payment", async () => {
    const response = await POST(signedRequest({
      id: "evt_charge_refunded",
      object: "event",
      type: "charge.refunded",
      livemode: true,
      data: { object: {
        id: "ch_live_refund",
        object: "charge",
        amount_refunded: 50_000,
        currency: "usd",
        refunded: true,
        payment_intent: "pi_live_payment",
        customer: "cus_live_customer",
        metadata: {
          klinikos_checkout_intent_id: "intent_opaque",
          klinikos_checkout_state: "state_opaque",
        },
      } },
    }));
    expect(response.status).toBe(200);
    expect(recordEvidence.mock.calls[0][0]).toMatchObject({
      outcome: "refunded",
      checkoutIntentId: "intent_opaque",
      checkoutState: "state_opaque",
      externalPaymentIntentId: "pi_live_payment",
    });
  });

  it("asks Stripe to retry when signed evidence cannot yet be durably correlated", async () => {
    recordEvidence.mockRejectedValueOnce(new Error("waiting for checkout intent"));
    const response = await POST(signedRequest({
      id: "evt_refund_retry",
      object: "event",
      type: "charge.refunded",
      livemode: true,
      data: { object: {
        id: "ch_live_refund_retry",
        object: "charge",
        amount_refunded: 50_000,
        currency: "usd",
        refunded: true,
        payment_intent: "pi_live_waiting",
        customer: null,
        metadata: {},
      } },
    }));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error: "Stripe evidence could not be recorded." });
  });
});
