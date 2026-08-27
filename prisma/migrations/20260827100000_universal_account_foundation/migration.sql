-- Canonical person-level account foundation.
-- Additive only. Legacy users/auth_credentials/auth_sessions remain intact until a
-- separately verified cutover retires them. Account itself carries no organization authority.

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

CREATE TABLE "account_entry_acceptance_bindings" (
    "id" TEXT NOT NULL,
    "acceptanceId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "documentKey" TEXT NOT NULL,
    "documentVersion" TEXT NOT NULL,
    "documentSha256" TEXT NOT NULL,
    "boundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_entry_acceptance_bindings_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "account_entry_acceptance_bindings_acceptanceId_key" ON "account_entry_acceptance_bindings"("acceptanceId");
CREATE INDEX "account_entry_acceptance_bindings_accountId_documentKey_documentVersion_idx" ON "account_entry_acceptance_bindings"("accountId", "documentKey", "documentVersion");
CREATE INDEX "account_entry_acceptance_bindings_personId_idx" ON "account_entry_acceptance_bindings"("personId");

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "account_credentials" ADD CONSTRAINT "account_credentials_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "account_sessions" ADD CONSTRAINT "account_sessions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "legacy_user_account_links" ADD CONSTRAINT "legacy_user_account_links_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "account_events" ADD CONSTRAINT "account_events_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "account_entry_acceptance_bindings" ADD CONSTRAINT "account_entry_acceptance_bindings_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "account_entry_acceptance_bindings" ADD CONSTRAINT "account_entry_acceptance_bindings_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Fail closed if a legacy user does not resolve to exactly one Person membership in its
-- current authoritative organization. Do not guess identity ownership during backfill.
DO $$
DECLARE invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM "users" u
    WHERE (
        SELECT COUNT(*) FROM "organization_memberships" om
        WHERE om."legacyUserId" = u."id"
          AND om."organizationId" = u."organizationId"
          AND om."personId" = 'person_' || u."id"
    ) <> 1;
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Universal account backfill aborted: % legacy user(s) lack one deterministic Person/current-organization mapping.', invalid_count;
    END IF;
END $$;

DO $$
DECLARE duplicate_count INTEGER;
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

INSERT INTO "accounts" ("id", "personId", "primaryEmail", "displayName", "status", "emailVerifiedAt", "createdAt", "updatedAt")
SELECT 'account_' || u."id", om."personId", LOWER(TRIM(u."email")), u."name", u."status", NULL, u."createdAt", u."updatedAt"
FROM "users" u
JOIN "organization_memberships" om
  ON om."legacyUserId" = u."id"
 AND om."organizationId" = u."organizationId"
 AND om."personId" = 'person_' || u."id";

INSERT INTO "legacy_user_account_links" ("id", "accountId", "legacyUserId", "sourceType", "createdAt")
SELECT 'account_link_' || u."id", 'account_' || u."id", u."id", 'legacy_user', u."createdAt"
FROM "users" u;

-- Copy existing password hashes, never plaintext. Legacy credential rows remain intact.
INSERT INTO "account_credentials" ("id", "accountId", "passwordHash", "passwordChangedAt", "mustReset", "failedAttempts", "lockedUntil", "createdAt", "updatedAt")
SELECT 'account_credential_' || ac."userId", 'account_' || ac."userId", ac."passwordHash", ac."passwordChangedAt", ac."mustReset", ac."failedAttempts", ac."lockedUntil", ac."createdAt", ac."updatedAt"
FROM "auth_credentials" ac
JOIN "legacy_user_account_links" link ON link."legacyUserId" = ac."userId";

INSERT INTO "account_events" ("id", "accountId", "eventType", "sourceType", "sourceReference", "metadata", "createdAt")
SELECT 'account_event_backfill_' || u."id", 'account_' || u."id", 'account.backfilled_from_legacy_user', 'migration', u."id", jsonb_build_object('legacyUserId', u."id"), CURRENT_TIMESTAMP
FROM "users" u;

-- Deliberately absent: DROP/DELETE/UPDATE against users, auth_credentials, auth_sessions,
-- organizations, organization_memberships, patient portal auth, or access_gate_acceptances.
