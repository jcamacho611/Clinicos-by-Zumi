-- Durable, privacy-minimized admission buckets for public mutations.
--
-- Keys are HMAC digests produced server-side. Raw email addresses, IP addresses,
-- prompts, patient data, credentials, and request bodies never belong in this table.
CREATE TABLE "public_mutation_rate_limits" (
  "scope" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "public_mutation_rate_limits_pkey"
    PRIMARY KEY ("scope", "keyHash", "windowStart")
);

CREATE INDEX "public_mutation_rate_limits_expiry_idx"
  ON "public_mutation_rate_limits"("expiresAt");
