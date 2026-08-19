import Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { recordEvidence, reconcileSalesPayment, processRecurring } = vi.hoisted(() => ({
  recordEvidence: vi.fn(),
  reconcileSalesPayment: vi.fn(),
  processRecurring: vi.fn(),
}));

vi.mock("@/lib/commercial/payment-evidence-repository", () => ({
  recordCommercialPaymentEvidence: recordEvidence,
}));

vi.mock("@/lib/commercial/sales-payment-fulfillment", () => ({
  reconcileVerifiedAnalysisPayment: reconcileSalesPayment,
}));

vi.mock("@/lib/commercial/stripe-clinic-subscriptions", () => ({
  StripeClinicSubscriptionError: class StripeClinicSubscriptionError extends Error {
    constructor(message: string, readonly status = 400) {
      super(message);
    }
  },
  processVerifiedStripeClinicSubscriptionEvent: processRecurring,
}));

import { POST } from "@/app/api/webhooks/stripe/route";

const webhookSecret = "whsec_sales_fulfillment_test";
const signer = new Stripe("sk_test_sales_fulfillment");

function signedCheckoutRequest(paymentStatus = "paid") {
  const payload = {
    id: `evt_analysis_${paymentStatus}`,
    object: "event",
    type: "checkout.session.completed",
    livemode: true,
    data: {
      object: {
        id: "cs_analysis_live",
        object: "checkout.session",
        mode: "payment",
        payment_status: paymentStatus,
        amount_total: 50_000,
        currency: "usd",
        client_reference_id: "intent_analysis_opaque",
        metadata: {
          klinikos_checkout_intent_id: "intent_analysis_opaque",
          klinikos_checkout_state: "state_analysis_opaque",
        },
        payment_intent: "pi_analysis_live",
        customer: "cus_analysis_live",
      },
    },
  };
  const raw = JSON.stringify(payload);
  const signature = signer.webhooks.generateTestHeaderString({ payload: raw, secret: webhookSecret });
  return new Request("https://klinikos.io/api/webhooks/stripe", {
    method: "POST",
    body: raw,
    headers: { "content-type": "application/json", "stripe-signature": signature },
  });
}

describe("Stripe -> Clinic Operating Analysis fulfillment bridge", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_live_sales_fulfillment";
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
    recordEvidence.mockReset();
    reconcileSalesPayment.mockReset();
    processRecurring.mockReset();
    processRecurring.mockResolvedValue(null);
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("advances fulfillment only after applied signed processor success", async () => {
    recordEvidence.mockResolvedValue({
      status: "applied",
      idempotent: false,
      organizationId: "org_sales_owner",
      eventId: "commercial_payment_event_1",
    });
    reconcileSalesPayment.mockResolvedValue({
      status: "reserved",
      reservationId: "reservation_1",
      reservationStatus: "reserved",
    });

    const response = await POST(signedCheckoutRequest("paid"));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      received: true,
      supported: true,
      status: "applied",
      salesFulfillment: "reserved",
    });
    expect(reconcileSalesPayment).toHaveBeenCalledOnce();
    expect(reconcileSalesPayment).toHaveBeenCalledWith({
      checkoutIntentId: "intent_analysis_opaque",
      organizationId: "org_sales_owner",
      paymentEventId: "commercial_payment_event_1",
      provider: "stripe",
      amountCents: 50_000,
    });
  });

  it("does not advance fulfillment while signed Checkout is still pending", async () => {
    recordEvidence.mockResolvedValue({
      status: "ignored",
      idempotent: false,
      organizationId: "org_sales_owner",
      eventId: "commercial_payment_event_pending",
    });

    const response = await POST(signedCheckoutRequest("unpaid"));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      received: true,
      supported: true,
      status: "ignored",
      salesFulfillment: null,
    });
    expect(reconcileSalesPayment).not.toHaveBeenCalled();
  });

  it("acknowledges real collected money even when reservation fulfillment needs reconciliation", async () => {
    recordEvidence.mockResolvedValue({
      status: "applied",
      idempotent: false,
      organizationId: "org_sales_owner",
      eventId: "commercial_payment_event_2",
    });
    reconcileSalesPayment.mockResolvedValue({ status: "reconciliation_required" });

    const response = await POST(signedCheckoutRequest("paid"));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      received: true,
      supported: true,
      status: "applied",
      salesFulfillment: "reconciliation_required",
    });
  });
});
