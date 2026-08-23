import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const repository = readFileSync("src/lib/repositories/body-map-repository.ts", "utf8");

describe("BodyMap repository contract", () => {
  it("is server-only and validates all legacy provenance inside the creation transaction", () => {
    expect(repository).toContain('import "server-only"');
    expect(repository).toContain("db.$transaction");

    expect(repository).toContain("transaction.patient.findFirst");
    expect(repository).toContain("organizationId: input.organizationId");
    expect(repository).toContain('status: "active"');

    expect(repository).toContain("transaction.encounter.findFirst");
    expect(repository).toContain("encounter.patientId !== input.patientId");

    expect(repository).toContain("transaction.user.findFirst");
    expect(repository).toContain("id: input.actor.userId");

    expect(repository).toContain("transaction.bodyMapVersion.findFirst");
    expect(repository).toContain("amendsVersionId: input.amendsVersionId");
  });

  it("preserves encounter immutability by requiring amendment lineage after finalization", () => {
    expect(repository).toContain("FINALIZED_ENCOUNTER_STATUSES");
    expect(repository).toContain("finalized_requires_amendment");
    expect(repository).toContain("input.amendsVersionId");
  });

  it("creates version + findings + audit atomically and exposes no historical update/delete path", () => {
    expect(repository).toContain("transaction.bodyMapVersion.create");
    expect(repository).toContain("findings: { create:");
    expect(repository).toContain("transaction.auditLog.create");
    expect(repository).toContain('action: input.amendsVersionId ? "body_map.version_amended" : "body_map.version_created"');
    expect(repository).toContain('resourceType: "body_map_version"');

    expect(repository).not.toContain("bodyMapVersion.update");
    expect(repository).not.toContain("bodyMapVersion.delete");
    expect(repository).not.toContain("bodyMapFinding.update");
    expect(repository).not.toContain("bodyMapFinding.delete");
  });

  it("uses tenant-scoped explicit-select reads with deterministic latest ordering", () => {
    expect(repository).toContain("const bodyMapVersionSelect");
    expect(repository).toContain("select: bodyMapVersionSelect");
    expect(repository).toContain("listBodyMapVersionsForPatient");
    expect(repository).toContain("findLatestBodyMapVersionForEncounter");
    expect(repository).toContain("where: { organizationId, patientId }");
    expect(repository).toContain("where: { organizationId, patientId, encounterId }");
    expect(repository).toContain('orderBy: [{ capturedAt: "desc" }, { createdAt: "desc" }]');
  });

  it("keeps audit metadata bounded and excludes finding clinical content", () => {
    expect(repository).toContain("findingCount: validated.value.findings.length");
    expect(repository).toContain("encounterId: input.encounterId");
    expect(repository).toContain("amendsVersionId: input.amendsVersionId ?? null");
    expect(repository).not.toContain("metadata: { findings:");
    expect(repository).not.toContain("changes: { findings:");
  });
});
