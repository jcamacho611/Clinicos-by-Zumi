import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCommercialProduct } from "@/lib/commercial/product-catalog";

export type CommercialCheckoutStatus = {
  state: string;
  provider: string;
  productKey: string;
  productLabel: string;
  status: "created" | "completed" | "expired" | "abandoned";
  processorVerificationAvailable: boolean;
  expiresAt: Date;
  completedAt: Date | null;
};

type CheckoutRow = {
  state: string;
  provider: string;
  productKey: string;
  status: "created" | "completed" | "expired" | "abandoned";
  expiresAt: Date;
  completedAt: Date | null;
};

export async function getCommercialCheckoutStatus(organizationId: string, state: string) {
  const rows = await db.$queryRaw<CheckoutRow[]>(Prisma.sql`
    SELECT "state", "provider", "productKey", "status", "expiresAt", "completedAt"
    FROM "commercial_checkout_intents"
    WHERE "organizationId" = ${organizationId} AND "state" = ${state}
    LIMIT 1
  `);
  const row = rows[0];
  if (!row) return null;

  const status = row.status === "created" && row.expiresAt <= new Date() ? "expired" : row.status;
  const product = getCommercialProduct(row.productKey);
  return {
    ...row,
    status,
    productLabel: product?.label ?? "Klinikos access",
    processorVerificationAvailable: row.provider !== "godaddy",
  } satisfies CommercialCheckoutStatus;
}

export async function getCommercialFundingStatus(organizationId: string) {
  const rows = await db.$queryRaw<Array<{
    prepaidBalanceCents: number;
    prepaidReservedCents: number;
    authorizedOverageLimitCents: number;
    authorizedOverageConsumedCents: number;
    authorizedOverageReservedCents: number;
    blockedAt: Date | null;
    blockReason: string | null;
  }>>(Prisma.sql`
    SELECT "prepaidBalanceCents", "prepaidReservedCents", "authorizedOverageLimitCents",
           "authorizedOverageConsumedCents", "authorizedOverageReservedCents", "blockedAt", "blockReason"
    FROM "commercial_funding_accounts"
    WHERE "organizationId" = ${organizationId}
    LIMIT 1
  `);
  return rows[0] ?? null;
}
