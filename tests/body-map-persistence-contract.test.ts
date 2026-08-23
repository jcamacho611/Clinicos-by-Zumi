import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const schema = read("prisma/models/clinical-body-map.prisma");
const migration = read("prisma/migrations/20260823024500_clinical_body_map_foundation/migration.sql");
const repository = read("src/lib/clinical/body-map-repository.ts");

describe("immutable BodyMap persistence contract", () => {
  it("stores immutable captures and findings with explicit clinical context, not mutable comparison stage", () => {
    expect(schema).toContain("model ClinicalBodyMapVersion {");
    expect(schema).toContain("model ClinicalBodyMapFinding {");
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

  it("makes duplicate structured findings impossible within one capture and persists scale provenance", () => {
    expect(schema).toContain("findingKey");
    expect(schema).toContain("severityScale");
    expect(schema).toContain("@@unique([bodyMapVersionId, findingKey])");
    expect(migration).toContain("clinical_body_map_findings_version_finding_key_key");
    expect(migration).toContain("clinical_body_map_findings_severity_check");
  });

  it("uses only new-table foreign keys in this tranche and does not create hidden legacy cascades", () => {
    expect(migration).toContain('REFERENCES "clinical_body_map_versions"');
    expect(migration).not.toContain('REFERENCES "patients"');
    expect(migration).not.toContain('REFERENCES "encounters"');
    expect(migration).not.toContain('REFERENCES "organizations"');
    expect(migration).not.toContain('REFERENCES "users"');
  });

  it("keeps write authority server-side, validates tenant/patient/encounter scope, and exposes no update/delete path", () => {
    expect(repository).toContain('import "server-only"');
    expect(repository).toContain("db.patient.findFirst");
    expect(repository).toContain("db.encounter.findFirst");
    expect(repository).toContain("organizationId");
    expect(repository).toContain("patientId");
    expect(repository).toContain("encounterId");
    expect(repository).toContain("db.clinicalBodyMapVersion.create");
    expect(repository).not.toContain("db.clinicalBodyMapVersion.update");
    expect(repository).not.toContain("db.clinicalBodyMapVersion.delete");
    expect(repository).not.toContain("db.clinicalBodyMapFinding.update");
    expect(repository).not.toContain("db.clinicalBodyMapFinding.delete");
  });

  it("lists versions only through explicit tenant + patient + clinical-context scope", () => {
    expect(repository).toContain("listBodyMapVersions");
    expect(repository).toContain("contextType");
    expect(repository).toContain("contextId");
    expect(repository).toContain("take: limit");
  });
});
