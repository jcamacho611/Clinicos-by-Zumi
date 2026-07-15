-- DropIndex
DROP INDEX "imaging_results_patientId_status_idx";

-- AlterTable
ALTER TABLE "imaging_orders" ADD COLUMN     "appointmentStatus" TEXT NOT NULL DEFAULT 'not_scheduled',
ADD COLUMN     "authorizationStatus" TEXT NOT NULL DEFAULT 'not_required',
ADD COLUMN     "bodyPart" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "clinicalIndication" TEXT,
ADD COLUMN     "clinicalOrderId" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryMethod" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "deliveryStatus" TEXT NOT NULL DEFAULT 'not_started',
ADD COLUMN     "diagnosisCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "integrationId" TEXT,
ADD COLUMN     "lastDeliveryAttemptAt" TIMESTAMP(3),
ADD COLUMN     "laterality" TEXT,
ADD COLUMN     "modality" TEXT,
ADD COLUMN     "priorAuthorizationId" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'routine',
ADD COLUMN     "provenance" JSONB,
ADD COLUMN     "readyAt" TIMESTAMP(3),
ADD COLUMN     "reportReceivedAt" TIMESTAMP(3),
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "transmittedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "imaging_results" ADD COLUMN     "correctionOfId" TEXT,
ADD COLUMN     "correctionReason" TEXT,
ADD COLUMN     "findings" TEXT,
ADD COLUMN     "imageReference" TEXT,
ADD COLUMN     "impression" TEXT,
ADD COLUMN     "integrationId" TEXT,
ADD COLUMN     "patientNotificationStatus" TEXT NOT NULL DEFAULT 'not_started',
ADD COLUMN     "patientNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "provenance" JSONB,
ADD COLUMN     "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "releaseApprovedAt" TIMESTAMP(3),
ADD COLUMN     "releaseApprovedBy" TEXT,
ADD COLUMN     "reportTitle" TEXT,
ADD COLUMN     "reviewComments" TEXT,
ADD COLUMN     "sourceReference" TEXT,
ADD COLUMN     "sourceType" TEXT NOT NULL DEFAULT 'manual_upload',
ADD COLUMN     "studyPerformedAt" TIMESTAMP(3),
ADD COLUMN     "urgentSourceFlag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- Preserve legacy rows while making the new clinical fields explicit and non-null.
UPDATE "imaging_orders"
SET "modality" = COALESCE("modality", 'Other'),
    "bodyPart" = COALESCE("bodyPart", 'Not specified'),
    "clinicalIndication" = COALESCE("clinicalIndication", 'Migrated legacy imaging order');

UPDATE "imaging_results"
SET "reportTitle" = COALESCE("reportTitle", 'Migrated imaging report');

ALTER TABLE "imaging_orders"
ALTER COLUMN "modality" SET NOT NULL,
ALTER COLUMN "bodyPart" SET NOT NULL,
ALTER COLUMN "clinicalIndication" SET NOT NULL;

ALTER TABLE "imaging_results"
ALTER COLUMN "reportTitle" SET NOT NULL;

-- CreateTable
CREATE TABLE "imaging_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "imagingOrderId" TEXT,
    "imagingResultId" TEXT,
    "actorId" TEXT,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imaging_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "imaging_events_organizationId_createdAt_idx" ON "imaging_events"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "imaging_events_imagingOrderId_createdAt_idx" ON "imaging_events"("imagingOrderId", "createdAt");

-- CreateIndex
CREATE INDEX "imaging_events_imagingResultId_createdAt_idx" ON "imaging_events"("imagingResultId", "createdAt");

-- CreateIndex
CREATE INDEX "imaging_orders_organizationId_status_priority_idx" ON "imaging_orders"("organizationId", "status", "priority");

-- CreateIndex
CREATE INDEX "imaging_orders_clinicalOrderId_idx" ON "imaging_orders"("clinicalOrderId");

-- CreateIndex
CREATE INDEX "imaging_orders_priorAuthorizationId_authorizationStatus_idx" ON "imaging_orders"("priorAuthorizationId", "authorizationStatus");

-- CreateIndex
CREATE INDEX "imaging_orders_integrationId_deliveryStatus_idx" ON "imaging_orders"("integrationId", "deliveryStatus");

-- CreateIndex
CREATE INDEX "imaging_results_organizationId_status_idx" ON "imaging_results"("organizationId", "status");

-- CreateIndex
CREATE INDEX "imaging_results_organizationId_urgentSourceFlag_status_idx" ON "imaging_results"("organizationId", "urgentSourceFlag", "status");

