-- AlterTable
ALTER TABLE "consents" ADD COLUMN     "capturedBy" TEXT,
ADD COLUMN     "dataCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "documentId" TEXT,
ADD COLUMN     "effectiveAt" TIMESTAMP(3),
ADD COLUMN     "grantedToOrganizationId" TEXT,
ADD COLUMN     "grantedToUserId" TEXT,
ADD COLUMN     "purposeOfUse" TEXT,
ADD COLUMN     "sensitiveRestrictions" JSONB,
ADD COLUMN     "signerName" TEXT,
ADD COLUMN     "signerRelationship" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'staff_capture',
ADD COLUMN     "withdrawalReason" TEXT,
ADD COLUMN     "withdrawnAt" TIMESTAMP(3),
ADD COLUMN     "withdrawnBy" TEXT;

-- AlterTable
ALTER TABLE "patient_matches" ADD COLUMN     "candidateSnapshot" JSONB,
ADD COLUMN     "decisionReason" TEXT,
ADD COLUMN     "masterPatientId" TEXT,
ADD COLUMN     "reconciliation" JSONB,
ADD COLUMN     "reviewAction" TEXT,
ADD COLUMN     "sourceSnapshot" JSONB;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "deceasedAt" TIMESTAMP(3),
ADD COLUMN     "formerNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "identityStatus" TEXT NOT NULL DEFAULT 'unverified',
ADD COLUMN     "identityVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "identityVerifiedBy" TEXT,
ADD COLUMN     "masterPatientId" TEXT,
ADD COLUMN     "preferredName" TEXT;

-- CreateIndex
CREATE INDEX "consents_organizationId_status_expiresAt_idx" ON "consents"("organizationId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "consents_grantedToOrganizationId_purposeOfUse_status_idx" ON "consents"("grantedToOrganizationId", "purposeOfUse", "status");

-- CreateIndex
CREATE INDEX "patients_masterPatientId_idx" ON "patients"("masterPatientId");
