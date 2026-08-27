-- Durable, non-authoritative abuse throttling for public mutation endpoints.
-- Raw IP addresses and email addresses are never persisted here. Application code
-- stores only server-keyed HMAC digests scoped to a named public mutation.

CREATE TABLE "public_mutation_rate_limits" (
  "scope" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "windowStart" TIMESTAMPTZ NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "public_mutation_rate_limits_pkey"
    PRIMARY KEY ("scope", "keyHash", "windowStart"),
  CONSTRAINT "public_mutation_rate_limits_attemptCount_check"
    CHECK ("attemptCount" > 0)
);

CREATE INDEX "public_mutation_rate_limits_expiresAt_idx"
  ON "public_mutation_rate_limits" ("expiresAt");
