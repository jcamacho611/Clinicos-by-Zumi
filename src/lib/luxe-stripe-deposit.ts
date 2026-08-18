import "server-only";

import { createHash } from "node:crypto";
import Stripe from "stripe";
import { stripeLivePaymentStatus } from "@/lib/commercial/payment-connectors/stripe";

export const LUXE_STRIPE_SALE_MODE = "luxe_deposit";
const SALE_MODE_METADATA_KEY = "klinikos_sale_mode";
const JOURNEY_METADATA_KEY = "klinikos_luxe_journey";
const EXPECTED_AMOUNT_METADATA_KEY = "klinikos_luxe_expected_amount_cents";
const PAYMENT_KIND_METADATA_KEY = "klinikos_luxe_payment_kind";
const DEFAULT_LABEL = "Luxe Medi booking deposit";
const MIN_DEPOSIT_CENTS = 100;
const MAX_DEPOSIT_CENTS = 1_000_000;

function metadataValue(metadata: Stripe.Metadata | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function configuredAmount(env: NodeJS.ProcessEnv) {
  const raw = env.LUXE_MEDI_STRIPE_DEPOSIT_CENTS?.trim();
  if (!raw || !/^\d+$/.test(raw)) return null;
  const amountCents = Number.parseInt(raw, 10);
  return Number.isSafeInteger(amountCents) && amountCents >= MIN_DEPOSIT_CENTS && amountCents <= MAX_DEPOSIT_CENTS
    ? amountCents
    : null;
}

function liveStripeClient(env: NodeJS.ProcessEnv) {
  const key = env.STRIPE_SECRET_KEY?.trim();
  if (!key || !["sk_live_", "rk_live_"].some((prefix) => key.startsWith(prefix))) {
    throw new Error("Live Stripe checkout is not configured.");
  }
  return new Stripe(key, { appInfo: { name: "Klinikos", version: "0.1.0" } });
}

export function luxeStripeDepositStatus(env: NodeJS.ProcessEnv = process.env) {
  const stripe = stripeLivePaymentStatus(env);
  const amountCents = configuredAmount(env);
  const publicCheckoutEnabled = env.LUXE_MEDI_STRIPE_DEPOSIT_PUBLIC_ENABLED?.trim().toLowerCase() === "true";
  const label = env.LUXE_MEDI_STRIPE_DEPOSIT_LABEL?.trim().slice(0, 120) || DEFAULT_LABEL;
  return {
    available: stripe.processorVerification && amountCents !== null,
    publicCheckoutAvailable: stripe.processorVerification && amountCents !== null && publicCheckoutEnabled,
    processorVerification: stripe.processorVerification,
    amountCents,
    label,
    missing: [
      ...stripe.missing,
      ...(amountCents === null ? ["LUXE_MEDI_STRIPE_DEPOSIT_CENTS"] : []),
      ...(!publicCheckoutEnabled ? ["LUXE_MEDI_STRIPE_DEPOSIT_PUBLIC_ENABLED=true (only if immediate public deposit collection is approved)"] : []),
    ],
  };
}

export async function createLuxeStripeDepositCheckout(input: {
  journeyToken: string;
  email?: string | null;
  returnUrl: string;
  env?: NodeJS.ProcessEnv;
}) {
  const env = input.env ?? process.env;
  const status = luxeStripeDepositStatus(env);
  if (!status.available || !status.amountCents) throw new Error("Luxe Stripe deposit checkout is not available.");
  if (!input.journeyToken || input.journeyToken.length > 500) throw new Error("Luxe deposit checkout requires an opaque acquisition journey.");

  const returnUrl = new URL(input.returnUrl);
  if (env.NODE_ENV === "production" && returnUrl.protocol !== "https:") throw new Error("Production Luxe deposit return URL must use HTTPS.");

  // Keep this as a plain string map instead of coupling the application to a
  // Stripe SDK metadata alias that can move between SDK major versions.
  const metadata: Record<string, string> = {
    [SALE_MODE_METADATA_KEY]: LUXE_STRIPE_SALE_MODE,
    [JOURNEY_METADATA_KEY]: input.journeyToken,
    [EXPECTED_AMOUNT_METADATA_KEY]: String(status.amountCents),
    [PAYMENT_KIND_METADATA_KEY]: "deposit",
  };
  const nowSeconds = Math.floor(Date.now() / 1000);
  const session = await liveStripeClient(env).checkout.sessions.create({
    mode: "payment",
    ui_mode: "hosted",
    expires_at: nowSeconds + 60 * 60,
    customer_email: input.email?.trim() || undefined,
    success_url: input.returnUrl,
    cancel_url: input.returnUrl,
    metadata,
    payment_intent_data: { metadata },
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: status.amountCents,
        product_data: { name: status.label },
      },
    }],
  }, {
    idempotencyKey: `klinikos_luxe_deposit_${createHash("sha256").update(input.journeyToken, "utf8").digest("hex").slice(0, 32)}_${Math.floor(Date.now() / (60 * 60 * 1000))}`,
  });

  if (!session.url || !session.livemode) throw new Error("Stripe did not return a valid live hosted checkout session.");
  return { checkoutUrl: session.url, externalCheckoutId: session.id, amountCents: status.amountCents };
}

