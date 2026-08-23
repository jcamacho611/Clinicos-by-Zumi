import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("encounter handoff repository boundary", () => {
  it("is server-only and scopes every domain query to organization, patient, and encounter", () => {
    const source = read("src/lib/repositories/encounter-handoff-repository.ts");
    expect(source).toContain('import "server-only"');
    expect(source).toContain("organizationId, patientId, encounterId");
    expect(source).toContain("findLatestVitalForEncounter(encounterId, patientId, organizationId)");
    expect(source).toContain("medicationReconciliation.findFirst");
    expect(source).toContain("formSubmission.findMany");
    expect(source).toContain("task.findMany");
  });

  it("returns a deliberate handoff DTO rather than raw ORM rows", () => {
    const source = read("src/lib/repositories/encounter-handoff-repository.ts");
    expect(source).toContain("EncounterStaffHandoffProjection");
    expect(source).toContain("discrepancyCount");
    expect(source).toContain("ownerAssigned");
    expect(source).not.toContain("return { vital, reconciliation, submissions, tasks }");
  });
});
