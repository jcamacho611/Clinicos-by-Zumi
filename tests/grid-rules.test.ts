import { describe, expect, it } from "vitest";
import {
  canTransitionGridProvider,
  canTransitionGridRequest,
  gridAvailabilitySchema,
  gridProviderProfileSchema,
  gridRequestSchema,
  gridServiceListingSchema,
  providerReadyForGrid,
} from "@/lib/grid-rules";

const future = new Date("2028-12-31T00:00:00.000Z");

describe("ClinicOS Grid rules", () => {
  it("requires a complete credential and malpractice profile before review", () => {
    const result = gridProviderProfileSchema.safeParse({
      displayName: "Alex Morgan",
      legalName: "Alexis Morgan",
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
    expect(providerReadyForGrid({ verificationStatus: "verified", malpracticeExpiration: future, credentials: [{ verificationStatus: "verified", expiresAt: future }] }, new Date("2026-08-09T00:00:00.000Z"))).toBe(true);
    expect(providerReadyForGrid({ verificationStatus: "verified", malpracticeExpiration: null, credentials: [{ verificationStatus: "verified", expiresAt: future }] })).toBe(false);
    expect(providerReadyForGrid({ verificationStatus: "verified", malpracticeExpiration: future, credentials: [{ verificationStatus: "pending", expiresAt: future }] })).toBe(false);
  });

  it("validates pricing and availability without implying automatic activation", () => {
    expect(gridServiceListingSchema.safeParse({ providerId: "provider-1", serviceName: "Synthetic consultation", category: "Consultation", description: "Controlled synthetic consultation listing requiring human review.", priceLowCents: 15000, priceHighCents: 25000, status: "draft" }).success).toBe(true);
    expect(gridServiceListingSchema.safeParse({ providerId: "provider-1", serviceName: "Synthetic consultation", category: "Consultation", description: "Controlled synthetic consultation listing requiring human review.", priceLowCents: 25000, priceHighCents: 15000, status: "draft" }).success).toBe(false);
    expect(gridAvailabilitySchema.safeParse({ providerId: "provider-1", dayOfWeek: 6, startTime: "12:00", endTime: "18:00", locationType: "chair_rental", mobileRadius: 20, onCall: true }).success).toBe(true);
    expect(gridAvailabilitySchema.safeParse({ providerId: "provider-1", dayOfWeek: 8, startTime: "18:00", endTime: "12:00", locationType: "chair_rental" }).success).toBe(false);
  });

  it("enforces the governed request sequence and synthetic identifiers", () => {
    expect(canTransitionGridRequest("requested", "provider_review")).toBe(true);
    expect(canTransitionGridRequest("requested", "confirmed")).toBe(false);
    expect(canTransitionGridRequest("credential_check", "confirmed")).toBe(true);
    expect(canTransitionGridRequest("completed", "requested")).toBe(false);
    expect(gridRequestSchema.safeParse({ syntheticClientLabel: "Synthetic Patient", syntheticClientReference: "SYNTH-100", serviceListingId: "service-1", providerId: "provider-1", requestedStartAt: "2026-08-15T14:00:00.000Z", locationType: "clinic_location", safetyFlags: ["Human review required"], requiredDocuments: [], consentStatus: "pending", notes: "Please complete a documented human review before scheduling." }).success).toBe(true);
  });
});
