import { describe, expect, it } from "vitest";
import { resolvePostLoginRedirect } from "@/lib/auth/post-login-routing";

describe("post-login route continuity", () => {
  it("returns the intended protected destination when the legacy legal gate is disabled", () => {
    expect(resolvePostLoginRedirect({
      role: "provider",
      requestedReturnTo: "/patients/patient-123",
      legalGateEnabled: false,
      legalConfigurationReady: true,
      agreementAccepted: false,
    })).toBe("/patients/patient-123");
  });

  it("preserves a safe intended destination through required legacy legal acceptance", () => {
    expect(resolvePostLoginRedirect({
      role: "provider",
      requestedReturnTo: "/encounters/encounter-123",
      legalGateEnabled: true,
      legalConfigurationReady: true,
      agreementAccepted: false,
    })).toBe("/legal/accept?returnTo=%2Fencounters%2Fencounter-123");
  });

  it("marks configuration blockers without losing the intended destination", () => {
    expect(resolvePostLoginRedirect({
      role: "clinic_owner",
      requestedReturnTo: "/integrations",
      legalGateEnabled: true,
      legalConfigurationReady: false,
      agreementAccepted: false,
    })).toBe("/legal/accept?blocked=configuration&returnTo=%2Fintegrations");
  });

  it("continues directly when the current legacy agreement is already accepted", () => {
    expect(resolvePostLoginRedirect({
      role: "biller",
      requestedReturnTo: "/claim-readiness",
      legalGateEnabled: true,
      legalConfigurationReady: true,
      agreementAccepted: true,
    })).toBe("/claim-readiness");
  });

  it("never carries external or legal-loop return targets", () => {
    expect(resolvePostLoginRedirect({
      role: "provider",
      requestedReturnTo: "https://evil.example/steal",
      legalGateEnabled: true,
      legalConfigurationReady: true,
      agreementAccepted: false,
    })).toBe("/legal/accept?returnTo=%2Fdashboard");
    expect(resolvePostLoginRedirect({
      role: "provider",
      requestedReturnTo: "/legal/accept?returnTo=%2Fpatients",
      legalGateEnabled: true,
      legalConfigurationReady: true,
      agreementAccepted: false,
    })).toBe("/legal/accept?returnTo=%2Fdashboard");
  });

  it("uses Grid opportunities as the contractor fallback", () => {
    expect(resolvePostLoginRedirect({
      role: "contractor",
      requestedReturnTo: null,
      legalGateEnabled: true,
      legalConfigurationReady: true,
      agreementAccepted: false,
    })).toBe("/legal/accept?returnTo=%2Fgrid%2Fopportunities");
  });
});
