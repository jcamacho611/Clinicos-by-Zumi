import fs from "node:fs";
import path from "node:path";
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
    organizationName: "Northgate Clinic",
    organizationSlug: "northgate",
    email: "owner@example.test",
    name: "Nadja Owner",
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

    // The previous Home always rendered an "Opportunity" derived from the viewer's
    // role alone, so it looked identical on a clinic with work waiting and a clinic
    // with none. An empty result is the correct answer, not a gap to fill.
    expect(rail.opportunity).toBeNull();
    expect(rail.destinations.length).toBeGreaterThan(0);
  });

  it("raises a Grid offer decision only when live offers were actually counted", async () => {
    queryRaw.mockResolvedValue([{ count: 3 }]);
    const rail = await getHomeOperatingRail(sessionFor("clinic_owner"));

    expect(rail.opportunity?.kind).toBe("grid_offer_decision");
    expect(rail.opportunity?.title).toContain("3");
    expect(rail.opportunity?.evidence).toContain("Grid offer records");

    const grid = rail.destinations.find((destination) => destination.workspace === "grid");
    expect(grid?.live).toEqual({ count: 3, noun: "offers awaiting your decision", singular: "offer awaiting your decision" });
  });

  it("prefers an open escalation over an open task, because an escalation is waiting on review", async () => {
    escalationCount.mockResolvedValue(2);
    taskCount.mockResolvedValue(9);
    const rail = await getHomeOperatingRail(sessionFor("front_desk"));

    expect(rail.opportunity?.kind).toBe("open_escalation");
    expect(rail.opportunity?.title).toContain("2 escalations are open");
  });

  it("never counts Grid offers for a role that cannot read Grid", async () => {
    queryRaw.mockResolvedValue([{ count: 5 }]);
    const rail = await getHomeOperatingRail(sessionFor("clinical_staff"));

    // clinical_staff holds no `grid` permission, so the Grid query must not run at
    // all — a count is a disclosure, and the rail must not leak one past RBAC.
    expect(queryRaw).not.toHaveBeenCalled();
    expect(rail.destinations.some((destination) => destination.workspace === "grid")).toBe(false);
    expect(rail.opportunity?.kind).not.toBe("grid_offer_decision");
  });

  it("scopes a provider's task count to that provider", async () => {
    taskCount.mockResolvedValue(4);
    await getHomeOperatingRail(sessionFor("provider"));

    // The provider rail shows /provider and /grid, neither of which counts tasks, so
    // the query must not fire. A number on Home has to match the queue it points at.
    expect(taskCount).not.toHaveBeenCalled();
  });

  it("passes the owner id when the counted destination is a provider task queue", async () => {
    taskCount.mockResolvedValue(4);
    const rail = await getHomeOperatingRail(sessionFor("case_manager"));

    expect(taskCount).toHaveBeenCalledWith({ where: { organizationId: "org-1", status: "open" } });
    const care = rail.destinations.find((destination) => destination.workspace === "tasks");
    expect(care?.live?.count).toBe(4);
  });

  it("only offers destinations the role can actually reach", async () => {
    for (const role of ["clinic_owner", "provider", "front_desk", "biller", "clinical_staff", "case_manager", "viewer", "quality"] as ClinicRole[]) {
      const rail = await getHomeOperatingRail(sessionFor(role));
      for (const destination of rail.destinations) {
        const { canAccessWorkspace } = await import("@/lib/auth/workspace-authorization");
        expect(canAccessWorkspace(role, destination.workspace), `${role} → ${destination.workspace}`).toBe(true);
      }
    }
  });
});

describe("Living Home surface behavior", () => {
  // Home is one surface across two files — the composer/rails shell and the standing
  // operating picture. Both are read so a section moving between them cannot silently
  // drop a guard.
  const shell = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/living-home.tsx"), "utf8");
  const operations = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/living-home-operations.tsx"), "utf8");
  const home = shell + operations;

  it("transforms in place instead of navigating away when a visit is selected", () => {
    // Every schedule entry used to be a Link straight out of Home. Selecting a visit
    // now opens the inline workspace on the same surface; the only control that
    // leaves is the explicit link to the full record.
    const patientLinks = home.match(/href=\{`\/patients\/\$\{appointment\.patientId\}`\}/g) ?? [];
    expect(patientLinks).toHaveLength(1);
    expect(home).toContain("onClick={() => focusAppointment(appointment.id)}");
    expect(home).toContain("<FocusPanel");
    expect(home).toContain("Open the full record");
  });

  it("does not invent a role-templated opportunity", () => {
    expect(home).not.toContain("opportunityForRole");
    expect(home).not.toContain("Put unused capacity to work.");
    expect(home).toContain("Nothing is open right now.");
  });

  it("reports intelligence availability rather than idling as if connected", () => {
    expect(home).toContain("intelligence.available");
    expect(home).toContain("Conversational intelligence is not connected on this deployment.");
  });

  it("hides the patient record link when the role cannot read patients", () => {
    expect(home).toContain("canOpenPatientRecord");
    expect(home).toContain("cannot open the patient record");
  });

  it("advances the phase rail on real milestones, never on a timer", () => {
    // The reference design played Listening → Understanding → Connecting → Preparing
    // → Ready back on setTimeout, which shows progress whether or not any is
    // happening. Each phase here is set beside the work it names.
    expect(shell).not.toMatch(/setTimeout|setInterval/);
    expect(shell).toContain('setPhase("understanding")');
    expect(shell).toContain('setPhase("connecting")');
    expect(shell).toContain('setPhase("preparing")');
  });

  it("does not put words in the person's mouth when a destination is picked", () => {
    // A destination prefills the composer and returns the caret. It must not submit a
    // sentence the person never wrote and then show it back to them as their own.
    expect(shell).toContain("composerRef.current?.focus()");
    expect(shell).not.toMatch(/proposeDestination[\s\S]{0,400}submitIntent\(/);
  });

  it("builds the workspace from the created Path, not from a canned table", () => {
    expect(shell).not.toContain("Sample data");
    expect(shell).toContain("activeSnapshot.goal");
    expect(shell).toContain("activeGuidance?.blockers");
    // Nothing is executed from Home, and the footer says so rather than implying a
    // send, submission or payout happened here.
    expect(shell).toContain("Nothing is executed from this surface");
  });

  it("derives the highlighted destination from the governed link, not the typed words", () => {
    expect(shell).toContain("destinationForHref");
    expect(shell).toContain("activeGuidance?.href ?? null");
  });
});
