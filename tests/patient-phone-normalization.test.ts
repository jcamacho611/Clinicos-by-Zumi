import { describe, expect, it } from "vitest";
import { normalizePatientPhone, patientCreateSchema } from "@/lib/patient-intake-rules";

const base = {
  firstName: "Maya",
  lastName: "Thompson",
  dateOfBirth: "1990-01-01",
  sexAtBirth: "female",
  email: "maya@example.com",
  preferredLanguage: "English",
};

describe("patient phone normalization", () => {
  it("canonicalizes common US formatting to E.164", () => {
    expect(normalizePatientPhone("(212) 555-0123")).toBe("+12125550123");
    expect(patientCreateSchema.parse({ ...base, phone: "212.555.0123" }).phone).toBe("+12125550123");
  });

  it("preserves explicit international intent while removing display formatting", () => {
    expect(normalizePatientPhone("+44 20 7946 0958")).toBe("+442079460958");
  });

  it("does not guess a country for non-US bare numbers", () => {
    expect(normalizePatientPhone("020 7946 0958")).toBeNull();
    expect(patientCreateSchema.safeParse({ ...base, phone: "020 7946 0958" }).success).toBe(false);
  });

  it("allows the phone field to remain blank", () => {
    expect(patientCreateSchema.parse({ ...base, phone: "" }).phone).toBe("");
  });
});
