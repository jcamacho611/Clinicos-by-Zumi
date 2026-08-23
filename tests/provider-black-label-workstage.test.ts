import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const page = fs.readFileSync(path.join(process.cwd(), "src/app/(platform)/provider/page.tsx"), "utf8");
const workspace = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/provider-workspace-real.tsx"), "utf8");
const mapper = fs.readFileSync(path.join(process.cwd(), "src/lib/repositories/appointment-mapper.ts"), "utf8");
const style = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/workspaces/provider-black-label.module.css"), "utf8");

describe("Provider Black Label workstage", () => {
  it("preserves provider authorization and real appointment/encounter sources", () => {
    expect(page).toContain('canAccessWorkspace(session.role, "provider")');
    expect(page).toContain("listAppointmentsForOrganization(session.organizationId)");
    expect(page).toContain("listEncountersForOrganization(session.organizationId)");
    expect(page).toContain("<ProviderWorkspaceReal appointments={appointments} encounters={encounters} />");
  });

  it("keeps Today grounded in the appointment location timezone", () => {
    expect(mapper).toContain('timeZone: timezone');
    expect(mapper).toContain('? "Today" : valueDay');
    expect(mapper).toContain('aggregate.location?.timezone ?? "America/New_York"');
    expect(workspace).toContain('appointment.date === "Today"');
  });

  it("centers provider home on deterministic next clinical work instead of four KPI cards", () => {
    expect(workspace).toContain('data-provider-workstage');
    expect(workspace).toContain("Next clinical work");
    expect(workspace).toContain('label: "Addendum needed"');
    expect(workspace).toContain('label: "Ready for review"');
    expect(workspace).toContain('label: "Resume draft"');
    expect(workspace).not.toContain("<StatCard");
    expect(workspace).not.toContain("xl:grid-cols-4");
  });

  it("keeps Current Visit / encounter deep links as the real action path", () => {
    expect(workspace).toContain('href={nextWork.href}');
    expect(workspace).toContain('href={`/encounters/${encounter.id}`}');
    expect(workspace).toContain('href={encounter ? `/encounters/${encounter.id}` : `/patients/${appointment.patientId}`}');
  });

  it("does not invent external results or provider tasks on this surface", () => {
    expect(workspace).toContain("External results and messages appear only when their real governed repositories are connected here");
    expect(workspace).toContain("Klinikos does not invent provider tasks on this surface");
    expect(workspace).not.toContain("fake result");
  });

  it("uses shared Black Label materials and clinical-focus density", () => {
    expect(style).toContain("var(--k-work-bg)");
    expect(style).toContain("var(--k-public-surface)");
    expect(style).toContain("var(--k-text)");
    expect(style).toContain("var(--k-muted)");
    expect(style).toContain("var(--k-line)");
    expect(style).toContain("var(--k-accent)");
    expect(style).toContain("min-height: 44px");
    expect(style).toContain("font-variant-numeric: tabular-nums");
  });
});
