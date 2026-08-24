import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const modelPath = "prisma/models/clinical-body-map.prisma";
const migrationPath = "prisma/migrations/20260823200000_body_map_persistence_v1/migration.sql";

describe("BodyMap persistence schema", () => {
  it("persists immutable source facts without persisting comparison roles", () => {
    const model = readFileSync(modelPath, "utf8");

    expect(model).toContain("model BodyMapVersion");
    expect(model).toContain("model BodyMapFinding");
    expect(model).toMatch(/enum\s+BodyMapLaterality\s*\{/);
    expect(model).toMatch(/enum\s+BodyMapFindingState\s*\{[\s\S]*\bactive\b[\s\S]*\bresolved\b[\s\S]*\}/);

    for (const field of [
      "organizationId",
      "patientId",
      "encounterId",
      "createdByUserId",
      "capturedAt",
      "amendsVersionId",
    ]) {
      expect(model).toMatch(new RegExp(`\\b${field}\\s+`));
    }

    expect(model).not.toMatch(/\bstage\s+[A-Za-z]/);
    expect(model).not.toMatch(/enum\s+BodyMapStage\b/);
  });

  it("keeps finding identity, laterality, explicit state, and governed severity structured", () => {
    const model = readFileSync(modelPath, "utf8");

    for (const value of ["left", "right", "bilateral", "midline", "not_applicable"]) {
      expect(model).toMatch(new RegExp(`\\b${value}\\b`));
    }

    for (const field of [
      "findingKey",
      "bodyRegion",
      "laterality",
      "symptom",
      "severity",
      "clinicalState",
      "functionalImpact",
      "radiation",
      "annotations",
      "sourceObservation",
    ]) {
      expect(model).toMatch(new RegExp(`\\b${field}\\s+`));
    }
    expect(model).toContain("@@unique([bodyMapVersionId, findingKey])");
  });

  it("keeps legacy provenance identifiers explicit while enforcing immutable aggregate integrity", () => {
    const model = readFileSync(modelPath, "utf8");
    const migration = readFileSync(migrationPath, "utf8");

    // Legacy tenant/patient/encounter/user consistency is verified transactionally by
    // the server repository rather than adding reverse relations to the monolithic schema.
    for (const scalar of ["organizationId", "patientId", "encounterId", "createdByUserId"]) {
      expect(model).toMatch(new RegExp(`\\b${scalar}\\s+String\\b`));
    }

    expect(model).toMatch(/amendsVersion\s+BodyMapVersion\?/);
    expect(model).toContain("onDelete: Restrict");
    expect(model).toMatch(/bodyMapVersion\s+BodyMapVersion\b/);
    expect(model).toContain("onDelete: Cascade");

    expect(migration).toContain('CREATE TABLE "body_map_versions"');
    expect(migration).toContain('CREATE TABLE "body_map_findings"');
    expect(migration).toContain('CHECK ("severity" IS NULL OR ("severity" >= 0 AND "severity" <= 10))');
    expect(migration).toMatch(/REFERENCES\s+"body_map_versions"\("id"\)\s+ON DELETE RESTRICT/);
    expect(migration).toMatch(/REFERENCES\s+"body_map_versions"\("id"\)\s+ON DELETE CASCADE/);

    expect(migration).toContain('"body_map_versions_organizationId_patientId_capturedAt_idx"');
    expect(migration).toContain('"body_map_versions_organizationId_encounterId_capturedAt_idx"');
    expect(migration).toContain('"body_map_findings_bodyMapVersionId_findingKey_key"');
  });
});
