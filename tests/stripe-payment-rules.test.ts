import { describe, expect, it } from "vitest";
import {
  type CheckoutIntentRow,
  type CommercialPaymentEvidenceInput,
  validateProcessorEvidenceAgainstIntent,
} from "@/lib/commercial/payment-evidence-repository";
import { normalizeCommercialReturnUrl } from "@/lib/commercial/checkout-service";
import {
  buildStripeCheckoutSessionParams,
  stripeLivePaymentStatus,
} from "@/lib/commercial/payment-connectors/stripe";
import { getCommercialProduct } from "@/lib/commercial/product-catalog";
import {
  paymentReadinessFromSignals,
  STRIPE_LIVE_PAYMENT_SUCCESS_EVENTS,
} from "@/lib/readiness/production-readiness";

const intent: CheckoutIntentRow = {
  id: "intent_opaque",
  state: "state_opaque",
  provider: "stripe",
  productKey: "operational_audit",
  email: "buyer@example.test",
  organizationId: "org_a",
  status: "created",
  expiresAt: new Date(Date.now() + 60_000),
  amountCents: 50_000,
  currency: "USD",
  processorMode: "live",
  externalCheckoutId: "cs_live_checkout",
  externalPaymentIntentId: null,
  refundedAmountCents: 0,
};

const evidence: CommercialPaymentEvidenceInput = {
  provider: "stripe",
  eventId: "evt_live_paid",
  eventType: "checkout.session.completed",
  verified: true,
  verificationMethod: "webhook_signature",
  processorVerified: true,
  processorMode: "live",
  outcome: "succeeded",
  payloadHash: "hash",
  payload: { stripeObjectId: "cs_live_checkout" },
  checkoutIntentId: intent.id,
  checkoutState: intent.state,
  externalCheckoutId: intent.externalCheckoutId,
  externalPaymentIntentId: "pi_live_payment",
  amountCents: 50_000,
  currency: "usd",
};

