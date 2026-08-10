-- Whop-first paid access entry.
--
-- Adds the entitlement grant that Klinikos authorization reads, the append-only
-- webhook ledger that makes deliveries idempotent and auditable, and the
-- server-issued checkout handoff that binds a verified email to a single tier.
--
-- Payment alone never satisfies credentialing, facility authority, or clinical
-- scope; those remain separate human-reviewed gates.

CREATE TABLE "whop_entitlements" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "whopMembershipId" TEXT NOT NULL,
  "whopUserId" TEXT,
  "whopPlanId" TEXT,
  "whopProductId" TEXT,
  "tierKey" TEXT NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'pending_connection',
  "membershipStatus" TEXT,
  "validUntil" TIMESTAMP(3),
  "grantedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "lastVerifiedAt" TIMESTAMP(3),
  "verificationSource" TEXT NOT NULL DEFAULT 'webhook',
  "organizationId" TEXT,
  "providerId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "whop_entitlements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "whop_entitlements_whopMembershipId_key" ON "whop_entitlements"("whopMembershipId");
CREATE INDEX "whop_entitlements_email_state_idx" ON "whop_entitlements"("email", "state");
CREATE INDEX "whop_entitlements_tierKey_state_idx" ON "whop_entitlements"("tierKey", "state");
CREATE INDEX "whop_entitlements_organizationId_idx" ON "whop_entitlements"("organizationId");
CREATE INDEX "whop_entitlements_validUntil_idx" ON "whop_entitlements"("validUntil");

-- Only tiers defined in the Klinikos catalog can be stored, so an unrecognised
-- Whop product cannot silently create a new privilege level.
ALTER TABLE "whop_entitlements"
  ADD CONSTRAINT "whop_entitlements_tier_check"
  CHECK ("tierKey" IN ('evaluator_pass', 'clinic_operator', 'grid_provider', 'grid_location_partner'));

ALTER TABLE "whop_entitlements"
  ADD CONSTRAINT "whop_entitlements_state_check"
  CHECK ("state" IN ('active', 'grace', 'revoked', 'pending_connection', 'unknown'));

ALTER TABLE "whop_entitlements"
  ADD CONSTRAINT "whop_entitlements_source_check"
  CHECK ("verificationSource" IN ('webhook', 'api_verification', 'checkout_return', 'manual_review'));

-- An active grant must record when it was granted and when it was last confirmed
-- against Whop, so an entitlement can never be active without provenance.
ALTER TABLE "whop_entitlements"
  ADD CONSTRAINT "whop_entitlements_active_provenance_check"
  CHECK ("state" <> 'active' OR ("grantedAt" IS NOT NULL AND "lastVerifiedAt" IS NOT NULL));

ALTER TABLE "whop_entitlements"
  ADD CONSTRAINT "whop_entitlements_revoked_check"
  CHECK ("state" <> 'revoked' OR "revokedAt" IS NOT NULL);

-- A revoked grant may never simultaneously read as active.
ALTER TABLE "whop_entitlements"
  ADD CONSTRAINT "whop_entitlements_revocation_exclusive_check"
  CHECK ("revokedAt" IS NULL OR "state" <> 'active');

CREATE TABLE "whop_webhook_events" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "membershipId" TEXT,
  "signatureVerified" BOOLEAN NOT NULL DEFAULT false,
  "payloadHash" TEXT NOT NULL,
  "processingStatus" TEXT NOT NULL DEFAULT 'received',
  "processedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payload" JSONB,
  CONSTRAINT "whop_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "whop_webhook_events_eventId_key" ON "whop_webhook_events"("eventId");
CREATE INDEX "whop_webhook_events_eventType_receivedAt_idx" ON "whop_webhook_events"("eventType", "receivedAt");
CREATE INDEX "whop_webhook_events_membershipId_idx" ON "whop_webhook_events"("membershipId");
CREATE INDEX "whop_webhook_events_processingStatus_idx" ON "whop_webhook_events"("processingStatus");

ALTER TABLE "whop_webhook_events"
  ADD CONSTRAINT "whop_webhook_events_status_check"
  CHECK ("processingStatus" IN ('received', 'rejected', 'ignored', 'applied', 'failed'));

-- A delivery may only be applied to an entitlement if its signature verified.
ALTER TABLE "whop_webhook_events"
  ADD CONSTRAINT "whop_webhook_events_applied_requires_signature_check"
  CHECK ("processingStatus" <> 'applied' OR "signatureVerified" = true);

CREATE TABLE "whop_checkout_intents" (
  "id" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "tierKey" TEXT NOT NULL,
  "whopPlanId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'created',
  "entitlementId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "whop_checkout_intents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "whop_checkout_intents_state_key" ON "whop_checkout_intents"("state");
CREATE INDEX "whop_checkout_intents_email_status_idx" ON "whop_checkout_intents"("email", "status");
CREATE INDEX "whop_checkout_intents_expiresAt_idx" ON "whop_checkout_intents"("expiresAt");

ALTER TABLE "whop_checkout_intents"
  ADD CONSTRAINT "whop_checkout_intents_tier_check"
  CHECK ("tierKey" IN ('evaluator_pass', 'clinic_operator', 'grid_provider', 'grid_location_partner'));

ALTER TABLE "whop_checkout_intents"
  ADD CONSTRAINT "whop_checkout_intents_status_check"
  CHECK ("status" IN ('created', 'completed', 'expired', 'abandoned'));

ALTER TABLE "whop_checkout_intents"
  ADD CONSTRAINT "whop_checkout_intents_completed_check"
  CHECK ("status" <> 'completed' OR ("completedAt" IS NOT NULL AND "entitlementId" IS NOT NULL));
