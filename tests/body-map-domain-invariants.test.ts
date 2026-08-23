import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { compareBodyMapVersions } from "@/lib/clinical/body-map-change";
import type { BodyMapVersion } from "@/lib/clinical/body-map-types";

function version(id: string, severity: number | null): BodyMapVersion {
  return {
    id,
    patientId: "patient-1",
    encounterId: `encounter-${id}`,
    capturedAt: "2026-08-23T12:00:00.000Z",
    createdByUserId: "provider-1",
    stage: "today",
    findings: [{
      id: `finding-${id}`,
      bodyRegion: "shoulder",
      laterality: "left",
      symptom: "pain",
      severity,
      functionalImpact: null,
      annotations: [],
    }],
  };
}

describe("BodyMap clinical-domain invariants", () => {
  it("fails closed when normalized symptom severity is outside the governed 0-10 scale", () => {
    for (const severity of [-1, 10.1, Number.POSITIVE_INFINITY, Number.NaN]) {
      expect(() => compareBodyMapVersions(version("prior", 6), version("today", severity))).toThrow("Invalid body map severity");
    }
  });

  it("documents that initial/previous/today are derived comparison roles rather than persisted clinical attributes", () => {
    const types = readFileSync("src/lib/clinical/body-map-types.ts", "utf8");
    const contract = readFileSync("docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md", "utf8");

    expect(types).toContain("comparison-only role");
    expect(types).toContain("must not be persisted as authoritative clinical state");
    expect(contract).toContain("Comparison roles are derived, not persisted");
    expect(contract).toContain("0–10 normalized symptom-severity scale");
    expect(contract).toContain("higher values mean worse severity");
    expect(contract).toContain("ROM, strength, or another structured measure");
  });
});
