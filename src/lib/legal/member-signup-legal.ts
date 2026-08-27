import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getLegalDocument } from "@/lib/legal/document-registry";
import type { MemberSignupAcceptanceProof } from "@/lib/auth/free-member-signup";

export class MemberSignupLegalNotReadyError extends Error {
  constructor(message = "Public member signup is waiting for approved baseline legal documents.") {
    super(message);
  }
}

function legalReadiness() {
  const websiteTerms = getLegalDocument("website_terms");
  const privacyPolicy = getLegalDocument("privacy_policy");
  if (!websiteTerms || !privacyPolicy || !websiteTerms.productionApproved || !privacyPolicy.productionApproved) {
    throw new MemberSignupLegalNotReadyError();
  }
  return { websiteTerms, privacyPolicy };
}

function baselinePresentation(name: string) {
  const { websiteTerms, privacyPolicy } = legalReadiness();
  const documentVersion = `terms:${websiteTerms.version}|privacy:${privacyPolicy.version}`;
  const documentSnapshot = [
    "Klinikos member signup baseline clickwrap",
    `Account name: ${name.trim()}`,
    `Website Terms of Use: ${websiteTerms.route} version ${websiteTerms.version}`,
    `Privacy Policy: ${privacyPolicy.route} version ${privacyPolicy.version}`,
    "Acknowledgment: I agree to the Website Terms of Use and acknowledge the Privacy Policy.",
    "Authority boundary: creating a person-level account does not verify identity claims, professional credentials, organization authority, patient access, clinical authority, payment status, Grid eligibility, EDU completion, or any other regulated or commercial entitlement.",
  ].join("\n");
  const documentSha256 = createHash("sha256").update(documentSnapshot).digest("hex");
  return {
    documentKey: "member_signup_baseline" as const,
    documentVersion,
    documentSnapshot,
    documentSha256,
  };
}

export async function recordMemberSignupAcceptance({
  name,
  email,
  acceptedTerms,
  acceptedPrivacy,
  ipAddress,
  userAgent,
}: {
  name: string;
  email: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  ipAddress?: string;
  userAgent?: string;
}): Promise<MemberSignupAcceptanceProof> {
  if (!acceptedTerms || !acceptedPrivacy) {
    throw new Error("Website Terms and Privacy acknowledgment are required.");
  }

  const presentation = baselinePresentation(name);
  const acceptanceId = randomUUID();
  const versionId = randomUUID();
  const idempotencyKey = randomUUID();
  const normalizedEmail = email.trim().toLowerCase();
  const acknowledgments = {
    websiteTerms: true,
    privacyPolicy: true,
    authorityGranted: false,
  };

  await db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "legal_agreement_versions" (
        "id", "documentKey", "documentVersion", "title", "effectiveAt",
        "documentSha256", "documentSnapshot", "requiredAcknowledgments", "status"
      ) VALUES (
        ${versionId}, ${presentation.documentKey}, ${presentation.documentVersion},
        'Klinikos Member Signup Baseline', CURRENT_TIMESTAMP,
        ${presentation.documentSha256}, ${presentation.documentSnapshot},
        CAST(${JSON.stringify(["websiteTerms", "privacyPolicy"])} AS JSONB), 'published'
      )
      ON CONFLICT ("documentKey", "documentVersion") DO NOTHING
    `);

    const registered = await tx.$queryRaw<Array<{ documentSha256: string; documentSnapshot: string }>>(Prisma.sql`
      SELECT "documentSha256", "documentSnapshot"
      FROM "legal_agreement_versions"
      WHERE "documentKey" = ${presentation.documentKey}
        AND "documentVersion" = ${presentation.documentVersion}
      LIMIT 1
      FOR SHARE
    `);
    if (!registered[0]
      || registered[0].documentSha256 !== presentation.documentSha256
      || registered[0].documentSnapshot !== presentation.documentSnapshot) {
      throw new MemberSignupLegalNotReadyError("Published member signup terms do not match the current approved presentation.");
    }

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "access_gate_acceptances" (
        "id", "email", "documentKey", "documentVersion", "acceptedAt",
        "ipAddress", "userAgent", "source", "legalName", "signerCapacity",
        "signatureMethod", "signatureText", "authorityConfirmed",
        "electronicSignatureConsentedAt", "presentedAt", "reachedEndAt",
        "acknowledgedAt", "signedAt", "documentSha256", "documentSnapshot",
        "acknowledgments", "idempotencyKey", "sourceRoute", "status"
      ) VALUES (
        ${acceptanceId}, ${normalizedEmail}, ${presentation.documentKey}, ${presentation.documentVersion}, CURRENT_TIMESTAMP,
        ${ipAddress ?? null}, ${userAgent ?? null}, 'member-signup', ${name.trim()}, 'individual',
        'clickwrap', 'I AGREE', false,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ${presentation.documentSha256}, ${presentation.documentSnapshot},
        CAST(${JSON.stringify(acknowledgments)} AS JSONB), ${idempotencyKey}, '/signup', 'active'
      )
    `);

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "legal_agreement_events" (
        "id", "acceptanceId", "userId", "organizationId", "eventType",
        "documentKey", "documentVersion", "metadata"
      ) VALUES (
        ${randomUUID()}, ${acceptanceId}, NULL, NULL, 'legal.member_signup.accepted',
        ${presentation.documentKey}, ${presentation.documentVersion},
        CAST(${JSON.stringify({
          documentSha256: presentation.documentSha256,
          websiteTermsAccepted: true,
          privacyAcknowledged: true,
          authorityGranted: false,
        })} AS JSONB)
      )
    `);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  return {
    acceptanceId,
    documentKey: presentation.documentKey,
    documentVersion: presentation.documentVersion,
    documentSha256: presentation.documentSha256,
  };
}
