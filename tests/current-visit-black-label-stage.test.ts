import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const page = fs.readFileSync(path.join(process.cwd(), "src/app/(platform)/encounters/[encounterId]/page.tsx"), "utf8");
const stage = fs.readFileSync(path.join(process.cwd(), "src/app/(platform)/encounters/[encounterId]/current-visit-black-label.module.css"), "utf8");
const editor = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/encounter-editor.tsx"), "utf8");

describe("Current Visit Black Label Object Stage", () => {
  it("scopes the existing governed EncounterEditor instead of creating a second clinical editor", () => {
    expect(page).toContain('import styles from "./current-visit-black-label.module.css"');
    expect(page).toContain('className={styles.stage}');
    expect(page).toContain("<EncounterEditor");
    expect(page).not.toContain("BlackLabelEncounterEditor");
    expect(page).not.toContain("CurrentVisitV2");
  });

  it("uses semantic Klinikos materials rather than a parallel palette", () => {
    expect(stage).toContain("var(--k-work-bg)");
    expect(stage).toContain("var(--k-public-surface)");
    expect(stage).toContain("var(--k-public-raised)");
    expect(stage).toContain("var(--k-text)");
    expect(stage).toContain("var(--k-muted)");
    expect(stage).toContain("var(--k-line)");
    expect(stage).toContain("var(--k-accent)");
    expect(stage).not.toContain("--black-label-");
  });

  it("turns the patient/context header into a stable Object Stage anchor", () => {
    expect(stage).toContain("position: sticky");
    expect(stage).toContain("Living Edge");
    expect(stage).toContain("box-shadow:");
    expect(stage).toContain("backdrop-filter:");
  });

  it("reduces generic card theater while preserving clinical hierarchy", () => {
    expect(stage).toContain('class*="shadow-[0_10px_35px"');
    expect(stage).toContain("box-shadow: none !important");
    expect(stage).toContain("border-color: var(--k-line) !important");
    expect(stage).toContain("Patient snapshot");
    expect(editor).toContain("What changed");
    expect(editor).toContain("Staff handoff");
    expect(editor).toContain("Assessment & plan");
    expect(editor).toContain("Documentation & coding");
    expect(editor).toContain("Close visit");
  });

  it("keeps clinical semantic danger/warning states visible instead of recoloring everything", () => {
    expect(stage).toContain("rose");
    expect(stage).toContain("amber");
    expect(stage).toContain("Clinical semantic states");
  });

  it("recomposes for mobile and reduced motion without hiding clinical work", () => {
    expect(stage).toContain("@media (max-width: 767px)");
    expect(stage).toContain("@media (prefers-reduced-motion: reduce)");
    expect(stage).toContain("min-height: 44px");
    expect(stage).not.toContain("display: none");
  });
});
