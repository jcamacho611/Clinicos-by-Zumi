import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createCommercialCheckoutIntent } from "@/lib/commercial/payment-evidence-repository";
import { getCommercialProduct, resolveCommercialCheckoutAmount, type CommercialProductKey } from "@/lib/commercial/product-catalog";
import { goDaddyPaymentConnector } from "@/lib/commercial/payment-connectors/godaddy";

export async function createGoDaddyCommercialCheckout(input: {
  organizationId: string;
  email: string;
  productKey: CommercialProductKey;
  expectedAmountCents?: number | null;
  returnUrl: string;
}) {
  const product = getCommercialProduct(input.productKey);
  if (!product) throw new Error("Unknown Klinikos commercial product.");

  const expectedAmountCents = resolveCommercialCheckoutAmount(product, input.expectedAmountCents);

  const intent = await createCommercialCheckoutIntent({
    organizationId: input.organizationId,
    email: input.email,
    provider: "godaddy",
    productKey: product.key,
  });

  if (expectedAmountCents !== null) {
    await db.$executeRaw(Prisma.sql`
      UPDATE "commercial_checkout_intents"
      SET "amountCents" = ${expectedAmountCents}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${intent.id} AND "organizationId" = ${input.organizationId}
    `);
  }

  try {
    const checkout = await goDaddyPaymentConnector.createCheckout?.({
      product,
      organizationId: input.organizationId,
      email: input.email,
      state: intent.state,
      returnUrl: input.returnUrl,
    });
    if (!checkout) throw new Error("GoDaddy checkout is not available.");

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
