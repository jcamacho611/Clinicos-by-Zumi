import { describe, expect, it } from "vitest";
import {
  bodyMapFindingPersistenceKey,
  validateBodyMapVersionInput,
  type CreateBodyMapVersionInput,
} from "@/lib/clinical/body-map-persistence";

function validInput(overrides: Partial<CreateBodyMapVersionInput> = {}): CreateBodyMapVersionInput {
  return {
    capturedAt: new Date("2026-08-23T18:00:00.000Z"),
    source: "clinical_capture",
    findings: [
      {
        bodyRegion: "Left Shoulder",
        laterality: "left",
        symptom: "Pain",
        severity: 6,
        clinicalState: "active",
        functionalImpact: "Difficulty lifting arm overhead",
        radiation: null,
        annotations: [],
        sourceObservation: null,
      },
    ],
    ...overrides,
  };
}

describe("BodyMap persistence input", () => {
  it("normalizes finding identity deterministically", () => {
    expect(bodyMapFindingPersistenceKey({
      bodyRegion: "  Left Shoulder ",
      laterality: "left",
      symptom: " PAIN ",
    })).toBe("left shoulder::left::pain");
  });

  it.each([-1, 11, Number.NaN, Number.POSITIVE_INFINITY, 4.5])(
    "rejects invalid governed symptom severity %s",
    (severity) => {
      const result = validateBodyMapVersionInput(validInput({
        findings: [{ ...validInput().findings[0], severity }],
      }));
      expect(result.ok).toBe(false);
    },
  );

  it("rejects blank structured identity fields", () => {
    expect(validateBodyMapVersionInput(validInput({
      findings: [{ ...validInput().findings[0], bodyRegion: "   " }],
    })).ok).toBe(false);

    expect(validateBodyMapVersionInput(validInput({
      findings: [{ ...validInput().findings[0], symptom: "" }],
    })).ok).toBe(false);
  });

  it("rejects duplicate normalized finding identity within one immutable version", () => {
    const first = validInput().findings[0];
    const result = validateBodyMapVersionInput(validInput({
      findings: [
        first,
        { ...first, bodyRegion: " left shoulder ", symptom: "pain", severity: 7 },
      ],
    }));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toContain("Duplicate");
  });

  it("accepts explicit resolved state as recorded evidence rather than inferring it from omission", () => {
    const result = validateBodyMapVersionInput(validInput({
      findings: [{ ...validInput().findings[0], clinicalState: "resolved", severity: 0 }],
    }));

    expect(result.ok).toBe(true);
  });

  it("rejects invalid capture time and unknown comparison-role persistence", () => {
    expect(validateBodyMapVersionInput(validInput({ capturedAt: new Date("invalid") })).ok).toBe(false);

    const withStage = { ...validInput(), stage: "today" } as CreateBodyMapVersionInput & { stage: string };
    expect(validateBodyMapVersionInput(withStage).ok).toBe(false);
  });

  it("normalizes valid clinical input without inventing clinical facts", () => {
    const result = validateBodyMapVersionInput(validInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.findings[0]).toMatchObject({
      findingKey: "left shoulder::left::pain",
      bodyRegion: "Left Shoulder",
      laterality: "left",
      symptom: "Pain",
      severity: 6,
      clinicalState: "active",
    });
    expect(result.value).not.toHaveProperty("stage");
  });
});
