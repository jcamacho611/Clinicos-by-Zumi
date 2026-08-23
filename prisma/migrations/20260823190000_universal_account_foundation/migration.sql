-- Canonical person-level account foundation.
--
-- Additive only. Legacy users/auth_credentials/auth_sessions remain intact until a
-- separately verified cutover retires them. Account itself carries no organization
-- authority; clinic context continues to require a real legacy user + organization
-- relationship during the compatibility period.

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
CREATE INDEX "account_sessions_accountId_revokedAt_expiresAt_idx"
    ON "account_sessions"("accountId", "revokedAt", "expiresAt");
CREATE UNIQUE INDEX "legacy_user_account_links_legacyUserId_key"
    ON "legacy_user_account_links"("legacyUserId");
CREATE INDEX "legacy_user_account_links_accountId_idx"
    ON "legacy_user_account_links"("accountId");
CREATE INDEX "account_events_accountId_createdAt_idx"
    ON "account_events"("accountId", "createdAt");
CREATE INDEX "account_events_eventType_createdAt_idx"
    ON "account_events"("eventType", "createdAt");

ALTER TABLE "accounts"
    ADD CONSTRAINT "accounts_personId_fkey"
    FOREIGN KEY ("personId") REFERENCES "people"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "account_credentials"
    ADD CONSTRAINT "account_credentials_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "accounts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "account_sessions"
    ADD CONSTRAINT "account_sessions_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "accounts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "legacy_user_account_links"
    ADD CONSTRAINT "legacy_user_account_links_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "accounts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "account_events"
    ADD CONSTRAINT "account_events_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "accounts"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Fail closed if a legacy user does not resolve to exactly one Person membership in
-- its current authoritative User.organizationId. Do not guess which Person owns an
-- account when relationship history is ambiguous or incomplete.
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM "users" u
    WHERE (
        SELECT COUNT(*)
        FROM "organization_memberships" om
        WHERE om."legacyUserId" = u."id"
          AND om."organizationId" = u."organizationId"
          AND om."personId" = 'person_' || u."id"
    ) <> 1;

    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Universal account backfill aborted: % legacy user(s) lack one deterministic Person/current-organization mapping.', invalid_count;
    END IF;
END $$;

-- User.email is globally unique in the current legacy model. Normalize it for the
-- canonical Account and fail rather than silently merge two identities if unexpected
-- case-only duplicates exist in production-shaped data.
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT LOWER(TRIM("email")) AS normalized_email
        FROM "users"
        GROUP BY LOWER(TRIM("email"))
        HAVING COUNT(*) > 1
    ) duplicates;

    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Universal account backfill aborted: % normalized email collision(s) require manual identity resolution.', duplicate_count;
    END IF;
END $$;

-- Backfill one canonical Account per existing legacy user through the Person anchor.
INSERT INTO "accounts" (
    "id",
    "personId",
    "primaryEmail",
    "displayName",
    "status",
    "emailVerifiedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    'account_' || u."id",
    om."personId",
    LOWER(TRIM(u."email")),
    u."name",
    u."status",
    NULL,
    u."createdAt",
    u."updatedAt"
FROM "users" u
JOIN "organization_memberships" om
  ON om."legacyUserId" = u."id"
 AND om."organizationId" = u."organizationId"
 AND om."personId" = 'person_' || u."id";

INSERT INTO "legacy_user_account_links" (
    "id",
    "accountId",
    "legacyUserId",
    "sourceType",
    "createdAt"
)
SELECT
    'account_link_' || u."id",
    'account_' || u."id",
    u."id",
    'legacy_user',
    u."createdAt"
FROM "users" u;

-- Copy the exact persisted password hash and security/reset state. We do not possess
-- or reconstruct plaintext passwords, and we do not mutate the legacy credential.
INSERT INTO "account_credentials" (
    "id",
    "accountId",
    "passwordHash",
    "passwordChangedAt",
    "mustReset",
    "failedAttempts",
    "lockedUntil",
    "createdAt",
    "updatedAt"
)
SELECT
    'account_credential_' || ac."userId",
    'account_' || ac."userId",
    ac."passwordHash",
    ac."passwordChangedAt",
    ac."mustReset",
    ac."failedAttempts",
    ac."lockedUntil",
    ac."createdAt",
    ac."updatedAt"
FROM "auth_credentials" ac
JOIN "legacy_user_account_links" link
  ON link."legacyUserId" = ac."userId";

-- Record the migration-created canonical accounts as neutral lifecycle evidence.
-- This is not tenant audit and does not imply a new authorization event.
INSERT INTO "account_events" (
    "id",
    "accountId",
    "eventType",
    "sourceType",
    "sourceReference",
    "metadata",
    "createdAt"
)
SELECT
    'account_event_backfill_' || u."id",
    'account_' || u."id",
    'account.backfilled_from_legacy_user',
    'migration',
    u."id",
    jsonb_build_object('legacyUserId', u."id"),
    CURRENT_TIMESTAMP
FROM "users" u;

-- Extend existing legal evidence so future pre-auth entry acceptance can be bound to
-- the canonical person/account before any organization context exists. Historical rows
-- remain valid because these columns are nullable.
ALTER TABLE "access_gate_acceptances"
    ADD COLUMN IF NOT EXISTS "accountId" TEXT,
    ADD COLUMN IF NOT EXISTS "personId" TEXT;

CREATE INDEX IF NOT EXISTS "access_gate_acceptances_accountId_document_idx"
    ON "access_gate_acceptances"("accountId", "documentKey", "documentVersion");
CREATE INDEX IF NOT EXISTS "access_gate_acceptances_personId_idx"
    ON "access_gate_acceptances"("personId");

ALTER TABLE "access_gate_acceptances"
    ADD CONSTRAINT "access_gate_acceptances_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "accounts"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "access_gate_acceptances"
    ADD CONSTRAINT "access_gate_acceptances_personId_fkey"
    FOREIGN KEY ("personId") REFERENCES "people"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Deliberately absent: DROP/DELETE/UPDATE statements against users, auth_credentials,
-- auth_sessions, organizations, organization_memberships, or patient portal auth.
