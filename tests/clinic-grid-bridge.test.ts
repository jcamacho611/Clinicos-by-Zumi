import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicRole } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";

const appointmentFindMany = vi.fn();
const locationFindFirst = vi.fn();
const referralCount = vi.fn();
const capacityCount = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    appointment: { findMany: (...a: unknown[]) => appointmentFindMany(...(a as [])) },
    location: { findFirst: (...a: unknown[]) => locationFindFirst(...(a as [])) },
    referral: { count: (...a: unknown[]) => referralCount(...(a as [])) },
    capacityListing: { count: (...a: unknown[]) => capacityCount(...(a as [])) },
  },
}));

const { detectClinicGridSignals, canActOnClinicGridSignal } = await import("@/lib/ecosystem/clinic-grid-bridge");
const { gridDemandSchema } = await import("@/lib/grid/demand-contract");

const NOW = new Date("2026-08-17T12:00:00.000Z");

function sessionFor(role: ClinicRole): ClinicSession {
  return {
    sessionId: "s1", userId: "u1", organizationId: "org-1", organizationName: "Northgate Clinic",
    organizationSlug: "northgate", email: "owner@example.test", name: "Nadja Owner",
    role, demo: true, expiresAt: NOW.getTime() + 60_000,
  };
}

/** Identifiers a real patient record would carry. None may reach a Grid draft. */
const PHI_MARKERS = [
  "Maya Thompson", "Thompson", "MRN-88421", "1984-03-02", "maya@example.test",
  "555-0142", "Diabetes follow-up", "appt-9931", "patient-77",
];

beforeEach(() => {
  appointmentFindMany.mockReset().mockResolvedValue([]);
  locationFindFirst.mockReset().mockResolvedValue(null);
  referralCount.mockReset().mockResolvedValue(0);
  capacityCount.mockReset().mockResolvedValue(0);
});

