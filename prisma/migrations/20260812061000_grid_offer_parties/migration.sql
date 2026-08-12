ALTER TABLE "GridOfferRecord"
ADD COLUMN "senderOrganizationId" TEXT,
ADD COLUMN "recipientOrganizationId" TEXT;

CREATE INDEX "GridOfferRecord_recipientOrganizationId_status_idx"
ON "GridOfferRecord"("recipientOrganizationId", "status");

ALTER TABLE "GridOfferRecord"
ADD CONSTRAINT "GridOfferRecord_senderOrganizationId_fkey"
FOREIGN KEY ("senderOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GridOfferRecord"
ADD CONSTRAINT "GridOfferRecord_recipientOrganizationId_fkey"
FOREIGN KEY ("recipientOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
