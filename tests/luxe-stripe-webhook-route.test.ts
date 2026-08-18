import Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { recordCommercialEvidence, recordLuxeDeposit, processRecurring } = vi.hoisted(() => ({
  recordCommercialEvidence: vi.fn(),
  recordLuxeDeposit: vi.fn(),
  processRecurring: vi.fn(),
}));

vi.mock("@/lib/commercial/payment-evidence-repository", () => ({
  recordCommercialPaymentEvidence: recordCommercialEvidence,
}));

vi.mock("@/lib/repositories/luxe-processor-payment-evidence-repository", () => ({
  recordProcessorVerifiedLuxeStripeDeposit: recordLuxeDeposit,
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

const webhookSecret = "whsec_luxe_unit_test_only";
const signer = new Stripe("sk_test_luxe_unit_test_only");

function signedRequest(payload: Record<string, unknown>) {
  const raw = JSON.stringify(payload);
  const signature = signer.webhooks.generateTestHeaderString({ payload: raw, secret: webhookSecret });
  return new Request("https://klinikos.io/api/webhooks/stripe", {
    method: "POST",
    body: raw,
    headers: { "content-type": "application/json", "stripe-signature": signature },
  });
}

function luxeDepositEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_live_luxe_deposit",
    object: "event",
    type: "checkout.session.completed",
    livemode: true,
    created: 1787079000,
    data: {
      object: {
        id: "cs_live_luxe_deposit",
        object: "checkout.session",
        mode: "payment",
        payment_status: "paid",
        amount_total: 15_000,
        currency: "usd",
        payment_intent: "pi_live_luxe_deposit",
        customer: null,
        metadata: {
          klinikos_sale_mode: "luxe_deposit",
          klinikos_luxe_journey: "opaque-journey-token",
          klinikos_luxe_expected_amount_cents: "15000",
          klinikos_luxe_payment_kind: "deposit",
        },
        ...overrides,
      },
    },
  };
}

describe("Luxe Stripe deposit webhook routing", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_live_unit_test_only";
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
    recordCommercialEvidence.mockReset();
    recordLuxeDeposit.mockReset();
    processRecurring.mockReset();
    recordLuxeDeposit.mockResolvedValue({
      recorded: true,
      idempotent: false,
      evidenceId: "evidence-1",
      paymentStatus: "processor_verified",
      bookingStatus: "started",
      taskId: "task-1",
    });
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("routes a signed Luxe deposit into the Luxe evidence processor only", async () => {
    const response = await POST(signedRequest(luxeDepositEvent()));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      received: true,
      supported: true,
      luxeDeposit: true,
      outcome: "succeeded",
      recorded: true,
      idempotent: false,
    });
    expect(recordLuxeDeposit).toHaveBeenCalledOnce();
    expect(recordLuxeDeposit.mock.calls[0][0]).toMatchObject({
      outcome: "succeeded",
      journeyToken: "opaque-journey-token",
      eventId: "evt_live_luxe_deposit",
      externalReference: "pi_live_luxe_deposit",
      alternateExternalReference: "cs_live_luxe_deposit",
      amountCents: 15_000,
      currency: "USD",
    });
    expect(recordCommercialEvidence).not.toHaveBeenCalled();
    expect(processRecurring).not.toHaveBeenCalled();
  });

  it("keeps an unpaid Luxe Checkout event out of paid evidence", async () => {
    recordLuxeDeposit.mockResolvedValueOnce({ recorded: false, outcome: "pending" });
    const response = await POST(signedRequest(luxeDepositEvent({ payment_status: "unpaid" })));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ luxeDeposit: true, outcome: "pending", recorded: false });
    expect(recordLuxeDeposit.mock.calls[0][0]).toMatchObject({ outcome: "pending" });
    expect(recordCommercialEvidence).not.toHaveBeenCalled();
  });

  it("does not accept a signed Luxe event whose amount differs from server-created metadata", async () => {
    const response = await POST(signedRequest(luxeDepositEvent({ amount_total: 14_999 })));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error: "Luxe Stripe deposit evidence could not be processed." });
    expect(recordLuxeDeposit).not.toHaveBeenCalled();
    expect(recordCommercialEvidence).not.toHaveBeenCalled();
  });

  it("asks Stripe to retry when durable Luxe correlation needs human reconciliation", async () => {
    const { NetworkAccessError } = await import("@/lib/repositories/network-access-error");
    recordLuxeDeposit.mockRejectedValueOnce(new NetworkAccessError("conflict", 409));
    const response = await POST(signedRequest(luxeDepositEvent()));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "Luxe Stripe deposit evidence needs reconciliation before it can be attributed." });
    expect(recordCommercialEvidence).not.toHaveBeenCalled();
  });
});
