-- DropForeignKey
ALTER TABLE "document_events" DROP CONSTRAINT "document_events_documentId_fkey";

-- DropForeignKey
ALTER TABLE "form_assignments" DROP CONSTRAINT "form_assignments_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "form_assignments" DROP CONSTRAINT "form_assignments_encounterId_fkey";

-- DropForeignKey
ALTER TABLE "form_assignments" DROP CONSTRAINT "form_assignments_patientId_fkey";

-- DropForeignKey
ALTER TABLE "form_assignments" DROP CONSTRAINT "form_assignments_templateId_fkey";

-- DropForeignKey
ALTER TABLE "form_events" DROP CONSTRAINT "form_events_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "form_events" DROP CONSTRAINT "form_events_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "form_events" DROP CONSTRAINT "form_events_templateId_fkey";

-- DropForeignKey
ALTER TABLE "form_reviews" DROP CONSTRAINT "form_reviews_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "form_submissions" DROP CONSTRAINT "form_submissions_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "form_submissions" DROP CONSTRAINT "form_submissions_documentId_fkey";

-- AlterTable
ALTER TABLE "form_submissions" ALTER COLUMN "status" SET DEFAULT 'draft';

-- AlterTable
ALTER TABLE "form_templates" ALTER COLUMN "status" SET DEFAULT 'draft';

-- CreateTable
CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "paymentId" TEXT,
    "patientId" TEXT,
    "actorId" TEXT,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "amountCents" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_plans" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "billingInterval" TEXT NOT NULL DEFAULT 'monthly',
    "includedSessions" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_memberships" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "remainingSessions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_plans" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "includedSessions" INTEGER NOT NULL,
    "expirationDays" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_purchases" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "packagePlanId" TEXT NOT NULL,
    "paymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "remainingSessions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_events_organizationId_createdAt_idx" ON "payment_events"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "payment_events_paymentId_createdAt_idx" ON "payment_events"("paymentId", "createdAt");

-- CreateIndex
CREATE INDEX "payment_events_patientId_createdAt_idx" ON "payment_events"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "membership_plans_organizationId_status_idx" ON "membership_plans"("organizationId", "status");

-- CreateIndex
CREATE INDEX "patient_memberships_organizationId_status_idx" ON "patient_memberships"("organizationId", "status");

-- CreateIndex
CREATE INDEX "patient_memberships_patientId_status_idx" ON "patient_memberships"("patientId", "status");

-- CreateIndex
CREATE INDEX "package_plans_organizationId_status_idx" ON "package_plans"("organizationId", "status");

-- CreateIndex
CREATE INDEX "package_purchases_organizationId_status_idx" ON "package_purchases"("organizationId", "status");

-- CreateIndex
CREATE INDEX "package_purchases_patientId_status_idx" ON "package_purchases"("patientId", "status");
