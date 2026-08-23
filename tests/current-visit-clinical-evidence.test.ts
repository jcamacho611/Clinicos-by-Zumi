import { describe, expect, it } from "vitest";
import {
  buildCurrentVisitClinicalEvidence,
  loadCurrentVisitClinicalEvidence,
} from "@/lib/clinical/current-visit-evidence";
import type { LabResult, PatientImagingResult } from "@/lib/types";

function lab(overrides: Partial<LabResult> = {}): LabResult {
  return {
    id: "lab-1",
    patientId: "patient-1",
    patient: "Jordan Lee",
    panel: "CBC",
    vendor: "Manual source",
    collectedAt: "2026-08-20T13:00:00.000Z",
    resultedAt: "2026-08-20T15:00:00.000Z",
    abnormalCount: 1,
    critical: false,
    reviewStatus: "Needs Review",
    patientVisible: false,
    source: "manual",
    sourceReference: "LAB-REF-1",
    version: 2,
    correctionOfId: "lab-original",
    items: [
      { id: "item-1", name: "Hemoglobin", value: "11.2", unit: "g/dL", range: "12-16", flag: "low", critical: false },
    ],
    ...overrides,
  };
}

function imaging(overrides: Partial<PatientImagingResult> = {}): PatientImagingResult {
  return {
    id: "img-1",
    patientId: "patient-1",
    title: "MRI cervical spine",
    study: "MRI cervical spine without contrast",
    modality: "MRI",
    bodyPart: "Cervical spine",
    facility: "Example Imaging",
    source: "manual",
    sourceReference: "IMG-REF-1",
    findings: "Multilevel degenerative changes.",
    impression: "No acute fracture.",
    imageReference: "internal-image-ref",
    studyPerformedAt: "2026-08-19T16:00:00.000Z",
    status: "final",
    urgentSourceFlag: true,
    patientVisible: false,
    version: 3,
    correctionOfId: "img-original",
    ...overrides,
  };
}

describe("Current Visit clinical evidence projection", () => {
  it("preserves lab review, correction, source, abnormal, and discrete evidence without duplicating patient identity", () => {
    const evidence = buildCurrentVisitClinicalEvidence("patient-1", { labs: [lab()], imaging: [] });

    expect(evidence.status).toBe("available");
    expect(evidence.labs[0]).toEqual({
      id: "lab-1",
      panel: "CBC",
      resultedAt: "2026-08-20T15:00:00.000Z",
      reviewStatus: "Needs Review",
      critical: false,
      abnormalCount: 1,
      source: "manual",
      sourceReference: "LAB-REF-1",
      version: 2,
      correctionOfId: "lab-original",
      items: [
        { id: "item-1", name: "Hemoglobin", value: "11.2", unit: "g/dL", range: "12-16", flag: "low", critical: false },
      ],
    });
    expect(evidence.labs[0]).not.toHaveProperty("patient");
    expect(evidence.labs[0]).not.toHaveProperty("patientVisible");
  });

  it("preserves imaging source, version, correction, urgent flag, findings, and impression without exposing image transport references", () => {
    const evidence = buildCurrentVisitClinicalEvidence("patient-1", { labs: [], imaging: [imaging()] });

    expect(evidence.imaging[0]).toEqual({
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
    });
    expect(evidence.imaging[0]).not.toHaveProperty("imageReference");
    expect(evidence.imaging[0]).not.toHaveProperty("patientVisible");
  });

  it("fails closed if a repository result does not belong to the encounter patient", () => {
    expect(() => buildCurrentVisitClinicalEvidence("patient-1", {
      labs: [lab({ patientId: "patient-2" })],
      imaging: [],
    })).toThrow("Clinical evidence patient mismatch");
  });

  it("bounds browser evidence while preserving repository order", () => {
    const labs = Array.from({ length: 9 }, (_, index) => lab({ id: `lab-${index + 1}`, sourceReference: `REF-${index + 1}` }));
    const imagingResults = Array.from({ length: 9 }, (_, index) => imaging({ id: `img-${index + 1}`, sourceReference: `IMG-${index + 1}` }));
    const evidence = buildCurrentVisitClinicalEvidence("patient-1", { labs, imaging: imagingResults });

    expect(evidence.labs.map((item) => item.id)).toEqual(["lab-1", "lab-2", "lab-3", "lab-4", "lab-5", "lab-6"]);
    expect(evidence.imaging.map((item) => item.id)).toEqual(["img-1", "img-2", "img-3", "img-4", "img-5", "img-6"]);
  });

  it("reports attention counts from explicit source state and never infers order completion", () => {
    const evidence = buildCurrentVisitClinicalEvidence("patient-1", {
      labs: [
        lab({ id: "needs-review", reviewStatus: "Needs Review" }),
        lab({ id: "critical", reviewStatus: "Reviewed", critical: true }),
        lab({ id: "corrected", reviewStatus: "Corrected", critical: false }),
      ],
      imaging: [imaging({ urgentSourceFlag: true })],
    });

    expect(evidence.attention).toEqual({
      labNeedsReview: 1,
      criticalLabs: 1,
      correctedLabs: 1,
      urgentImaging: 1,
    });
    expect(evidence.externalCompletion).toBe("not_inferred");
    expect(evidence).not.toHaveProperty("orderComplete");
  });

  it("treats no visible evidence as none available rather than normal", () => {
    const evidence = buildCurrentVisitClinicalEvidence("patient-1", { labs: [], imaging: [] });

    expect(evidence.status).toBe("none_available");
    expect(evidence.externalCompletion).toBe("not_inferred");
  });

  it("loads labs and imaging with the exact encounter patient and organization scope before projecting", async () => {
    const calls: Array<[string, string, string]> = [];
    const evidence = await loadCurrentVisitClinicalEvidence("patient-1", "org-1", {
      listLabsForPatient: async (patientId, organizationId) => {
        calls.push(["labs", patientId, organizationId]);
        return [lab()];
      },
      listImagingForPatient: async (patientId, organizationId) => {
        calls.push(["imaging", patientId, organizationId]);
        return [imaging()];
      },
    });

    expect(calls).toEqual([
      ["labs", "patient-1", "org-1"],
      ["imaging", "patient-1", "org-1"],
    ]);
    expect(evidence.labs[0].id).toBe("lab-1");
    expect(evidence.imaging[0].id).toBe("img-1");
    expect(evidence.externalCompletion).toBe("not_inferred");
  });
});
