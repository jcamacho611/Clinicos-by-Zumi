import { describe, expect, it } from "vitest";
import { buildVitalChangeSet } from "@/lib/clinical/vital-change";
import type { PatientVital } from "@/lib/clinical/vital-types";

const previous: PatientVital = {
  id: "vital-prior",
  measuredAt: "2026-07-22T13:00:00.000Z",
  bloodPressureSystolic: 140,
  bloodPressureDiastolic: 90,
  heartRate: 80,
  temperatureF: 98.4,
  oxygenPercent: 97,
  weightLbs: 180,
  heightInches: 65,
  bmi: 30,
};

const current: PatientVital = {
  id: "vital-current",
  measuredAt: "2026-08-22T13:00:00.000Z",
  bloodPressureSystolic: 132,
  bloodPressureDiastolic: 84,
  heartRate: 80,
  temperatureF: 98.8,
  oxygenPercent: 98,
  weightLbs: 174,
  heightInches: 65,
  bmi: 29,
};

describe("Current Visit deterministic vital change", () => {
  it("compares persisted prior and current measurements without clinical interpretation", () => {
    const change = buildVitalChangeSet(previous, current);

    expect(change.status).toBe("partial");
    expect(change.source).toBe("vital_comparison");
    expect(change.previousMeasuredAt).toBe(previous.measuredAt);
    expect(change.currentMeasuredAt).toBe(current.measuredAt);
    expect(change.metrics).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "blood_pressure_systolic", prior: 140, current: 132, delta: -8, direction: "decreased", unit: "mmHg" }),
      expect.objectContaining({ key: "heart_rate", prior: 80, current: 80, delta: 0, direction: "unchanged", unit: "bpm" }),
      expect.objectContaining({ key: "weight", prior: 180, current: 174, delta: -6, direction: "decreased", unit: "lb" }),
    ]));
    expect(change.metrics.some((metric) => "interpretation" in metric)).toBe(false);
  });

  it("omits a metric when either comparison value is absent instead of inventing data", () => {
    const incomplete = { ...current, oxygenPercent: null };
    const change = buildVitalChangeSet(previous, incomplete);

    expect(change.metrics.some((metric) => metric.key === "oxygen_percent")).toBe(false);
  });

  it("does not create a change set without both persisted measurements", () => {
    expect(buildVitalChangeSet(null, current).status).toBe("not_available");
    expect(buildVitalChangeSet(previous, null).status).toBe("not_available");
  });
});
