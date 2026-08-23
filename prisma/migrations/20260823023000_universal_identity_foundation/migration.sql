-- Universal lifelong identity foundation.
--
-- Additive only: current authentication and tenant authorization continue to use
-- the existing users.organizationId / users.roleKey path until a later migration
-- explicitly adopts memberships as active session context.

CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "displayName" TEXT,
    "legalName" TEXT,
    "primaryEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sourceType" TEXT NOT NULL DEFAULT 'system',
    "sourceReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_memberships" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "legacyUserId" TEXT,
    "membershipType" TEXT NOT NULL,
    "roleKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sourceType" TEXT NOT NULL DEFAULT 'legacy_user',
    "sourceReference" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "location_assignments" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "roleKey" TEXT,
    "professionKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "sourceType" TEXT NOT NULL DEFAULT 'organization',
    "sourceReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "people_primaryEmail_idx" ON "people"("primaryEmail");
CREATE INDEX "people_status_idx" ON "people"("status");

CREATE INDEX "organization_memberships_personId_status_idx"
    ON "organization_memberships"("personId", "status");
CREATE INDEX "organization_memberships_organizationId_status_idx"
    ON "organization_memberships"("organizationId", "status");
CREATE INDEX "organization_memberships_legacyUserId_idx"
    ON "organization_memberships"("legacyUserId");
CREATE INDEX "organization_memberships_effectiveFrom_effectiveTo_idx"
    ON "organization_memberships"("effectiveFrom", "effectiveTo");

CREATE UNIQUE INDEX "location_assignments_membershipId_locationId_effectiveFrom_key"
    ON "location_assignments"("membershipId", "locationId", "effectiveFrom");
CREATE INDEX "location_assignments_locationId_status_idx"
    ON "location_assignments"("locationId", "status");
CREATE INDEX "location_assignments_effectiveFrom_effectiveTo_idx"
    ON "location_assignments"("effectiveFrom", "effectiveTo");

ALTER TABLE "organization_memberships"
    ADD CONSTRAINT "organization_memberships_personId_fkey"
    FOREIGN KEY ("personId") REFERENCES "people"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "location_assignments"
    ADD CONSTRAINT "location_assignments_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "organization_memberships"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill one durable Person anchor for every existing staff User.
INSERT INTO "people" (
    "id",
    "displayName",
    "legalName",
    "primaryEmail",
    "status",
    "sourceType",
    "sourceReference",
    "createdAt",
    "updatedAt"
)
SELECT
    'person_' || "id",
    "name",
    "name",
    "email",
    "status",
    'legacy_user',
    "id",
    "createdAt",
    "updatedAt"
FROM "users"
ON CONFLICT ("id") DO NOTHING;

-- Preserve the existing user's organization/role as the first relationship record.
-- This does NOT alter current authentication or authorization semantics.
INSERT INTO "organization_memberships" (
    "id",
    "personId",
    "organizationId",
    "legacyUserId",
    "membershipType",
    "roleKey",
    "status",
    "sourceType",
    "sourceReference",
    "effectiveFrom",
    "createdAt",
    "updatedAt"
)
SELECT
    'orgmem_' || "id",
    'person_' || "id",
    "organizationId",
    "id",
    'staff',
    "roleKey",
    "status",
    'legacy_user',
    "id",
    "createdAt",
    "createdAt",
    "updatedAt"
FROM "users"
ON CONFLICT ("id") DO NOTHING;
