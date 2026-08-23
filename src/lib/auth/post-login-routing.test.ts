import { describe, expect, it } from "vitest";
import { resolvePostLoginRedirect } from "@/lib/auth/post-login-routing";

describe("post-login route continuity", () => {
  it("returns the intended protected destination when the legal gate is disabled", () => {
    expect(resolvePostLoginRedirect({
      role: "provider",
      requestedReturnTo: "/patients/patient-123",
      legalGateEnabled: false,
      legalConfigurationReady: true,
      agreementAccepted: false,
    })).toBe("/patients/patient-123");
  });

  it("preserves the safe intended destination through required legal acceptance", () => {
    expect(resolvePostLoginRedirect({
      role: "provider",
      requestedReturnTo: "/encounters/encounter-123",
      legalGateEnabled: true,
      legalConfigurationReady: true,
      agreementAccepted: false,
    })).toBe("/legal/accept?returnTo=%2Fencounters%2Fencounter-123");
  });

  it("marks a legal-configuration blocker without losing the intended destination", () => {
    expect(resolvePostLoginRedirect({
      role: "clinic_owner",
      requestedReturnTo: "/integrations",
      legalGateEnabled: true,
      legalConfigurationReady: false,
      agreementAccepted: false,
    })).toBe("/legal/accept?blocked=configuration&returnTo=%2Fintegrations");
  });

  it("continues directly when the current agreement is already accepted", () => {
    expect(resolvePostLoginRedirect({
      role: "biller",
      requestedReturnTo: "/claim-readiness",
      legalGateEnabled: true,
      legalConfigurationReady: true,
      agreementAccepted: true,
    })).toBe("/claim-readiness");
  });

  it("never carries an external return URL through the legal gate", () => {
    expect(resolvePostLoginRedirect({
      role: "provider",
      requestedReturnTo: "https://evil.example/steal",
      legalGateEnabled: true,
      legalConfigurationReady: true,
      agreementAccepted: false,
    })).toBe("/legal/accept?returnTo=%2Fdashboard");
  });

  it("uses the Grid opportunity route as the contractor default", () => {
    expect(resolvePostLoginRedirect({
      role: "contractor",
      requestedReturnTo: null,
      legalGateEnabled: true,
      legalConfigurationReady: true,
      agreementAccepted: false,
    })).toBe("/legal/accept?returnTo=%2Fgrid%2Fopportunities");
  });
});
