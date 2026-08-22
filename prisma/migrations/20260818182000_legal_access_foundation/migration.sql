-- Klinikos legal-access foundation.
-- This migration deliberately extends the existing access-gate evidence table rather
-- than replacing the current identity, organization, audit, or document systems.
-- Executed agreement evidence is retained independently of user/org deletion so a
-- historical contract record is not destroyed by an unrelated account lifecycle.

CREATE TABLE IF NOT EXISTS "legal_agreement_versions" (
  "id" TEXT NOT NULL,
  "documentKey" TEXT NOT NULL,
  "documentVersion" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "effectiveAt" TIMESTAMP(3) NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "documentSha256" TEXT NOT NULL,
  "documentSnapshot" TEXT NOT NULL,
  "requiredAcknowledgments" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "status" TEXT NOT NULL DEFAULT 'published',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "legal_agreement_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "legal_agreement_versions_key_version_key"
  ON "legal_agreement_versions"("documentKey", "documentVersion");
CREATE INDEX IF NOT EXISTS "legal_agreement_versions_key_status_idx"
  ON "legal_agreement_versions"("documentKey", "status");
CREATE INDEX IF NOT EXISTS "legal_agreement_versions_sha_idx"
  ON "legal_agreement_versions"("documentSha256");

ALTER TABLE "access_gate_acceptances"
  ADD COLUMN IF NOT EXISTS "userId" TEXT,
  ADD COLUMN IF NOT EXISTS "organizationId" TEXT,
  ADD COLUMN IF NOT EXISTS "legalName" TEXT,
  ADD COLUMN IF NOT EXISTS "signerTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "signerCapacity" TEXT NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS "signerCountry" TEXT,
  ADD COLUMN IF NOT EXISTS "signerRegion" TEXT,
  ADD COLUMN IF NOT EXISTS "signatureMethod" TEXT,
  ADD COLUMN IF NOT EXISTS "signatureText" TEXT,
  ADD COLUMN IF NOT EXISTS "authorityConfirmed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "electronicSignatureConsentedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "presentedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "firstViewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reachedEndAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "acknowledgedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "signedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "documentSha256" TEXT,
  ADD COLUMN IF NOT EXISTS "documentSnapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "acknowledgments" JSONB,
  ADD COLUMN IF NOT EXISTS "sessionId" TEXT,
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceRoute" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "supersededAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "supersededById" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "access_gate_acceptances_idempotency_key"
  ON "access_gate_acceptances"("idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "access_gate_acceptances_user_org_active_version_key"
  ON "access_gate_acceptances"("userId", "organizationId", "documentKey", "documentVersion")
  WHERE "userId" IS NOT NULL AND "organizationId" IS NOT NULL AND "status" = 'active';
CREATE INDEX IF NOT EXISTS "access_gate_acceptances_user_idx"
  ON "access_gate_acceptances"("userId", "acceptedAt");
CREATE INDEX IF NOT EXISTS "access_gate_acceptances_org_idx"
  ON "access_gate_acceptances"("organizationId", "acceptedAt");
CREATE INDEX IF NOT EXISTS "access_gate_acceptances_sha_idx"
  ON "access_gate_acceptances"("documentSha256");

CREATE TABLE IF NOT EXISTS "legal_agreement_events" (
  "id" TEXT NOT NULL,
  "acceptanceId" TEXT,
  "userId" TEXT,
  "organizationId" TEXT,
  "eventType" TEXT NOT NULL,
  "documentKey" TEXT NOT NULL,
  "documentVersion" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "legal_agreement_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "legal_agreement_events_acceptance_idx"
  ON "legal_agreement_events"("acceptanceId", "occurredAt");
CREATE INDEX IF NOT EXISTS "legal_agreement_events_user_idx"
  ON "legal_agreement_events"("userId", "occurredAt");
CREATE INDEX IF NOT EXISTS "legal_agreement_events_org_idx"
  ON "legal_agreement_events"("organizationId", "occurredAt");
CREATE INDEX IF NOT EXISTS "legal_agreement_events_type_idx"
  ON "legal_agreement_events"("eventType", "occurredAt");
