import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import {
  agreementPlainText,
  agreementSha256,
  type AgreementAcknowledgment,
  type AgreementPresentation,
} from "@/lib/legal/global-agreement";

export interface LegalAcceptanceRecord {
  id: string;
  email: string;
  userId: string | null;
  organizationId: string | null;
  documentKey: string;
  documentVersion: string;
  legalName: string | null;
  signerTitle: string | null;
  signerCapacity: string;
  signerCountry: string | null;
  signerRegion: string | null;
  signatureMethod: string | null;
  signatureText: string | null;
  authorityConfirmed: boolean;
  presentedAt: Date | null;
  reachedEndAt: Date | null;
  acknowledgedAt: Date | null;
  signedAt: Date | null;
  acceptedAt: Date;
  documentSha256: string | null;
  documentSnapshot: string | null;
  acknowledgments: unknown;
  sourceRoute: string | null;
  status: string;
  ipAddress: string | null;
  userAgent: string | null;
}

interface StoredAgreementVersion {
  id: string;
  documentSha256: string;
  documentSnapshot: string;
  status: string;
}

interface CreateAcceptanceInput {
  session: ClinicSession;
  agreement: AgreementPresentation;
  legalName: string;
  signerTitle?: string;
  signerCapacity: "individual" | "organization_representative";
  signerCountry: string;
  signerRegion?: string;
  signatureText: string;
  authorityConfirmed: boolean;
  acknowledgments: Record<string, boolean>;
  presentedAt: Date;
  reachedEndAt: Date;
  signedAt: Date;
  idempotencyKey: string;
  sourceRoute?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function ensureAgreementVersionRegistered(
  agreement: AgreementPresentation,
  requiredAcknowledgments: AgreementAcknowledgment[],
) {
  const snapshot = agreementPlainText(agreement);
  const sha256 = agreementSha256(agreement);
  const existing = await db.$queryRaw<StoredAgreementVersion[]>(Prisma.sql`
    SELECT "id", "documentSha256", "documentSnapshot", "status"
    FROM "legal_agreement_versions"
    WHERE "documentKey" = ${agreement.documentKey}
      AND "documentVersion" = ${agreement.documentVersion}
    LIMIT 1
  `);

  if (existing[0]) {
    if (existing[0].documentSha256 !== sha256 || existing[0].documentSnapshot !== snapshot) {
      throw new Error("Published legal agreement version is immutable and does not match the current source text.");
    }
    return { id: existing[0].id, documentSha256: sha256, documentSnapshot: snapshot };
  }

  const id = randomUUID();
  await db.$executeRaw(Prisma.sql`
    INSERT INTO "legal_agreement_versions" (
      "id", "documentKey", "documentVersion", "title", "effectiveAt",
      "documentSha256", "documentSnapshot", "requiredAcknowledgments", "status"
    ) VALUES (
      ${id}, ${agreement.documentKey}, ${agreement.documentVersion}, ${agreement.title},
      ${new Date(`${agreement.effectiveDate}T00:00:00.000Z`)}, ${sha256}, ${snapshot},
      CAST(${JSON.stringify(requiredAcknowledgments)} AS JSONB), 'published'
    )
  `);

  return { id, documentSha256: sha256, documentSnapshot: snapshot };
}

export async function hasCurrentAgreementAcceptance(
  session: ClinicSession,
  agreement: AgreementPresentation,
) {
  if (session.demo || !process.env.DATABASE_URL) return false;
  const sha256 = agreementSha256(agreement);
  try {
    const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id"
      FROM "access_gate_acceptances"
      WHERE "userId" = ${session.userId}
        AND "organizationId" = ${session.organizationId}
        AND "documentKey" = ${agreement.documentKey}
        AND "documentVersion" = ${agreement.documentVersion}
        AND "documentSha256" = ${sha256}
        AND "status" = 'active'
        AND "signedAt" IS NOT NULL
        AND "electronicSignatureConsentedAt" IS NOT NULL
      LIMIT 1
    `);
    return Boolean(rows[0]);
  } catch {
    return false;
  }
}

export async function recordLegalEvent({
  session,
  eventType,
  agreement,
  acceptanceId,
  metadata = {},
}: {
  session: ClinicSession;
  eventType: string;
  agreement: AgreementPresentation;
  acceptanceId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const id = randomUUID();
  await db.$executeRaw(Prisma.sql`
    INSERT INTO "legal_agreement_events" (
      "id", "acceptanceId", "userId", "organizationId", "eventType",
      "documentKey", "documentVersion", "metadata"
    ) VALUES (
      ${id}, ${acceptanceId ?? null}, ${session.userId}, ${session.organizationId}, ${eventType},
      ${agreement.documentKey}, ${agreement.documentVersion}, CAST(${JSON.stringify(metadata)} AS JSONB)
    )
  `);

  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: eventType,
      resourceType: "legal_agreement",
      resourceId: acceptanceId ?? `${agreement.documentKey}:${agreement.documentVersion}`,
      metadata: {
        documentKey: agreement.documentKey,
        documentVersion: agreement.documentVersion,
        documentSha256: agreementSha256(agreement),
        ...metadata,
      },
    },
  }).catch(() => undefined);
}

export async function createLegalAcceptance(input: CreateAcceptanceInput): Promise<LegalAcceptanceRecord> {
  const snapshot = agreementPlainText(input.agreement);
  const sha256 = agreementSha256(input.agreement);

  return db.$transaction(async (tx) => {
    const current = await tx.$queryRaw<LegalAcceptanceRecord[]>(Prisma.sql`
      SELECT *
      FROM "access_gate_acceptances"
      WHERE "userId" = ${input.session.userId}
        AND "organizationId" = ${input.session.organizationId}
        AND "documentKey" = ${input.agreement.documentKey}
        AND "documentVersion" = ${input.agreement.documentVersion}
        AND "documentSha256" = ${sha256}
        AND "status" = 'active'
        AND "signedAt" IS NOT NULL
      LIMIT 1
    `);
    if (current[0]) return current[0];

    const duplicate = await tx.$queryRaw<LegalAcceptanceRecord[]>(Prisma.sql`
      SELECT * FROM "access_gate_acceptances"
      WHERE "idempotencyKey" = ${input.idempotencyKey}
      LIMIT 1
    `);
    if (duplicate[0]) {
      if (
        duplicate[0].userId !== input.session.userId ||
        duplicate[0].documentKey !== input.agreement.documentKey ||
        duplicate[0].documentVersion !== input.agreement.documentVersion ||
        duplicate[0].documentSha256 !== sha256
      ) {
        throw new Error("Idempotency key is already bound to different legal evidence.");
      }
      return duplicate[0];
    }

    const id = randomUUID();
    const inserted = await tx.$queryRaw<LegalAcceptanceRecord[]>(Prisma.sql`
      INSERT INTO "access_gate_acceptances" (
        "id", "email", "documentKey", "documentVersion", "acceptedAt", "verifiedEmailAt",
        "ipAddress", "userAgent", "source", "userId", "organizationId", "legalName",
        "signerTitle", "signerCapacity", "signerCountry", "signerRegion", "signatureMethod",
        "signatureText", "authorityConfirmed", "electronicSignatureConsentedAt", "presentedAt",
        "firstViewedAt", "reachedEndAt", "acknowledgedAt", "signedAt", "documentSha256",
        "documentSnapshot", "acknowledgments", "sessionId", "idempotencyKey", "sourceRoute", "status"
      ) VALUES (
        ${id}, ${input.session.email}, ${input.agreement.documentKey}, ${input.agreement.documentVersion},
        ${input.signedAt}, ${input.signedAt}, ${input.ipAddress ?? null}, ${input.userAgent ?? null},
        'authenticated-legal-gate', ${input.session.userId}, ${input.session.organizationId}, ${input.legalName},
        ${input.signerTitle ?? null}, ${input.signerCapacity}, ${input.signerCountry}, ${input.signerRegion ?? null},
        'typed', ${input.signatureText}, ${input.authorityConfirmed}, ${input.signedAt}, ${input.presentedAt},
        ${input.presentedAt}, ${input.reachedEndAt}, ${input.signedAt}, ${input.signedAt}, ${sha256}, ${snapshot},
        CAST(${JSON.stringify(input.acknowledgments)} AS JSONB), ${input.session.sessionId}, ${input.idempotencyKey},
        ${input.sourceRoute ?? null}, 'active'
      )
      RETURNING *
    `);

    if (!inserted[0]) throw new Error("Legal acceptance could not be recorded.");
    return inserted[0];
  });
}

export async function listUserLegalAcceptances(session: ClinicSession) {
  if (session.demo || !process.env.DATABASE_URL) return [];
  return db.$queryRaw<LegalAcceptanceRecord[]>(Prisma.sql`
    SELECT * FROM "access_gate_acceptances"
    WHERE "userId" = ${session.userId}
    ORDER BY "acceptedAt" DESC
  `);
}

export async function getUserLegalAcceptance(session: ClinicSession, acceptanceId: string) {
  if (session.demo || !process.env.DATABASE_URL) return null;
  const rows = await db.$queryRaw<LegalAcceptanceRecord[]>(Prisma.sql`
    SELECT * FROM "access_gate_acceptances"
    WHERE "id" = ${acceptanceId} AND "userId" = ${session.userId}
    LIMIT 1
  `);
  return rows[0] ?? null;
}

export async function listOrganizationLegalAcceptances(session: ClinicSession) {
  if (session.demo || !process.env.DATABASE_URL) return [];
  return db.$queryRaw<Array<Omit<LegalAcceptanceRecord, "signatureText" | "documentSnapshot">>>(Prisma.sql`
    SELECT
      "id", "email", "userId", "organizationId", "documentKey", "documentVersion", "legalName",
      "signerTitle", "signerCapacity", "signerCountry", "signerRegion", "signatureMethod",
      "authorityConfirmed", "presentedAt", "reachedEndAt", "acknowledgedAt", "signedAt", "acceptedAt",
      "documentSha256", "acknowledgments", "sourceRoute", "status", "ipAddress", "userAgent"
    FROM "access_gate_acceptances"
    WHERE "organizationId" = ${session.organizationId}
    ORDER BY "acceptedAt" DESC
  `);
}
