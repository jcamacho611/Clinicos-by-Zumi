CREATE TABLE "GridFulfillmentEventRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridFulfillmentEventRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GridFulfillmentEventRecord_reservationId_createdAt_idx"
ON "GridFulfillmentEventRecord"("reservationId", "createdAt");

ALTER TABLE "GridFulfillmentEventRecord"
ADD CONSTRAINT "GridFulfillmentEventRecord_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GridFulfillmentEventRecord"
ADD CONSTRAINT "GridFulfillmentEventRecord_reservationId_fkey"
FOREIGN KEY ("reservationId") REFERENCES "GridReservationRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
