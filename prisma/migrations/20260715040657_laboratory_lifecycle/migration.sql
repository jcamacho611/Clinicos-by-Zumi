-- DropIndex
DROP INDEX "lab_result_items_labResultId_idx";

-- AlterTable
ALTER TABLE "lab_orders" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "clinicalOrderId" TEXT,
ADD COLUMN     "collectedAt" TIMESTAMP(3),
ADD COLUMN     "collectionInstructions" TEXT,
ADD COLUMN     "collectionSite" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryMethod" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "deliveryStatus" TEXT NOT NULL DEFAULT 'not_started',
ADD COLUMN     "diagnosisCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "integrationId" TEXT,
ADD COLUMN     "lastDeliveryAttemptAt" TIMESTAMP(3),
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'routine',
ADD COLUMN     "provenance" JSONB,
ADD COLUMN     "readyAt" TIMESTAMP(3),
ADD COLUMN     "resultsReceivedAt" TIMESTAMP(3),
ADD COLUMN     "specimenType" TEXT,
ADD COLUMN     "transmittedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "lab_result_items" ADD COLUMN     "critical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "numericValue" DOUBLE PRECISION,
ADD COLUMN     "resultStatus" TEXT NOT NULL DEFAULT 'final',
ADD COLUMN     "sequence" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "lab_results" ADD COLUMN     "correctionOfId" TEXT,
ADD COLUMN     "correctionReason" TEXT,
ADD COLUMN     "critical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "patientNotificationStatus" TEXT NOT NULL DEFAULT 'not_started',
ADD COLUMN     "patientNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "provenance" JSONB,
ADD COLUMN     "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "releaseApprovedAt" TIMESTAMP(3),
ADD COLUMN     "releaseApprovedBy" TEXT,
ADD COLUMN     "reviewComments" TEXT,
ADD COLUMN     "sourceReference" TEXT,
ADD COLUMN     "sourceType" TEXT NOT NULL DEFAULT 'manual_entry',
ADD COLUMN     "specimenType" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "lab_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "labOrderId" TEXT,
    "labResultId" TEXT,
    "actorId" TEXT,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "acknowledgmentCode" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_events_organizationId_createdAt_idx" ON "lab_events"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "lab_events_labOrderId_createdAt_idx" ON "lab_events"("labOrderId", "createdAt");

-- CreateIndex
CREATE INDEX "lab_events_labResultId_createdAt_idx" ON "lab_events"("labResultId", "createdAt");

-- CreateIndex
CREATE INDEX "integration_events_organizationId_status_occurredAt_idx" ON "integration_events"("organizationId", "status", "occurredAt");

-- CreateIndex
CREATE INDEX "integration_events_resourceType_resourceId_occurredAt_idx" ON "integration_events"("resourceType", "resourceId", "occurredAt");

-- CreateIndex
CREATE INDEX "integration_events_integrationId_status_idx" ON "integration_events"("integrationId", "status");

-- CreateIndex
CREATE INDEX "lab_orders_organizationId_status_priority_idx" ON "lab_orders"("organizationId", "status", "priority");

-- CreateIndex
CREATE INDEX "lab_orders_clinicalOrderId_idx" ON "lab_orders"("clinicalOrderId");

-- CreateIndex
CREATE INDEX "lab_orders_integrationId_deliveryStatus_idx" ON "lab_orders"("integrationId", "deliveryStatus");

-- CreateIndex
CREATE INDEX "lab_result_items_labResultId_sequence_idx" ON "lab_result_items"("labResultId", "sequence");

-- CreateIndex
CREATE INDEX "lab_result_items_organizationId_loincCode_createdAt_idx" ON "lab_result_items"("organizationId", "loincCode", "createdAt");

-- CreateIndex
CREATE INDEX "lab_results_organizationId_critical_status_idx" ON "lab_results"("organizationId", "critical", "status");

