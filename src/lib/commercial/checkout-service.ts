import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  attachCommercialCheckoutReferences,
  createCommercialCheckoutIntent,
} from "@/lib/commercial/payment-evidence-repository";
import { goDaddyPaymentConnector } from "@/lib/commercial/payment-connectors/godaddy";
import { stripeLivePaymentStatus, stripePaymentConnector } from "@/lib/commercial/payment-connectors/stripe";
import type { CommercialPaymentConnector, CommercialProcessorMode } from "@/lib/commercial/payment-connectors/types";
import { getCommercialProduct, resolveCommercialCheckoutAmount, type CommercialProductKey } from "@/lib/commercial/product-catalog";

type CommercialCheckoutInput = {
  organizationId: string;
  email: string;
  productKey: CommercialProductKey;
  expectedAmountCents?: number | null;
  returnUrl: string;
};

export function normalizeCommercialReturnUrl(value: string, env: NodeJS.ProcessEnv = process.env) {
  const candidate = new URL(value);
  if (!["http:", "https:"].includes(candidate.protocol)) throw new Error("Checkout return URL must use HTTP or HTTPS.");
  const configuredBase = env.NEXT_PUBLIC_APP_URL?.trim() || env.RENDER_EXTERNAL_URL?.trim();
  const base = configuredBase
    ? new URL(configuredBase)
    : env.NODE_ENV === "production"
      ? new URL("https://klinikos.io")
      : new URL(candidate.origin);
  if (!["http:", "https:"].includes(base.protocol)) throw new Error("Configured checkout return origin must use HTTP or HTTPS.");
  const normalized = new URL("/", base);
  // Assigning pathname/search separately prevents a leading `//` path from being
  // reinterpreted as a protocol-relative attacker-controlled host.
  normalized.pathname = candidate.pathname;
  normalized.search = candidate.search;
  normalized.hash = "";
  return normalized.toString();
}

async function createCommercialCheckoutWithConnector(
  input: CommercialCheckoutInput,
  connector: CommercialPaymentConnector,
  processorMode: CommercialProcessorMode,
) {
  const product = getCommercialProduct(input.productKey);
  if (!product) throw new Error("Unknown Klinikos commercial product.");
  const expectedAmountCents = resolveCommercialCheckoutAmount(product, input.expectedAmountCents);
  const currency = "USD";
  const returnUrl = normalizeCommercialReturnUrl(input.returnUrl);
  // Stripe permits Checkout expiry from 30 minutes to 24 hours. Give the API
  // call a five-minute creation margin, then bind both systems to the same time.
  const expiresAt = processorMode === "manual" ? undefined : new Date(Date.now() + 35 * 60 * 1000);

  const intent = await createCommercialCheckoutIntent({
    organizationId: input.organizationId,
    email: input.email,
    provider: connector.key,
    productKey: product.key,
    amountCents: expectedAmountCents,
    currency,
    processorMode,
    expiresAt,
  });

  try {
    const checkout = await connector.createCheckout?.({
      product,
      organizationId: input.organizationId,
      email: input.email,
      state: intent.state,
      expiresAt: intent.expiresAt,
      intentId: intent.id,
      amountCents: expectedAmountCents,
      currency,
      processorMode,
      returnUrl,
    });
    if (!checkout) throw new Error(`${connector.key} checkout is not available.`);

    if (checkout.externalCheckoutId) {
      await attachCommercialCheckoutReferences({
        intentId: intent.id,
        organizationId: input.organizationId,
        provider: checkout.provider,
        externalCheckoutId: checkout.externalCheckoutId,
      });
    }

    return {
      intentId: intent.id,
      state: intent.state,
      expiresAt: intent.expiresAt,
      provider: checkout.provider,
      checkoutUrl: checkout.checkoutUrl,
      processorVerificationAvailable: checkout.processorVerificationAvailable,
      processorMode: checkout.processorMode ?? processorMode,
      productKey: product.key,
      expectedAmountCents,
    };
  } catch (error) {
    await db.$executeRaw(Prisma.sql`
      UPDATE "commercial_checkout_intents"
      SET "status" = 'abandoned', "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${intent.id} AND "organizationId" = ${input.organizationId} AND "status" = 'created'
    `).catch(() => undefined);
    throw error;
  }
}

export function createGoDaddyCommercialCheckout(input: CommercialCheckoutInput) {
  return createCommercialCheckoutWithConnector(input, goDaddyPaymentConnector, "manual");
}

export function createLiveStripeCommercialCheckout(input: CommercialCheckoutInput) {
  return createCommercialCheckoutWithConnector(input, stripePaymentConnector, "live");
}

/**
 * Stripe becomes the preferred direct rail only when both the live API key and
 * signed-webhook secret are configured. Until then the existing GoDaddy checkout
 * remains the truthful payment-attempt path with manual reconciliation.
 */
export function createPreferredCommercialCheckout(input: CommercialCheckoutInput) {
  return stripeLivePaymentStatus().processorVerification
    ? createLiveStripeCommercialCheckout(input)
    : createGoDaddyCommercialCheckout(input);
}