-- CreateIndex
CREATE INDEX "imaging_results_patientId_studyPerformedAt_idx" ON "imaging_results"("patientId", "studyPerformedAt");

-- CreateIndex
CREATE INDEX "imaging_results_orderId_idx" ON "imaging_results"("orderId");

-- CreateIndex
CREATE INDEX "imaging_results_integrationId_sourceType_idx" ON "imaging_results"("integrationId", "sourceType");

-- CreateIndex
CREATE INDEX "imaging_results_reportDocumentId_idx" ON "imaging_results"("reportDocumentId");

-- CreateIndex
CREATE INDEX "imaging_results_correctionOfId_idx" ON "imaging_results"("correctionOfId");

-- AddForeignKey
ALTER TABLE "imaging_events" ADD CONSTRAINT "imaging_events_imagingOrderId_fkey" FOREIGN KEY ("imagingOrderId") REFERENCES "imaging_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imaging_events" ADD CONSTRAINT "imaging_events_imagingResultId_fkey" FOREIGN KEY ("imagingResultId") REFERENCES "imaging_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Database-level radiology lifecycle and safety invariants.
ALTER TABLE "imaging_orders"
ADD CONSTRAINT "imaging_orders_priority_check"
CHECK ("priority" IN ('routine', 'urgent', 'stat')),
ADD CONSTRAINT "imaging_orders_authorization_status_check"
CHECK ("authorizationStatus" IN ('not_required', 'pending', 'approved', 'denied', 'expired')),
ADD CONSTRAINT "imaging_orders_delivery_method_check"
CHECK ("deliveryMethod" IN ('manual', 'print', 'fax', 'direct', 'electronic_adapter')),
ADD CONSTRAINT "imaging_orders_delivery_status_check"
CHECK ("deliveryStatus" IN ('not_started', 'pending_manual', 'queued', 'delivered', 'failed')),
ADD CONSTRAINT "imaging_orders_delivery_attempts_check"
CHECK ("deliveryAttempts" >= 0),
ADD CONSTRAINT "imaging_orders_appointment_status_check"
CHECK ("appointmentStatus" IN ('not_scheduled', 'requested', 'scheduled', 'completed', 'cancelled', 'no_show')),
ADD CONSTRAINT "imaging_orders_status_check"
CHECK ("status" IN ('draft', 'ready_to_send', 'transmission_queued', 'sent', 'scheduled', 'completed', 'report_received', 'cancelled')),
ADD CONSTRAINT "imaging_orders_authorization_gate_check"
CHECK ("status" = 'draft' OR "authorizationStatus" IN ('not_required', 'approved')),
ADD CONSTRAINT "imaging_orders_electronic_integration_check"
CHECK ("deliveryMethod" <> 'electronic_adapter' OR "integrationId" IS NOT NULL);

ALTER TABLE "imaging_results"
ADD CONSTRAINT "imaging_results_source_type_check"
CHECK ("sourceType" IN ('manual_upload', 'structured_manual', 'electronic_interface')),
ADD CONSTRAINT "imaging_results_source_document_check"
CHECK ("sourceType" <> 'manual_upload' OR "reportDocumentId" IS NOT NULL),
ADD CONSTRAINT "imaging_results_electronic_integration_check"
CHECK ("sourceType" <> 'electronic_interface' OR "integrationId" IS NOT NULL),
ADD CONSTRAINT "imaging_results_status_check"
CHECK ("status" IN ('needs_review', 'reviewed', 'released', 'corrected')),
ADD CONSTRAINT "imaging_results_notification_status_check"
CHECK ("patientNotificationStatus" IN ('not_started', 'pending', 'notified', 'declined', 'failed')),
ADD CONSTRAINT "imaging_results_version_check"
CHECK ("version" >= 1),
ADD CONSTRAINT "imaging_results_release_review_check"
CHECK ("status" <> 'released' OR ("reviewedAt" IS NOT NULL AND "reviewedBy" IS NOT NULL AND "releaseApprovedAt" IS NOT NULL AND "releaseApprovedBy" IS NOT NULL AND "releasedAt" IS NOT NULL AND "patientVisible" = true)),
ADD CONSTRAINT "imaging_results_visibility_check"
CHECK ("patientVisible" = false OR "status" = 'released');

ALTER TABLE "imaging_events"
ADD CONSTRAINT "imaging_events_resource_check"
CHECK ("imagingOrderId" IS NOT NULL OR "imagingResultId" IS NOT NULL);
