import "server-only";

import type { CommercialPaymentConnector, CommercialCheckoutRequest } from "@/lib/commercial/payment-connectors/types";

export type StripeProcessorMode = "live" | "test";

type StripeCheckoutSession = {
  id?: string;
  url?: string | null;
  livemode?: boolean;
};

function clean(value: string | undefined) {
  return value?.trim() ?? "";
}

export function stripeSecretForMode(mode: StripeProcessorMode, env: NodeJS.ProcessEnv = process.env) {
  const value = clean(mode === "live" ? env.STRIPE_SECRET_KEY : env.STRIPE_TEST_SECRET_KEY);
  const expectedPrefix = mode === "live" ? "sk_live_" : "sk_test_";
  return value.startsWith(expectedPrefix) ? value : null;
}

export function stripeWebhookSecretForMode(mode: StripeProcessorMode, env: NodeJS.ProcessEnv = process.env) {
  const value = clean(mode === "live" ? env.STRIPE_WEBHOOK_SECRET : env.STRIPE_TEST_WEBHOOK_SECRET);
  return value.startsWith("whsec_") ? value : null;
}

export function stripeModeReady(mode: StripeProcessorMode, env: NodeJS.ProcessEnv = process.env) {
  return Boolean(stripeSecretForMode(mode, env) && stripeWebhookSecretForMode(mode, env));
}

function returnUrlWithState(returnUrl: string, state: "returned" | "cancelled") {
  const parsed = new URL(returnUrl);
  parsed.searchParams.set("processor", "stripe");
  parsed.searchParams.set("checkout", state);
  return parsed.toString();
}

function stripeBasicAuth(secret: string) {
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}

function lineItemFields(body: URLSearchParams, request: CommercialCheckoutRequest) {
  const priceCents = request.product.priceCents;
  if (priceCents == null) throw new Error(`Stripe checkout requires a server-owned price for ${request.product.label}.`);

  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "usd");
  body.set("line_items[0][price_data][unit_amount]", String(priceCents));
  body.set("line_items[0][price_data][product_data][name]", request.product.label);

  if (request.product.billing === "monthly") {
    body.set("mode", "subscription");
    body.set("line_items[0][price_data][recurring][interval]", "month");
    body.set("subscription_data[metadata][klinikos_checkout_state]", request.state);
    body.set("subscription_data[metadata][klinikos_product_key]", request.product.key);
  } else {
    body.set("mode", "payment");
    body.set("payment_intent_data[metadata][klinikos_checkout_state]", request.state);
    body.set("payment_intent_data[metadata][klinikos_product_key]", request.product.key);
  }
}

export async function createStripeCheckoutSession(
  request: CommercialCheckoutRequest,
  mode: StripeProcessorMode,
  env: NodeJS.ProcessEnv = process.env,
) {
  const secret = stripeSecretForMode(mode, env);
  if (!secret) throw new Error(`Stripe ${mode} API access is not configured.`);
  if (!stripeWebhookSecretForMode(mode, env)) {
    throw new Error(`Stripe ${mode} checkout is held until signed webhook verification is configured.`);
  }
  if (request.product.priceCents == null || request.product.priceCents < 1) {
    throw new Error("Stripe Checkout requires a positive server-owned amount.");
  }

  const body = new URLSearchParams();
  lineItemFields(body, request);
  body.set("success_url", returnUrlWithState(request.returnUrl, "returned"));
  body.set("cancel_url", returnUrlWithState(request.returnUrl, "cancelled"));
  body.set("customer_email", request.email);
  body.set("client_reference_id", request.state);
  body.set("metadata[klinikos_checkout_state]", request.state);
  body.set("metadata[klinikos_product_key]", request.product.key);
  body.set("payment_method_types[0]", "card");

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: stripeBasicAuth(secret),
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: body.toString(),
  }).catch(() => null);

  if (!response) throw new Error("Stripe Checkout could not be reached.");
  if (!response.ok) throw new Error(`Stripe Checkout returned HTTP ${response.status}.`);

  const session = (await response.json().catch(() => null)) as StripeCheckoutSession | null;
  if (!session?.id || !session.url) throw new Error("Stripe Checkout did not return an active hosted Checkout Session.");
  if (typeof session.livemode === "boolean" && session.livemode !== (mode === "live")) {
    throw new Error("Stripe Checkout returned a processor mode that does not match the requested mode.");
  }
  return { id: session.id, url: session.url };
}

export function stripeConnector(mode: StripeProcessorMode): CommercialPaymentConnector {
  return {
    key: "stripe",
    status(env = process.env) {
      const checkoutConfigured = Boolean(stripeSecretForMode(mode, env));
      const webhookConfigured = Boolean(stripeWebhookSecretForMode(mode, env));
      return {
        key: "stripe",
        checkoutConfigured,
        webhookConfigured,
        processorVerification: checkoutConfigured && webhookConfigured,
        missing: [
          ...(checkoutConfigured ? [] : [mode === "live" ? "STRIPE_SECRET_KEY" : "STRIPE_TEST_SECRET_KEY"]),
          ...(webhookConfigured ? [] : [mode === "live" ? "STRIPE_WEBHOOK_SECRET" : "STRIPE_TEST_WEBHOOK_SECRET"]),
        ],
      };
    },
    async createCheckout(request, env = process.env) {
      const session = await createStripeCheckoutSession(request, mode, env);
      return {
        provider: "stripe",
        checkoutUrl: session.url,
        externalCheckoutId: session.id,
        processorVerificationAvailable: true,
      };
    },
  };
}

export const stripeLivePaymentConnector = stripeConnector("live");
export const stripeTestPaymentConnector = stripeConnector("test");
