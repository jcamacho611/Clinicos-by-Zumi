import "server-only";

import { createHash } from "node:crypto";
import Stripe from "stripe";
import type { CommercialPaymentEvidenceInput } from "@/lib/commercial/payment-evidence-repository";
import type {
  CommercialCheckoutRequest,
  CommercialCheckoutResult,
  CommercialPaymentConnector,
  CommercialProcessorMode,
} from "@/lib/commercial/payment-connectors/types";

const INTENT_METADATA_KEY = "klinikos_checkout_intent_id";
const STATE_METADATA_KEY = "klinikos_checkout_state";
const INTEGRATION_IDENTIFIER = "klinikos_clinic_analysis_nxqjvbrm";

function opaqueMetadata(request: CommercialCheckoutRequest) {
  if (!request.intentId || !request.state) throw new Error("Stripe checkout requires an opaque Klinikos intent reference.");
  return {
    [INTENT_METADATA_KEY]: request.intentId,
    [STATE_METADATA_KEY]: request.state,
  };
}

function stringId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function metadataValue(metadata: Stripe.Metadata | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stripeKeyForMode(mode: Exclude<CommercialProcessorMode, "manual">, env: NodeJS.ProcessEnv) {
  const variable = mode === "live" ? "STRIPE_SECRET_KEY" : "STRIPE_TEST_SECRET_KEY";
  const key = env[variable]?.trim();
  if (!key) throw new Error(`${variable} is not configured.`);
  const expectedPrefixes = mode === "live" ? ["sk_live_", "rk_live_"] : ["sk_test_", "rk_test_"];
  if (!expectedPrefixes.some((prefix) => key.startsWith(prefix))) throw new Error(`${variable} does not match the requested Stripe mode.`);
  return key;
}

function stripeWebhookSecretForMode(mode: Exclude<CommercialProcessorMode, "manual">, env: NodeJS.ProcessEnv) {
  const variable = mode === "live" ? "STRIPE_WEBHOOK_SECRET" : "STRIPE_TEST_WEBHOOK_SECRET";
  const secret = env[variable]?.trim();
  if (!secret) throw new Error(`${variable} is not configured.`);
  if (!secret.startsWith("whsec_")) throw new Error(`${variable} is not a Stripe endpoint signing secret.`);
  return secret;
}

function stripeClient(mode: Exclude<CommercialProcessorMode, "manual">, env: NodeJS.ProcessEnv) {
  return new Stripe(stripeKeyForMode(mode, env), {
    appInfo: { name: "Klinikos", version: "0.1.0" },
  });
}

export function stripeLivePaymentStatus(env: NodeJS.ProcessEnv = process.env) {
  const liveKey = env.STRIPE_SECRET_KEY?.trim();
  const checkoutConfigured = Boolean(liveKey && ["sk_live_", "rk_live_"].some((prefix) => liveKey.startsWith(prefix)));
  const webhookConfigured = Boolean(env.STRIPE_WEBHOOK_SECRET?.trim().startsWith("whsec_"));
  const missing: string[] = [];
  if (!checkoutConfigured) missing.push("STRIPE_SECRET_KEY (live mode)");
  if (!webhookConfigured) missing.push("STRIPE_WEBHOOK_SECRET");
  return {
    key: "stripe",
    checkoutConfigured,
    webhookConfigured,
    processorVerification: checkoutConfigured && webhookConfigured,
    missing,
  };
}

export function buildStripeCheckoutSessionParams(request: CommercialCheckoutRequest): Stripe.Checkout.SessionCreateParams {
  if (request.product.billing !== "one_time") {
    throw new Error("This Stripe slice supports only the one-time Clinic Operating Analysis.");
  }
  if (!request.amountCents || !Number.isInteger(request.amountCents) || request.amountCents < 1) {
    throw new Error("Stripe checkout requires a positive server-owned amount in cents.");
  }
  if (!request.expiresAt) throw new Error("Stripe checkout requires the server-owned intent expiration.");
  const expiresAt = Math.floor(request.expiresAt.getTime() / 1000);
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt < now + 30 * 60 || expiresAt > now + 24 * 60 * 60) {
    throw new Error("Stripe checkout expiration must be between 30 minutes and 24 hours.");
  }
  const metadata = opaqueMetadata(request);
  return {
    mode: "payment",
    ui_mode: "hosted",
    expires_at: expiresAt,
    integration_identifier: INTEGRATION_IDENTIFIER,
    client_reference_id: request.intentId,
    customer_email: request.email,
    success_url: request.returnUrl,
    cancel_url: request.returnUrl,
    metadata,
    payment_intent_data: { metadata },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: (request.currency ?? "USD").toLowerCase(),
          unit_amount: request.amountCents,
          product_data: { name: request.product.label },
        },
      },
    ],
  };
}

