-- Patient portal principals remain separate from workforce users and sessions.
CREATE TABLE "portal_accounts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "emailVerifiedAt" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mustReset" BOOLEAN NOT NULL DEFAULT false,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "portal_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "portal_sessions" (
    "id" TEXT NOT NULL,
    "portalAccountId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceLabel" TEXT,
    "authLevel" TEXT NOT NULL DEFAULT 'password',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "portal_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "portal_accounts_patientId_key" ON "portal_accounts"("patientId");
CREATE UNIQUE INDEX "portal_accounts_organizationId_email_key" ON "portal_accounts"("organizationId", "email");
CREATE INDEX "portal_accounts_email_status_idx" ON "portal_accounts"("email", "status");
CREATE INDEX "portal_sessions_portalAccountId_revokedAt_expiresAt_idx" ON "portal_sessions"("portalAccountId", "revokedAt", "expiresAt");

ALTER TABLE "portal_accounts" ADD CONSTRAINT "portal_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "portal_accounts" ADD CONSTRAINT "portal_accounts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portal_sessions" ADD CONSTRAINT "portal_sessions_portalAccountId_fkey" FOREIGN KEY ("portalAccountId") REFERENCES "portal_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
