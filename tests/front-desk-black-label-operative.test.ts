import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const page = fs.readFileSync(path.join(process.cwd(), "src/app/(platform)/front-desk/page.tsx"), "utf8");
const workspace = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/front-desk-workspace-real.tsx"), "utf8");
const style = fs.readFileSync(path.join(process.cwd(), "src/app/(platform)/front-desk/front-desk-black-label.module.css"), "utf8");

describe("Front Desk Black Label operative workspace", () => {
  it("preserves workspace authorization and real schedule/coordination sources", () => {
    expect(page).toContain('canAccessWorkspace(session.role, "front-desk")');
    expect(page).toContain("listAppointmentsForOrganization(session.organizationId)");
    expect(page).toContain("listCareCoordinationWorkspace(session.organizationId, session.userId)");
  });

  it("does not pretend the unbounded appointment query is today-scoped", () => {
    expect(workspace).not.toContain("Run today without the scramble");
    expect(workspace).not.toContain("Arrival board");
    expect(workspace).toContain("Schedule readiness");
    expect(workspace).toContain("Active appointments");
  });

  it("replaces four KPI cards with one operational strip", () => {
    expect(workspace).toContain("data-front-desk-operative-strip");
    expect(workspace).not.toContain("<StatCard");
    expect(workspace).not.toContain("xl:grid-cols-4");
  });

  it("preserves appointment status actions and real follow-through", () => {
    expect(workspace).toContain("AppointmentStatusControl");
    expect(workspace).toContain("frontDeskCategoryHints");
    expect(workspace).toContain("coordination.tasks.filter");
    expect(workspace).toContain('href="/tasks"');
    expect(workspace).toContain('href="/messages"');
  });

  it("keeps communications truth explicit", () => {
    expect(workspace).toContain("No fake missed-call queue");
    expect(workspace).toContain("Real inbound/call events will appear only after an approved communications connection supplies them");
  });

  it("uses shared Black Label materials and a high-speed dense table", () => {
    expect(style).toContain("var(--k-work-bg)");
    expect(style).toContain("var(--k-public-surface)");
    expect(style).toContain("var(--k-text)");
    expect(style).toContain("var(--k-muted)");
    expect(style).toContain("var(--k-line)");
    expect(style).toContain("font-variant-numeric: tabular-nums");
    expect(style).toContain("min-height: 44px");
    expect(workspace).toContain("<table");
  });

  it("keeps touched front-desk labels at the Black Label floor", () => {
    expect(workspace).not.toContain('text-[11px]');
    expect(workspace).not.toContain('text-[10px]');
  });
});
