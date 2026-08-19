import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";

const findMany = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    patient: { findMany: (...args: unknown[]) => findMany(...args) },
  },
}));

const { listPatientViewsForSession } = await import("@/lib/repositories/patient-list-presentation-repository");

const session: ClinicSession = {
  sessionId: "session-1",
  userId: "user-1",
  organizationId: "org-1",
  organizationName: "Example Clinic",
  organizationSlug: "example-clinic",
  email: "owner@example.test",
  name: "Owner",
  role: "clinic_owner",
  demo: true,
  expiresAt: Date.now() + 60_000,
};

beforeEach(() => {
  findMany.mockReset();
});

describe("patient list presentation repository", () => {
  it("queries only the active tenant and returns a minimum-necessary list DTO", async () => {
    findMany.mockResolvedValue([
      {
        id: "patient-1",
        mrn: "K-2026-00001",
        firstName: "Avery",
        lastName: "Patient",
        preferredName: "Ave",
        dateOfBirth: new Date("1990-01-02T00:00:00.000Z"),
        preferredLanguage: "English",
        portalStatus: "active",
        riskLevel: "NORMAL",
      },
    ]);

    const result = await listPatientViewsForSession(session);
    expect(result).toEqual([
      {
        id: "patient-1",
        mrn: "K-2026-00001",
        displayName: "Ave",
        dateOfBirth: "1990-01-02",
        preferredLanguage: "English",
        portalStatus: "active",
        riskLevel: "NORMAL",
      },
    ]);

    const query = findMany.mock.calls[0][0];
    expect(query.where).toEqual({ organizationId: "org-1", status: "active" });
    expect(query.take).toBe(1000);
    expect(query.select.phone).toBeUndefined();
    expect(query.select.email).toBeUndefined();
    expect(query.select.communicationPrefs).toBeUndefined();
    expect(query.select.identityStatus).toBeUndefined();
    expect(JSON.stringify(query.select)).not.toContain("insurance");
    expect(JSON.stringify(query.select)).not.toContain("medication");
    expect(JSON.stringify(query.select)).not.toContain("problem");
  });

  it("does not query when the session role lacks patient read permission", async () => {
    await expect(listPatientViewsForSession({ ...session, role: "contractor" })).rejects.toMatchObject({ status: 403 });
    expect(findMany).not.toHaveBeenCalled();
  });
});
