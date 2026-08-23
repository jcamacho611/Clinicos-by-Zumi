import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CurrentVisitClinicalEvidenceCard } from "@/components/clinic/current-visit-clinical-evidence";
import type { CurrentVisitClinicalEvidence } from "@/lib/clinical/current-visit-evidence";

function availableEvidence(): CurrentVisitClinicalEvidence {
  return {
    status: "available",
    labs: [
      {
        id: "lab-1",
        panel: "CBC",
        resultedAt: "2026-08-20T15:00:00.000Z",
        reviewStatus: "Needs Review",
        critical: true,
        abnormalCount: 1,
        source: "manual",
        sourceReference: "LAB-REF-1",
        version: 2,
        correctionOfId: "lab-original",
        totalItemCount: 1,
        itemsTruncated: false,
        items: [
          { id: "item-1", name: "Hemoglobin", value: "11.2", unit: "g/dL", range: "12-16", flag: "low", critical: false },
        ],
      },
      {
        id: "lab-2",
        panel: "CMP",
        resultedAt: "2026-08-18T15:00:00.000Z",
        reviewStatus: "Corrected",
        critical: false,
        abnormalCount: 0,
        source: "connected lab",
        sourceReference: "LAB-REF-2",
        version: 3,
        correctionOfId: "lab-2-v2",
        totalItemCount: 0,
        itemsTruncated: false,
        items: [],
      },
    ],
    imaging: [
      {
        id: "img-1",
        title: "MRI cervical spine",
        study: "MRI cervical spine without contrast",
        modality: "MRI",
        bodyPart: "Cervical spine",
        facility: "Example Imaging",
        source: "manual",
        sourceReference: "IMG-REF-1",
        findings: "Multilevel degenerative changes.",
        impression: "No acute fracture.",
        studyPerformedAt: "2026-08-19T16:00:00.000Z",
        status: "final",
        urgentSourceFlag: true,
        version: 3,
        correctionOfId: "img-original",
      },
    ],
    attention: {
      labNeedsReview: 1,
      criticalLabs: 1,
      correctedLabs: 1,
      urgentImaging: 1,
    },
    externalCompletion: "not_inferred",
  };
}

describe("Current Visit clinical evidence card", () => {
  it("surfaces governed lab and imaging evidence with source attention state and no completion claim", () => {
    const markup = renderToStaticMarkup(<CurrentVisitClinicalEvidenceCard evidence={availableEvidence()} />);

    expect(markup).toContain("Orders &amp; results");
    expect(markup).toContain("CBC");
    expect(markup).toContain("Needs Review");
    expect(markup).toContain("Critical source flag");
    expect(markup).toContain("CMP");
    expect(markup).toContain("Corrected");
    expect(markup).toContain("MRI cervical spine");
    expect(markup).toContain("Urgent source flag");
    expect(markup).toContain("No acute fracture.");
    expect(markup).toContain("Evidence visibility does not mean the originating order is complete.");
  });

  it("keeps clinical evidence metadata at or above the repository readability floor", () => {
    const markup = renderToStaticMarkup(<CurrentVisitClinicalEvidenceCard evidence={availableEvidence()} />);

    expect(markup).not.toContain("text-[9px]");
    expect(markup).not.toContain("text-[10px]");
  });

  it("discloses when a displayed lab panel is partial", () => {
    const evidence = availableEvidence();
    evidence.labs[0] = { ...evidence.labs[0], totalItemCount: 120, itemsTruncated: true };
    const markup = renderToStaticMarkup(<CurrentVisitClinicalEvidenceCard evidence={evidence} />);

    expect(markup).toContain("Current Visit is showing a partial panel.");
    expect(markup).toContain("120 total source items");
    expect(markup).toContain("authoritative lab workspace");
  });

  it("describes empty evidence as unavailable rather than normal", () => {
    const evidence: CurrentVisitClinicalEvidence = {
      status: "none_available",
      labs: [],
      imaging: [],
      attention: { labNeedsReview: 0, criticalLabs: 0, correctedLabs: 0, urgentImaging: 0 },
      externalCompletion: "not_inferred",
    };
    const markup = renderToStaticMarkup(<CurrentVisitClinicalEvidenceCard evidence={evidence} />);

    expect(markup).toContain("No lab or imaging evidence is available for this patient in the current organization.");
    expect(markup).toContain("This is not a normal-result assertion.");
  });
});
