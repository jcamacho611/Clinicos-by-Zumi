import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Current Visit staff handoff experience", () => {
  it("loads one encounter-scoped handoff projection on the server page", () => {
    const page = read("src/app/(platform)/encounters/[encounterId]/page.tsx");
    expect(page).toContain("getEncounterStaffHandoffProjection");
    expect(page).toContain("encounter.id, encounter.patientId, session.organizationId");
    expect(page).toContain("handoff={handoff}");
    expect(page).not.toContain("findLatestVitalForEncounter");
  });

  it("renders the four persisted handoff evidence classes without claiming completion", () => {
    const editor = read("src/components/clinic/encounter-editor.tsx");
    expect(editor).toContain("Medication reconciliation");
    expect(editor).toContain("Forms / screenings");
    expect(editor).toContain("Encounter work");
    expect(editor).toContain("Vitals captured");
    expect(editor).toContain("Other staff intake remains incomplete");
    expect(editor).not.toContain("Handoff complete");
  });

  it("passes the projection into the pure Current Visit model", () => {
    const editor = read("src/components/clinic/encounter-editor.tsx");
    expect(editor).toContain("handoff: EncounterStaffHandoffProjection");
    expect(editor).toContain("{ handoff }");
    expect(editor).not.toContain("vital: PatientVital | null");
  });
});
