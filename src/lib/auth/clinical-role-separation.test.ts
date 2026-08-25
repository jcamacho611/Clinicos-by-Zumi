import { describe, expect, it } from "vitest";

import {
  can,
  clinicRoles,
  type ClinicAction,
  type ClinicResource,
  type ClinicRole,
} from "@/lib/auth/rbac";

/**
 * Medical assistants, licensed practical nurses and registered nurses differ by
 * licensure, not job title. Collapsing them into one `clinical_staff` role made staff
 * handoff attribution untruthful: a vital recorded by an unlicensed assistant and a
 * nursing assessment performed by an RN are not the same clinical claim.
 *
 * Splitting a role is a privilege-boundary change, so the tests that matter most here
 * are the ones proving nobody gained access. `clinical_staff` is retained unchanged so
 * existing memberships keep working.
 */

const CLINICAL_ROLES = ["medical_assistant", "licensed_practical_nurse", "registered_nurse"] as const;

const RESOURCES: ClinicResource[] = [
  "patients", "appointments", "encounters", "billing", "coding", "settings", "users",
  "registry", "network", "grid", "identity", "consents", "referrals", "labs", "imaging",
  "medications", "documents", "forms", "voice", "tasks", "escalations", "messages",
  "knowledge", "remote_monitoring", "inventory", "credentialing", "crm", "care_teams",
  "cases", "quality", "insurance", "telemedicine", "portal", "integrations", "ai",
];

const ACTIONS: ClinicAction[] = ["read", "create", "update", "sign", "manage"];

function grantsOf(role: ClinicRole): Set<string> {
  const granted = new Set<string>();
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      if (can(role, resource, action)) granted.add(`${resource}:${action}`);
    }
  }
  return granted;
}

describe("clinical role separation", () => {
  it("registers the three licensure-distinct roles", () => {
    for (const role of CLINICAL_ROLES) {
      expect(clinicRoles).toContain(role);
    }
  });

  it("retains clinical_staff so existing memberships keep working", () => {
    expect(clinicRoles).toContain("clinical_staff");
  });

  it("grants no clinical role more than clinical_staff already had", () => {
    // The load-bearing safety property. Splitting a role must never widen access for
    // anyone; if it did, this change would be a silent privilege escalation.
    const baseline = grantsOf("clinical_staff");
    for (const role of CLINICAL_ROLES) {
      const escalations = [...grantsOf(role)].filter((grant) => !baseline.has(grant));
      expect(escalations, `${role} gained permissions clinical_staff never had`).toEqual([]);
    }
  });

  it("orders the three roles as a strict ladder by licensure", () => {
    const ma = grantsOf("medical_assistant");
    const lpn = grantsOf("licensed_practical_nurse");
    const rn = grantsOf("registered_nurse");

    // Every MA grant is held by an LPN, and every LPN grant by an RN.
    expect([...ma].filter((g) => !lpn.has(g))).toEqual([]);
    expect([...lpn].filter((g) => !rn.has(g))).toEqual([]);

    // And each step is a real widening, not a relabel — otherwise the roles are
    // distinct in name only, which is the defect this change exists to fix.
    expect(lpn.size).toBeGreaterThan(ma.size);
    expect(rn.size).toBeGreaterThan(lpn.size);
  });

  it("keeps medication administration out of the unlicensed role", () => {
    // A medical assistant is unlicensed. Recording that a medication was given is a
    // licensed act in the general case, so it is not granted by default.
    expect(can("medical_assistant", "medications", "create")).toBe(false);
    expect(can("medical_assistant", "medications", "update")).toBe(false);
    // Reading the medication list is required for intake and reconciliation support.
    expect(can("medical_assistant", "medications", "read")).toBe(true);

    expect(can("licensed_practical_nurse", "medications", "create")).toBe(true);
    expect(can("registered_nurse", "medications", "create")).toBe(true);
  });

  it("never grants clinical signature authority to any support role", () => {
    // Signing is the provider's authority. No amount of nursing licensure moves it.
    for (const role of [...CLINICAL_ROLES, "clinical_staff"] as ClinicRole[]) {
      expect(can(role, "encounters", "sign")).toBe(false);
      expect(can(role, "documents", "sign")).toBe(false);
      expect(can(role, "medications", "sign")).toBe(false);
    }
    expect(can("provider", "encounters", "sign")).toBe(true);
  });

  it("never grants billing, settings or user administration to a clinical role", () => {
    for (const role of CLINICAL_ROLES) {
      expect(can(role, "billing", "read")).toBe(false);
      expect(can(role, "settings", "manage")).toBe(false);
      expect(can(role, "users", "manage")).toBe(false);
    }
  });
});