describe("Clinic OS → Grid bridge", () => {
  it("stays silent when Clinic OS has nothing to report", async () => {
    // A clinic with no gaps is shown no suggestions, rather than an invented
    // reason to publish something to Grid.
    expect(await detectClinicGridSignals(sessionFor("clinic_owner"), NOW)).toEqual([]);
  });

  it("turns unassigned scheduled visits into a coverage need", async () => {
    appointmentFindMany.mockResolvedValue([
      { startsAt: new Date("2026-08-20T14:00:00Z"), endsAt: new Date("2026-08-20T14:30:00Z"), locationId: "loc-1" },
      { startsAt: new Date("2026-08-21T15:00:00Z"), endsAt: new Date("2026-08-21T15:30:00Z"), locationId: "loc-1" },
    ]);
    locationFindFirst.mockResolvedValue({ city: "Brooklyn", state: "NY", locationType: "clinic" });

    const signals = await detectClinicGridSignals(sessionFor("clinic_owner"), NOW);
    const coverage = signals.find((signal) => signal.kind === "coverage_gap");

    expect(coverage).toBeDefined();
    expect(coverage!.count).toBe(2);
    expect(coverage!.direction).toBe("demand");
    expect(coverage!.draft?.kind).toBe("provider");
    expect(coverage!.draft?.city).toBe("Brooklyn");
    expect(coverage!.draft?.requiresClinicalEligibility).toBe(true);
  });

  it("never lets patient identity reach a Grid draft", async () => {
    // Grid demand records are visible outside the originating organization. The
    // fixture carries every identifier a real appointment would expose; none of it
    // may appear anywhere in the emitted signal.
    appointmentFindMany.mockResolvedValue([
      {
        startsAt: new Date("2026-08-20T14:00:00Z"),
        endsAt: new Date("2026-08-20T14:30:00Z"),
        locationId: "loc-1",
        id: "appt-9931",
        patientId: "patient-77",
        patient: { firstName: "Maya", lastName: "Thompson", mrn: "MRN-88421", dob: "1984-03-02", email: "maya@example.test", phone: "555-0142" },
        notes: "Diabetes follow-up",
      },
    ]);
    locationFindFirst.mockResolvedValue({ city: "Brooklyn", state: "NY", locationType: "clinic" });
    referralCount.mockResolvedValue(3);
    capacityCount.mockResolvedValue(2);

    const signals = await detectClinicGridSignals(sessionFor("clinic_owner"), NOW);
    const serialized = JSON.stringify(signals);
    for (const marker of PHI_MARKERS) {
      expect(serialized, `"${marker}" reached a Grid-bound payload`).not.toContain(marker);
    }
  });

  it("does not read the patient relation at all", async () => {
    appointmentFindMany.mockResolvedValue([
      { startsAt: new Date("2026-08-20T14:00:00Z"), endsAt: new Date("2026-08-20T14:30:00Z"), locationId: null },
    ]);
    await detectClinicGridSignals(sessionFor("clinic_owner"), NOW);

    // What is never selected cannot leak, even if the draft copy changes later.
    const query = appointmentFindMany.mock.calls[0][0] as { select: Record<string, unknown>; include?: unknown };
    expect(query.include).toBeUndefined();
    expect(Object.keys(query.select).sort()).toEqual(["endsAt", "locationId", "startsAt"]);
  });

  it("emits drafts the real Grid contract accepts", async () => {
    appointmentFindMany.mockResolvedValue([
      { startsAt: new Date("2026-08-20T14:00:00Z"), endsAt: new Date("2026-08-20T14:30:00Z"), locationId: null },
    ]);
    referralCount.mockResolvedValue(2);

    const signals = await detectClinicGridSignals(sessionFor("clinic_owner"), NOW);
    const drafts = signals.map((signal) => signal.draft).filter(Boolean);
    expect(drafts.length).toBeGreaterThan(0);
    for (const draft of drafts) {
      // A draft Grid would reject is a dead control on the surface that offers it.
      expect(gridDemandSchema.safeParse(draft).success, JSON.stringify(draft)).toBe(true);
    }
  });

  it("opens every draft as a reviewable draft, never as an open posting", async () => {
    appointmentFindMany.mockResolvedValue([
      { startsAt: new Date("2026-08-20T14:00:00Z"), endsAt: new Date("2026-08-20T14:30:00Z"), locationId: null },
    ]);
    referralCount.mockResolvedValue(1);

    for (const signal of await detectClinicGridSignals(sessionFor("clinic_owner"), NOW)) {
      if (!signal.draft) continue;
      expect(signal.draft.status).toBe("draft");
      expect(signal.draft.visibility).toBe("matched_only");
    }
  });

  it("treats spare capacity as supply, not as something the clinic needs", async () => {
    capacityCount.mockResolvedValue(4);
    const signals = await detectClinicGridSignals(sessionFor("clinic_owner"), NOW);
    const capacity = signals.find((signal) => signal.kind === "unused_capacity");

    expect(capacity?.direction).toBe("supply");
    expect(capacity?.draft).toBeNull();
  });

  it("does not query Clinic OS state a role cannot read", async () => {
    // A Grid contractor holds `grid` rights only — no `appointments` or `referrals`
    // read — so neither query runs. A count is a disclosure, and an external Grid
    // participant must not be able to enumerate a clinic's schedule through a
    // convenience surface. RBAC decides before the database is touched.
    await detectClinicGridSignals(sessionFor("contractor"), NOW);
    expect(appointmentFindMany).not.toHaveBeenCalled();
    expect(referralCount).not.toHaveBeenCalled();
  });

  it("separates seeing a signal from acting on it", async () => {
    expect(canActOnClinicGridSignal(sessionFor("clinic_owner"))).toBe(true);
    expect(canActOnClinicGridSignal(sessionFor("viewer"))).toBe(false);
    expect(canActOnClinicGridSignal(sessionFor("quality"))).toBe(false);
  });

  it("counts only future work, so a past gap is not offered as coverage", async () => {
    appointmentFindMany.mockResolvedValue([
      { startsAt: new Date("2026-08-20T14:00:00Z"), endsAt: new Date("2026-08-20T14:30:00Z"), locationId: null },
    ]);
    await detectClinicGridSignals(sessionFor("clinic_owner"), NOW);

    const where = (appointmentFindMany.mock.calls[0][0] as { where: { startsAt: { gte: Date } ; providerId: null } }).where;
    expect(where.providerId).toBeNull();
    expect(where.startsAt.gte).toEqual(NOW);
  });
});
