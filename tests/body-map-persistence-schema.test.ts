import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const modelPath = "prisma/models/clinical-body-map.prisma";
const migrationPath = "prisma/migrations/20260823200000_body_map_persistence_v1/migration.sql";

describe("BodyMap persistence schema", () => {
  it("persists immutable source facts without persisting comparison roles", () => {
    const model = readFileSync(modelPath, "utf8");

    expect(model).toContain("model BodyMapVersion");
    expect(model).toContain("model BodyMapFinding");
    expect(model).toContain("enum BodyMapLaterality");
    expect(model).toContain("enum BodyMapFindingState");
    expect(model).toContain("active");
    expect(model).toContain("resolved");

    for (const field of [
      "organizationId",
      "patientId",
      "encounterId",
      "createdByUserId",
      "capturedAt",
      "amendsVersionId",
    ]) {
      expect(model).toContain(field);
    }

    expect(model).not.toMatch(/\bstage\s+/);
    expect(model).not.toContain("initial");
    expect(model).not.toContain("previous");
    expect(model).not.toContain("today");
  });

  it("keeps finding identity, laterality, explicit state, and governed severity structured", () => {
    const model = readFileSync(modelPath, "utf8");

    for (const value of ["left", "right", "bilateral", "midline", "not_applicable"]) {
      expect(model).toContain(value);
    }

    expect(model).toContain("findingKey");
    expect(model).toContain("bodyRegion");
    expect(model).toContain("laterality");
    expect(model).toContain("symptom");
    expect(model).toContain("severity");
    expect(model).toContain("clinicalState");
    expect(model).toContain("functionalImpact");
    expect(model).toContain("radiation");
    expect(model).toContain("annotations");
    expect(model).toContain("sourceObservation");
    expect(model).toContain("@@unique([bodyMapVersionId, findingKey])");
  });

  it("keeps legacy provenance identifiers explicit while enforcing immutable aggregate integrity", () => {
    const model = readFileSync(modelPath, "utf8");
    const migration = readFileSync(migrationPath, "utf8");

    // Legacy tenant/patient/encounter/user consistency is verified transactionally by
    // the server repository rather than adding reverse relations to the monolithic schema.
    for (const scalar of ["organizationId String", "patientId String", "encounterId String", "createdByUserId String"]) {
      expect(model).toContain(scalar);
    }

    expect(model).toContain("amendsVersion BodyMapVersion?");
    expect(model).toContain("onDelete: Restrict");
    expect(model).toContain("bodyMapVersion BodyMapVersion");
    expect(model).toContain("onDelete: Cascade");

    expect(migration).toContain('CREATE TABLE "body_map_versions"');
    expect(migration).toContain('CREATE TABLE "body_map_findings"');
    expect(migration).toContain('CHECK ("severity" IS NULL OR ("severity" >= 0 AND "severity" <= 10))');
    expect(migration).toContain('REFERENCES "body_map_versions"("id") ON DELETE RESTRICT');
    expect(migration).toContain('REFERENCES "body_map_versions"("id") ON DELETE CASCADE');

    expect(migration).toContain('"body_map_versions_organizationId_patientId_capturedAt_idx"');
    expect(migration).toContain('"body_map_versions_organizationId_encounterId_capturedAt_idx"');
    expect(migration).toContain('"body_map_findings_bodyMapVersionId_findingKey_key"');
  });
});
