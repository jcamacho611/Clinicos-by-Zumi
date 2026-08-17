import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createCommercialCheckoutIntent } from "@/lib/commercial/payment-evidence-repository";
import { getCommercialProduct, resolveCommercialCheckoutAmount, type CommercialProductKey } from "@/lib/commercial/product-catalog";
import { goDaddyPaymentConnector } from "@/lib/commercial/payment-connectors/godaddy";
import { stripeLivePaymentConnector, stripeModeReady, type StripeProcessorMode } from "@/lib/commercial/payment-connectors/stripe";
import type { CommercialPaymentConnector } from "@/lib/commercial/payment-connectors/types";

export type CommercialCheckoutInput = {
  organizationId: string;
  email: string;
  productKey: CommercialProductKey;
  expectedAmountCents?: number | null;
  returnUrl: string;
};

async function createCheckoutWithConnector(input: CommercialCheckoutInput, connector: CommercialPaymentConnector, options?: { processorMode?: StripeProcessorMode }) {
  const product = getCommercialProduct(input.productKey);
  if (!product) throw new Error("Unknown Klinikos commercial product.");

  const expectedAmountCents = resolveCommercialCheckoutAmount(product, input.expectedAmountCents);
  const intent = await createCommercialCheckoutIntent({
    organizationId: input.organizationId,
    email: input.email,
    provider: connector.key,
    productKey: product.key,
  });

  const processorMetadata = options?.processorMode ? JSON.stringify({ processorMode: options.processorMode }) : "{}";
  await db.$executeRaw(Prisma.sql`
    UPDATE "commercial_checkout_intents"
    SET "amountCents" = ${expectedAmountCents},
        "currency" = 'USD',
        "metadata" = "metadata" || ${processorMetadata}::jsonb,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${intent.id} AND "organizationId" = ${input.organizationId}
  `);

  try {
    const checkout = await connector.createCheckout?.({
      product,
      organizationId: input.organizationId,
      email: input.email,
      state: intent.state,
      returnUrl: input.returnUrl,
    });
    if (!checkout) throw new Error(`${connector.key} checkout is not available.`);

    if (checkout.externalCheckoutId) {
      await db.$executeRaw(Prisma.sql`
        UPDATE "commercial_checkout_intents"
        SET "externalCheckoutId" = ${checkout.externalCheckoutId}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${intent.id} AND "organizationId" = ${input.organizationId}
      `);
    }

    return {
      intentId: intent.id,
      state: intent.state,
      expiresAt: intent.expiresAt,
      provider: checkout.provider,
      checkoutUrl: checkout.checkoutUrl,
      processorVerificationAvailable: checkout.processorVerificationAvailable,
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

export async function createGoDaddyCommercialCheckout(input: CommercialCheckoutInput) {
  return createCheckoutWithConnector(input, goDaddyPaymentConnector);
}

export async function createStripeCommercialCheckout(input: CommercialCheckoutInput, mode: StripeProcessorMode = "live") {
  if (mode !== "live") throw new Error("Public commercial checkout cannot silently enter Stripe test mode.");
  return createCheckoutWithConnector(input, stripeLivePaymentConnector, { processorMode: mode });
}

/**
 * Current production checkout selector.
 *
 * For one-time products, Stripe becomes primary only when BOTH its live API secret and
 * live webhook signing secret are configured. That prevents us from taking a payment
 * we cannot automatically prove. Until then, the existing exact-value GoDaddy/manual
 * reconciliation rail remains the truthful fallback.
 *
 * Recurring subscriptions remain on the existing rail until Stripe subscription
 * lifecycle evidence/renewal/cancellation handling is finished as a separate slice.
 */
export async function createCommercialCheckout(input: CommercialCheckoutInput) {
  const product = getCommercialProduct(input.productKey);
  if (!product) throw new Error("Unknown Klinikos commercial product.");
  if (product.billing === "one_time" && stripeModeReady("live")) {
    return createStripeCommercialCheckout(input, "live");
  }
  return createGoDaddyCommercialCheckout(input);
}
