import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Current Visit encounter staff handoff projection", () => {
  it("defines one minimum-necessary projection across existing encounter evidence", () => {
    const types = read("src/lib/clinical/encounter-handoff-types.ts");
    expect(types).toContain("EncounterStaffHandoffProjection");
    expect(types).toContain("vital");
    expect(types).toContain("medicationReconciliation");
    expect(types).toContain("forms");
    expect(types).toContain("tasks");
    expect(types).not.toContain("organizationId");
  });

  it("lets the Current Visit model consume the projection instead of inventing intake state", () => {
    const model = read("src/lib/clinical/current-visit-model.ts");
    expect(model).toContain("EncounterStaffHandoffProjection");
    expect(model).toContain("handoff?: EncounterStaffHandoffProjection | null");
    expect(model).toContain("Other staff intake remains incomplete");
    expect(model).not.toContain('source: "encounter_vitals"');
  });

  it("keeps handoff completion conservative", () => {
    const model = read("src/lib/clinical/current-visit-model.ts");
    expect(model).toContain('status: "not_available"');
    expect(model).toContain('status: "partial"');
    expect(model).not.toContain('status: "complete"');
  });
});
