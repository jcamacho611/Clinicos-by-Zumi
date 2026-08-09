CREATE TABLE "demo_scenarios" (
  "id" TEXT NOT NULL,
  "salesOwnerOrganizationId" TEXT NOT NULL,
  "clinicType" TEXT NOT NULL,
  "primaryPainPoint" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "syntheticPatient" JSONB NOT NULL,
  "syntheticAppointment" JSONB NOT NULL,
  "syntheticDocument" JSONB NOT NULL,
  "syntheticReferral" JSONB NOT NULL,
  "syntheticTask" JSONB NOT NULL,
  "syntheticResult" JSONB NOT NULL,
  "syntheticBillingItem" JSONB NOT NULL,
  "syntheticOwnerAlert" JSONB NOT NULL,
  "syntheticRevenueLeak" JSONB NOT NULL,
  "recommendedWorkflow" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ready',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "demo_scenarios_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "demo_scenarios_status_check" CHECK ("status" IN ('ready', 'archived'))
);

CREATE TABLE "demo_reservations" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "salesOwnerOrganizationId" TEXT NOT NULL,
  "clinicName" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "contactRole" TEXT NOT NULL,
  "contactEmail" TEXT NOT NULL,
  "contactPhone" TEXT NOT NULL,
  "clinicType" TEXT NOT NULL,
  "providerCount" INTEGER NOT NULL,
  "locationCount" INTEGER NOT NULL,
  "biggestPainPoint" TEXT NOT NULL,
  "painPoints" JSONB NOT NULL,
  "currentSystems" JSONB NOT NULL,
  "estimatedSoftwareSpendCents" INTEGER,
  "wantsFreeIntro" BOOLEAN NOT NULL DEFAULT false,
  "wantsPaidDemo" BOOLEAN NOT NULL DEFAULT true,
  "wantsFoundingEvaluation" BOOLEAN NOT NULL DEFAULT false,
  "wantsFoundingProgram" BOOLEAN NOT NULL DEFAULT false,
  "selectedOffer" TEXT NOT NULL DEFAULT 'private_workflow_demo',
  "priceCents" INTEGER NOT NULL DEFAULT 50000,
  "status" TEXT NOT NULL DEFAULT 'inquiry',
  "paymentStatus" TEXT NOT NULL DEFAULT 'not_started',
  "scheduledAt" TIMESTAMP(3),
  "demoScenarioId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "demo_reservations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "demo_reservations_provider_count_check" CHECK ("providerCount" BETWEEN 1 AND 10000),
  CONSTRAINT "demo_reservations_location_count_check" CHECK ("locationCount" BETWEEN 1 AND 1000),
  CONSTRAINT "demo_reservations_price_check" CHECK ("priceCents" >= 0),
  CONSTRAINT "demo_reservations_spend_check" CHECK ("estimatedSoftwareSpendCents" IS NULL OR "estimatedSoftwareSpendCents" >= 0),
  CONSTRAINT "demo_reservations_pain_points_check" CHECK (jsonb_typeof("painPoints") = 'array'),
  CONSTRAINT "demo_reservations_current_systems_check" CHECK (jsonb_typeof("currentSystems") = 'object'),
  CONSTRAINT "demo_reservations_offer_check" CHECK ("selectedOffer" IN ('private_workflow_demo', 'founding_clinic_evaluation', 'founding_clinic_program')),
  CONSTRAINT "demo_reservations_status_check" CHECK ("status" IN ('inquiry', 'qualified', 'payment_pending', 'reserved', 'scheduled', 'completed', 'no_show', 'moved_to_evaluation', 'moved_to_founding', 'closed_lost')),
  CONSTRAINT "demo_reservations_payment_status_check" CHECK ("paymentStatus" IN ('not_started', 'manual_link_required', 'payment_pending', 'payment_recorded', 'credited_forward', 'waived', 'refunded'))
);

CREATE TABLE "demo_recaps" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "salesOwnerOrganizationId" TEXT NOT NULL,
  "painPoint" TEXT NOT NULL,
  "whatWasShown" JSONB NOT NULL,
  "workflowGaps" JSONB NOT NULL,
  "recommendedNextStep" TEXT NOT NULL,
  "estimatedValueAreas" JSONB NOT NULL,
  "productStatusSnapshot" JSONB NOT NULL,
  "priceOption" JSONB NOT NULL,
  "callToAction" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "reviewStatus" TEXT NOT NULL DEFAULT 'human_review_required',
  "draftedBy" TEXT NOT NULL DEFAULT 'deterministic_fallback',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "demo_recaps_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "demo_recaps_status_check" CHECK ("status" IN ('draft', 'approved', 'archived')),
  CONSTRAINT "demo_recaps_review_status_check" CHECK ("reviewStatus" IN ('human_review_required', 'approved', 'rejected'))
);

CREATE TABLE "demo_reservation_events" (
  "id" TEXT NOT NULL,
  "salesOwnerOrganizationId" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "actorId" TEXT,
  "actorType" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT,
  "note" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "demo_reservation_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "demo_reservation_events_actor_type_check" CHECK ("actorType" IN ('public_contact', 'user', 'system'))
);

CREATE UNIQUE INDEX "demo_reservations_demoScenarioId_key" ON "demo_reservations"("demoScenarioId");
CREATE INDEX "demo_reservations_salesOwnerOrganizationId_status_createdAt_idx" ON "demo_reservations"("salesOwnerOrganizationId", "status", "createdAt");
CREATE INDEX "demo_reservations_organizationId_updatedAt_idx" ON "demo_reservations"("organizationId", "updatedAt");
CREATE INDEX "demo_reservations_contactEmail_createdAt_idx" ON "demo_reservations"("contactEmail", "createdAt");
CREATE INDEX "demo_scenarios_salesOwnerOrganizationId_status_createdAt_idx" ON "demo_scenarios"("salesOwnerOrganizationId", "status", "createdAt");
CREATE UNIQUE INDEX "demo_recaps_reservationId_key" ON "demo_recaps"("reservationId");
CREATE INDEX "demo_recaps_salesOwnerOrganizationId_reviewStatus_createdAt_idx" ON "demo_recaps"("salesOwnerOrganizationId", "reviewStatus", "createdAt");
CREATE INDEX "demo_reservation_events_salesOwnerOrganizationId_createdAt_idx" ON "demo_reservation_events"("salesOwnerOrganizationId", "createdAt");
CREATE INDEX "demo_reservation_events_reservationId_createdAt_idx" ON "demo_reservation_events"("reservationId", "createdAt");

ALTER TABLE "demo_scenarios" ADD CONSTRAINT "demo_scenarios_salesOwnerOrganizationId_fkey" FOREIGN KEY ("salesOwnerOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "demo_reservations" ADD CONSTRAINT "demo_reservations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "demo_reservations" ADD CONSTRAINT "demo_reservations_salesOwnerOrganizationId_fkey" FOREIGN KEY ("salesOwnerOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "demo_reservations" ADD CONSTRAINT "demo_reservations_demoScenarioId_fkey" FOREIGN KEY ("demoScenarioId") REFERENCES "demo_scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "demo_recaps" ADD CONSTRAINT "demo_recaps_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "demo_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "demo_recaps" ADD CONSTRAINT "demo_recaps_salesOwnerOrganizationId_fkey" FOREIGN KEY ("salesOwnerOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "demo_reservation_events" ADD CONSTRAINT "demo_reservation_events_salesOwnerOrganizationId_fkey" FOREIGN KEY ("salesOwnerOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "demo_reservation_events" ADD CONSTRAINT "demo_reservation_events_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "demo_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
