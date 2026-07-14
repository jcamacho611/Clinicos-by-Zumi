import { describe, expect, it } from "vitest";
import { can } from "@/lib/auth/rbac";
import { signSessionToken, verifySessionToken } from "@/lib/auth/token";
import { getPatientForOrganization, getPatientsForOrganization } from "@/lib/clinic-data";
import type { ClinicSession } from "@/lib/auth/types";

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
    expect(can("viewer", "settings", "update")).toBe(false);
  });

  it("does not return another organization's patient from a guessed id", () => {
    expect(getPatientForOrganization("pt-1004", "org-bfm")).toBeUndefined();
    expect(getPatientForOrganization("pt-1004", "org-luxe")?.mrn).toBe("LUX-10428");
    expect(getPatientsForOrganization("org-bfm").every((patient) => patient.organizationId === "org-bfm")).toBe(true);
  });
});
