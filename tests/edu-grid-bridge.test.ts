import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicRole } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";

const enrollmentFindMany = vi.fn();
const competencyFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    educationEnrollment: { findMany: (...a: unknown[]) => enrollmentFindMany(...(a as [])) },
    educationCompetency: { findMany: (...a: unknown[]) => competencyFindMany(...(a as [])) },
  },
}));

const { resolveEduGridReadiness, draftForEduGridSignal, canPublishEduGridPlacement } =
  await import("@/lib/ecosystem/edu-grid-bridge");
const { gridDemandSchema } = await import("@/lib/grid/demand-contract");
const { CREDENTIAL_DISCLAIMER, NOT_A_CREDENTIAL_CLAIMS } = await import("@/lib/edu/edu-safety");

function sessionFor(role: ClinicRole, email = "Student@Example.Test"): ClinicSession {
  return {
    sessionId: "s1", userId: "u1", organizationId: "org-1", organizationName: "Northgate Clinic",
    organizationSlug: "northgate", email, name: "Sam Learner",
    role, demo: true, expiresAt: Date.now() + 60_000,
  };
}

beforeEach(() => {
  enrollmentFindMany.mockReset().mockResolvedValue([]);
  competencyFindMany.mockReset().mockResolvedValue([]);
});

describe("EDU → Grid bridge", () => {
  it("stays absent for someone with no EDU enrollment", async () => {
    // A clinic user who never touched EDU should not see an empty education panel.
    expect(await resolveEduGridReadiness(sessionFor("clinic_owner"))).toBeNull();
    expect(competencyFindMany).not.toHaveBeenCalled();
  });

  it("offers placement once an instructor has recorded a demonstrated competency", async () => {
    enrollmentFindMany.mockResolvedValue([{ id: "enr-1", status: "active" }]);
    competencyFindMany.mockResolvedValue([
      { competencyArea: "Aseptic technique", status: "achieved" },
      { competencyArea: "Patient intake", status: "achieved" },
    ]);

    const readiness = await resolveEduGridReadiness(sessionFor("clinic_owner"));
    const ready = readiness?.signals.find((signal) => signal.kind === "placement_ready");

    expect(ready).toBeDefined();
    expect(ready!.draft?.kind).toBe("education");
    expect(ready!.evidence).toContain("Aseptic technique");
  });

  it("never turns an education record into clinical eligibility", async () => {
    // The load-bearing test. An EDU competency is not licensure, so the placement
    // request it produces must keep Grid's real eligibility check switched on and say
    // so in its own words. Softening this is how a marketplace ends up matching an
    // unlicensed person to regulated work.
    enrollmentFindMany.mockResolvedValue([{ id: "enr-1", status: "active" }]);
    competencyFindMany.mockResolvedValue([{ competencyArea: "Injection technique", status: "achieved" }]);

    const readiness = await resolveEduGridReadiness(sessionFor("clinic_owner"));
    const draft = readiness!.signals.find((signal) => signal.kind === "placement_ready")!.draft!;

    expect(draft.requiresClinicalEligibility).toBe(true);
    expect(draft.description).toMatch(/not licensure, certification, or scope-of-practice approval/i);
    expect(draft.requirements.join(" ")).toMatch(/verified against real credentials at match/i);
    expect(draft.requirements.join(" ")).toMatch(/supervised/i);
  });

  it("carries the credential boundary on the readiness object itself", async () => {
    // A surface must not be able to render the encouraging half of this bridge
    // without the limiting half, so the disclaimer travels with the data.
    enrollmentFindMany.mockResolvedValue([{ id: "enr-1", status: "active" }]);
    competencyFindMany.mockResolvedValue([{ competencyArea: "Aseptic technique", status: "achieved" }]);

    const readiness = await resolveEduGridReadiness(sessionFor("clinic_owner"));
    expect(readiness!.boundary).toBe(CREDENTIAL_DISCLAIMER);
    for (const claim of NOT_A_CREDENTIAL_CLAIMS) {
      expect(readiness!.boundary).toContain(claim);
    }
  });

  it("keeps the learner's identity out of anything Grid can see", async () => {
    enrollmentFindMany.mockResolvedValue([{ id: "enr-1", status: "active" }]);
    competencyFindMany.mockResolvedValue([{ competencyArea: "Aseptic technique", status: "achieved" }]);

    const readiness = await resolveEduGridReadiness(sessionFor("clinic_owner", "sam.learner@example.test"));
    const draft = JSON.stringify(readiness!.signals.map((signal) => signal.draft));

    // A Grid demand is visible outside the originating organization. Who is asking is
    // carried by the record's ownership fields, never written into free text.
    for (const identifier of ["Sam Learner", "sam.learner@example.test", "enr-1", "Northgate"]) {
      expect(draft, `"${identifier}" reached a Grid-bound payload`).not.toContain(identifier);
    }
  });

  it("does not treat an unassessed or failed competency as demonstrated", async () => {
    enrollmentFindMany.mockResolvedValue([{ id: "enr-1", status: "active" }]);
    competencyFindMany.mockResolvedValue([
      { competencyArea: "Aseptic technique", status: "not_assessed" },
      { competencyArea: "Injection technique", status: "not_achieved" },
    ]);

    const readiness = await resolveEduGridReadiness(sessionFor("clinic_owner"));
    expect(readiness!.signals.some((signal) => signal.kind === "placement_ready")).toBe(false);
    const pending = readiness!.signals.find((signal) => signal.kind === "competency_in_progress");
    expect(pending?.title).toContain("2 competency areas are still open");
    expect(pending?.draft).toBeNull();
  });

  it("does not double-count an area that is demonstrated on one enrollment and open on another", async () => {
    enrollmentFindMany.mockResolvedValue([{ id: "enr-1", status: "completed" }, { id: "enr-2", status: "active" }]);
    competencyFindMany.mockResolvedValue([
      { competencyArea: "Aseptic technique", status: "achieved" },
      { competencyArea: "Aseptic technique", status: "not_assessed" },
    ]);

    const readiness = await resolveEduGridReadiness(sessionFor("clinic_owner"));
    expect(readiness!.signals.some((signal) => signal.kind === "competency_in_progress")).toBe(false);
    expect(readiness!.signals.find((signal) => signal.kind === "placement_ready")!.evidence).toContain("Aseptic technique");
  });

  it("says plainly when nothing has been determined yet", async () => {
    enrollmentFindMany.mockResolvedValue([{ id: "enr-1", status: "invited" }]);
    const readiness = await resolveEduGridReadiness(sessionFor("clinic_owner"));

    const signal = readiness!.signals[0];
    expect(signal.kind).toBe("no_determination_yet");
    expect(signal.draft).toBeNull();
  });

  it("reads competencies only for this identity's own enrollments", async () => {
    enrollmentFindMany.mockResolvedValue([{ id: "enr-1", status: "active" }]);
    competencyFindMany.mockResolvedValue([]);
    await resolveEduGridReadiness(sessionFor("clinic_owner", "  Student@Example.Test  "));

    const enrollmentWhere = (enrollmentFindMany.mock.calls[0][0] as { where: { studentEmail: string } }).where;
    expect(enrollmentWhere.studentEmail).toBe("student@example.test");
    const competencyWhere = (competencyFindMany.mock.calls[0][0] as { where: { enrollmentId: { in: string[] } } }).where;
    expect(competencyWhere.enrollmentId.in).toEqual(["enr-1"]);
  });

  it("emits a draft the real Grid contract accepts", async () => {
    enrollmentFindMany.mockResolvedValue([{ id: "enr-1", status: "active" }]);
    competencyFindMany.mockResolvedValue([{ competencyArea: "Aseptic technique", status: "achieved" }]);

    const draft = await draftForEduGridSignal(sessionFor("clinic_owner"), "placement_ready");
    expect(gridDemandSchema.safeParse(draft).success).toBe(true);
    expect(draft!.status).toBe("draft");
    expect(draft!.visibility).toBe("matched_only");
  });

  it("returns nothing to prefill once the competency is no longer demonstrated", async () => {
    enrollmentFindMany.mockResolvedValue([{ id: "enr-1", status: "active" }]);
    competencyFindMany.mockResolvedValue([{ competencyArea: "Aseptic technique", status: "not_achieved" }]);
    expect(await draftForEduGridSignal(sessionFor("clinic_owner"), "placement_ready")).toBeNull();
  });

  it("does not let demonstrating a competency grant the right to publish", async () => {
    // Publishing to Grid is the ordinary Grid create permission. Being a learner does
    // not confer it, and neither does passing an assessment.
    expect(canPublishEduGridPlacement(sessionFor("clinic_owner"))).toBe(true);
    expect(canPublishEduGridPlacement(sessionFor("viewer"))).toBe(false);
    expect(canPublishEduGridPlacement(sessionFor("quality"))).toBe(false);
  });
});
