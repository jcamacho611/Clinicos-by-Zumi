import Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { recordCommercialEvidence, recordLuxeDeposit, recordLuxeRefund, processRecurring } = vi.hoisted(() => ({
  recordCommercialEvidence: vi.fn(),
  recordLuxeDeposit: vi.fn(),
  recordLuxeRefund: vi.fn(),
  processRecurring: vi.fn(),
}));

vi.mock("@/lib/commercial/payment-evidence-repository", () => ({
  recordCommercialPaymentEvidence: recordCommercialEvidence,
}));

vi.mock("@/lib/repositories/luxe-processor-payment-evidence-repository", () => ({
  recordProcessorVerifiedLuxeStripeDeposit: recordLuxeDeposit,
}));

vi.mock("@/lib/repositories/luxe-refund-evidence-repository", () => ({
  recordProcessorVerifiedLuxeStripeRefund: recordLuxeRefund,
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
const luxeMetadata = {
  klinikos_sale_mode: "luxe_deposit",
  klinikos_luxe_journey: "opaque-journey-token",
  klinikos_luxe_expected_amount_cents: "15000",
  klinikos_luxe_payment_kind: "deposit",
};

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
        metadata: luxeMetadata,
        ...overrides,
      },
    },
  };
}

function luxeRefundEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_live_luxe_refund",
    object: "event",
    type: "charge.refunded",
    livemode: true,
    created: 1787079600,
    data: {
      object: {
        id: "ch_live_luxe_deposit",
        object: "charge",
        amount: 15_000,
        amount_refunded: 5_000,
        currency: "usd",
        payment_intent: "pi_live_luxe_deposit",
        metadata: luxeMetadata,
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
    recordLuxeRefund.mockReset();
    processRecurring.mockReset();
    recordLuxeDeposit.mockResolvedValue({
      recorded: true,
      idempotent: false,
      evidenceId: "evidence-1",
      paymentStatus: "processor_verified",
      bookingStatus: "started",
      taskId: "task-1",
    });
    recordLuxeRefund.mockResolvedValue({
      recorded: true,
      idempotent: false,
      evidenceId: "refund-evidence-1",
      amountRefundedCents: 5_000,
      paymentStatus: "partially_refunded",
      taskId: "task-refund-1",
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
    expect(recordLuxeRefund).not.toHaveBeenCalled();
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

  it("routes a signed partial refund into the Luxe refund evidence processor only", async () => {
    const response = await POST(signedRequest(luxeRefundEvent()));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      received: true,
      supported: true,
      luxeDepositRefund: true,
      amountRefundedCents: 5_000,
      paymentStatus: "partially_refunded",
      idempotent: false,
    });
    expect(recordLuxeRefund).toHaveBeenCalledOnce();
    expect(recordLuxeRefund.mock.calls[0][0]).toMatchObject({
      journeyToken: "opaque-journey-token",
      eventId: "evt_live_luxe_refund",
      externalReference: "ch_live_luxe_deposit",
      paymentExternalReference: "pi_live_luxe_deposit",
      amountRefundedCents: 5_000,
      originalAmountCents: 15_000,
      currency: "USD",
    });
    expect(recordLuxeDeposit).not.toHaveBeenCalled();
    expect(recordCommercialEvidence).not.toHaveBeenCalled();
    expect(processRecurring).not.toHaveBeenCalled();
  });

  it("routes a full refund without claiming the booking was cancelled", async () => {
    recordLuxeRefund.mockResolvedValueOnce({
      recorded: true,
      idempotent: false,
      evidenceId: "refund-evidence-full",
      amountRefundedCents: 15_000,
      paymentStatus: "refunded",
      taskId: "task-refund-full",
    });
    const response = await POST(signedRequest(luxeRefundEvent({ amount_refunded: 15_000 })));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ paymentStatus: "refunded", amountRefundedCents: 15_000 });
    expect(recordCommercialEvidence).not.toHaveBeenCalled();
  });

  it("returns idempotent refund evidence truth for a replay", async () => {
    recordLuxeRefund.mockResolvedValueOnce({
      recorded: true,
      idempotent: true,
      evidenceId: "refund-evidence-1",
      amountRefundedCents: 5_000,
      paymentStatus: "partially_refunded",
    });
    const response = await POST(signedRequest(luxeRefundEvent()));
    expect(await response.json()).toMatchObject({ luxeDepositRefund: true, idempotent: true });
  });

  it("rejects inconsistent signed refund amounts before the repository", async () => {
    const response = await POST(signedRequest(luxeRefundEvent({ amount_refunded: 15_001 })));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error: "Luxe Stripe refund evidence could not be processed." });
    expect(recordLuxeRefund).not.toHaveBeenCalled();
    expect(recordCommercialEvidence).not.toHaveBeenCalled();
  });
});
