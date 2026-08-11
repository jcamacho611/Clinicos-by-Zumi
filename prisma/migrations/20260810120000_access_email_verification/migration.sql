-- Access gate email verification.
-- The verification service and the verified-email gate were added to the
-- application without a matching migration, so this backfills the table and
-- column they already depend on.

ALTER TABLE "access_gate_acceptances"
  ADD COLUMN IF NOT EXISTS "verifiedEmailAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "access_gate_acceptances_verifiedEmailAt_idx"
  ON "access_gate_acceptances"("verifiedEmailAt");

CREATE TABLE IF NOT EXISTS "access_email_verifications" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "acceptanceId" TEXT NOT NULL,
  "documentVersion" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "requestedIpAddress" TEXT,
  "requestedUserAgent" TEXT,
  "verifiedIpAddress" TEXT,
  "verifiedUserAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "access_email_verifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "access_email_verifications_tokenHash_key"
  ON "access_email_verifications"("tokenHash");
CREATE INDEX IF NOT EXISTS "access_email_verifications_email_status_idx"
  ON "access_email_verifications"("email", "status");
CREATE INDEX IF NOT EXISTS "access_email_verifications_acceptanceId_idx"
  ON "access_email_verifications"("acceptanceId");
CREATE INDEX IF NOT EXISTS "access_email_verifications_expiresAt_idx"
  ON "access_email_verifications"("expiresAt");

ALTER TABLE "access_email_verifications"
  DROP CONSTRAINT IF EXISTS "access_email_verifications_acceptanceId_fkey";
ALTER TABLE "access_email_verifications"
  ADD CONSTRAINT "access_email_verifications_acceptanceId_fkey"
  FOREIGN KEY ("acceptanceId") REFERENCES "access_gate_acceptances"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Only the four states the verification service writes are storable, and a
-- verified row must carry its verification timestamp.
--
-- Added NOT VALID deliberately. This migration exists precisely because the table
-- was created by `db push` before it had a migration, so a deployed database may
-- already hold rows these rules would reject. A plain ADD CONSTRAINT scans the whole
-- table and aborts on the first offender, which would stop `migrate deploy` partway
-- through — verified by applying this file to a database seeded with a legacy
-- 'consumed' row, which failed with "is violated by some row".
--
-- NOT VALID skips only the retroactive scan. Postgres still enforces both rules on
-- every INSERT and UPDATE, so no new row can violate them and no legacy row can be
-- edited into a worse state. Once any pre-existing rows are reconciled, these can be
-- promoted with VALIDATE CONSTRAINT, which takes no exclusive lock.
ALTER TABLE "access_email_verifications"
  DROP CONSTRAINT IF EXISTS "access_email_verifications_status_check";
ALTER TABLE "access_email_verifications"
  ADD CONSTRAINT "access_email_verifications_status_check"
  CHECK ("status" IN ('pending', 'verified', 'expired', 'revoked')) NOT VALID;

ALTER TABLE "access_email_verifications"
  DROP CONSTRAINT IF EXISTS "access_email_verifications_verified_evidence_check";
ALTER TABLE "access_email_verifications"
  ADD CONSTRAINT "access_email_verifications_verified_evidence_check"
  CHECK ("status" <> 'verified' OR "verifiedAt" IS NOT NULL) NOT VALID;
