import { describe, expect, it } from "vitest";
import { compareBodyMapVersions } from "@/lib/clinical/body-map-change";
import type { BodyMapVersion } from "@/lib/clinical/body-map-types";

const initial: BodyMapVersion = {
  id: "bm-initial",
  patientId: "patient-1",
  encounterId: "encounter-initial",
  capturedAt: "2026-06-01T10:00:00.000Z",
  createdByUserId: "provider-1",
  stage: "initial",
  findings: [
    {
      id: "finding-shoulder-left",
      bodyRegion: "shoulder",
      laterality: "left",
      symptom: "pain",
      severity: 8,
      functionalImpact: "Difficulty lifting arm overhead",
      annotations: [],
    },
  ],
};

const previous: BodyMapVersion = {
  id: "bm-previous",
  patientId: "patient-1",
  encounterId: "encounter-previous",
  capturedAt: "2026-07-01T10:00:00.000Z",
  createdByUserId: "provider-1",
  stage: "previous",
  findings: [
    {
      id: "finding-shoulder-left-prev",
      bodyRegion: "shoulder",
      laterality: "left",
      symptom: "pain",
      severity: 6,
      functionalImpact: "Difficulty lifting arm overhead",
      annotations: [],
    },
  ],
};

const today: BodyMapVersion = {
  id: "bm-today",
  patientId: "patient-1",
  encounterId: "encounter-today",
  capturedAt: "2026-08-22T10:00:00.000Z",
  createdByUserId: "provider-1",
  stage: "today",
  findings: [
    {
      id: "finding-shoulder-left-today",
      bodyRegion: "shoulder",
      laterality: "left",
      symptom: "pain",
      severity: 6,
      functionalImpact: "Difficulty lifting arm overhead",
      annotations: [],
    },
    {
      id: "finding-dizziness-today",
      bodyRegion: "head",
      laterality: "not_applicable",
      symptom: "dizziness",
      severity: null,
      functionalImpact: "Intermittent dizziness with position change",
      annotations: [],
    },
  ],
};

describe("BodyMap longitudinal clinical change", () => {
  it("reports severity improvement with evidence from both versions", () => {
    const deltas = compareBodyMapVersions(initial, previous);

    expect(deltas).toEqual(expect.arrayContaining([
      expect.objectContaining({
        bodyRegion: "shoulder",
        laterality: "left",
        symptom: "pain",
        kind: "severity_improved",
        previousValue: 8,
        currentValue: 6,
        evidence: [
          { bodyMapVersionId: "bm-initial", findingId: "finding-shoulder-left" },
          { bodyMapVersionId: "bm-previous", findingId: "finding-shoulder-left-prev" },
        ],
      }),
    ]));
  });

  it("reports unchanged severity without inventing improvement", () => {
    const deltas = compareBodyMapVersions(previous, today);

    expect(deltas).toEqual(expect.arrayContaining([
      expect.objectContaining({
        bodyRegion: "shoulder",
        laterality: "left",
        symptom: "pain",
        kind: "severity_unchanged",
        previousValue: 6,
        currentValue: 6,
      }),
    ]));
  });

  it("reports a newly documented finding using only current evidence", () => {
    const deltas = compareBodyMapVersions(previous, today);

    expect(deltas).toEqual(expect.arrayContaining([
      expect.objectContaining({
        bodyRegion: "head",
        symptom: "dizziness",
        kind: "finding_added",
        previousValue: null,
        currentValue: "dizziness",
        evidence: [{ bodyMapVersionId: "bm-today", findingId: "finding-dizziness-today" }],
      }),
    ]));
  });

  it("does not mutate historical body-map versions during comparison", () => {
    const beforeInitial = JSON.stringify(initial);
    const beforePrevious = JSON.stringify(previous);

    compareBodyMapVersions(initial, previous);

    expect(JSON.stringify(initial)).toBe(beforeInitial);
    expect(JSON.stringify(previous)).toBe(beforePrevious);
  });

  it("locks the doctor-defined initial -> previous -> today golden case", () => {
    const initialToPrevious = compareBodyMapVersions(initial, previous);
    const previousToToday = compareBodyMapVersions(previous, today);

    expect(initialToPrevious).toEqual(expect.arrayContaining([
      expect.objectContaining({ bodyRegion: "shoulder", laterality: "left", symptom: "pain", kind: "severity_improved", previousValue: 8, currentValue: 6 }),
    ]));

    expect(previousToToday).toEqual(expect.arrayContaining([
      expect.objectContaining({ bodyRegion: "shoulder", laterality: "left", symptom: "pain", kind: "severity_unchanged", previousValue: 6, currentValue: 6 }),
      expect.objectContaining({ bodyRegion: "head", symptom: "dizziness", kind: "finding_added" }),
    ]));

    for (const delta of [...initialToPrevious, ...previousToToday]) {
      expect(delta.evidence.length).toBeGreaterThan(0);
      if (delta.bodyRegion === "shoulder") expect(delta.evidence).toHaveLength(2);
    }
  });
});
