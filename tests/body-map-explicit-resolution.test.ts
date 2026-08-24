import { describe, expect, it } from "vitest";
import { compareBodyMapVersions } from "@/lib/clinical/body-map-change";
import type { BodyMapVersion } from "@/lib/clinical/body-map-types";

function version(
  id: string,
  stage: BodyMapVersion["stage"],
  findings: Array<{
    id: string;
    bodyRegion: string;
    laterality: "left" | "right" | "bilateral" | "midline" | "not_applicable";
    symptom: string;
    severity: number | null;
    clinicalState: "active" | "resolved";
    functionalImpact: string | null;
    annotations: string[];
  }>,
): BodyMapVersion {
  return {
    id,
    patientId: "patient-1",
    encounterId: `encounter-${id}`,
    capturedAt: "2026-08-23T10:00:00.000Z",
    createdByUserId: "provider-1",
    stage,
    findings,
  } as BodyMapVersion;
}

const previous = version("previous", "previous", [
  {
    id: "previous-left-shoulder",
    bodyRegion: "Left Shoulder",
    laterality: "left",
    symptom: "Pain",
    severity: 6,
    clinicalState: "active",
    functionalImpact: "Difficulty lifting arm overhead",
    annotations: [],
  },
]);

describe("BodyMap explicit resolution", () => {
  it("emits one evidence-backed resolution transition and does not duplicate it as severity improvement", () => {
    const today = version("today", "today", [
      {
        id: "today-left-shoulder",
        bodyRegion: "Left Shoulder",
        laterality: "left",
        symptom: "Pain",
        severity: 0,
        clinicalState: "resolved",
        functionalImpact: null,
        annotations: [],
      },
    ]);

    expect(compareBodyMapVersions(previous, today)).toEqual([
      expect.objectContaining({
        kind: "finding_resolved",
        bodyRegion: "Left Shoulder",
        laterality: "left",
        symptom: "Pain",
        previousValue: "active",
        currentValue: "resolved",
        evidence: [
          { bodyMapVersionId: "previous", findingId: "previous-left-shoulder" },
          { bodyMapVersionId: "today", findingId: "today-left-shoulder" },
        ],
      }),
    ]);
  });

  it("does not manufacture a resolution transition when no matching prior active finding exists", () => {
    const today = version("today", "today", [
      {
        id: "today-dizziness",
        bodyRegion: "Head",
        laterality: "not_applicable",
        symptom: "Dizziness",
        severity: 0,
        clinicalState: "resolved",
        functionalImpact: null,
        annotations: [],
      },
    ]);

    expect(compareBodyMapVersions(previous, today)).toEqual([]);
  });

  it("matches Unicode-width and whitespace-equivalent finding identity instead of adding a fake new finding", () => {
    const today = version("today", "today", [
      {
        id: "today-left-shoulder",
        bodyRegion: " Left\u3000\u3000Shoulder ",
        laterality: "left",
        symptom: " ＰＡＩＮ ",
        severity: 6,
        clinicalState: "active",
        functionalImpact: "Difficulty lifting arm overhead",
        annotations: [],
      },
    ]);

    const deltas = compareBodyMapVersions(previous, today);
    expect(deltas).toEqual([
      expect.objectContaining({
        kind: "severity_unchanged",
        previousValue: 6,
        currentValue: 6,
      }),
    ]);
    expect(deltas).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "finding_added" }),
    ]));
  });
});
