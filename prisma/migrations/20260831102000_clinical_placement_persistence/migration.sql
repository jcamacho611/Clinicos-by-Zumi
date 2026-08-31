-- Add governed clinical placement persistence.
--
-- Placement stores lifecycle/context only. It does not grant licensure, professional
-- authority, clinical authority, Grid eligibility, school approval, site approval,
-- or preceptor authority. Approved supervised time is derived from append-only
-- placement_hour_events; no mutable approved-minutes counter is stored.

CREATE TABLE IF NOT EXISTS "education_placements" (
    "id" TEXT NOT NULL,
    "learnerPersonId" TEXT NOT NULL,
    "learnerRelationshipId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "programId" TEXT,
    "preceptorPersonId" TEXT NOT NULL,
    "preceptorRelationshipId" TEXT,
    "siteOrganizationId" TEXT NOT NULL,
    "siteLocationId" TEXT NOT NULL,
    "gridDemandId" TEXT,
    "gridOfferId" TEXT,
    "gridCompositionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'matched',
    "schoolApprovalState" TEXT NOT NULL DEFAULT 'pending',
    "schoolDecidedByPersonId" TEXT,
    "schoolEvidenceReference" TEXT,
    "schoolDecidedAt" TIMESTAMP(3),
    "siteApprovalState" TEXT NOT NULL DEFAULT 'pending',
    "siteDecidedByPersonId" TEXT,
    "siteEvidenceReference" TEXT,
    "siteDecidedAt" TIMESTAMP(3),
    "preceptorApprovalState" TEXT NOT NULL DEFAULT 'pending',
    "preceptorDecidedByPersonId" TEXT,
    "preceptorEvidenceReference" TEXT,
    "preceptorDecidedAt" TIMESTAMP(3),
    "learnerApprovalState" TEXT NOT NULL DEFAULT 'pending',
    "learnerDecidedByPersonId" TEXT,
    "learnerEvidenceReference" TEXT,
    "learnerDecidedAt" TIMESTAMP(3),
    "requiredMinutes" INTEGER NOT NULL,
    "plannedStartAt" TIMESTAMP(3),
    "plannedEndAt" TIMESTAMP(3),
    "matchedAt" TIMESTAMP(3) NOT NULL,
    "assignedAt" TIMESTAMP(3),
    "assignedByPersonId" TEXT,
    "actualStartAt" TIMESTAMP(3),
    "activatedByPersonId" TEXT,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_placements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "education_placements_required_minutes_check" CHECK ("requiredMinutes" > 0),
    CONSTRAINT "education_placements_planned_dates_check" CHECK (
      "plannedStartAt" IS NULL OR "plannedEndAt" IS NULL OR "plannedStartAt" <= "plannedEndAt"
    ),
    CONSTRAINT "education_placements_status_check" CHECK (
      "status" IN ('matched', 'awaiting_approvals', 'approved', 'active', 'completed', 'cancelled')
    ),
    CONSTRAINT "education_placements_school_approval_check" CHECK (
      "schoolApprovalState" IN ('pending', 'approved', 'rejected')
    ),
    CONSTRAINT "education_placements_site_approval_check" CHECK (
      "siteApprovalState" IN ('pending', 'approved', 'rejected')
    ),
    CONSTRAINT "education_placements_preceptor_approval_check" CHECK (
      "preceptorApprovalState" IN ('pending', 'accepted', 'declined')
    ),
    CONSTRAINT "education_placements_learner_approval_check" CHECK (
      "learnerApprovalState" IN ('pending', 'accepted', 'declined')
    )
);

CREATE INDEX IF NOT EXISTS "education_placements_learnerPersonId_status_idx"
    ON "education_placements"("learnerPersonId", "status");
CREATE INDEX IF NOT EXISTS "education_placements_enrollmentId_status_idx"
    ON "education_placements"("enrollmentId", "status");
CREATE INDEX IF NOT EXISTS "education_placements_institutionId_status_idx"
    ON "education_placements"("institutionId", "status");
CREATE INDEX IF NOT EXISTS "education_placements_preceptorPersonId_status_idx"
    ON "education_placements"("preceptorPersonId", "status");
CREATE INDEX IF NOT EXISTS "education_placements_siteOrganizationId_siteLocationId_status_idx"
    ON "education_placements"("siteOrganizationId", "siteLocationId", "status");
CREATE INDEX IF NOT EXISTS "education_placements_gridDemandId_idx"
    ON "education_placements"("gridDemandId");
