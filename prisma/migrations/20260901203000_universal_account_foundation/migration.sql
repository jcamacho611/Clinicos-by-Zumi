-- Additive person-level authentication substrate for Living Universe free entry.
--
-- This migration does not alter legacy clinic users, organizations, memberships,
-- patient portal authentication, professional authority, Grid eligibility, or
-- any clinical/financial state. Backfill/cutover is deliberately deferred until
-- a separately witnessed RED contract proves the compatibility behavior.

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "primaryEmail" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "account_credentials" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mustReset" BOOLEAN NOT NULL DEFAULT false,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "account_credentials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "account_sessions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "account_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "legacy_user_account_links" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "legacyUserId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'legacy_user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "legacy_user_account_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "account_events" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceReference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accounts_personId_key" ON "accounts"("personId");
CREATE UNIQUE INDEX "accounts_primaryEmail_key" ON "accounts"("primaryEmail");
CREATE INDEX "accounts_status_idx" ON "accounts"("status");
CREATE UNIQUE INDEX "account_credentials_accountId_key" ON "account_credentials"("accountId");
CREATE INDEX "account_sessions_accountId_revokedAt_expiresAt_idx" ON "account_sessions"("accountId", "revokedAt", "expiresAt");
CREATE UNIQUE INDEX "legacy_user_account_links_legacyUserId_key" ON "legacy_user_account_links"("legacyUserId");
CREATE INDEX "legacy_user_account_links_accountId_idx" ON "legacy_user_account_links"("accountId");
CREATE INDEX "account_events_accountId_createdAt_idx" ON "account_events"("accountId", "createdAt");
CREATE INDEX "account_events_eventType_createdAt_idx" ON "account_events"("eventType", "createdAt");

ALTER TABLE "accounts"
  ADD CONSTRAINT "accounts_personId_fkey"
  FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "account_credentials"
  ADD CONSTRAINT "account_credentials_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "account_sessions"
  ADD CONSTRAINT "account_sessions_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "legacy_user_account_links"
  ADD CONSTRAINT "legacy_user_account_links_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "account_events"
  ADD CONSTRAINT "account_events_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
