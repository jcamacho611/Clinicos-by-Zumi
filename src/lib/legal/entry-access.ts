import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { agreementPlainText, agreementSha256, type AgreementPresentation } from "@/lib/legal/global-agreement";
import { buildEntryAgreement } from "@/lib/legal/entry-agreement";
import { getLegalConfigurationStatus } from "@/lib/legal/legal-config";
import { ENTRY_GATE_COOKIE_NAME, type EntryTokenClaims, verifyEntryToken } from "@/lib/legal/entry-token";

export type AnonymousEntryAcceptance = {
  id: string;
  documentKey: string;
  documentVersion: string;
  documentSha256: string;
  acceptedAt: Date;
  sessionId: string;
};

type EntryAcceptanceRow = AnonymousEntryAcceptance & {
  userId: string | null;
  organizationId: string | null;
  status: string;
  signedAt: Date | null;
  electronicSignatureConsentedAt: Date | null;
};

export type AcceptedEntryProof = {
  claims: EntryTokenClaims;
  acceptance: AnonymousEntryAcceptance;
};

export async function createAnonymousEntryAcceptance(input: {
  entrySessionId: string;
  agreement: AgreementPresentation;
  acknowledgments: Record<string, boolean>;
  presentedAt: Date;
  reachedEndAt: Date;
  acceptedAt: Date;
  idempotencyKey: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<AnonymousEntryAcceptance> {
  const snapshot = agreementPlainText(input.agreement);
  const sha256 = agreementSha256(input.agreement);

  return db.$transaction(async (tx) => {
    const duplicate = await tx.$queryRaw<EntryAcceptanceRow[]>(Prisma.sql`
      SELECT "id", "documentKey", "documentVersion", "documentSha256", "acceptedAt", "sessionId",
             "userId", "organizationId", "status", "signedAt", "electronicSignatureConsentedAt"
      FROM "access_gate_acceptances"
      WHERE "idempotencyKey" = ${input.idempotencyKey}
      LIMIT 1
    `);
    if (duplicate[0]) {
      const row = duplicate[0];
      if (
        row.sessionId !== input.entrySessionId ||
        row.documentKey !== input.agreement.documentKey ||
        row.documentVersion !== input.agreement.documentVersion ||
        row.documentSha256 !== sha256 ||
        row.status !== "active" || !row.signedAt || !row.electronicSignatureConsentedAt
      ) throw new Error("Entry idempotency key is already bound to different evidence.");
      return row;
    }

    const id = randomUUID();
    const inserted = await tx.$queryRaw<EntryAcceptanceRow[]>(Prisma.sql`
      INSERT INTO "access_gate_acceptances" (
        "id", "email", "documentKey", "documentVersion", "acceptedAt",
        "ipAddress", "userAgent", "source", "userId", "organizationId", "legalName",
        "signerTitle", "signerCapacity", "signerCountry", "signerRegion", "signatureMethod",
        "signatureText", "authorityConfirmed", "electronicSignatureConsentedAt", "presentedAt",
        "firstViewedAt", "reachedEndAt", "acknowledgedAt", "signedAt", "documentSha256",
        "documentSnapshot", "acknowledgments", "sessionId", "idempotencyKey", "sourceRoute", "status"
      ) VALUES (
        ${id}, '', ${input.agreement.documentKey}, ${input.agreement.documentVersion}, ${input.acceptedAt},
        ${input.ipAddress ?? null}, ${input.userAgent ?? null}, 'protected-entry-gate', NULL, NULL, NULL,
        NULL, 'individual', NULL, NULL, 'clickwrap', NULL, false, ${input.acceptedAt}, ${input.presentedAt},
        ${input.presentedAt}, ${input.reachedEndAt}, ${input.acceptedAt}, ${input.acceptedAt}, ${sha256}, ${snapshot},
        CAST(${JSON.stringify(input.acknowledgments)} AS JSONB), ${input.entrySessionId}, ${input.idempotencyKey},
        '/access', 'active'
      )
      ON CONFLICT DO NOTHING
      RETURNING "id", "documentKey", "documentVersion", "documentSha256", "acceptedAt", "sessionId",
                "userId", "organizationId", "status", "signedAt", "electronicSignatureConsentedAt"
    `);
    if (!inserted[0]) throw new Error("Protected entry acceptance could not be recorded safely.");

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "legal_agreement_events" (
        "id", "acceptanceId", "userId", "organizationId", "eventType",
        "documentKey", "documentVersion", "metadata"
      ) VALUES (
        ${randomUUID()}, ${inserted[0].id}, NULL, NULL, 'legal.entry.accepted_anonymous',
        ${input.agreement.documentKey}, ${input.agreement.documentVersion},
        CAST(${JSON.stringify({ documentSha256: sha256, signatureMethod: "clickwrap", entrySessionId: input.entrySessionId })} AS JSONB)
      )
    `);
    return inserted[0];
  });
}

export async function findAnonymousEntryAcceptance(input: { acceptanceId: string; entrySessionId: string; agreement: AgreementPresentation }) {
  const sha256 = agreementSha256(input.agreement);
  const rows = await db.$queryRaw<EntryAcceptanceRow[]>(Prisma.sql`
    SELECT "id", "documentKey", "documentVersion", "documentSha256", "acceptedAt", "sessionId",
           "userId", "organizationId", "status", "signedAt", "electronicSignatureConsentedAt"
    FROM "access_gate_acceptances"
    WHERE "id" = ${input.acceptanceId}
      AND "sessionId" = ${input.entrySessionId}
      AND "documentKey" = ${input.agreement.documentKey}
      AND "documentVersion" = ${input.agreement.documentVersion}
      AND "documentSha256" = ${sha256}
      AND "status" = 'active'
      AND "userId" IS NULL
      AND "organizationId" IS NULL
      AND "signedAt" IS NOT NULL
      AND "electronicSignatureConsentedAt" IS NOT NULL
    LIMIT 1
  `);
  return rows[0] ?? null;
}

export async function readAcceptedEntryProof(): Promise<AcceptedEntryProof | null> {
  if (!process.env.DATABASE_URL) return null;
  const legal = getLegalConfigurationStatus();
  if (!legal.ready) return null;
  const agreement = buildEntryAgreement(legal.config);
  const identity = {
    documentKey: agreement.documentKey,
    documentVersion: agreement.documentVersion,
    documentSha256: agreementSha256(agreement),
  };
  const cookieStore = await cookies();
  const token = cookieStore.get(ENTRY_GATE_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const claims = await verifyEntryToken(token, identity, "accepted");
    if (!claims.acceptanceId) return null;
    const acceptance = await findAnonymousEntryAcceptance({
      acceptanceId: claims.acceptanceId,
      entrySessionId: claims.entrySessionId,
      agreement,
    });
    return acceptance ? { claims, acceptance } : null;
  } catch {
    return null;
  }
}
