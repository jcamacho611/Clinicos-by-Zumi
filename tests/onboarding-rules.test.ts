import { describe, expect, it } from "vitest";
import {
  defaultAppointmentTypes,
  onboardingSchema,
  pendingConnectorTemplates,
  slugifyOrganizationName,
} from "@/lib/onboarding-rules";

const validInput = {
  organizationName: "Northstar Family Health",
  clinicType: "Primary Care",
  locationName: "Main clinic",
  city: "Brooklyn",
  state: "ny",
  timezone: "America/New_York",
  teamSize: "1-5",
  ownerName: "Jordan Ellis",
  email: "OWNER@NORTHSTAR.EXAMPLE",
  password: "Strong-Clinic-Password-2026",
  primaryGoal: "Launch a complete clinic workspace",
  acceptTerms: true,
  syntheticDataOnly: true,
};

describe("ClinicOS organization onboarding", () => {
  it("normalizes an accepted offer into a tenant-safe workspace input", () => {
    const parsed = onboardingSchema.parse(validInput);
    expect(parsed.email).toBe("owner@northstar.example");
    expect(parsed.state).toBe("NY");
    expect(parsed.syntheticDataOnly).toBe(true);
  });

  it("requires a strong owner credential and explicit safety acknowledgments", () => {
    expect(onboardingSchema.safeParse({ ...validInput, password: "weakpassword", syntheticDataOnly: false }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...validInput, acceptTerms: false }).success).toBe(false);
  });

  it("creates stable, URL-safe organization slugs without using reserved routes", () => {
    expect(slugifyOrganizationName("Clínica del Sol & Family Care")).toBe("clinica-del-sol-family-care");
    expect(slugifyOrganizationName("Admin")).toBe("admin-workspace");
  });

  it("starts without paid vendors while preserving every connection door", () => {
    expect(defaultAppointmentTypes.some((type) => type.telemedicine)).toBe(true);
    expect(pendingConnectorTemplates.map((connector) => connector.type)).toEqual(expect.arrayContaining([
      "payments", "communications", "lab", "imaging", "clearinghouse", "e_prescribing", "telemedicine",
    ]));
    expect(pendingConnectorTemplates.every((connector) => connector.vendor.length > 0)).toBe(true);
  });
});
