import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type AccountAcceptanceBindingInput = {
  acceptanceId: string;
  documentKey: string;
  documentVersion: string;
  documentSha256: string;
  accountId: string;
  personId: string;
};

type LegalBindingClient = Pick<Prisma.TransactionClient, "$queryRaw" | "$executeRaw">;

export async function bindAcceptanceToAccountIdentity(
  input: AccountAcceptanceBindingInput,
  tx: LegalBindingClient = db,
) {
  const rows = await tx.$queryRaw<Array<{
    id: string;
    accountId: string | null;
    personId: string | null;
  }>>(Prisma.sql`
    SELECT "id", "accountId", "personId"
    FROM "access_gate_acceptances"
    WHERE "id" = ${input.acceptanceId}
      AND "documentKey" = ${input.documentKey}
      AND "documentVersion" = ${input.documentVersion}
      AND "documentSha256" = ${input.documentSha256}
      AND "status" = 'active'
      AND "signedAt" IS NOT NULL
      AND "electronicSignatureConsentedAt" IS NOT NULL
    LIMIT 2
    FOR UPDATE
  `);

  if (rows.length !== 1) {
    throw new Error("Protected-entry acceptance is missing or ambiguous.");
  }

  const existing = rows[0];
  if (existing.accountId || existing.personId) {
    if (existing.accountId === input.accountId && existing.personId === input.personId) {
      return { acceptanceId: existing.id, created: false };
    }
    throw new Error("Protected-entry acceptance is already bound to another account identity.");
  }

  const updated = await tx.$executeRaw(Prisma.sql`
    UPDATE "access_gate_acceptances"
    SET "accountId" = ${input.accountId},
        "personId" = ${input.personId}
    WHERE "id" = ${input.acceptanceId}
      AND "accountId" IS NULL
      AND "personId" IS NULL
      AND "documentKey" = ${input.documentKey}
      AND "documentVersion" = ${input.documentVersion}
      AND "documentSha256" = ${input.documentSha256}
      AND "status" = 'active'
  `);

  if (updated !== 1) {
    throw new Error("Protected-entry acceptance could not be bound atomically to the account.");
  }

  await tx.$executeRaw(Prisma.sql`
    INSERT INTO "legal_agreement_events" (
      "id", "acceptanceId", "userId", "organizationId", "eventType",
      "documentKey", "documentVersion", "metadata"
    ) VALUES (
      ${randomUUID()}, ${input.acceptanceId}, NULL, NULL,
      'legal.entry.bound_to_account', ${input.documentKey}, ${input.documentVersion},
      CAST(${JSON.stringify({
        documentSha256: input.documentSha256,
        accountId: input.accountId,
        personId: input.personId,
      })} AS JSONB)
    )
  `);

  return { acceptanceId: input.acceptanceId, created: true };
}
