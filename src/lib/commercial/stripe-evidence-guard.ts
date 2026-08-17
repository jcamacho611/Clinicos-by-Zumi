import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { StripeProcessorMode } from "@/lib/commercial/payment-connectors/stripe";

type CheckoutIntentEvidenceRow = {
  id: string;
  provider: string;
  productKey: string;
  amountCents: number | null;
  currency: string;
  status: string;
  expiresAt: Date;
  metadata: Prisma.JsonValue;
};

function processorMode(metadata: Prisma.JsonValue): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, Prisma.JsonValue>).processorMode;
  return typeof value === "string" ? value : null;
}

/**
 * The signed Stripe event is evidence, not pricing authority. Re-load the server-owned
 * Klinikos checkout intent and require amount, currency, product, provider and
 * live/test mode to match before payment evidence may be applied.
 */
export async function assertStripeCheckoutEvidence(input: {
  checkoutState: string;
  productKey: string;
  amountCents: number | null;
  currency: string | null;
  mode: StripeProcessorMode;
}) {
  const rows = await db.$queryRaw<CheckoutIntentEvidenceRow[]>(Prisma.sql`
    SELECT "id", "provider", "productKey", "amountCents", "currency", "status", "expiresAt", "metadata"
    FROM "commercial_checkout_intents"
    WHERE "state" = ${input.checkoutState}
    LIMIT 1
  `);
  const intent = rows[0] ?? null;
  if (!intent) throw new Error("Stripe payment evidence does not match a Klinikos checkout intent.");
  if (intent.provider !== "stripe") throw new Error("Stripe evidence cannot satisfy a checkout created for another processor.");
  if (intent.status !== "created") throw new Error("Stripe payment evidence references a checkout that is not open.");
  if (intent.expiresAt <= new Date()) throw new Error("Stripe payment evidence references an expired Klinikos checkout.");
  if (intent.productKey !== input.productKey) throw new Error("Stripe payment product does not match the server-owned checkout intent.");
  if (intent.amountCents == null || input.amountCents == null || intent.amountCents !== input.amountCents) {
    throw new Error("Stripe payment amount does not match the server-owned checkout amount.");
  }
  const expectedCurrency = intent.currency.trim().toUpperCase();
  const receivedCurrency = input.currency?.trim().toUpperCase() || "";
  if (!receivedCurrency || receivedCurrency !== expectedCurrency) {
    throw new Error("Stripe payment currency does not match the server-owned checkout currency.");
  }
  if (processorMode(intent.metadata) !== input.mode) {
    throw new Error("Stripe payment mode does not match the server-owned checkout mode.");
  }
  return { intentId: intent.id };
}
