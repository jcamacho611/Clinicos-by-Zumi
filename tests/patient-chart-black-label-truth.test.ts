import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const page = fs.readFileSync(path.join(process.cwd(), "src/app/(platform)/patients/[patientId]/page.tsx"), "utf8");
const chart = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/patient-chart-real.tsx"), "utf8");
const style = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/patient-chart-black-label.module.css"), "utf8");

describe("Patient chart Black Label truth-only record", () => {
  it("preserves patient authorization and the real patient-scoped repositories", () => {
    expect(page).toContain('can(session.role, "patients", "read")');
    expect(page).toContain("findPatientForOrganization(patientId, session.organizationId)");
    expect(page).toContain("listEncountersForPatient(patientId, session.organizationId)");
    expect(page).toContain("listLabResultsForPatient(patientId, session.organizationId)");
    expect(page).toContain("listImagingResultsForPatient(patientId, session.organizationId)");
    expect(page).toContain("listDocumentsForPatient(patientId, session.organizationId)");
    expect(page).toContain("listFormSubmissionsForPatient(session.organizationId, patientId)");
    expect(page).toContain("listConsentsForPatient(session.organizationId, patientId)");
    expect(page).toContain("listMedicationHistoryForPatient(session.organizationId, patientId)");
    expect(page).toContain("listVitalsForPatient(patientId, session.organizationId)");
  });

  it("uses a smaller progressive chart model instead of eighteen equal-weight tabs", () => {
    expect(chart).toContain('const tabs = ["Summary", "Encounters", "Medications", "Vitals", "Labs", "Imaging", "Documents", "Forms & consents"]');
    expect(chart).not.toContain('"Notes"');
    expect(chart).not.toContain('"Referrals"');
    expect(chart).not.toContain('"Messages"');
    expect(chart).not.toContain('"Quality"');
    expect(chart).not.toContain('"Cases"');
  });

  it("contains no fabricated demo patient records or seeded quality-gap content", () => {
    expect(chart).not.toContain("Diabetes follow-up note - Draft");
    expect(chart).not.toContain("Endocrinology - Sent Jun 18");
    expect(chart).not.toContain("Lab result question - Routed to provider");
    expect(chart).not.toContain("No active cases for this demo patient");
    expect(chart).not.toContain("qualityGaps");
    expect(chart).not.toContain("Depression screening");
  });

  it("removes dead chart controls and routes real work to governed workspaces", () => {
    expect(chart).not.toContain('aria-label="Print chart"');
    expect(chart).not.toContain('aria-label="More actions"');
    expect(chart).not.toContain("Full timeline");
    expect(chart).toContain('href="/labs"');
    expect(chart).toContain('href="/imaging"');
    expect(chart).toContain('href="/documents"');
    expect(chart).toContain('href="/forms"');
    expect(chart).toContain('href="/medications"');
  });

  it("keeps provider review state based on real labs/imaging/forms/documents", () => {
    expect(chart).toContain('result.reviewStatus === "Needs Review"');
    expect(chart).toContain('result.status === "needs_review"');
    expect(chart).toContain('["staff_review", "provider_review"].includes(submission.status)');
    expect(chart).toContain('document.reviewStatus === "needs_review"');
    expect(chart).toContain("ClinicOS has not interpreted");
  });

  it("uses Black Label materials, readable microcopy, and a stable patient context stage", () => {
    expect(chart).toContain('data-patient-chart-stage');
    expect(style).toContain("var(--k-work-bg)");
    expect(style).toContain("var(--k-public-surface)");
    expect(style).toContain("var(--k-text)");
    expect(style).toContain("var(--k-muted)");
    expect(style).toContain("var(--k-line)");
    expect(style).toContain("var(--k-accent)");
    expect(style).toContain("min-height: 44px");
    expect(chart).not.toContain('text-[11px]');
    expect(chart).not.toContain('text-[10px]');
  });
});
