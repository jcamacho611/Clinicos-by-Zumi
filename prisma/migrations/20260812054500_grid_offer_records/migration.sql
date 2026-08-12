-- Durable Grid offers connect a saved demand to selected supply without assuming
-- every future Grid resource is a clinician/service pair.
CREATE TABLE "GridOfferRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "providerId" TEXT,
    "serviceListingId" TEXT,
    "locationId" TEXT,
    "resourceKind" TEXT,
    "resourceReference" TEXT,
    "offeredStartAt" TIMESTAMP(3) NOT NULL,
    "offeredEndAt" TIMESTAMP(3),
    "grossAmountCents" INTEGER NOT NULL,
    "depositAmountCents" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridOfferRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GridOfferRecord_organizationId_status_idx"
ON "GridOfferRecord"("organizationId", "status");

CREATE INDEX "GridOfferRecord_demandId_status_idx"
ON "GridOfferRecord"("demandId", "status");

CREATE INDEX "GridOfferRecord_expiresAt_idx"
ON "GridOfferRecord"("expiresAt");

ALTER TABLE "GridOfferRecord"
ADD CONSTRAINT "GridOfferRecord_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GridOfferRecord"
ADD CONSTRAINT "GridOfferRecord_demandId_fkey"
FOREIGN KEY ("demandId") REFERENCES "GridDemandRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GridOfferRecord"
ADD CONSTRAINT "GridOfferRecord_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GridOfferRecord"
ADD CONSTRAINT "GridOfferRecord_serviceListingId_fkey"
FOREIGN KEY ("serviceListingId") REFERENCES "grid_service_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GridOfferRecord"
ADD CONSTRAINT "GridOfferRecord_locationId_fkey"
FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
