import { describe, expect, it } from "vitest";
import { createEncounterSchema, encounterAddendumSchema, encounterCodingSchema } from "@/lib/encounter-authoring-rules";

describe("encounter authoring validation", () => {
  it("accepts a tenant-bound encounter draft input", () => {
    expect(createEncounterSchema.safeParse({ patientId: "pt-1", providerId: "provider-1", type: "Follow-up visit", serviceDate: "2026-07-16T14:00:00.000Z", chiefComplaint: "Follow-up" }).success).toBe(true);
  });

  it("validates ICD-10, CPT, uniqueness, and one primary diagnosis", () => {
    expect(encounterCodingSchema.safeParse({ diagnoses: [{ code: "E11.65", label: "Type 2 diabetes", primary: true }], procedures: [{ code: "99214", label: "Established patient visit", modifiers: ["25"] }] }).success).toBe(true);
    expect(encounterCodingSchema.safeParse({ diagnoses: [{ code: "E11.65", label: "One", primary: true }, { code: "E11.65", label: "Duplicate", primary: false }], procedures: [] }).success).toBe(false);
    expect(encounterCodingSchema.safeParse({ diagnoses: [{ code: "bad", label: "Invalid", primary: false }], procedures: [] }).success).toBe(false);
  });

  it("requires signed addendum content and preserves the original note boundary", () => {
    expect(encounterAddendumSchema.safeParse({ reason: "Clarification", text: "The follow-up interval is three months.", attestation: true }).success).toBe(true);
    expect(encounterAddendumSchema.safeParse({ reason: "", text: "", attestation: false }).success).toBe(false);
  });
});
