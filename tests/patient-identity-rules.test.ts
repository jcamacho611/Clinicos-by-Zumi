import { describe, expect, it } from "vitest";
import {
  consentAllowsAccess,
  createConsentSchema,
  getConsentState,
  reviewPatientMatchSchema,
  scorePatientIdentity,
} from "@/lib/patient-identity-rules";

const source = {
  firstName: "Maya",
  lastName: "Thompson",
  dateOfBirth: new Date("1985-09-12T00:00:00.000Z"),
  sexAtBirth: "Female",
  phone: "(917) 555-0142",
  email: "maya.thompson@example.test",
};

describe("master patient identity rules", () => {
  it("scores normalized demographic signals without treating a name alone as proof", () => {
    const likely = scorePatientIdentity(source, { ...source, firstName: "MAYA", phone: "917-555-0142" });
    expect(likely.classification).toBe("likely_match");
    expect(likely.score).toBe(1);

    const nameOnly = scorePatientIdentity(source, {
      ...source,
      dateOfBirth: new Date("1999-01-01T00:00:00.000Z"),
      phone: "(212) 555-0199",
      email: "different@example.test",
      sexAtBirth: "Male",
    });
    expect(nameOnly.classification).toBe("unlikely_match");
    expect(nameOnly.matchedFields).toEqual(["first_name", "last_name"]);
  });

  it("recognizes preferred and former names as identity signals", () => {
    const result = scorePatientIdentity({ ...source, formerNames: ["Maya Patel"] }, { ...source, firstName: "Maya Patel", lastName: "Thompson" });
    expect(result.matchedFields).toContain("first_name");
  });

  it("requires human review reasons for linking or separating records", () => {
    expect(reviewPatientMatchSchema.safeParse({ action: "confirm_match", reason: "looks same" }).success).toBe(false);
    expect(reviewPatientMatchSchema.safeParse({ action: "confirm_match", reason: "DOB, phone, and email confirmed with the patient." }).success).toBe(true);
  });
});

describe("consent lifecycle rules", () => {
  const consent = {
    organizationId: "org-bfm",
    patientId: "pt-1001",
    purposeOfUse: "treatment",
    dataCategories: ["demographics", "allergies"],
    grantedToOrganizationId: "org-luxe",
    grantedToUserId: null,
    status: "active",
    effectiveAt: new Date("2026-07-01T00:00:00.000Z"),
    expiresAt: new Date("2026-08-01T00:00:00.000Z"),
    withdrawnAt: null,
  };
  const now = new Date("2026-07-14T12:00:00.000Z");

  it("enforces patient, recipient, purpose, category, and time scope", () => {
    const request = {
      sourceOrganizationId: "org-bfm",
      patientId: "pt-1001",
      requestingOrganizationId: "org-luxe",
      purposeOfUse: "treatment" as const,
      categories: ["demographics"] as const,
      now,
    };
    expect(consentAllowsAccess(consent, request)).toBe(true);
    expect(consentAllowsAccess(consent, { ...request, categories: ["medications"] })).toBe(false);
    expect(consentAllowsAccess({ ...consent, sensitiveRestrictions: { demographics: true } }, request)).toBe(false);
    expect(consentAllowsAccess(consent, { ...request, requestingOrganizationId: "org-other" })).toBe(false);
    expect(getConsentState({ ...consent, expiresAt: now }, now)).toBe("expired");
    expect(getConsentState({ ...consent, withdrawnAt: now }, now)).toBe("withdrawn");
  });

  it("validates signed, bounded consent capture", () => {
    expect(createConsentSchema.safeParse({ patientId: "pt-1" }).success).toBe(false);
    expect(createConsentSchema.safeParse({
      patientId: "pt-1",
      type: "network_sharing",
      purposeOfUse: "treatment",
      dataCategories: ["demographics"],
      grantedToOrganizationId: "org-luxe",
      signerName: "Synthetic Patient",
      expiresInDays: 30,
    }).success).toBe(true);
  });
});
