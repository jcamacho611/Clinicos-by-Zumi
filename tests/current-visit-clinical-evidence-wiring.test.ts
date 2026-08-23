import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const encounterPage = readFileSync(join(root, "src/app/(platform)/encounters/[encounterId]/page.tsx"), "utf8");
const encounterEditor = readFileSync(join(root, "src/components/clinic/encounter-editor.tsx"), "utf8");

describe("Current Visit clinical evidence browser boundary", () => {
  it("loads governed lab and imaging repositories on the authenticated server page before passing a bounded projection to the client", () => {
    expect(encounterPage).toContain("listLabResultsForPatient");
    expect(encounterPage).toContain("listImagingResultsForPatient");
    expect(encounterPage).toContain("loadCurrentVisitClinicalEvidence");
    expect(encounterPage).toContain("clinicalEvidence={clinicalEvidence}");
    expect(encounterPage).not.toContain("labs={");
    expect(encounterPage).not.toContain("imaging={");
  });

  it("types the editor boundary as CurrentVisitClinicalEvidence and renders the dedicated evidence card", () => {
    expect(encounterEditor).toContain("CurrentVisitClinicalEvidenceCard");
    expect(encounterEditor).toContain("CurrentVisitClinicalEvidence");
    expect(encounterEditor).toContain("clinicalEvidence: CurrentVisitClinicalEvidence");
    expect(encounterEditor).toContain("<CurrentVisitClinicalEvidenceCard evidence={clinicalEvidence} />");
  });
});
