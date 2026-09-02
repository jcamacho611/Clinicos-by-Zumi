import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { MemberSignupAcceptanceEvidence } from "@/lib/legal/member-signup-acceptance";
import { getLegalDocument } from "@/lib/legal/document-registry";

type MemberSignupLegalEvidenceInput = {
  accountId: string;
  personId: string;
  email: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  legalAcceptance: MemberSignupAcceptanceEvidence;
};

type StoredAgreementVersion = {
  id: string;
  documentSha256: string;
  documentSnapshot: string;
};

type StoredMemberAcceptance = {
  id: string;
  accountId: string | null;
  personId: string | null;
  documentKey: string;
  documentVersion: string;
  documentSha256: string | null;
};

const REQUIRED_MEMBER_DOCUMENTS = [
  { documentKey: "website_terms", kind: "agreement", label: "Website Terms" },
  { documentKey: "privacy_policy", kind: "notice", label: "Privacy Policy" },
] as const;

function assertValidMemberSignupLegalEvidence(
  evidence: MemberSignupAcceptanceEvidence,
) {
  const keys = evidence.documents.map((document) => document.documentKey);
  if (
    evidence.documents.length !== REQUIRED_MEMBER_DOCUMENTS.length
    || new Set(keys).size !== REQUIRED_MEMBER_DOCUMENTS.length
    || REQUIRED_MEMBER_DOCUMENTS.some(({ documentKey }) => !keys.includes(documentKey))
  ) {
    throw new Error("Member signup legal evidence must contain exactly the Website Terms and Privacy Policy.");
  }

  for (const expected of REQUIRED_MEMBER_DOCUMENTS) {
    const document = evidence.documents.find((candidate) => candidate.documentKey === expected.documentKey);
    if (!document) {
      throw new Error("Member signup legal evidence must contain exactly the Website Terms and Privacy Policy.");
    }
    if (document.kind !== expected.kind) {
      throw new Error(`${expected.label} must be recorded as an ${expected.kind}.`);
    }

    const definition = getLegalDocument(expected.documentKey);
    if (!definition || document.documentVersion !== definition.version) {
      throw new Error(`${expected.label} version does not match the governed legal document registry.`);
    }
    if (!document.documentSnapshot) {
      throw new Error(`${expected.label} source snapshot is missing.`);
    }

    const computedSha256 = createHash("sha256")
      .update(document.documentSnapshot, "utf8")
      .digest("hex");
    if (computedSha256 !== document.documentSha256) {
      throw new Error(`${expected.label} SHA-256 does not match its source snapshot.`);
    }
  }
}

function assertExistingAcceptanceMatches(
  record: StoredMemberAcceptance,
  input: MemberSignupLegalEvidenceInput,
  document: MemberSignupAcceptanceEvidence["documents"][number],
) {
  if (
    record.accountId !== input.accountId
    || record.personId !== input.personId
    || record.documentKey !== document.documentKey
    || record.documentVersion !== document.documentVersion
    || record.documentSha256 !== document.documentSha256
  ) {
    throw new Error("Member legal evidence idempotency key is bound to different evidence.");
  }
}

async function ensureMemberAgreementVersionRegistered(
  tx: Prisma.TransactionClient,
  document: MemberSignupAcceptanceEvidence["documents"][number],
) {
  const id = randomUUID();
  await tx.$executeRaw(Prisma.sql`
    INSERT INTO "legal_agreement_versions" (
      "id", "documentKey", "documentVersion", "title", "effectiveAt",
      "documentSha256", "documentSnapshot", "requiredAcknowledgments", "status"
    ) VALUES (
      ${id}, ${document.documentKey}, ${document.documentVersion}, ${document.title},
      ${new Date(`${document.effectiveDate}T00:00:00.000Z`)}, ${document.documentSha256},
      ${document.documentSnapshot}, CAST(${JSON.stringify(document.acknowledgments)} AS JSONB), 'published'
    )
    ON CONFLICT ("documentKey", "documentVersion") DO NOTHING
  `);

  const registered = await tx.$queryRaw<StoredAgreementVersion[]>(Prisma.sql`
    SELECT "id", "documentSha256", "documentSnapshot"
    FROM "legal_agreement_versions"
    WHERE "documentKey" = ${document.documentKey}
      AND "documentVersion" = ${document.documentVersion}
    LIMIT 1
  `);

  if (!registered[0]) throw new Error("Member legal agreement version could not be registered.");
  if (
    registered[0].documentSha256 !== document.documentSha256
    || registered[0].documentSnapshot !== document.documentSnapshot
  ) {
    throw new Error("Published member legal agreement version is immutable and does not match the accepted source.");
  }
}

