-- Immutable structured BodyMap capture substrate.
-- Additive only. Clinical comparison roles such as initial/previous/today are
-- derived from encounter/context reads and are not persisted as mutable labels.

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
      CHECK ("contextType" IN ('patient_longitudinal','financial_case','clinical_episode','encounter_series'))
);

CREATE TABLE "clinical_body_map_findings" (
    "id" TEXT NOT NULL,
    "bodyMapVersionId" TEXT NOT NULL,
    "findingKey" TEXT NOT NULL,
    "bodyRegion" TEXT NOT NULL,
    "laterality" TEXT NOT NULL,
    "symptom" TEXT NOT NULL,
    "severity" INTEGER,
    "severityScale" TEXT,
    "functionalImpact" TEXT,
    "annotations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_body_map_findings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "clinical_body_map_findings_laterality_check"
      CHECK ("laterality" IN ('left','right','bilateral','midline','not_applicable')),
    CONSTRAINT "clinical_body_map_findings_severity_check"
      CHECK (("severity" IS NULL AND "severityScale" IS NULL)
        OR ("severityScale" = 'zero_to_ten' AND "severity" BETWEEN 0 AND 10))
);

CREATE INDEX "clinical_body_map_versions_scope_captured_idx"
  ON "clinical_body_map_versions"("organizationId", "patientId", "contextType", "contextId", "capturedAt");
CREATE INDEX "clinical_body_map_versions_encounter_idx"
  ON "clinical_body_map_versions"("organizationId", "encounterId", "capturedAt");
CREATE UNIQUE INDEX "clinical_body_map_versions_supersedes_key"
  ON "clinical_body_map_versions"("supersedesVersionId") WHERE "supersedesVersionId" IS NOT NULL;
CREATE UNIQUE INDEX "clinical_body_map_findings_version_finding_key_key"
  ON "clinical_body_map_findings"("bodyMapVersionId", "findingKey");
CREATE INDEX "clinical_body_map_findings_region_idx"
  ON "clinical_body_map_findings"("bodyRegion", "laterality", "symptom");

ALTER TABLE "clinical_body_map_versions"
  ADD CONSTRAINT "clinical_body_map_versions_supersedes_fkey"
  FOREIGN KEY ("supersedesVersionId") REFERENCES "clinical_body_map_versions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "clinical_body_map_findings"
  ADD CONSTRAINT "clinical_body_map_findings_version_fkey"
  FOREIGN KEY ("bodyMapVersionId") REFERENCES "clinical_body_map_versions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