export function constructVerifiedLiveStripeEvent(input: {
  rawBody: string;
  signature: string;
  env?: NodeJS.ProcessEnv;
}) {
  const env = input.env ?? process.env;
  const client = stripeClient("live", env);
  const webhookSecret = stripeWebhookSecretForMode("live", env);
  return client.webhooks.constructEvent(input.rawBody, input.signature, webhookSecret);
}

export function normalizeStripeWebhookEvent(event: Stripe.Event, rawBody: string): CommercialPaymentEvidenceInput | null {
  const processorMode: Exclude<CommercialProcessorMode, "manual"> = event.livemode ? "live" : "test";
  const common = {
    provider: "stripe",
    eventId: event.id,
    eventType: event.type,
    verified: true,
    verificationMethod: "webhook_signature" as const,
    processorVerified: true,
    processorMode,
    payloadHash: createHash("sha256").update(rawBody, "utf8").digest("hex"),
  };

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const session = event.data.object;
    if (session.mode !== "payment") return null;
    const paymentIntentId = stringId(session.payment_intent);
    const outcome = event.type === "checkout.session.async_payment_succeeded"
      ? "succeeded"
      : event.type === "checkout.session.async_payment_failed"
        ? "failed"
        : session.payment_status === "paid"
          ? "succeeded"
          : "pending";
    return {
      ...common,
      outcome,
      checkoutIntentId: session.client_reference_id ?? metadataValue(session.metadata, INTENT_METADATA_KEY),
      checkoutState: metadataValue(session.metadata, STATE_METADATA_KEY),
      externalCheckoutId: session.id,
      externalPaymentIntentId: paymentIntentId,
      externalCustomerId: stringId(session.customer),
      amountCents: session.amount_total,
      currency: session.currency,
      payload: {
        stripeObjectId: session.id,
        stripeObjectType: "checkout.session",
        livemode: event.livemode,
        paymentStatus: session.payment_status,
        paymentIntentId,
      },
    };
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    return {
      ...common,
      outcome: "failed",
      checkoutIntentId: metadataValue(paymentIntent.metadata, INTENT_METADATA_KEY),
      checkoutState: metadataValue(paymentIntent.metadata, STATE_METADATA_KEY),
      externalPaymentIntentId: paymentIntent.id,
      externalCustomerId: stringId(paymentIntent.customer),
      amountCents: paymentIntent.amount,
      currency: paymentIntent.currency,
      payload: {
        stripeObjectId: paymentIntent.id,
        stripeObjectType: "payment_intent",
        livemode: event.livemode,
        status: paymentIntent.status,
      },
    };
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    return {
      ...common,
      outcome: "refunded",
      checkoutIntentId: metadataValue(charge.metadata, INTENT_METADATA_KEY),
      checkoutState: metadataValue(charge.metadata, STATE_METADATA_KEY),
      externalPaymentIntentId: stringId(charge.payment_intent),
      externalCustomerId: stringId(charge.customer),
      amountCents: charge.amount_refunded,
      currency: charge.currency,
      payload: {
        stripeObjectId: charge.id,
        stripeObjectType: "charge",
        livemode: event.livemode,
        refunded: charge.refunded,
        paymentIntentId: stringId(charge.payment_intent),
      },
    };
  }

  return null;
}

export const stripePaymentConnector: CommercialPaymentConnector = {
  key: "stripe",
  status: stripeLivePaymentStatus,
  async createCheckout(request, env = process.env): Promise<CommercialCheckoutResult> {
    const mode = request.processorMode;
    if (mode !== "live" && mode !== "test") throw new Error("Stripe checkout mode must be selected explicitly.");
    stripeWebhookSecretForMode(mode, env);
    const client = stripeClient(mode, env);
    const params = buildStripeCheckoutSessionParams(request);
    const session = await client.checkout.sessions.create(params, {
      idempotencyKey: `klinikos_checkout_${request.intentId}`,
    });
    if (!session.url) throw new Error("Stripe Checkout did not return a hosted payment URL.");
    if (session.livemode !== (mode === "live")) throw new Error("Stripe Checkout returned the wrong processor mode.");
    return {
      provider: "stripe",
      checkoutUrl: session.url,
      externalCheckoutId: session.id,
      processorVerificationAvailable: true,
      processorMode: mode,
    };
  },
};
