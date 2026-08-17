import { createHmac } from "node:crypto";
import { describe, expect, it, vi, afterEach } from "vitest";
import { getCommercialProduct } from "@/lib/commercial/product-catalog";
import { createStripeCheckoutSession, stripeModeReady, stripeWebhookSecretForMode } from "@/lib/commercial/payment-connectors/stripe";
import { verifyStripeWebhookSignature } from "@/lib/commercial/stripe-webhook";

const liveEnv = {
  STRIPE_SECRET_KEY: "sk_live_example",
  STRIPE_WEBHOOK_SECRET: "whsec_live_example",
  STRIPE_TEST_SECRET_KEY: "sk_test_example",
  STRIPE_TEST_WEBHOOK_SECRET: "whsec_test_example",
} as NodeJS.ProcessEnv;

function signature(payload: string, timestamp: number, secret: string) {
  const digest = createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest("hex");
  return `t=${timestamp},v1=${digest},v0=${"0".repeat(64)}`;
}

afterEach(() => vi.restoreAllMocks());

describe("Stripe webhook signature verification", () => {
  it("accepts a current valid v1 live signature", () => {
    const rawBody = JSON.stringify({ id: "evt_live", livemode: true });
    const now = 1_800_000_000;
    expect(verifyStripeWebhookSignature({
      rawBody,
      signatureHeader: signature(rawBody, now, liveEnv.STRIPE_WEBHOOK_SECRET!),
      env: liveEnv,
      nowSeconds: now,
    })).toEqual({ ok: true, mode: "live", timestamp: now });
  });

  it("keeps test and live signing secrets distinct", () => {
    const rawBody = JSON.stringify({ id: "evt_test", livemode: false });
    const now = 1_800_000_000;
    expect(verifyStripeWebhookSignature({
      rawBody,
      signatureHeader: signature(rawBody, now, liveEnv.STRIPE_TEST_WEBHOOK_SECRET!),
      env: liveEnv,
      nowSeconds: now,
    })).toEqual({ ok: true, mode: "test", timestamp: now });
  });

  it("rejects missing, forged, and stale signatures", () => {
    const rawBody = "{}";
    const now = 1_800_000_000;
    expect(verifyStripeWebhookSignature({ rawBody, signatureHeader: null, env: liveEnv, nowSeconds: now })).toMatchObject({ ok: false, reason: "missing_signature" });
    expect(verifyStripeWebhookSignature({ rawBody, signatureHeader: `t=${now},v1=${"a".repeat(64)}`, env: liveEnv, nowSeconds: now })).toMatchObject({ ok: false, reason: "invalid_signature" });
    expect(verifyStripeWebhookSignature({ rawBody, signatureHeader: signature(rawBody, now - 301, liveEnv.STRIPE_WEBHOOK_SECRET!), env: liveEnv, nowSeconds: now })).toMatchObject({ ok: false, reason: "stale_signature" });
  });

  it("does not call a Stripe API rail live until webhook verification is configured", () => {
    expect(stripeModeReady("live", { STRIPE_SECRET_KEY: "sk_live_example" })).toBe(false);
    expect(stripeModeReady("live", liveEnv)).toBe(true);
    expect(stripeWebhookSecretForMode("test", liveEnv)).toBe("whsec_test_example");
  });
});

describe("Stripe hosted Checkout", () => {
  it("uses server-owned price and opaque correlation metadata", async () => {
    const product = getCommercialProduct("operational_audit");
    expect(product).toBeTruthy();
    const request = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      id: "cs_live_123",
      url: "https://checkout.stripe.com/c/pay/example",
      livemode: true,
    }), { status: 200, headers: { "content-type": "application/json" } }));

    const result = await createStripeCheckoutSession({
      product: product!,
      organizationId: "org_private_not_sent",
      email: "buyer@example.com",
      state: "opaque_checkout_state",
      returnUrl: "https://klinikos.io/payments/success",
    }, "live", liveEnv);

    expect(result.id).toBe("cs_live_123");
    const [, options] = request.mock.calls[0] as [string, RequestInit];
    const body = String(options.body);
    expect(body).toContain(`line_items%5B0%5D%5Bprice_data%5D%5Bunit_amount%5D=${product!.priceCents}`);
    expect(body).toContain("metadata%5Bklinikos_checkout_state%5D=opaque_checkout_state");
    expect(body).not.toContain("org_private_not_sent");
    expect(body).not.toContain("patient");
    expect(body).not.toContain("diagnosis");
  });

  it("never silently uses a test key for a live request", async () => {
    await expect(createStripeCheckoutSession({
      product: getCommercialProduct("operational_audit")!,
      organizationId: "org",
      email: "buyer@example.com",
      state: "state",
      returnUrl: "https://klinikos.io/payments/success",
    }, "live", {
      STRIPE_TEST_SECRET_KEY: "sk_test_only",
      STRIPE_TEST_WEBHOOK_SECRET: "whsec_test_only",
    })).rejects.toThrow("Stripe live API access is not configured");
  });
});
