import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicRole } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";

const taskCount = vi.fn<() => Promise<number>>();
const escalationCount = vi.fn<() => Promise<number>>();
const queryRaw = vi.fn<() => Promise<Array<{ count: number }>>>();

vi.mock("@/lib/db", () => ({
  db: {
    task: { count: (...args: unknown[]) => taskCount(...(args as [])) },
    escalation: { count: (...args: unknown[]) => escalationCount(...(args as [])) },
    $queryRaw: (...args: unknown[]) => queryRaw(...(args as [])),
  },
}));

const { getHomeOperatingRail } = await import("@/lib/home/operating-rail");

function sessionFor(role: ClinicRole): ClinicSession {
  return {
    sessionId: "session-1",
    userId: "user-1",
    organizationId: "org-1",
    organizationName: "Example Clinic",
    organizationSlug: "example-clinic",
    email: "operator@example.test",
    name: "Provider",
    role,
    demo: true,
    expiresAt: Date.now() + 60_000,
  };
}

beforeEach(() => {
  taskCount.mockReset().mockResolvedValue(0);
  escalationCount.mockReset().mockResolvedValue(0);
  queryRaw.mockReset().mockResolvedValue([{ count: 0 }]);
});

describe("Home operating rail", () => {
  it("returns no opportunity when nothing real is open", async () => {
    const rail = await getHomeOperatingRail(sessionFor("clinic_owner"));
    expect(rail.opportunity).toBeNull();
    expect(rail.destinations.length).toBeGreaterThan(0);
  });

  it("raises a Grid decision only from actually counted live offers", async () => {
    queryRaw.mockResolvedValue([{ count: 3 }]);
    const rail = await getHomeOperatingRail(sessionFor("clinic_owner"));
    expect(rail.opportunity?.kind).toBe("grid_offer_decision");
    expect(rail.opportunity?.title).toContain("3");
    const grid = rail.destinations.find((destination) => destination.workspace === "grid");
    expect(grid?.live?.count).toBe(3);
  });

  it("prefers an open escalation over ordinary tasks", async () => {
    escalationCount.mockResolvedValue(2);
    taskCount.mockResolvedValue(9);
    const rail = await getHomeOperatingRail(sessionFor("front_desk"));
    expect(rail.opportunity?.kind).toBe("open_escalation");
  });

  it("does not query Grid offers for a role that cannot read Grid", async () => {
    queryRaw.mockResolvedValue([{ count: 5 }]);
    const rail = await getHomeOperatingRail(sessionFor("clinical_staff"));
    expect(queryRaw).not.toHaveBeenCalled();
    expect(rail.destinations.some((destination) => destination.workspace === "grid")).toBe(false);
  });

  it("only returns destinations that the role can actually reach", async () => {
    const { canAccessWorkspace } = await import("@/lib/auth/workspace-authorization");
    for (const role of ["clinic_owner", "provider", "front_desk", "biller", "clinical_staff", "case_manager", "viewer", "quality"] as ClinicRole[]) {
      const rail = await getHomeOperatingRail(sessionFor(role));
      for (const destination of rail.destinations) {
        expect(canAccessWorkspace(role, destination.workspace), `${role} → ${destination.workspace}`).toBe(true);
      }
    }
  });
});
