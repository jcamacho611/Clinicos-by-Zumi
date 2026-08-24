import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const schemaPath = "prisma/models/clinical-body-map.prisma";
const migrationPath = "prisma/migrations/20260823024500_clinical_body_map_foundation/migration.sql";
const repositoryPath = "src/lib/clinical/body-map-repository.ts";

describe("immutable BodyMap persistence contract", () => {
  it("persists immutable source facts and never comparison-only initial/previous/today stage", () => {
    const schema = read(schemaPath);

    expect(schema).toContain("model ClinicalBodyMapVersion {");
    expect(schema).toContain("model ClinicalBodyMapFinding {");
    expect(schema).toContain("model ClinicalBodyMapEvent {");
    expect(schema).toContain("organizationId");
    expect(schema).toContain("patientId");
    expect(schema).toContain("encounterId");
    expect(schema).toContain("contextType");
    expect(schema).toContain("contextId");
    expect(schema).toContain("capturedAt");
    expect(schema).toContain("createdByUserId");
    expect(schema).not.toMatch(/\bstage\b/);
    expect(schema).not.toContain("updatedAt");
  });

  it("keeps correction history linear and Prisma migration semantics aligned", () => {
    const schema = read(schemaPath);
    const migration = read(migrationPath);

    expect(schema).toContain("supersedesVersionId String? @unique");
    expect(migration).toContain('CREATE UNIQUE INDEX "clinical_body_map_versions_supersedes_key"');
    expect(migration).toContain('ON "clinical_body_map_versions"("supersedesVersionId");');
    expect(migration).not.toMatch(/supersedesVersionId"\)\s+WHERE/i);
  });

  it("preserves governed 0-10 severity including decimal values and rejects NULL scale loopholes", () => {
    const schema = read(schemaPath);
    const migration = read(migrationPath);

    expect(schema).toContain("severity         Float?");
    expect(schema).toContain("severityScale    String?");
    expect(schema).toContain("clinicalState    String");
    expect(schema).toContain("resolutionNote   String?");
    expect(migration).toContain("clinical_body_map_findings_severity_check");
    expect(migration).toContain('"severity" IS NOT NULL');
    expect(migration).toContain('"severityScale" IS NOT NULL');
    expect(migration).toContain("clinical_body_map_findings_state_check");
    expect(migration).toContain("clinical_body_map_findings_resolution_check");
    expect(migration).toContain("BETWEEN 0 AND 10");
  });

  it("makes duplicate structured findings impossible within one capture", () => {
    const schema = read(schemaPath);
    const migration = read(migrationPath);

    expect(schema).toContain("findingKey");
    expect(schema).toContain("@@unique([bodyMapVersionId, findingKey])");
    expect(migration).toContain("clinical_body_map_findings_version_finding_key_key");
  });

  it("records append-only capture, review, resolution and amendment evidence", () => {
    const schema = read(schemaPath);
    const migration = read(migrationPath);
    const repository = read(repositoryPath);

    expect(schema).toContain("eventType");
    expect(schema).toContain("actorUserId");
    expect(schema).toContain("occurredAt");
    expect(migration).toContain("capture_created");
    expect(migration).toContain("review_recorded");
    expect(migration).toContain("finding_resolved");
    expect(migration).toContain("amendment_created");
    expect(repository).toContain("recordBodyMapReview");
    expect(repository).toContain("finding_resolved");
    expect(repository).not.toContain("db.clinicalBodyMapVersion.update");
    expect(repository).not.toContain("db.clinicalBodyMapVersion.delete");
    expect(repository).not.toContain("db.clinicalBodyMapFinding.update");
    expect(repository).not.toContain("db.clinicalBodyMapFinding.delete");
  });

  it("uses only new-table foreign keys so legacy lifecycle cascades cannot erase clinical history", () => {
    const migration = read(migrationPath);

    expect(migration).toContain('REFERENCES "clinical_body_map_versions"');
    expect(migration).toContain('REFERENCES "clinical_body_map_findings"');
    expect(migration).not.toContain('REFERENCES "patients"');
    expect(migration).not.toContain('REFERENCES "encounters"');
    expect(migration).not.toContain('REFERENCES "organizations"');
    expect(migration).not.toContain('REFERENCES "users"');
    expect(migration).not.toContain("ON DELETE CASCADE");
  });

  it("keeps write authority server-only and validates organization, patient, encounter and actor scope", () => {
    const repository = read(repositoryPath);

    expect(repository).toContain('import "server-only"');
    expect(repository).toContain("db.patient.findFirst");
    expect(repository).toContain("db.encounter.findFirst");
    expect(repository).toContain("db.user.findFirst");
    expect(repository).toContain("organizationId");
    expect(repository).toContain("patientId");
    expect(repository).toContain("encounterId");
    expect(repository).toContain("db.$transaction");
    expect(repository).toContain("tx.clinicalBodyMapVersion.create");
  });

  it("never converts clinic ownership or administration into clinical author/reviewer authority", () => {
    const repository = read(repositoryPath);

    expect(repository).toContain('const CLINICIAN_AUTHOR_ROLES = new Set(["provider"]);');
    expect(repository).toContain('const STAFF_AUTHOR_ROLES = new Set(["clinical_staff"]);');
    expect(repository).toContain('const REVIEW_ROLES = new Set(["provider"]);');
    expect(repository).not.toMatch(/CLINICIAN_AUTHOR_ROLES[^;]*clinic_owner/s);
    expect(repository).not.toMatch(/REVIEW_ROLES[^;]*clinic_owner/s);
    expect(repository).not.toMatch(/REVIEW_ROLES[^;]*administrator/s);
  });

  it("requires provenance for reviewed imports rather than accepting an untraceable clinical source", () => {
    const repository = read(repositoryPath);

    expect(repository).toContain('sourceType === "reviewed_import"');
    expect(repository).toContain("Reviewed BodyMap imports require a source reference");
  });

  it("lists versions only through explicit tenant, patient and clinical-context scope with a bounded limit", () => {
    const repository = read(repositoryPath);

    expect(repository).toContain("listBodyMapVersions");
    expect(repository).toContain("contextType");
    expect(repository).toContain("contextId");
    expect(repository).toContain("Math.min(input.limit ?? 20, 50)");
    expect(repository).toContain("take: limit");
  });
});
