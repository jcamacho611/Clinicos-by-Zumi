CREATE TABLE "GridReservationRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "providerId" TEXT,
    "serviceListingId" TEXT,
    "locationId" TEXT,
    "resourceKind" TEXT,
    "resourceReference" TEXT,
    "reservedStartAt" TIMESTAMP(3) NOT NULL,
    "reservedEndAt" TIMESTAMP(3),
    "grossAmountCents" INTEGER NOT NULL,
    "depositAmountCents" INTEGER NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'not_required',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fulfillmentStatus" TEXT NOT NULL DEFAULT 'not_started',
    "legacyGridRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridReservationRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GridReservationRecord_offerId_key"
ON "GridReservationRecord"("offerId");

CREATE INDEX "GridReservationRecord_organizationId_status_idx"
ON "GridReservationRecord"("organizationId", "status");

CREATE INDEX "GridReservationRecord_providerId_status_idx"
ON "GridReservationRecord"("providerId", "status");

CREATE INDEX "GridReservationRecord_locationId_status_idx"
ON "GridReservationRecord"("locationId", "status");

CREATE INDEX "GridReservationRecord_reservedStartAt_idx"
ON "GridReservationRecord"("reservedStartAt");

ALTER TABLE "GridReservationRecord"
ADD CONSTRAINT "GridReservationRecord_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GridReservationRecord"
ADD CONSTRAINT "GridReservationRecord_demandId_fkey"
FOREIGN KEY ("demandId") REFERENCES "GridDemandRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GridReservationRecord"
ADD CONSTRAINT "GridReservationRecord_offerId_fkey"
FOREIGN KEY ("offerId") REFERENCES "GridOfferRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GridReservationRecord"
ADD CONSTRAINT "GridReservationRecord_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GridReservationRecord"
ADD CONSTRAINT "GridReservationRecord_serviceListingId_fkey"
FOREIGN KEY ("serviceListingId") REFERENCES "GridServiceListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GridReservationRecord"
ADD CONSTRAINT "GridReservationRecord_locationId_fkey"
FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
