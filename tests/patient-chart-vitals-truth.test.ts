import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("patient chart persisted vitals truth", () => {
  it("loads patient-scoped persisted vitals on the server page", () => {
    const page = read("src/app/(platform)/patients/[patientId]/page.tsx");
    expect(page).toContain("listVitalsForPatient");
    expect(page).toContain("session.organizationId");
    expect(page).toContain("vitals={vitals}");
  });

  it("renders the Vitals tab from a typed persisted-vitals prop", () => {
    const chart = read("src/components/clinic/patient-chart.tsx");
    expect(chart).toContain("PatientVital");
    expect(chart).toContain("vitals: PatientVital[]");
    expect(chart).toContain("<VitalsTab vitals={vitals}");
  });

  it("has a truthful empty state and no fixed clinical measurements", () => {
    const chart = read("src/components/clinic/patient-chart.tsx");
    expect(chart).toContain("No vitals recorded for this patient");
    expect(chart).not.toContain('"132/84"');
    expect(chart).not.toContain('"171"');
    expect(chart).not.toContain('"29.4"');
    expect(chart).not.toContain("Jul 14, 2026 · 9:02 AM");
  });

  it("preserves newest-first patient vitals ordering at the repository boundary", () => {
    const repository = read("src/lib/repositories/vital-repository.ts");
    expect(repository).toContain("where: { organizationId, patientId }");
    expect(repository).toContain('orderBy: { measuredAt: "desc" }');
    expect(repository).toContain("Math.max(1, Math.min(limit, 100))");
  });
});