describe("Stripe payment truth rules", () => {
  it("accepts exact live processor evidence for one open server-owned intent", () => {
    expect(validateProcessorEvidenceAgainstIntent(evidence, intent)).toBeNull();
  });

  it("accepts delayed delivery of a signed completion for the exact server-expiring Checkout Session", () => {
    expect(validateProcessorEvidenceAgainstIntent(evidence, { ...intent, expiresAt: new Date(Date.now() - 1_000) })).toBeNull();
  });

  it("refuses an incorrect Stripe amount", () => {
    expect(validateProcessorEvidenceAgainstIntent({ ...evidence, amountCents: 49_999 }, intent)).toMatch(/amount/i);
  });

  it("refuses an incorrect Stripe currency", () => {
    expect(validateProcessorEvidenceAgainstIntent({ ...evidence, currency: "cad" }, intent)).toMatch(/currency/i);
    expect(validateProcessorEvidenceAgainstIntent({ ...evidence, currency: null }, intent)).toMatch(/missing.*currency/i);
  });

  it("refuses a cross-tenant organization reference", () => {
    expect(validateProcessorEvidenceAgainstIntent({ ...evidence, organizationId: "org_b" }, intent)).toMatch(/organization/i);
  });

  it("refuses test-mode evidence for a live checkout intent", () => {
    expect(validateProcessorEvidenceAgainstIntent({ ...evidence, processorMode: "test" }, intent)).toMatch(/mode/i);
  });

  it("refuses a different Checkout Session even when amount and currency match", () => {
    expect(validateProcessorEvidenceAgainstIntent({ ...evidence, externalCheckoutId: "cs_live_other" }, intent)).toMatch(/session/i);
  });

  it("refuses contradictory opaque references or a success without a PaymentIntent", () => {
    expect(validateProcessorEvidenceAgainstIntent({ ...evidence, checkoutState: "state_other" }, intent)).toMatch(/state/i);
    expect(validateProcessorEvidenceAgainstIntent({ ...evidence, externalPaymentIntentId: null }, intent)).toMatch(/PaymentIntent/i);
  });

  it("accepts only a bounded refund tied to the completed PaymentIntent", () => {
    const paidIntent = { ...intent, status: "completed", externalPaymentIntentId: "pi_live_payment" };
    expect(validateProcessorEvidenceAgainstIntent({
      ...evidence,
      eventId: "evt_refund",
      eventType: "charge.refunded",
      outcome: "refunded",
      externalCheckoutId: null,
      amountCents: 25_000,
    }, paidIntent)).toBeNull();
    expect(validateProcessorEvidenceAgainstIntent({
      ...evidence,
      outcome: "refunded",
      externalCheckoutId: null,
      externalPaymentIntentId: "pi_live_other",
      amountCents: 25_000,
    }, paidIntent)).toMatch(/PaymentIntent/i);
  });

  it("accepts an out-of-order signed refund when opaque metadata binds it to the open intent", () => {
    expect(validateProcessorEvidenceAgainstIntent({
      ...evidence,
      eventId: "evt_refund_first",
      eventType: "charge.refunded",
      outcome: "refunded",
      externalCheckoutId: null,
      amountCents: 50_000,
    }, intent)).toBeNull();
  });

  it("keeps Stripe metadata opaque and derives the amount from the server-owned request", () => {
    const product = getCommercialProduct("operational_audit");
    expect(product).toBeTruthy();
    const expiresAt = new Date(Date.now() + 35 * 60 * 1000);
    const params = buildStripeCheckoutSessionParams({
      product: product!,
      organizationId: "org_a",
      email: "buyer@example.test",
      state: "state_opaque",
      intentId: "intent_opaque",
      amountCents: 50_000,
      currency: "USD",
      processorMode: "live",
      expiresAt,
      returnUrl: "https://klinikos.io/payments/success",
    });
    expect(params.line_items?.[0]).toMatchObject({ quantity: 1, price_data: { currency: "usd", unit_amount: 50_000 } });
    expect(params.payment_method_types).toBeUndefined();
    expect(params.expires_at).toBe(Math.floor(expiresAt.getTime() / 1000));
    expect(params.integration_identifier).toMatch(/^klinikos_clinic_analysis_[a-z]{8}$/);
    expect(params.metadata).toEqual({
      klinikos_checkout_intent_id: "intent_opaque",
      klinikos_checkout_state: "state_opaque",
    });
    expect(params.payment_intent_data?.metadata).toEqual(params.metadata);
    expect(JSON.stringify(params.metadata)).not.toMatch(/buyer|email|clinic|patient|provider/i);
  });

  it("does not report live processor verification from a key alone or from a test key", () => {
    expect(stripeLivePaymentStatus({ NODE_ENV: "test", STRIPE_SECRET_KEY: "sk_live_placeholder" } as NodeJS.ProcessEnv).processorVerification).toBe(false);
    expect(stripeLivePaymentStatus({
      NODE_ENV: "test",
      STRIPE_SECRET_KEY: "sk_test_placeholder",
      STRIPE_WEBHOOK_SECRET: "whsec_placeholder",
    } as NodeJS.ProcessEnv).checkoutConfigured).toBe(false);
    expect(stripeLivePaymentStatus({
      NODE_ENV: "test",
      STRIPE_SECRET_KEY: "sk_live_placeholder",
      STRIPE_WEBHOOK_SECRET: "whsec_placeholder",
    } as NodeJS.ProcessEnv).processorVerification).toBe(true);
    const configuredStripe = stripeLivePaymentStatus({
      NODE_ENV: "test",
      STRIPE_SECRET_KEY: "rk_live_placeholder",
      STRIPE_WEBHOOK_SECRET: "whsec_placeholder",
    } as NodeJS.ProcessEnv);
    expect(configuredStripe.processorVerification).toBe(true);
    expect(paymentReadinessFromSignals({
      stripe: configuredStripe,
      verifiedLivePayment: false,
      goDaddy: { key: "godaddy", checkoutConfigured: true, webhookConfigured: false, processorVerification: false, missing: [] },
      planStatus: { configuredPlanKeys: ["clinic_core", "clinic_growth", "clinic_scale"], missing: [], allConfigured: true },
    }).state).toBe("PENDING_CONNECTION");
  });

  it("recognizes both immediate and asynchronous signed Checkout success as live-rail evidence", () => {
    expect(STRIPE_LIVE_PAYMENT_SUCCESS_EVENTS).toEqual([
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
    ]);
  });

  it("rebuilds checkout returns on the configured Klinikos origin", () => {
    const env = { NODE_ENV: "production", NEXT_PUBLIC_APP_URL: "https://klinikos.io" } as NodeJS.ProcessEnv;
    expect(normalizeCommercialReturnUrl("https://attacker.example/payments/success?state=opaque", env)).toBe("https://klinikos.io/payments/success?state=opaque");
    expect(normalizeCommercialReturnUrl("https://attacker.example//other.example/escape", env)).toBe("https://klinikos.io//other.example/escape");
    expect(() => normalizeCommercialReturnUrl("javascript:alert(1)", env)).toThrow(/HTTP or HTTPS/i);
  });

  it("preserves authorized late GoDaddy reconciliation without weakening amount checks", () => {
    const manualEvidence = {
      ...evidence,
      provider: "godaddy",
      processorVerified: false,
      processorMode: "manual",
      verificationMethod: "manual_reconciliation",
    } as CommercialPaymentEvidenceInput;
    const lateIntent = { ...intent, provider: "godaddy", expiresAt: new Date(Date.now() - 86_400_000) };
    expect(validateProcessorEvidenceAgainstIntent(manualEvidence, lateIntent)).toBeNull();
    expect(validateProcessorEvidenceAgainstIntent(manualEvidence, { ...lateIntent, status: "completed" })).toBeNull();
    expect(validateProcessorEvidenceAgainstIntent({ ...manualEvidence, amountCents: 49_999 }, lateIntent)).toMatch(/amount/i);
  });
});
