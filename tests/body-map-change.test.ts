import { readFileSync } from "node:fs";
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

  it("does not infer resolution when the current body map is empty", () => {
    const emptyToday: BodyMapVersion = { ...today, id: "bm-empty-today", findings: [] };
    expect(compareBodyMapVersions(previous, emptyToday)).toEqual([]);
  });

  it("does not infer resolution from omission even when another current finding is documented", () => {
    const dizzinessOnlyToday: BodyMapVersion = {
      ...today,
      id: "bm-dizziness-only-today",
      findings: [today.findings[1]],
    };

    const deltas = compareBodyMapVersions(previous, dizzinessOnlyToday);

    expect(deltas).toEqual([
      expect.objectContaining({
        bodyRegion: "head",
        symptom: "dizziness",
        kind: "finding_added",
      }),
    ]);
    expect(deltas.some((delta) => delta.kind === "finding_removed")).toBe(false);
  });

  it("reports changed functional impact with evidence from both versions", () => {
    const functionImprovedToday: BodyMapVersion = {
      ...today,
      findings: [{ ...today.findings[0], functionalImpact: "Can now lift arm overhead with mild discomfort" }],
    };

    const deltas = compareBodyMapVersions(previous, functionImprovedToday);

    expect(deltas).toEqual(expect.arrayContaining([
      expect.objectContaining({
        bodyRegion: "shoulder",
        kind: "functional_impact_changed",
        previousValue: "Difficulty lifting arm overhead",
        currentValue: "Can now lift arm overhead with mild discomfort",
        evidence: [
          { bodyMapVersionId: "bm-previous", findingId: "finding-shoulder-left-prev" },
          { bodyMapVersionId: "bm-today", findingId: "finding-shoulder-left-today" },
        ],
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

  it("locks the follow-on persistence and Current Visit truth contract", () => {
    const contract = readFileSync("docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md", "utf8");

    for (const requiredInvariant of [
      "append-only/versioned persistence",
      "tenant + patient + encounter scoped reads",
      "Historical versions are never overwritten",
      "creator and captured-at provenance",
      "initial -> previous -> today",
      "Current Visit consumes persisted versions, never demo constants",
      "AI may explain deterministic deltas but may not create unsupported findings",
      "Omission is never clinical resolution",
      "amendment/addendum semantics rather than mutation",
      "does not satisfy P0 #244 by itself",
    ]) {
      expect(contract).toContain(requiredInvariant);
    }
  });
});
