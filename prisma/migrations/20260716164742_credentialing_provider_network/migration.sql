-- AlterTable
ALTER TABLE "provider_credentials" ADD COLUMN     "evidenceDocumentId" TEXT,
ADD COLUMN     "exceptionReason" TEXT,
ADD COLUMN     "primarySourceVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "verificationSource" TEXT,
ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "acceptedInsurance" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "deaExpiresAt" TIMESTAMP(3),
ADD COLUMN     "deaNumber" TEXT,
ADD COLUMN     "prescribingEligible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "subspecialty" TEXT,
ADD COLUMN     "taxonomy" TEXT,
ADD COLUMN     "telemedicineEligible" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "provider_facility_privileges" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "grantedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "verificationSource" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_facility_privileges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provider_facility_privileges_organizationId_status_expiresA_idx" ON "provider_facility_privileges"("organizationId", "status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "provider_facility_privileges_organizationId_providerId_faci_key" ON "provider_facility_privileges"("organizationId", "providerId", "facilityId");

-- AddForeignKey
ALTER TABLE "provider_credentials" ADD CONSTRAINT "provider_credentials_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_facility_privileges" ADD CONSTRAINT "provider_facility_privileges_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_facility_privileges" ADD CONSTRAINT "provider_facility_privileges_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_facility_privileges" ADD CONSTRAINT "provider_facility_privileges_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
