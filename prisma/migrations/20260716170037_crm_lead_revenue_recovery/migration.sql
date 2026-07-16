-- AlterTable
ALTER TABLE "call_logs" ADD COLUMN     "leadId" TEXT;

-- AlterTable
ALTER TABLE "email_logs" ADD COLUMN     "leadId" TEXT;

-- AlterTable
ALTER TABLE "message_threads" ADD COLUMN     "leadId" TEXT;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "leadId" TEXT;

-- AlterTable
ALTER TABLE "sms_logs" ADD COLUMN     "leadId" TEXT;

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT NOT NULL,
    "campaignSource" TEXT,
    "serviceInterest" TEXT,
    "appointmentInterest" TEXT,
    "estimatedValueCents" INTEGER NOT NULL DEFAULT 0,
    "pipelineStage" TEXT NOT NULL DEFAULT 'new',
    "status" TEXT NOT NULL DEFAULT 'new',
    "assignedTo" TEXT,
    "followUpDueAt" TIMESTAMP(3),
    "contactAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastContactedAt" TIMESTAMP(3),
    "bookingStatus" TEXT NOT NULL DEFAULT 'not_started',
    "paymentStatus" TEXT NOT NULL DEFAULT 'not_started',
    "formStatus" TEXT NOT NULL DEFAULT 'not_started',
    "lostReason" TEXT,
    "notes" TEXT,
    "consentStatus" TEXT NOT NULL DEFAULT 'not_recorded',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "actorId" TEXT,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_organizationId_status_followUpDueAt_idx" ON "leads"("organizationId", "status", "followUpDueAt");

-- CreateIndex
CREATE INDEX "leads_organizationId_pipelineStage_updatedAt_idx" ON "leads"("organizationId", "pipelineStage", "updatedAt");

-- CreateIndex
CREATE INDEX "leads_organizationId_source_createdAt_idx" ON "leads"("organizationId", "source", "createdAt");

-- CreateIndex
CREATE INDEX "leads_patientId_idx" ON "leads"("patientId");

-- CreateIndex
CREATE INDEX "lead_events_organizationId_leadId_createdAt_idx" ON "lead_events"("organizationId", "leadId", "createdAt");

-- CreateIndex
CREATE INDEX "call_logs_organizationId_leadId_startedAt_idx" ON "call_logs"("organizationId", "leadId", "startedAt");

-- CreateIndex
CREATE INDEX "email_logs_organizationId_leadId_createdAt_idx" ON "email_logs"("organizationId", "leadId", "createdAt");

-- CreateIndex
CREATE INDEX "message_threads_organizationId_leadId_status_idx" ON "message_threads"("organizationId", "leadId", "status");

-- CreateIndex
CREATE INDEX "messages_organizationId_leadId_createdAt_idx" ON "messages"("organizationId", "leadId", "createdAt");

-- CreateIndex
CREATE INDEX "sms_logs_organizationId_leadId_createdAt_idx" ON "sms_logs"("organizationId", "leadId", "createdAt");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
