-- DropIndex
DROP INDEX "referrals_patientId_idx";

-- AlterTable
ALTER TABLE "referrals" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "appointmentAt" TIMESTAMP(3),
ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "authorizationStatus" TEXT NOT NULL DEFAULT 'not_required',
ADD COLUMN     "clinicalQuestion" TEXT,
ADD COLUMN     "closedBy" TEXT,
ADD COLUMN     "closedLoopAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "consultationNoteDocumentId" TEXT,
ADD COLUMN     "consultationNoteReceivedAt" TIMESTAMP(3),
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "declineReason" TEXT,
ADD COLUMN     "declinedAt" TIMESTAMP(3),
ADD COLUMN     "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryMethod" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "deliveryStatus" TEXT NOT NULL DEFAULT 'not_started',
ADD COLUMN     "destinationFacilityId" TEXT,
ADD COLUMN     "destinationOrganizationId" TEXT,
ADD COLUMN     "destinationProviderId" TEXT,
ADD COLUMN     "destinationType" TEXT NOT NULL DEFAULT 'external',
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "followUpDueAt" TIMESTAMP(3),
ADD COLUMN     "lastDeliveryAttemptAt" TIMESTAMP(3),
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "patientNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "patientOutreachStatus" TEXT NOT NULL DEFAULT 'not_started',
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'routine',
ADD COLUMN     "provenance" JSONB,
ADD COLUMN     "receivedAt" TIMESTAMP(3),
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "specialistResponse" TEXT,
ADD COLUMN     "supportingDocumentIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "referral_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "actorId" TEXT,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "deliveryMethod" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "referral_events_organizationId_referralId_createdAt_idx" ON "referral_events"("organizationId", "referralId", "createdAt");

-- CreateIndex
CREATE INDEX "referral_events_referralId_createdAt_idx" ON "referral_events"("referralId", "createdAt");

-- CreateIndex
CREATE INDEX "referrals_organizationId_status_followUpDueAt_idx" ON "referrals"("organizationId", "status", "followUpDueAt");

-- CreateIndex
CREATE INDEX "referrals_destinationOrganizationId_status_idx" ON "referrals"("destinationOrganizationId", "status");

-- CreateIndex
CREATE INDEX "referrals_patientId_createdAt_idx" ON "referrals"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "referrals_orderId_idx" ON "referrals"("orderId");