export type NormalizedLuxeStripeDeposit = {
  outcome: "succeeded" | "pending" | "failed";
  journeyToken: string;
  eventId: string;
  externalReference: string;
  alternateExternalReference: string | null;
  externalCheckoutId: string;
  externalPaymentIntentId: string | null;
  amountCents: number;
  currency: "USD";
  receivedAt: Date;
};

export function isLuxeStripeDepositEvent(event: Stripe.Event) {
  if (![
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
  ].includes(event.type)) return false;
  const session = event.data.object as Stripe.Checkout.Session;
  return metadataValue(session.metadata, SALE_MODE_METADATA_KEY) === LUXE_STRIPE_SALE_MODE;
}

export function normalizeVerifiedLuxeStripeDepositEvent(event: Stripe.Event): NormalizedLuxeStripeDeposit {
  if (!isLuxeStripeDepositEvent(event)) throw new Error("Stripe event is not a Luxe deposit event.");
  if (!event.livemode) throw new Error("Test-mode Stripe events cannot verify a live Luxe deposit.");

  const session = event.data.object as Stripe.Checkout.Session;
  const journeyToken = metadataValue(session.metadata, JOURNEY_METADATA_KEY);
  const expectedRaw = metadataValue(session.metadata, EXPECTED_AMOUNT_METADATA_KEY);
  const paymentKind = metadataValue(session.metadata, PAYMENT_KIND_METADATA_KEY);
  const expectedAmount = expectedRaw && /^\d+$/.test(expectedRaw) ? Number.parseInt(expectedRaw, 10) : null;
  if (!journeyToken || journeyToken.length > 500) throw new Error("Luxe Stripe deposit correlation metadata is invalid.");
  if (paymentKind !== "deposit") throw new Error("Luxe Stripe payment kind is invalid.");
  if (!expectedAmount || !Number.isSafeInteger(expectedAmount) || expectedAmount < MIN_DEPOSIT_CENTS || expectedAmount > MAX_DEPOSIT_CENTS) {
    throw new Error("Luxe Stripe expected amount metadata is invalid.");
  }
  if (session.amount_total !== expectedAmount) throw new Error("Stripe deposit amount does not match the server-owned checkout amount.");
  if (session.currency?.toLowerCase() !== "usd") throw new Error("Luxe Stripe deposits must settle in USD.");

  const paymentIntentId = stringId(session.payment_intent);
  const outcome = event.type === "checkout.session.async_payment_failed"
    ? "failed"
    : event.type === "checkout.session.async_payment_succeeded" || session.payment_status === "paid"
      ? "succeeded"
      : "pending";
  const externalReference = paymentIntentId ?? session.id;
  return {
    outcome,
    journeyToken,
    eventId: event.id,
    externalReference,
    alternateExternalReference: paymentIntentId ? session.id : null,
    externalCheckoutId: session.id,
    externalPaymentIntentId: paymentIntentId,
    amountCents: expectedAmount,
    currency: "USD",
    receivedAt: new Date(event.created * 1000),
  };
}
