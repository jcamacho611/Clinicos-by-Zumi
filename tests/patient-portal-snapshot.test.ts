import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { PortalDashboard } from "@/lib/repositories/portal-repository";
import {
  buildPatientPortalSnapshot,
  PATIENT_PORTAL_SNAPSHOT_SCHEMA,
  patientPortalSnapshotFilename,
} from "@/lib/portal/patient-portal-snapshot";

function dashboardFixture(): PortalDashboard {
  return {
    patient: {
      id: "pat_1",
      firstName: "Ari",
      lastName: "Patient",
      preferredName: "Ari",
      displayName: "Ari",
      mrn: "MRN-100",
      email: "ari@example.test",
      phone: "+15555550100",
      preferredLanguage: "English",
    },
    appointments: [],
    forms: [],
    records: [
      {
        id: "lab_1",
        kind: "Lab result",
        title: "Metabolic panel",
        detail: "Clinic result",
        releasedAt: "2026-08-18T15:00:00.000Z",
      },
    ],
    financial: { balanceCents: 2500, asOf: "2026-08-18T12:00:00.000Z", invoices: [] },
    messages: [],
    accessHistory: [
      { id: "audit_1", action: "portal.dashboard_viewed", resourceType: "patient_portal", createdAt: "2026-08-18T15:00:00.000Z" },
    ],
  };
}

describe("patient portal portability snapshot", () => {
  it("exports a machine-readable portal snapshot without claiming a complete medical record", () => {
    const snapshot = buildPatientPortalSnapshot(dashboardFixture(), {
      organizationName: "Example Clinic",
      exportedAt: new Date("2026-08-18T16:00:00.000Z"),
    });

    expect(snapshot.schemaVersion).toBe(PATIENT_PORTAL_SNAPSHOT_SCHEMA);
    expect(snapshot.kind).toBe("patient_portal_snapshot");
    expect(snapshot.scope.completeMedicalRecord).toBe(false);
    expect(snapshot.scope.completeDesignatedRecordSet).toBe(false);
    expect(snapshot.scope.notice).toContain("complete records-access or transfer request");
    expect(snapshot.organization).toEqual({ name: "Example Clinic" });
    expect(snapshot.patient).toMatchObject({ id: "pat_1", mrn: "MRN-100" });
    expect(snapshot.releasedRecords).toHaveLength(1);
    expect(snapshot).not.toHaveProperty("accessHistory");
  });

  it("creates a bounded attachment filename from the patient display name", () => {
    const filename = patientPortalSnapshotFilename({
      displayName: "Ari Pátient / ../ private",
      exportedAt: new Date("2026-08-18T16:00:00.000Z"),
    });

    expect(filename).toBe("klinikos-ari-patient-private-portal-snapshot-2026-08-18.json");
    expect(filename).not.toContain("..");
    expect(filename).not.toContain("/");
  });

  it("keeps the export route bound to the authenticated portal identity and disables caching", () => {
    const route = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/portal/records/snapshot/route.ts"),
      "utf8",
    );

    expect(route).toContain("getPortalSession()");
    expect(route).toContain("session.organizationId, session.patientId");
    expect(route).not.toContain("searchParams.get(\"patientId\")");
    expect(route).not.toContain("params.patientId");
    expect(route).toContain('"Cache-Control": "private, no-store"');
    expect(route).toContain('"Content-Disposition"');
    expect(route).toContain('"X-Content-Type-Options": "nosniff"');
    expect(route).toContain('"portal.records_snapshot_exported"');
  });
});
