import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const editor = read("src/components/clinic/encounter-editor.tsx");

describe("Current Visit encounter experience", () => {
  it("organizes the provider surface around the professional-feedback visit sequence", () => {
    expect(editor).toContain('buildCurrentVisitModel');
    expect(editor).toContain('Current Visit');
    expect(editor).toContain('Patient snapshot');
    expect(editor).toContain('What changed');
    expect(editor).toContain('Staff handoff');
    expect(editor).toContain('Today');
    expect(editor).toContain('Clinical');
    expect(editor).toContain('Assessment & plan');
    expect(editor).toContain('Documentation & coding');
    expect(editor).toContain('Close visit');
  });

  it("preserves the governed encounter lifecycle while the experience converges", () => {
    expect(editor).toContain('EncounterCodingAddenda');
    expect(editor).toContain('Ready for review');
    expect(editor).toContain('Sign & lock note');
    expect(editor).toContain('AI may prepare a draft, never a final clinical note.');
  });

  it("states change and staff intake from derived truth rather than fabricating either", () => {
    // The change graph is no longer a hardcoded placeholder: it is derived from
    // persisted body map versions, and reports a baseline, a comparison, or nothing
    // recorded. What must not change is that neither section invents a conclusion.
    expect(editor).toContain('visit.changeSummary');
    expect(editor).toContain('visit.staffHandoff.message');
    expect(editor).not.toContain('AI detected improvement');
    expect(editor).not.toContain('Staff handoff complete');
  });
});