-- CreateIndex
CREATE INDEX "lab_results_orderId_idx" ON "lab_results"("orderId");

-- CreateIndex
CREATE INDEX "lab_results_correctionOfId_idx" ON "lab_results"("correctionOfId");

-- AddForeignKey
ALTER TABLE "lab_events" ADD CONSTRAINT "lab_events_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_events" ADD CONSTRAINT "lab_events_labResultId_fkey" FOREIGN KEY ("labResultId") REFERENCES "lab_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_events" ADD CONSTRAINT "integration_events_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Database-level lifecycle and safety invariants.
ALTER TABLE "lab_orders"
ADD CONSTRAINT "lab_orders_priority_check"
CHECK ("priority" IN ('routine', 'urgent', 'stat')),
ADD CONSTRAINT "lab_orders_delivery_method_check"
CHECK ("deliveryMethod" IN ('manual', 'print', 'fax', 'electronic_adapter')),
ADD CONSTRAINT "lab_orders_delivery_status_check"
CHECK ("deliveryStatus" IN ('not_started', 'pending_manual', 'queued', 'delivered', 'failed')),
ADD CONSTRAINT "lab_orders_status_check"
CHECK ("status" IN ('draft', 'ready_to_send', 'transmission_queued', 'sent', 'collected', 'resulted', 'cancelled')),
ADD CONSTRAINT "lab_orders_delivery_attempts_check"
CHECK ("deliveryAttempts" >= 0),
ADD CONSTRAINT "lab_orders_electronic_integration_check"
CHECK ("deliveryMethod" <> 'electronic_adapter' OR "integrationId" IS NOT NULL);

ALTER TABLE "lab_results"
ADD CONSTRAINT "lab_results_source_type_check"
CHECK ("sourceType" IN ('manual_entry', 'manual_upload', 'electronic_interface')),
ADD CONSTRAINT "lab_results_status_check"
CHECK ("status" IN ('needs_review', 'reviewed', 'released', 'corrected')),
ADD CONSTRAINT "lab_results_notification_status_check"
CHECK ("patientNotificationStatus" IN ('not_started', 'pending', 'notified', 'declined', 'failed')),
ADD CONSTRAINT "lab_results_version_check"
CHECK ("version" >= 1),
ADD CONSTRAINT "lab_results_release_review_check"
CHECK ("status" <> 'released' OR ("reviewedAt" IS NOT NULL AND "reviewedBy" IS NOT NULL AND "releaseApprovedAt" IS NOT NULL AND "releaseApprovedBy" IS NOT NULL AND "releasedAt" IS NOT NULL AND "patientVisible" = true)),
ADD CONSTRAINT "lab_results_visibility_check"
CHECK ("patientVisible" = false OR "status" = 'released');

ALTER TABLE "lab_result_items"
ADD CONSTRAINT "lab_result_items_flag_check"
CHECK ("abnormalFlag" IS NULL OR "abnormalFlag" IN ('normal', 'high', 'low', 'abnormal', 'critical')),
ADD CONSTRAINT "lab_result_items_status_check"
CHECK ("resultStatus" IN ('preliminary', 'final', 'corrected')),
ADD CONSTRAINT "lab_result_items_critical_check"
CHECK ("critical" = false OR "abnormalFlag" = 'critical');

ALTER TABLE "lab_events"
ADD CONSTRAINT "lab_events_resource_check"
CHECK ("labOrderId" IS NOT NULL OR "labResultId" IS NOT NULL);

ALTER TABLE "integration_events"
ADD CONSTRAINT "integration_events_direction_check"
CHECK ("direction" IN ('inbound', 'outbound')),
ADD CONSTRAINT "integration_events_status_check"
CHECK ("status" IN ('queued', 'sent', 'acknowledged', 'failed', 'manual_review')),
ADD CONSTRAINT "integration_events_retry_count_check"
CHECK ("retryCount" >= 0);