CREATE INDEX IF NOT EXISTS "education_placements_gridOfferId_idx"
    ON "education_placements"("gridOfferId");
CREATE INDEX IF NOT EXISTS "education_placements_gridCompositionId_idx"
    ON "education_placements"("gridCompositionId");

ALTER TABLE "education_placements"
  ADD CONSTRAINT "education_placements_learnerPersonId_fkey"
  FOREIGN KEY ("learnerPersonId") REFERENCES "people"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "education_placements"
  ADD CONSTRAINT "education_placements_learnerRelationshipId_fkey"
  FOREIGN KEY ("learnerRelationshipId") REFERENCES "person_relationships"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "education_placements"
  ADD CONSTRAINT "education_placements_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "education_enrollments"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "education_placements"
  ADD CONSTRAINT "education_placements_institutionId_fkey"
  FOREIGN KEY ("institutionId") REFERENCES "education_institutions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "education_placements"
  ADD CONSTRAINT "education_placements_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "education_programs"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "education_placements"
  ADD CONSTRAINT "education_placements_preceptorPersonId_fkey"
  FOREIGN KEY ("preceptorPersonId") REFERENCES "people"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "education_placements"
  ADD CONSTRAINT "education_placements_preceptorRelationshipId_fkey"
  FOREIGN KEY ("preceptorRelationshipId") REFERENCES "person_relationships"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "education_placements"
  ADD CONSTRAINT "education_placements_siteOrganizationId_fkey"
  FOREIGN KEY ("siteOrganizationId") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "education_placements"
  ADD CONSTRAINT "education_placements_siteLocationId_fkey"
  FOREIGN KEY ("siteLocationId") REFERENCES "locations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "education_placements"
  ADD CONSTRAINT "education_placements_schoolDecidedByPersonId_fkey"
  FOREIGN KEY ("schoolDecidedByPersonId") REFERENCES "people"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "education_placements"
  ADD CONSTRAINT "education_placements_siteDecidedByPersonId_fkey"
  FOREIGN KEY ("siteDecidedByPersonId") REFERENCES "people"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "education_placements"
  ADD CONSTRAINT "education_placements_preceptorDecidedByPersonId_fkey"
  FOREIGN KEY ("preceptorDecidedByPersonId") REFERENCES "people"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "education_placements"
  ADD CONSTRAINT "education_placements_learnerDecidedByPersonId_fkey"
  FOREIGN KEY ("learnerDecidedByPersonId") REFERENCES "people"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "education_placements"
  ADD CONSTRAINT "education_placements_assignedByPersonId_fkey"
  FOREIGN KEY ("assignedByPersonId") REFERENCES "people"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "education_placements"
  ADD CONSTRAINT "education_placements_activatedByPersonId_fkey"
  FOREIGN KEY ("activatedByPersonId") REFERENCES "people"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "placement_hour_events" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "minutes" INTEGER NOT NULL,
    "activity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reportedByPersonId" TEXT NOT NULL,
    "reviewedByPersonId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceReference" TEXT,
    "evidenceReference" TEXT,
    "supersedesEventId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_hour_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "placement_hour_events_minutes_check" CHECK ("minutes" > 0),
    CONSTRAINT "placement_hour_events_status_check" CHECK (
      "status" IN ('reported', 'attested', 'accepted', 'rejected')
    )
);

CREATE INDEX IF NOT EXISTS "placement_hour_events_placementId_occurredAt_idx"
    ON "placement_hour_events"("placementId", "occurredAt");
CREATE INDEX IF NOT EXISTS "placement_hour_events_supersedesEventId_idx"
    ON "placement_hour_events"("supersedesEventId");
CREATE INDEX IF NOT EXISTS "placement_hour_events_reportedByPersonId_idx"
    ON "placement_hour_events"("reportedByPersonId");
CREATE INDEX IF NOT EXISTS "placement_hour_events_reviewedByPersonId_idx"
    ON "placement_hour_events"("reviewedByPersonId");

ALTER TABLE "placement_hour_events"
  ADD CONSTRAINT "placement_hour_events_placementId_fkey"
  FOREIGN KEY ("placementId") REFERENCES "education_placements"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "placement_hour_events"
  ADD CONSTRAINT "placement_hour_events_reportedByPersonId_fkey"
  FOREIGN KEY ("reportedByPersonId") REFERENCES "people"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "placement_hour_events"
  ADD CONSTRAINT "placement_hour_events_reviewedByPersonId_fkey"
  FOREIGN KEY ("reviewedByPersonId") REFERENCES "people"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
