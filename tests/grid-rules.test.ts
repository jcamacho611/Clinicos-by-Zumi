import { describe, expect, it } from "vitest";
import {
  buildZumiGridGuidance,
  canTransitionGridProvider,
  canTransitionGridRequest,
  gridAvailabilitySchema,
  gridContractorEnrollmentSchema,
  gridProviderProfileSchema,
  gridRequestSchema,
  gridServiceListingSchema,
  providerReadyForGrid,
} from "@/lib/grid-rules";

const future = new Date("2028-12-31T00:00:00.000Z");

describe("ClinicOS Grid rules", () => {
  it("requires a complete credential and malpractice profile before review", () => {
    const result = gridProviderProfileSchema.safeParse({
      displayName: "Grid Provider Applicant",
      legalName: "Grid Provider Applicant · synthetic",
      providerType: "Nurse Injector",
      credential: "RN",
      specialty: "Aesthetic services",
      licenseType: "STATE_LICENSE",
      licenseNumber: "SYNTH-NY-RN",
      licenseState: "NY",
      licenseExpiration: future.toISOString(),
      malpracticeCarrier: "Synthetic Coverage",
      malpracticePolicyNumber: "SYNTH-POLICY",
      malpracticeExpiration: future.toISOString(),
      certifications: ["Synthetic BLS record"],
      servicesOffered: ["Injectable treatment support"],
      experienceLevel: "Intermediate",
      bio: "Synthetic provider profile for a controlled Grid workflow demonstration.",
      serviceLocations: ["Brooklyn"],
      mobileServiceAllowed: true,
      chairRentalAllowed: true,
      atHomeAllowed: false,
      travelRadiusMiles: 20,
    });
    expect(result.success).toBe(true);
    expect(gridProviderProfileSchema.safeParse({ ...(result.success ? result.data : {}), providerType: "Random gig worker" }).success).toBe(false);
  });

  it("keeps provider verification transitions human and ordered", () => {
    expect(canTransitionGridProvider("draft", "submitted")).toBe(true);
    expect(canTransitionGridProvider("submitted", "verified")).toBe(false);
    expect(canTransitionGridProvider("needs_review", "verified")).toBe(true);
    expect(canTransitionGridProvider("verified", "draft")).toBe(false);
  });

  it("requires current human-verified authority and malpractice coverage", () => {
    expect(providerReadyForGrid({ verificationStatus: "verified", malpracticeExpiration: future, malpracticeVerificationStatus: "verified", credentials: [{ verificationStatus: "verified", expiresAt: future }] }, new Date("2026-08-09T00:00:00.000Z"))).toBe(true);
    expect(providerReadyForGrid({ verificationStatus: "verified", malpracticeExpiration: null, malpracticeVerificationStatus: "verified", credentials: [{ verificationStatus: "verified", expiresAt: future }] })).toBe(false);
    expect(providerReadyForGrid({ verificationStatus: "verified", malpracticeExpiration: future, malpracticeVerificationStatus: "pending", credentials: [{ verificationStatus: "verified", expiresAt: future }] })).toBe(false);
    expect(providerReadyForGrid({ verificationStatus: "verified", malpracticeExpiration: future, malpracticeVerificationStatus: "verified", credentials: [{ verificationStatus: "pending", expiresAt: future }] })).toBe(false);
  });

  it("validates the complete independent-contractor enrollment", () => {
    const enrollment = {
      organizationSlug: "luxe-medi",
      fullName: "Independent Grid Provider",
      email: "GRID.PROVIDER@EXAMPLE.TEST",
      phone: "212-555-0164",
      password: "Synthetic!Pass123",
      providerType: "Nurse Injector",
      credential: "RN",
      specialty: "Aesthetic services",
      licenseType: "STATE_LICENSE",
      licenseNumber: "SYNTH-NY-RN-PROVIDER",
      licenseState: "NY",
      licenseExpiration: future.toISOString(),
      licenseEvidenceReference: "SYNTHETIC-LICENSE-PROVIDER-001",
      malpracticeCarrier: "Synthetic Contractor Coverage",
      malpracticePolicyNumber: "SYNTH-PROVIDER-RN-001",
      malpracticeExpiration: future.toISOString(),
      malpracticeCoverageAmountCents: 100_000_000,
      malpracticeEvidenceReference: "SYNTHETIC-POLICY-PROVIDER-001",
      certifications: ["Synthetic BLS record"],
      servicesOffered: ["Injectable treatment support"],
      experienceLevel: "Experienced",
      bio: "Synthetic contractor nurse profile used only for a controlled demonstration.",
      serviceArea: "New York City",
      travelRadiusMiles: 25,
      mobileServiceAllowed: true,
      chairRentalAllowed: true,
      partnerLocationAllowed: true,
      atHomeAllowed: false,
      onCallNow: true,
      availability: [{ dayOfWeek: 2, startTime: "10:00", endTime: "18:00", locationType: "mobile" }],
    } as const;
    const parsed = gridContractorEnrollmentSchema.safeParse(enrollment);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("grid.provider@example.test");
    expect(gridContractorEnrollmentSchema.safeParse({ ...enrollment, password: "SyntheticPass123" }).success).toBe(false);
    expect(gridContractorEnrollmentSchema.safeParse({ ...enrollment, mobileServiceAllowed: false, chairRentalAllowed: false, partnerLocationAllowed: false }).success).toBe(false);
  });

  it("provides bounded Zumi administrative guidance", () => {
    const guidance = buildZumiGridGuidance({
      verificationStatus: "submitted",
      malpracticeVerificationStatus: "pending",
      currentCredentials: 0,
      availabilitySlots: 1,
      openRequests: 1,
      estimatedPayoutCents: 35_000,
    });
    expect(guidance.title).toContain("human review");
    expect(guidance.nextSteps.join(" ")).toContain("credentialing team");
    expect(guidance.nextSteps.join(" ")).toContain("accept, counter, or decline");
    expect(guidance.guardrail).toContain("does not verify credentials");
    expect(guidance.guardrail).toContain("guarantee work or payment");
  });

  it("validates pricing and availability without implying automatic activation", () => {
    expect(gridServiceListingSchema.safeParse({ providerId: "provider-1", serviceName: "Synthetic consultation", category: "Consultation", description: "Controlled synthetic consultation listing requiring human review.", priceLowCents: 15000, priceHighCents: 25000, status: "draft" }).success).toBe(true);
    expect(gridServiceListingSchema.safeParse({ providerId: "provider-1", serviceName: "Synthetic consultation", category: "Consultation", description: "Controlled synthetic consultation listing requiring human review.", priceLowCents: 25000, priceHighCents: 15000, status: "draft" }).success).toBe(false);
    expect(gridAvailabilitySchema.safeParse({ providerId: "provider-1", dayOfWeek: 6, startTime: "12:00", endTime: "18:00", locationType: "chair_rental", mobileRadius: 20, onCall: true }).success).toBe(true);
    expect(gridAvailabilitySchema.safeParse({ providerId: "provider-1", dayOfWeek: 8, startTime: "18:00", endTime: "12:00", locationType: "chair_rental" }).success).toBe(false);
  });

  it("enforces the governed request sequence and synthetic identifiers", () => {
    expect(canTransitionGridRequest("requested", "accepted")).toBe(true);
    expect(canTransitionGridRequest("requested", "countered")).toBe(true);
    expect(canTransitionGridRequest("requested", "declined")).toBe(true);
    expect(canTransitionGridRequest("requested", "provider_review")).toBe(true);
    expect(canTransitionGridRequest("requested", "confirmed")).toBe(false);
    expect(canTransitionGridRequest("credential_check", "confirmed")).toBe(true);
    expect(canTransitionGridRequest("completed", "requested")).toBe(false);
    expect(gridRequestSchema.safeParse({ syntheticClientLabel: "Synthetic Patient", syntheticClientReference: "SYNTH-100", serviceListingId: "service-1", providerId: "provider-1", requestedStartAt: "2026-08-15T14:00:00.000Z", locationType: "clinic_location", safetyFlags: ["Human review required"], requiredDocuments: [], consentStatus: "pending", notes: "Please complete a documented human review before scheduling." }).success).toBe(true);
  });
});
