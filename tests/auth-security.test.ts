import { describe, expect, it } from "vitest";
import { can } from "@/lib/auth/rbac";
import { signSessionToken, verifySessionToken } from "@/lib/auth/token";
import type { ClinicSession } from "@/lib/auth/types";
import { mapPatientAggregate } from "@/lib/repositories/patient-mapper";

const session: ClinicSession = {
  sessionId: "session-test-1",
  userId: "user-test-1",
  organizationId: "org-bfm",
  organizationName: "Brooklyn Family Medicine",
  organizationSlug: "brooklyn-family-medicine",
  email: "nadja@example.test",
  name: "Nadja R., NP",
  role: "clinic_owner",
  demo: true,
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
};

describe("ClinicOS security boundaries", () => {
  it("round-trips a signed session and rejects a tampered token", async () => {
    const token = await signSessionToken(session);
    await expect(verifySessionToken(token)).resolves.toMatchObject({
      sessionId: session.sessionId,
      organizationId: session.organizationId,
      role: "clinic_owner",
    });

    const [header, payload, signature] = token.split(".");
    const tamperedPayload = `${payload.slice(0, -1)}${payload.endsWith("a") ? "b" : "a"}`;
    await expect(verifySessionToken(`${header}.${tamperedPayload}.${signature}`)).resolves.toBeNull();
  });

  it("keeps role permissions least-privileged", () => {
    expect(can("provider", "encounters", "sign")).toBe(true);
    expect(can("front_desk", "encounters", "sign")).toBe(false);
    expect(can("front_desk", "appointments", "update")).toBe(true);
    expect(can("viewer", "appointments", "update")).toBe(false);
    expect(can("viewer", "settings", "update")).toBe(false);
  });

  it("allows registry visibility without granting operational voice or network writes", () => {
    expect(can("viewer", "registry", "read")).toBe(true);
    expect(can("viewer", "voice", "create")).toBe(false);
    expect(can("viewer", "network", "update")).toBe(false);
    expect(can("clinic_owner", "registry", "manage")).toBe(true);
  });

  it("keeps patient identity and consent changes limited to authorized roles", () => {
    expect(can("clinic_owner", "identity", "manage")).toBe(true);
    expect(can("front_desk", "identity", "update")).toBe(true);
    expect(can("front_desk", "consents", "create")).toBe(true);
    expect(can("provider", "consents", "update")).toBe(false);
    expect(can("viewer", "identity", "read")).toBe(false);
    expect(can("viewer", "consents", "read")).toBe(false);
  });

  it("allows care teams to coordinate referrals without exposing workflow controls to viewers", () => {
    expect(can("provider", "referrals", "create")).toBe(true);
    expect(can("clinical_staff", "referrals", "update")).toBe(true);
    expect(can("front_desk", "referrals", "create")).toBe(false);
    expect(can("front_desk", "referrals", "update")).toBe(true);
    expect(can("biller", "referrals", "read")).toBe(true);
    expect(can("viewer", "referrals", "read")).toBe(false);
  });

  it("separates laboratory operations from provider review and release", () => {
    expect(can("clinical_staff", "labs", "create")).toBe(true);
    expect(can("clinical_staff", "labs", "sign")).toBe(false);
    expect(can("provider", "labs", "sign")).toBe(true);
    expect(can("clinic_owner", "labs", "manage")).toBe(true);
    expect(can("front_desk", "labs", "update")).toBe(true);
    expect(can("viewer", "labs", "read")).toBe(true);
    expect(can("viewer", "labs", "update")).toBe(false);
  });

  it("separates imaging coordination from provider review, release, and correction", () => {
    expect(can("clinical_staff", "imaging", "create")).toBe(true);
    expect(can("clinical_staff", "imaging", "sign")).toBe(false);
    expect(can("provider", "imaging", "sign")).toBe(true);
    expect(can("clinic_owner", "imaging", "manage")).toBe(true);
    expect(can("front_desk", "imaging", "update")).toBe(true);
    expect(can("viewer", "imaging", "read")).toBe(true);
    expect(can("viewer", "imaging", "update")).toBe(false);
  });

  it("separates document intake from review, release, and export", () => {
    expect(can("front_desk", "documents", "create")).toBe(true);
    expect(can("front_desk", "documents", "sign")).toBe(false);
    expect(can("clinical_staff", "documents", "update")).toBe(true);
    expect(can("provider", "documents", "sign")).toBe(true);
    expect(can("provider", "documents", "manage")).toBe(true);
    expect(can("viewer", "documents", "read")).toBe(true);
    expect(can("viewer", "documents", "update")).toBe(false);
    expect(can("viewer", "documents", "manage")).toBe(false);
  });

  it("preserves the repository's tenant identity while mapping database records", () => {
    const patient = mapPatientAggregate({
      patient: {
        id: "pt-1001", organizationId: "org-bfm", locationId: null, mrn: "BFM-28419",
        firstName: "Maya", lastName: "Thompson", dateOfBirth: new Date("1985-09-12T00:00:00.000Z"),
        sexAtBirth: "Female", pronouns: "she/her", phone: null, email: null, preferredLanguage: "English",
        portalStatus: "active", riskLevel: "NEEDS_PROVIDER", requiresHumanReview: true,
      },
      allergies: [], medications: [], problems: [],
    }, new Date("2026-07-14T12:00:00.000Z"));

    expect(patient.organizationId).toBe("org-bfm");
    expect(patient.mrn).toBe("BFM-28419");
    expect(patient.riskLevel).toBe("Needs Provider");
    expect(patient.riskFlags).toContain("Human review required");
  });
});
