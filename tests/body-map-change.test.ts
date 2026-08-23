import { describe, expect, it } from "vitest";
import { compareBodyMapVersions } from "@/lib/clinical/body-map-change";
import type { BodyMapVersion } from "@/lib/clinical/body-map-types";

const baseFinding = {
  bodyRegion: "shoulder",
  laterality: "left" as const,
  symptom: "pain",
  severityScale: "zero_to_ten" as const,
  functionalImpact: "Difficulty lifting arm overhead",
  annotations: [] as string[],
};

const initial: BodyMapVersion = {
  id: "bm-initial",
  organizationId: "org-1",
  patientId: "patient-1",
  encounterId: "encounter-initial",
  contextType: "financial_case",
  contextId: "case-1",
  capturedAt: "2026-06-01T10:00:00.000Z",
  createdByUserId: "provider-1",
  findings: [{ id: "finding-shoulder-left", ...baseFinding, severity: 8 }],
};

const previous: BodyMapVersion = {
  ...initial,
  id: "bm-previous",
  encounterId: "encounter-previous",
  capturedAt: "2026-07-01T10:00:00.000Z",
  findings: [{ id: "finding-shoulder-left-prev", ...baseFinding, severity: 6 }],
};

const today: BodyMapVersion = {
  ...initial,
  id: "bm-today",
  encounterId: "encounter-today",
  capturedAt: "2026-08-22T10:00:00.000Z",
  findings: [
    { id: "finding-shoulder-left-today", ...baseFinding, severity: 6 },
    {
      id: "finding-dizziness-today",
      bodyRegion: "head",
      laterality: "not_applicable",
      symptom: "dizziness",
      severity: null,
      severityScale: null,
      functionalImpact: "Intermittent dizziness with position change",
      annotations: [],
    },
  ],
};

describe("BodyMap longitudinal clinical change", () => {
  it("reports severity improvement with evidence from both versions", () => {
    expect(compareBodyMapVersions(initial, previous)).toEqual(expect.arrayContaining([
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
    expect(compareBodyMapVersions(previous, today)).toEqual(expect.arrayContaining([
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
    expect(compareBodyMapVersions(previous, today)).toEqual(expect.arrayContaining([
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
    expect(compareBodyMapVersions(previous, { ...today, id: "bm-empty", findings: [] })).toEqual([]);
  });

  it("does not infer resolution from omission even when another current finding is documented", () => {
    const dizzinessOnly = { ...today, id: "bm-dizziness-only", findings: [today.findings[1]] };
    expect(compareBodyMapVersions(previous, dizzinessOnly)).toEqual([
      expect.objectContaining({ bodyRegion: "head", symptom: "dizziness", kind: "finding_added" }),
    ]);
  });

  it("rejects cross-patient comparison", () => {
    expect(() => compareBodyMapVersions(previous, { ...today, patientId: "patient-2" })).toThrow("Body map patient mismatch");
  });

  it("rejects cross-organization comparison", () => {
    expect(() => compareBodyMapVersions(previous, { ...today, organizationId: "org-2" })).toThrow("Body map organization mismatch");
  });

  it("rejects cross-context comparison so unrelated episodes are not blended", () => {
    expect(() => compareBodyMapVersions(previous, { ...today, contextId: "case-2" })).toThrow("Body map clinical context mismatch");
  });

  it("rejects duplicate structured finding keys instead of silently collapsing evidence", () => {
    const ambiguous = { ...today, findings: [today.findings[0], { ...today.findings[0], id: "duplicate", severity: 7 }] };
    expect(() => compareBodyMapVersions(previous, ambiguous)).toThrow("Duplicate body map finding key");
  });

  it("requires an explicit scale for numeric severity", () => {
    const unsafe = { ...today, findings: [{ ...today.findings[0], severityScale: null }] };
    expect(() => compareBodyMapVersions(previous, unsafe)).toThrow("Body map severity scale required");
  });

  it("rejects out-of-range zero-to-ten severity instead of comparing invalid evidence", () => {
    const unsafe = { ...today, findings: [{ ...today.findings[0], severity: 11 }] };
    expect(() => compareBodyMapVersions(previous, unsafe)).toThrow("Body map severity out of range");
  });

  it("reports changed functional impact with evidence from both versions", () => {
    const changed = { ...today, findings: [{ ...today.findings[0], functionalImpact: "Can now lift arm overhead with mild discomfort" }] };
    expect(compareBodyMapVersions(previous, changed)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        bodyRegion: "shoulder",
        kind: "functional_impact_changed",
        previousValue: "Difficulty lifting arm overhead",
        currentValue: "Can now lift arm overhead with mild discomfort",
      }),
    ]));
  });

  it("does not mutate historical body-map versions during comparison", () => {
    const beforePrevious = JSON.stringify(previous);
    const beforeToday = JSON.stringify(today);
    compareBodyMapVersions(previous, today);
    expect(JSON.stringify(previous)).toBe(beforePrevious);
    expect(JSON.stringify(today)).toBe(beforeToday);
  });

  it("does not persist mutable initial/previous/today labels on an immutable capture", () => {
    expect(initial).not.toHaveProperty("stage");
    expect(previous).not.toHaveProperty("stage");
    expect(today).not.toHaveProperty("stage");
  });
});
