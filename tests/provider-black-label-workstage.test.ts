import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const renderer = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/workspace-renderer.tsx"), "utf8");
const operations = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/workspaces/operations.tsx"), "utf8");
const mapper = fs.readFileSync(path.join(process.cwd(), "src/lib/repositories/appointment-mapper.ts"), "utf8");
const style = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/workspaces/provider-black-label.module.css"), "utf8");

describe("Provider Black Label workstage", () => {
  it("preserves the provider workspace router and real appointment/encounter sources", () => {
    expect(renderer).toContain('case "provider"');
    expect(renderer).toContain("listAppointmentsForOrganization(organizationId)");
    expect(renderer).toContain("listEncountersForOrganization(organizationId)");
    expect(renderer).toContain("<ProviderWorkspace appointments={appointments} encounters={encounters} />");
  });

  it("keeps Today grounded in the appointment location timezone", () => {
    expect(mapper).toContain('timeZone: timezone');
    expect(mapper).toContain('? "Today" : valueDay');
    expect(mapper).toContain('aggregate.location?.timezone ?? "America/New_York"');
    expect(operations).toContain('appointment.date === "Today"');
  });

  it("centers provider home on deterministic next clinical work instead of four KPI cards", () => {
    expect(operations).toContain('data-provider-workstage');
    expect(operations).toContain("Next clinical work");
    expect(operations).toContain("Addendum needed");
    expect(operations).toContain("Ready for review");
    expect(operations).toContain("Resume draft");
    expect(operations).not.toContain('label="Today’s visits"');
  });

  it("keeps Current Visit / encounter deep links as the real action path", () => {
    expect(operations).toContain('href={`/encounters/${nextWork.encounterId}`}');
    expect(operations).toContain('href={`/encounters/${encounter.id}`}');
    expect(operations).toContain('href={encounter ? `/encounters/${encounter.id}` : `/patients/${appointment.patientId}`}');
  });

  it("does not invent external results or provider tasks on this surface", () => {
    expect(operations).toContain("External results and messages appear only when their real governed repositories are connected here");
    expect(operations).toContain("Klinikos does not invent provider tasks on this surface");
    expect(operations).not.toContain("fake result");
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
