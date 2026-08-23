-- Immutable structured BodyMap persistence.
-- Comparison roles (initial / previous / today) are deliberately not stored.

CREATE TABLE "clinical_body_map_versions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "contextType" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'clinician_entry',
    "sourceReference" TEXT,
    "supersedesVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_body_map_versions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "clinical_body_map_versions_context_type_check"
      CHECK ("contextType" IN ('patient_longitudinal','financial_case','clinical_episode','encounter_series')),
    CONSTRAINT "clinical_body_map_versions_source_type_check"
      CHECK ("sourceType" IN ('clinician_entry','staff_entry','reviewed_import'))
);

CREATE TABLE "clinical_body_map_findings" (
    "id" TEXT NOT NULL,
    "bodyMapVersionId" TEXT NOT NULL,
    "findingKey" TEXT NOT NULL,
    "bodyRegion" TEXT NOT NULL,
    "laterality" TEXT NOT NULL,
    "symptom" TEXT NOT NULL,
    "severity" DOUBLE PRECISION,
    "severityScale" TEXT,
    "functionalImpact" TEXT,
    "annotations" TEXT[] NOT NULL,
    "clinicalState" TEXT NOT NULL DEFAULT 'active',
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_body_map_findings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "clinical_body_map_findings_laterality_check"
      CHECK ("laterality" IN ('left','right','bilateral','midline','not_applicable')),
    CONSTRAINT "clinical_body_map_findings_severity_check"
      CHECK (("severity" IS NULL AND "severityScale" IS NULL)
        OR ("severityScale" = 'zero_to_ten' AND "severity" BETWEEN 0 AND 10)),
    CONSTRAINT "clinical_body_map_findings_state_check"
      CHECK ("clinicalState" IN ('active','resolved')),
    CONSTRAINT "clinical_body_map_findings_resolution_check"
      CHECK (("clinicalState" = 'active' AND "resolutionNote" IS NULL)
        OR ("clinicalState" = 'resolved' AND "resolutionNote" IS NOT NULL AND length(btrim("resolutionNote")) > 0))
);

CREATE TABLE "clinical_body_map_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "bodyMapVersionId" TEXT NOT NULL,
    "findingId" TEXT,
    "eventType" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "sourceReference" TEXT,
    "metadata" JSONB,

    CONSTRAINT "clinical_body_map_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "clinical_body_map_events_type_check"
      CHECK ("eventType" IN ('capture_created','review_recorded','finding_resolved','amendment_created')),
    CONSTRAINT "clinical_body_map_events_finding_scope_check"
      CHECK (("eventType" = 'finding_resolved' AND "findingId" IS NOT NULL)
        OR ("eventType" <> 'finding_resolved' AND "findingId" IS NULL))
);

CREATE INDEX "clinical_body_map_versions_scope_captured_idx"
  ON "clinical_body_map_versions"("organizationId", "patientId", "contextType", "contextId", "capturedAt");
CREATE INDEX "clinical_body_map_versions_encounter_idx"
  ON "clinical_body_map_versions"("organizationId", "encounterId", "capturedAt");
CREATE UNIQUE INDEX "clinical_body_map_versions_supersedes_key"
  ON "clinical_body_map_versions"("supersedesVersionId");
CREATE UNIQUE INDEX "clinical_body_map_findings_version_finding_key_key"
  ON "clinical_body_map_findings"("bodyMapVersionId", "findingKey");
CREATE INDEX "clinical_body_map_findings_region_idx"
  ON "clinical_body_map_findings"("bodyRegion", "laterality", "symptom");
CREATE INDEX "clinical_body_map_events_patient_occurred_idx"
  ON "clinical_body_map_events"("organizationId", "patientId", "occurredAt");
CREATE INDEX "clinical_body_map_events_version_occurred_idx"
  ON "clinical_body_map_events"("bodyMapVersionId", "occurredAt");
CREATE INDEX "clinical_body_map_events_finding_occurred_idx"
  ON "clinical_body_map_events"("findingId", "occurredAt");

ALTER TABLE "clinical_body_map_versions"
  ADD CONSTRAINT "clinical_body_map_versions_supersedes_fkey"
  FOREIGN KEY ("supersedesVersionId") REFERENCES "clinical_body_map_versions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "clinical_body_map_findings"
  ADD CONSTRAINT "clinical_body_map_findings_version_fkey"
  FOREIGN KEY ("bodyMapVersionId") REFERENCES "clinical_body_map_versions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "clinical_body_map_events"
  ADD CONSTRAINT "clinical_body_map_events_version_fkey"
  FOREIGN KEY ("bodyMapVersionId") REFERENCES "clinical_body_map_versions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "clinical_body_map_events"
  ADD CONSTRAINT "clinical_body_map_events_finding_fkey"
  FOREIGN KEY ("findingId") REFERENCES "clinical_body_map_findings"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
