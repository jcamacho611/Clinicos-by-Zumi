import { describe, expect, it } from "vitest";

import { buildCurrentVisitChange, summariseClinicalChange } from "@/lib/clinical/current-visit-change";
import type { BodyMapVersion } from "@/lib/clinical/body-map-types";

/**
 * "What changed" is the section a physician reads first. It was a hardcoded
 * placeholder that always said nothing had been captured, while a working comparison
 * engine sat unused beside it.
 *
 * The states must stay distinct: a first visit has no change to show, which is not the
 * same as nothing having been recorded.
 */

function version(overrides: Partial<BodyMapVersion> & { id: string }): BodyMapVersion {
  return {
    patientId: "patient-1",
    encounterId: "encounter-1",
    capturedAt: "2026-08-01T10:00:00.000Z",
    createdByUserId: "user-1",
    stage: "previous",
    findings: [],
    ...overrides,
  };
}

const shoulder = {
  id: "f1",
  bodyRegion: "shoulder",
  laterality: "right" as const,
  symptom: "pain",
  severity: 8,
  functionalImpact: null,
  annotations: [],
};

describe("buildCurrentVisitChange", () => {
  it("reports nothing captured when there is no body map at all", () => {
    const change = buildCurrentVisitChange({ previous: null, current: null });
    expect(change.status).toBe("not_available");
  });

  it("distinguishes a first recorded map from nothing being recorded", () => {
    // A baseline is real clinical information. Calling it "not captured" would be
    // false, and would hide that a map exists.
    const change = buildCurrentVisitChange({
      previous: null,
      current: version({ id: "v1", stage: "today", findings: [shoulder] }),
    });
    expect(change.status).toBe("baseline");
    if (change.status !== "baseline") throw new Error("unreachable");
    expect(change.findingCount).toBe(1);
  });

  it("compares two versions and reports real deltas", () => {
    const change = buildCurrentVisitChange({
      previous: version({ id: "v1", findings: [shoulder] }),
      current: version({
        id: "v2",
        stage: "today",
        capturedAt: "2026-08-20T10:00:00.000Z",
        findings: [{ ...shoulder, severity: 5 }],
      }),
    });
    expect(change.status).toBe("compared");
    if (change.status !== "compared") throw new Error("unreachable");
    expect(change.deltas).toHaveLength(1);
    expect(change.deltas[0].kind).toBe("severity_improved");
    expect(change.improved).toBe(1);
    expect(change.worsened).toBe(0);
  });

  it("counts a worsening separately from an improvement", () => {
    const change = buildCurrentVisitChange({
      previous: version({ id: "v1", findings: [shoulder] }),
      current: version({ id: "v2", stage: "today", findings: [{ ...shoulder, severity: 9 }] }),
    });
    if (change.status !== "compared") throw new Error("unreachable");
    expect(change.worsened).toBe(1);
    expect(change.improved).toBe(0);
  });

  it("never reports a finding as resolved because it stopped appearing", () => {
    // Omission is not resolution. A finding present before and absent now produces no
    // delta at all, because the absence is not evidence of recovery.
    const change = buildCurrentVisitChange({
      previous: version({ id: "v1", findings: [shoulder] }),
      current: version({ id: "v2", stage: "today", findings: [] }),
    });
    // No current findings means nothing to compare, not "everything resolved".
    if (change.status === "compared") {
      expect(change.deltas.every((d) => d.kind !== ("resolved" as never))).toBe(true);
    }
    expect(JSON.stringify(change)).not.toMatch(/resolved/i);
  });
});

describe("summariseClinicalChange", () => {
  it("says plainly when there is nothing to compare against", () => {
    expect(summariseClinicalChange(buildCurrentVisitChange({ previous: null, current: null })))
      .toBe("No body map has been recorded for this patient yet.");
  });

  it("frames a first map as a starting point, not a gap", () => {
    const s = summariseClinicalChange(buildCurrentVisitChange({
      previous: null,
      current: version({ id: "v1", stage: "today", findings: [shoulder] }),
    }));
    expect(s).toBe("This is the first body map recorded. It becomes the baseline to compare against next visit.");
  });

  it("leads with what improved and what worsened", () => {
    const s = summariseClinicalChange(buildCurrentVisitChange({
      previous: version({ id: "v1", findings: [shoulder, { ...shoulder, id: "f2", bodyRegion: "knee" }] }),
      current: version({
        id: "v2",
        stage: "today",
        findings: [{ ...shoulder, severity: 5 }, { ...shoulder, id: "f2", bodyRegion: "knee", severity: 9 }],
      }),
    }));
    expect(s).toBe("1 finding improved and 1 worsened since the last body map.");
  });

  it("uses no internal state names in anything a clinician reads", () => {
    const states = [
      buildCurrentVisitChange({ previous: null, current: null }),
      buildCurrentVisitChange({ previous: null, current: version({ id: "v1", stage: "today", findings: [shoulder] }) }),
      buildCurrentVisitChange({
        previous: version({ id: "v1", findings: [shoulder] }),
        current: version({ id: "v2", stage: "today", findings: [{ ...shoulder, severity: 5 }] }),
      }),
    ];
    for (const state of states) {
      expect(summariseClinicalChange(state)).not.toMatch(/[a-z]+_[a-z]+|[A-Z]{3,}/);
    }
  });
});
