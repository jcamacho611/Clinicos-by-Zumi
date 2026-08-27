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

type BindingRow = {
  id: string;
  acceptanceId: string;
  accountId: string;
  personId: string;
  documentKey: string;
  documentVersion: string;
  documentSha256: string;
};

function sameBinding(row: BindingRow, input: AccountAcceptanceBindingInput) {
  return row.acceptanceId === input.acceptanceId
    && row.accountId === input.accountId
    && row.personId === input.personId
    && row.documentKey === input.documentKey
    && row.documentVersion === input.documentVersion
    && row.documentSha256 === input.documentSha256;
}

export async function bindAcceptanceToAccountIdentity(
  input: AccountAcceptanceBindingInput,
  tx: LegalBindingClient = db,
) {
  const acceptanceRows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "access_gate_acceptances"
    WHERE "id" = ${input.acceptanceId}
      AND "documentKey" = ${input.documentKey}
      AND "documentVersion" = ${input.documentVersion}
      AND "documentSha256" = ${input.documentSha256}
      AND "status" = 'active'
      AND "userId" IS NULL
      AND "organizationId" IS NULL
      AND "signedAt" IS NOT NULL
      AND "electronicSignatureConsentedAt" IS NOT NULL
    LIMIT 2
    FOR SHARE
  `);

  if (acceptanceRows.length !== 1) {
    throw new Error("Agreement acceptance is missing, already authority-bound, or ambiguous.");
  }

  const existing = await tx.$queryRaw<BindingRow[]>(Prisma.sql`
    SELECT "id", "acceptanceId", "accountId", "personId", "documentKey", "documentVersion", "documentSha256"
    FROM "account_entry_acceptance_bindings"
    WHERE "acceptanceId" = ${input.acceptanceId}
    LIMIT 1
    FOR SHARE
  `);

  if (existing[0]) {
    if (!sameBinding(existing[0], input)) {
      throw new Error("Agreement acceptance is already bound to another account identity.");
    }
    return { acceptanceId: input.acceptanceId, bindingId: existing[0].id, created: false };
  }

  const bindingId = randomUUID();
  const inserted = await tx.$queryRaw<BindingRow[]>(Prisma.sql`
    INSERT INTO "account_entry_acceptance_bindings" (
      "id", "acceptanceId", "accountId", "personId", "documentKey", "documentVersion", "documentSha256", "boundAt"
    ) VALUES (
      ${bindingId}, ${input.acceptanceId}, ${input.accountId}, ${input.personId},
      ${input.documentKey}, ${input.documentVersion}, ${input.documentSha256}, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("acceptanceId") DO NOTHING
    RETURNING "id", "acceptanceId", "accountId", "personId", "documentKey", "documentVersion", "documentSha256"
  `);

  if (!inserted[0]) {
    const concurrent = await tx.$queryRaw<BindingRow[]>(Prisma.sql`
      SELECT "id", "acceptanceId", "accountId", "personId", "documentKey", "documentVersion", "documentSha256"
      FROM "account_entry_acceptance_bindings"
      WHERE "acceptanceId" = ${input.acceptanceId}
      LIMIT 1
      FOR SHARE
    `);
    if (!concurrent[0] || !sameBinding(concurrent[0], input)) {
      throw new Error("Concurrent agreement binding conflicts with this account identity.");
    }
    return { acceptanceId: input.acceptanceId, bindingId: concurrent[0].id, created: false };
  }

  await tx.$executeRaw(Prisma.sql`
    INSERT INTO "legal_agreement_events" (
      "id", "acceptanceId", "userId", "organizationId", "eventType",
      "documentKey", "documentVersion", "metadata"
    ) VALUES (
      ${randomUUID()}, ${input.acceptanceId}, NULL, NULL,
      'legal.acceptance.bound_to_account', ${input.documentKey}, ${input.documentVersion},
      CAST(${JSON.stringify({
        documentSha256: input.documentSha256,
        accountId: input.accountId,
        personId: input.personId,
        bindingId,
      })} AS JSONB)
    )
  `);

  return { acceptanceId: input.acceptanceId, bindingId, created: true };
}
