import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const page = fs.readFileSync(path.join(process.cwd(), "src/app/portal/page.tsx"), "utf8");
const dashboard = fs.readFileSync(path.join(process.cwd(), "src/components/portal/portal-dashboard.tsx"), "utf8");
const style = fs.readFileSync(path.join(process.cwd(), "src/components/portal/portal-black-label.module.css"), "utf8");

describe("Patient Portal Black Label private hospitality", () => {
  it("preserves patient-bound portal authority and access audit", () => {
    expect(page).toContain("requirePortalSession()");
    expect(page).toContain("recordPortalAccess");
    expect(page).toContain("getPortalDashboardForPatient(session.organizationId, session.patientId)");
  });

  it("centers the experience on the patient's next step instead of dashboard stat cards", () => {
    expect(dashboard).toContain('data-patient-next-step');
    expect(dashboard).toContain("Your next step");
    expect(dashboard).not.toContain("function PortalStat");
    expect(dashboard).not.toContain("xl:grid-cols-4");
  });

  it("keeps released-record and complete-record truth explicit", () => {
    expect(dashboard).toContain("Only records explicitly released by your care team appear here");
    expect(dashboard).toContain("not represented as your complete medical record");
    expect(dashboard).toContain("complete records-access or transfer request");
  });

  it("does not expose internal roadmap language or fake help actions", () => {
    expect(dashboard).not.toContain("next portal workflow slice");
    expect(dashboard).not.toContain("Secure messaging and refill/referral requests are the next");
    expect(dashboard).not.toContain("ChevronRight");
    expect(dashboard).toContain("Need help from the office?");
  });

  it("uses shared Black Label materials with a patient-hospitality density", () => {
    expect(style).toContain("var(--k-work-bg)");
    expect(style).toContain("var(--k-public-surface)");
    expect(style).toContain("var(--k-public-raised)");
    expect(style).toContain("var(--k-text)");
    expect(style).toContain("var(--k-muted)");
    expect(style).toContain("var(--k-line)");
    expect(style).toContain("var(--k-accent)");
    expect(style).toContain("min-height: 44px");
  });

  it("keeps patient-visible typography at the Black Label floor in touched UI", () => {
    expect(dashboard).not.toContain('text-[11px]');
    expect(dashboard).not.toContain('text-[10px]');
  });
});
