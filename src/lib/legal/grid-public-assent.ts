import "server-only";

import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  ACCEPTABLE_USE_KEY,
  ACCEPTABLE_USE_VERSION,
  GRID_MARKETPLACE_TERMS_KEY,
  GRID_MARKETPLACE_TERMS_VERSION,
  PRIVACY_POLICY_KEY,
  PRIVACY_POLICY_VERSION,
  WEBSITE_TERMS_KEY,
  WEBSITE_TERMS_VERSION,
} from "@/lib/legal/public-terms";

export const gridPublicAssentSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  acceptsWebsiteTerms: z.literal(true),
  acceptsGridMarketplaceTerms: z.literal(true),
  acceptsAcceptableUse: z.literal(true),
  acknowledgesPrivacyNotice: z.literal(true),
  websiteTermsVersion: z.literal(WEBSITE_TERMS_VERSION),
  gridMarketplaceTermsVersion: z.literal(GRID_MARKETPLACE_TERMS_VERSION),
}).passthrough();

export type GridPublicAssent = z.infer<typeof gridPublicAssentSchema>;

export function parseGridPublicAssent(rawInput: unknown) {
  return gridPublicAssentSchema.parse(rawInput);
}

/**
 * Stores versioned clickwrap/acknowledgment evidence using the existing legal acceptance
 * ledger. Recording assent before account creation is deliberate: the agreement applies
 * to the attempted public marketplace use even when the later enrollment is rejected.
 */
export async function recordGridPublicAssent(
  input: GridPublicAssent,
  metadata: { ipAddress?: string | null; userAgent?: string | null },
  source: string,
) {
  const documents = [
    [WEBSITE_TERMS_KEY, WEBSITE_TERMS_VERSION],
    [GRID_MARKETPLACE_TERMS_KEY, GRID_MARKETPLACE_TERMS_VERSION],
    [ACCEPTABLE_USE_KEY, ACCEPTABLE_USE_VERSION],
    [PRIVACY_POLICY_KEY, PRIVACY_POLICY_VERSION],
  ] as const;

  await db.$transaction(
    documents.map(([documentKey, documentVersion]) => db.$executeRaw(Prisma.sql`
      INSERT INTO "access_gate_acceptances"
        ("id", "email", "documentKey", "documentVersion", "ipAddress", "userAgent", "source")
      VALUES
        (${crypto.randomUUID()}, ${input.email}, ${documentKey}, ${documentVersion}, ${metadata.ipAddress ?? null}, ${metadata.userAgent ?? null}, ${source})
    `)),
  );
}
