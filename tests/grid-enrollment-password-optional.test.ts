import { describe, expect, it } from "vitest";
import { gridContractorEnrollmentSchema } from "@/lib/grid-rules";

function enrollment(overrides: Record<string, unknown> = {}) {
  return {
    organizationSlug: "luxe-medi",
    fullName: "Existing Grid User",
    email: "existing@example.test",
    phone: "2125550100",
    providerType: "Registered Nurse",
    credential: "RN",
    specialty: "Ambulatory care",
    licenseType: "STATE_LICENSE",
    licenseNumber: "RN12345",
    licenseState: "NY",
    licenseExpiration: "2027-08-27T00:00:00.000Z",
    licenseEvidenceReference: "primary-source-reference",
    malpracticeCarrier: "Example Carrier",
    malpracticePolicyNumber: "POLICY123",
    malpracticeExpiration: "2027-08-27T00:00:00.000Z",
    malpracticeCoverageAmountCents: 100_000_000,
    malpracticeEvidenceReference: "malpractice-reference",
    certifications: ["BLS"],
    servicesOffered: ["Nursing support"],
    experienceLevel: "Experienced",
    bio: "Experienced registered nurse applying for governed Grid opportunities.",
    serviceArea: "New York, NY",
    travelRadiusMiles: 20,
    mobileServiceAllowed: true,
    chairRentalAllowed: false,
    partnerLocationAllowed: true,
    atHomeAllowed: false,
    onCallNow: false,
    availability: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00", locationType: "clinic_location" }],
    ...overrides,
  };
}

describe("Grid enrollment password compatibility", () => {
  it("allows the password field to be omitted so a proven existing account can be reused", () => {
    const parsed = gridContractorEnrollmentSchema.parse(enrollment());
    expect(parsed.password).toBe("");
  });

  it("still rejects a weak password when a new-account password is supplied", () => {
    expect(() => gridContractorEnrollmentSchema.parse(enrollment({ password: "weak-password" }))).toThrow();
  });
});
