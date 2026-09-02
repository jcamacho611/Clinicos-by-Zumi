-- Additive durable persistence for governed Expert Grid engagements.
-- Matching or persistence never grants data access; authorization remains a separate
-- purpose-bound, minimum-necessary decision evaluated at access time.

CREATE TABLE "expert_engagements" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sourceRequestId" TEXT NOT NULL,
    "expertPersonId" TEXT NOT NULL,
    "expertRelationshipId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'proposed',
    "version" INTEGER NOT NULL DEFAULT 1,
    "purpose" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "organizationAccepted" BOOLEAN NOT NULL DEFAULT false,
    "expertAccepted" BOOLEAN NOT NULL DEFAULT false,
    "conflictCleared" BOOLEAN NOT NULL DEFAULT false,
    "allowedCapabilityKeys" JSONB NOT NULL,
    "allowedResourceTypes" JSONB NOT NULL,
    "dataAccessClass" TEXT NOT NULL DEFAULT 'none',
    "minimumNecessaryFields" JSONB NOT NULL,
    "agreementEvidenceRefs" JSONB NOT NULL,
    "scopedAuthorizationApprovedBy" TEXT,
    "scopedAuthorizationApprovedAt" TIMESTAMP(3),
    "createdByPersonId" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expert_engagements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expert_engagement_events" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventSequence" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "previousState" TEXT,
    "nextState" TEXT NOT NULL,
    "engagementVersion" INTEGER NOT NULL,
    "actorPersonId" TEXT,
    "snapshot" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_engagement_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "expert_engagements_organizationId_state_idx"
ON "expert_engagements"("organizationId", "state");

CREATE INDEX "expert_engagements_expertPersonId_state_idx"
ON "expert_engagements"("expertPersonId", "state");

CREATE INDEX "expert_engagements_sourceRequestId_idx"
ON "expert_engagements"("sourceRequestId");

CREATE INDEX "expert_engagements_startsAt_endsAt_idx"
ON "expert_engagements"("startsAt", "endsAt");

CREATE UNIQUE INDEX "expert_engagement_events_engagementId_eventSequence_key"
ON "expert_engagement_events"("engagementId", "eventSequence");

CREATE INDEX "expert_engagement_events_organizationId_occurredAt_idx"
ON "expert_engagement_events"("organizationId", "occurredAt");

CREATE INDEX "expert_engagement_events_engagementId_occurredAt_idx"
ON "expert_engagement_events"("engagementId", "occurredAt");
