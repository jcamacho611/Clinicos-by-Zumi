-- CreateTable
CREATE TABLE "luxe_services" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "mobileAvailable" BOOLEAN NOT NULL DEFAULT false,
    "requiresConsultation" BOOLEAN NOT NULL DEFAULT true,
    "providerReviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "luxe_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "luxe_treatment_plans" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "providerId" TEXT,
    "name" TEXT NOT NULL,
    "goals" JSONB,
    "recommendedSessions" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reviewStatus" TEXT NOT NULL DEFAULT 'needs_provider_review',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "luxe_treatment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "luxe_treatment_sessions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "treatmentPlanId" TEXT,
    "appointmentId" TEXT,
    "encounterId" TEXT,
    "providerId" TEXT,
    "sessionNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "luxe_treatment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "luxe_promotions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "serviceId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "discountCents" INTEGER,
    "discountPercent" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "luxe_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "luxe_services_organizationId_category_status_idx" ON "luxe_services"("organizationId", "category", "status");

-- CreateIndex
CREATE UNIQUE INDEX "luxe_services_organizationId_key_key" ON "luxe_services"("organizationId", "key");

-- CreateIndex
CREATE INDEX "luxe_treatment_plans_organizationId_status_reviewStatus_idx" ON "luxe_treatment_plans"("organizationId", "status", "reviewStatus");

-- CreateIndex
CREATE INDEX "luxe_treatment_plans_organizationId_patientId_updatedAt_idx" ON "luxe_treatment_plans"("organizationId", "patientId", "updatedAt");

-- CreateIndex
CREATE INDEX "luxe_treatment_plans_serviceId_idx" ON "luxe_treatment_plans"("serviceId");

-- CreateIndex
CREATE INDEX "luxe_treatment_sessions_organizationId_status_scheduledAt_idx" ON "luxe_treatment_sessions"("organizationId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "luxe_treatment_sessions_organizationId_patientId_createdAt_idx" ON "luxe_treatment_sessions"("organizationId", "patientId", "createdAt");

-- CreateIndex
CREATE INDEX "luxe_treatment_sessions_treatmentPlanId_sessionNumber_idx" ON "luxe_treatment_sessions"("treatmentPlanId", "sessionNumber");

-- CreateIndex
CREATE INDEX "luxe_promotions_organizationId_status_startsAt_endsAt_idx" ON "luxe_promotions"("organizationId", "status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "luxe_promotions_serviceId_idx" ON "luxe_promotions"("serviceId");
