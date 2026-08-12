-- Offer decisions preserve lineage instead of mutating financial/time terms in place.
ALTER TABLE "GridOfferRecord"
ADD COLUMN "destinationOrganizationId" TEXT,
ADD COLUMN "parentOfferId" TEXT,
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "GridDemandRecord"
ADD COLUMN "acceptedOfferId" TEXT;

CREATE TABLE "GridOfferEventRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridOfferEventRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GridOfferRecord_destinationOrganizationId_status_idx"
ON "GridOfferRecord"("destinationOrganizationId", "status");

CREATE INDEX "GridOfferRecord_parentOfferId_idx"
ON "GridOfferRecord"("parentOfferId");

CREATE UNIQUE INDEX "GridOfferRecord_one_accepted_per_demand_idx"
ON "GridOfferRecord"("demandId") WHERE "status" = 'accepted';

CREATE INDEX "GridOfferEventRecord_offerId_createdAt_idx"
ON "GridOfferEventRecord"("offerId", "createdAt");

ALTER TABLE "GridOfferRecord"
ADD CONSTRAINT "GridOfferRecord_destinationOrganizationId_fkey"
FOREIGN KEY ("destinationOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GridOfferRecord"
ADD CONSTRAINT "GridOfferRecord_parentOfferId_fkey"
FOREIGN KEY ("parentOfferId") REFERENCES "GridOfferRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GridOfferEventRecord"
ADD CONSTRAINT "GridOfferEventRecord_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GridOfferEventRecord"
ADD CONSTRAINT "GridOfferEventRecord_offerId_fkey"
FOREIGN KEY ("offerId") REFERENCES "GridOfferRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
