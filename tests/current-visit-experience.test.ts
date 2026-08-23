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

  it("does not pretend the future change graph or staff intake snapshot is already implemented", () => {
    expect(editor).toContain('visit.change.message');
    expect(editor).toContain('visit.staffHandoff.message');
    expect(editor).not.toContain('AI detected improvement');
    expect(editor).not.toContain('Staff handoff complete');
  });
});
