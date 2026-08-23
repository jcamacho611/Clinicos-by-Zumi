import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const vitalRepository = read("src/lib/repositories/vital-repository.ts");
const encounterPage = read("src/app/(platform)/encounters/[encounterId]/page.tsx");
const editor = read("src/components/clinic/encounter-editor.tsx");

describe("Current Visit prior-vital wiring", () => {
  it("scopes the prior measurement to the same organization and patient, before current measurement, outside the current encounter", () => {
    expect(vitalRepository).toContain("findPreviousVitalForPatient");
    expect(vitalRepository).toContain("organizationId");
    expect(vitalRepository).toContain("patientId");
    expect(vitalRepository).toContain("measuredAt: { lt: before }");
    expect(vitalRepository).toContain("NOT: { encounterId: excludeEncounterId }");
  });

  it("loads prior-vital evidence server-side and passes it into the existing Current Visit projection", () => {
    expect(encounterPage).toContain("findPreviousVitalForPatient");
    expect(encounterPage).toContain("previousVital");
    expect(editor).toContain("previousVital");
    expect(editor).toContain("Prior");
    expect(editor).toContain("Current");
    expect(editor).toContain("Klinikos has not interpreted");
  });
});