/**
 * Writes Person/Account baseline legal evidence using the existing legal tables. The
 * caller must supply the SAME Prisma transaction that creates the Person and Account;
 * this function must never create its own transaction or identity authority.
 */
export async function recordMemberSignupLegalEvidence(
  tx: Prisma.TransactionClient,
  input: MemberSignupLegalEvidenceInput,
) {
  assertValidMemberSignupLegalEvidence(input.legalAcceptance);

  for (const document of input.legalAcceptance.documents) {
    await ensureMemberAgreementVersionRegistered(tx, document);

    const idempotencyKey = `member:${input.accountId}:${document.documentKey}:${document.documentVersion}`;
    const duplicate = await tx.$queryRaw<StoredMemberAcceptance[]>(Prisma.sql`
      SELECT "id", "accountId", "personId", "documentKey", "documentVersion", "documentSha256"
      FROM "access_gate_acceptances"
      WHERE "idempotencyKey" = ${idempotencyKey}
      LIMIT 1
    `);
    if (duplicate[0]) {
      assertExistingAcceptanceMatches(duplicate[0], input, document);
      continue;
    }

    const acceptanceId = randomUUID();
    const now = new Date();
    const signatureMethod = document.kind === "agreement" ? "clickwrap" : "acknowledgment";
    const inserted = await tx.$queryRaw<StoredMemberAcceptance[]>(Prisma.sql`
      INSERT INTO "access_gate_acceptances" (
        "id", "email", "documentKey", "documentVersion", "acceptedAt", "ipAddress", "userAgent",
        "source", "personId", "accountId", "signerCapacity", "signatureMethod",
        "authorityConfirmed", "electronicSignatureConsentedAt", "acknowledgedAt", "signedAt",
        "documentSha256", "documentSnapshot", "acknowledgments", "sessionId", "idempotencyKey",
        "sourceRoute", "status"
      ) VALUES (
        ${acceptanceId}, ${input.email}, ${document.documentKey}, ${document.documentVersion}, ${now},
        ${input.ipAddress ?? null}, ${input.userAgent ?? null}, 'member-signup', ${input.personId}, ${input.accountId},
        'individual', ${signatureMethod}, false,
        NULL, ${now}, NULL,
        ${document.documentSha256}, ${document.documentSnapshot},
        CAST(${JSON.stringify(document.acknowledgments)} AS JSONB), ${input.sessionId}, ${idempotencyKey},
        '/signup', 'active'
      )
      ON CONFLICT DO NOTHING
      RETURNING "id", "accountId", "personId", "documentKey", "documentVersion", "documentSha256"
    `);

    let acceptance = inserted[0];
    if (!acceptance) {
      const concurrent = await tx.$queryRaw<StoredMemberAcceptance[]>(Prisma.sql`
        SELECT "id", "accountId", "personId", "documentKey", "documentVersion", "documentSha256"
        FROM "access_gate_acceptances"
        WHERE "idempotencyKey" = ${idempotencyKey}
        LIMIT 1
      `);
      if (!concurrent[0]) throw new Error("Member legal acceptance could not be recorded safely.");
      assertExistingAcceptanceMatches(concurrent[0], input, document);
      acceptance = concurrent[0];
    }

    if (inserted[0]) {
      const eventType = document.kind === "agreement"
        ? "legal.member.agreement.accepted"
        : "legal.member.notice.acknowledged";
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "legal_agreement_events" (
          "id", "acceptanceId", "userId", "organizationId", "personId", "accountId", "eventType",
          "documentKey", "documentVersion", "metadata"
        ) VALUES (
          ${randomUUID()}, ${acceptance.id}, NULL, NULL, ${input.personId}, ${input.accountId}, ${eventType},
          ${document.documentKey}, ${document.documentVersion},
          CAST(${JSON.stringify({
            sourceRoute: "/signup",
            signatureMethod,
            documentSha256: document.documentSha256,
          })} AS JSONB)
        )
      `);
    }
  }
}
