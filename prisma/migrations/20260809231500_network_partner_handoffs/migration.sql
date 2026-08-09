-- Make existing clinic relationships operational without implying live external connectivity.
ALTER TABLE "network_connections"
  ADD COLUMN "relationshipType" TEXT NOT NULL DEFAULT 'referral_partner',
  ADD COLUMN "acceptedReferralTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "services" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "capacityStatus" TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN "contactMethod" TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN "contactDetails" JSONB,
  ADD COLUMN "integrationStatus" TEXT NOT NULL DEFAULT 'pending_connection',
  ADD COLUMN "manualFallbackMethod" TEXT NOT NULL DEFAULT 'documented_manual_delivery',
  ADD COLUMN "consentRequiredCategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "lastReviewedAt" TIMESTAMP(3),
  ADD CONSTRAINT "network_connections_capacity_status_check" CHECK ("capacityStatus" IN ('available', 'limited', 'unavailable', 'unknown')),
  ADD CONSTRAINT "network_connections_integration_status_check" CHECK ("integrationStatus" IN ('live', 'demo', 'manual_fallback', 'pending_connection', 'roadmap', 'requires_production_review'));

-- Evolve the existing handoff record into a dual-organization, consent-gated delivery lifecycle.
ALTER TABLE "care_handoffs"
  ADD COLUMN "destinationOrganizationId" TEXT,
  ADD COLUMN "networkConnectionId" TEXT,
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'provider_handoff',
  ADD COLUMN "purposeOfUse" TEXT NOT NULL DEFAULT 'treatment',
  ADD COLUMN "dataCategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "deliveryMethod" TEXT NOT NULL DEFAULT 'internal',
  ADD COLUMN "consentId" TEXT,
  ADD COLUMN "sharingAgreementId" TEXT,
  ADD COLUMN "humanReviewRequired" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "confirmedBy" TEXT,
  ADD COLUMN "confirmedAt" TIMESTAMP(3),
  ADD COLUMN "sentAt" TIMESTAMP(3),
  ADD COLUMN "receivedAt" TIMESTAMP(3),
  ADD COLUMN "scheduledAt" TIMESTAMP(3),
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "failedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "failureReason" TEXT,
  ADD COLUMN "manualFallbackReason" TEXT;

ALTER TABLE "care_handoffs" ALTER COLUMN "receiverId" DROP NOT NULL;
ALTER TABLE "care_handoffs" ALTER COLUMN "status" SET DEFAULT 'draft';

ALTER TABLE "care_handoffs"
  ADD CONSTRAINT "care_handoffs_status_check" CHECK ("status" IN ('draft', 'pending_review', 'ready_to_send', 'sent', 'sent_connected', 'sent_manual', 'fax_pending', 'direct_pending', 'received', 'acknowledged', 'needs_clarification', 'scheduled', 'completed', 'failed', 'cancelled', 'rejected', 'clarification_requested', 'resolved')),
  ADD CONSTRAINT "care_handoffs_delivery_method_check" CHECK ("deliveryMethod" IN ('internal', 'connected_network', 'manual', 'fax', 'direct_secure_message')),
  ADD CONSTRAINT "care_handoffs_network_destination_check" CHECK ("deliveryMethod" = 'internal' OR "destinationOrganizationId" IS NOT NULL);

CREATE TABLE "care_handoff_events" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "careHandoffId" TEXT NOT NULL,
  "actorId" TEXT,
  "actorType" TEXT NOT NULL DEFAULT 'user',
  "action" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT,
  "note" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "care_handoff_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "care_handoff_events_actor_type_check" CHECK ("actorType" IN ('user', 'system', 'manual_partner'))
);

CREATE INDEX "care_handoffs_destinationOrganizationId_status_updatedAt_idx" ON "care_handoffs"("destinationOrganizationId", "status", "updatedAt");
CREATE INDEX "care_handoffs_networkConnectionId_status_idx" ON "care_handoffs"("networkConnectionId", "status");
CREATE INDEX "care_handoff_events_organizationId_createdAt_idx" ON "care_handoff_events"("organizationId", "createdAt");
CREATE INDEX "care_handoff_events_careHandoffId_createdAt_idx" ON "care_handoff_events"("careHandoffId", "createdAt");

ALTER TABLE "care_handoffs" ADD CONSTRAINT "care_handoffs_destinationOrganizationId_fkey" FOREIGN KEY ("destinationOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "care_handoffs" ADD CONSTRAINT "care_handoffs_networkConnectionId_fkey" FOREIGN KEY ("networkConnectionId") REFERENCES "network_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "care_handoff_events" ADD CONSTRAINT "care_handoff_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "care_handoff_events" ADD CONSTRAINT "care_handoff_events_careHandoffId_fkey" FOREIGN KEY ("careHandoffId") REFERENCES "care_handoffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing local handoffs remain valid and get a provenance event.
INSERT INTO "care_handoff_events" ("id", "organizationId", "careHandoffId", "actorId", "actorType", "action", "toStatus", "note", "metadata", "createdAt")
SELECT
  'event-backfill-' || md5(handoff."id"),
  handoff."organizationId",
  handoff."id",
  handoff."senderId",
  'system',
  'legacy_handoff_registered',
  handoff."status",
  'Existing local care handoff registered in the governed delivery ledger.',
  jsonb_build_object('backfill', true, 'deliveryMethod', 'internal'),
  handoff."createdAt"
FROM "care_handoffs" handoff;
