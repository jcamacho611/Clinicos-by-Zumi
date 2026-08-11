-- Klinikos universal identity and event foundation.
-- Additive migration: legacy clinic User and PortalAccount records remain intact
-- while authentication and authorization are migrated onto the universal model.

CREATE TABLE IF NOT EXISTS "identities" (
  "id" TEXT PRIMARY KEY,
  "primaryEmail" TEXT NOT NULL UNIQUE,
  "displayName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "organization_memberships" (
  "id" TEXT PRIMARY KEY,
  "identityId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_memberships_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "identities"("id") ON DELETE CASCADE,
  CONSTRAINT "organization_memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "organization_memberships_identityId_organizationId_key"
  ON "organization_memberships"("identityId", "organizationId");
CREATE INDEX IF NOT EXISTS "organization_memberships_organizationId_idx"
  ON "organization_memberships"("organizationId", "status");

CREATE TABLE IF NOT EXISTS "membership_role_assignments" (
  "id" TEXT PRIMARY KEY,
  "membershipId" TEXT NOT NULL,
  "roleKey" TEXT NOT NULL,
  "scope" JSONB,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "membership_role_assignments_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "organization_memberships"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "membership_role_assignments_membershipId_roleKey_key"
  ON "membership_role_assignments"("membershipId", "roleKey");
CREATE INDEX IF NOT EXISTS "membership_role_assignments_roleKey_idx"
  ON "membership_role_assignments"("roleKey");

CREATE TABLE IF NOT EXISTS "identity_links" (
  "id" TEXT PRIMARY KEY,
  "identityId" TEXT NOT NULL,
  "linkType" TEXT NOT NULL,
  "linkedRecordId" TEXT NOT NULL,
  "organizationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "identity_links_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "identities"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "identity_links_linkType_linkedRecordId_key"
  ON "identity_links"("linkType", "linkedRecordId");
CREATE INDEX IF NOT EXISTS "identity_links_identityId_idx"
  ON "identity_links"("identityId", "linkType");

CREATE TABLE IF NOT EXISTS "domain_events" (
  "id" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "producer" TEXT NOT NULL,
  "actorIdentityId" TEXT,
  "organizationId" TEXT,
  "subjectType" TEXT,
  "subjectId" TEXT,
  "correlationId" TEXT,
  "causationId" TEXT,
  "payload" JSONB NOT NULL,
  "containsPhi" BOOLEAN NOT NULL DEFAULT false,
  "minimumNecessary" BOOLEAN NOT NULL DEFAULT true,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "domain_events_type_occurredAt_idx"
  ON "domain_events"("type", "occurredAt");
CREATE INDEX IF NOT EXISTS "domain_events_domain_occurredAt_idx"
  ON "domain_events"("domain", "occurredAt");
CREATE INDEX IF NOT EXISTS "domain_events_organizationId_occurredAt_idx"
  ON "domain_events"("organizationId", "occurredAt");
CREATE INDEX IF NOT EXISTS "domain_events_correlationId_idx"
  ON "domain_events"("correlationId");

CREATE TABLE IF NOT EXISTS "event_deliveries" (
  "id" TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "consumer" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_deliveries_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "domain_events"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_deliveries_eventId_consumer_key"
  ON "event_deliveries"("eventId", "consumer");
CREATE INDEX IF NOT EXISTS "event_deliveries_status_availableAt_idx"
  ON "event_deliveries"("status", "availableAt");

CREATE TABLE IF NOT EXISTS "ai_connections" (
  "id" TEXT PRIMARY KEY,
  "identityId" TEXT,
  "organizationId" TEXT,
  "providerKey" TEXT NOT NULL,
  "authorizationMethod" TEXT NOT NULL,
  "secretReference" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "billingOwner" TEXT NOT NULL DEFAULT 'platform',
  "phiEligible" BOOLEAN NOT NULL DEFAULT false,
  "configuration" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_connections_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "identities"("id") ON DELETE CASCADE,
  CONSTRAINT "ai_connections_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "ai_connections_owner_check" CHECK ("identityId" IS NOT NULL OR "organizationId" IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS "ai_connections_identityId_status_idx"
  ON "ai_connections"("identityId", "status");
CREATE INDEX IF NOT EXISTS "ai_connections_organizationId_status_idx"
  ON "ai_connections"("organizationId", "status");
