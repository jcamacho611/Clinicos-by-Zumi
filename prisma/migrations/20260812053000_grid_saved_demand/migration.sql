-- Durable universal Grid demand. This is additive and intentionally separate from GridRequest,
-- which represents a later-stage request that already has a selected provider/service.
CREATE TABLE "GridDemandRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "serviceName" TEXT,
    "requestedStartAt" TIMESTAMP(3),
    "requestedEndAt" TIMESTAMP(3),
    "locationType" TEXT,
    "city" TEXT,
    "state" TEXT,
    "radiusMiles" INTEGER,
    "maxPriceCents" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "requiresClinicalEligibility" BOOLEAN NOT NULL DEFAULT false,
    "requirements" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'open',
    "visibility" TEXT NOT NULL DEFAULT 'matched_only',
    "selectedProviderId" TEXT,
    "selectedServiceListingId" TEXT,
    "selectedLocationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridDemandRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GridDemandRecord_organizationId_status_idx"
ON "GridDemandRecord"("organizationId", "status");

CREATE INDEX "GridDemandRecord_kind_status_idx"
ON "GridDemandRecord"("kind", "status");

CREATE INDEX "GridDemandRecord_requestedStartAt_idx"
ON "GridDemandRecord"("requestedStartAt");

ALTER TABLE "GridDemandRecord"
ADD CONSTRAINT "GridDemandRecord_organizationId_fkey"
-- The Organization model maps to "organizations"; the Prisma model name is not the table
-- name. Referencing "Organization" here meant this migration could never apply to any
-- database, because no migration has ever created a table by that name.
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
