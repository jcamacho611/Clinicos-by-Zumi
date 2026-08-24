import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("persisted vitals truth boundary", () => {
  it("scopes encounter vital lookup by organization, patient, and encounter", () => {
    const repository = read("src/lib/repositories/vital-repository.ts");
    expect(repository).toContain('import "server-only"');
    expect(repository).toContain("organizationId");
    expect(repository).toContain("patientId");
    expect(repository).toContain("encounterId");
    expect(repository).toContain("measuredAt: \"desc\"");
    expect(repository).toContain("take: 1");
  });

  it("loads the encounter vital on the server and passes only the vital DTO into Current Visit", () => {
    const page = read("src/app/(platform)/encounters/[encounterId]/page.tsx");
    expect(page).toContain("findLatestVitalForEncounter");
    expect(page).toContain("vital={vital}");
  });

  it("renders measured vitals without claiming a complete handoff", () => {
    const editor = read("src/components/clinic/encounter-editor.tsx");
    expect(editor).toContain("visit.staffHandoff.status");
    expect(editor).toContain('"partial"');
    expect(editor).toContain("Vitals captured");
    // The editor renders the handoff message rather than composing its own claim, so the
    // caveat is asserted where it is authored. Requiring the literal in the component
    // would only prove the sentence had been copied into a second place.
    expect(editor).toContain("visit.staffHandoff.message");
    expect(editor).not.toContain("Staff handoff complete");

    const model = read("src/lib/clinical/current-visit-model.ts");
    expect(model).toContain("Other staff intake");
    expect(model).not.toContain("Staff handoff complete");
  });
});
