import { describe, expect, it } from "vitest";
import {
  projectPublicPatientIdentity,
  projectPublicProfessionalIdentity,
  resolvePersonExperienceContext,
  type PersonContextInput,
} from "@/lib/identity/person-context";

const base: PersonContextInput = {
  person: {
    id: "person_1",
    displayName: "Jordan Lee",
    status: "active",
  },
  memberships: [
    {
      id: "mem_a",
      personId: "person_1",
      organizationId: "org_a",
      legacyUserId: "user_a",
      membershipType: "organization_user",
      roleKey: "provider",
      status: "active",
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      effectiveTo: null,
    },
    {
      id: "mem_b",
      personId: "person_1",
      organizationId: "org_b",
      legacyUserId: "user_b",
      membershipType: "organization_user",
      roleKey: "clinic_owner",
      status: "active",
      effectiveFrom: new Date("2026-02-01T00:00:00.000Z"),
      effectiveTo: null,
    },
  ],
  locationAssignments: [
    {
      id: "loc_a",
      membershipId: "mem_a",
      locationId: "location_a",
      roleKey: "provider",
      professionKey: "rn",
      status: "active",
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      effectiveTo: null,
    },
    {
      id: "loc_b",
      membershipId: "mem_b",
      locationId: "location_b",
      roleKey: "clinic_owner",
      professionKey: null,
      status: "active",
      effectiveFrom: new Date("2026-02-01T00:00:00.000Z"),
      effectiveTo: null,
    },
  ],
  relationships: [
    {
      id: "rel_student",
      personId: "person_1",
      relationshipType: "learner",
      organizationId: "school_1",
      status: "active",
      verificationState: "claimed",
      effectiveFrom: new Date("2025-09-01T00:00:00.000Z"),
      effectiveTo: null,
    },
    {
      id: "rel_provider",
      personId: "person_1",
      relationshipType: "professional",
      organizationId: "org_a",
      status: "active",
      verificationState: "verified",
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      effectiveTo: null,
    },
  ],
  domainLinks: [
    { kind: "user", recordId: "user_a", organizationId: "org_a" },
    { kind: "provider", recordId: "provider_a", organizationId: "org_a" },
    { kind: "patient", recordId: "patient_a", organizationId: "org_a" },
    { kind: "user", recordId: "user_b", organizationId: "org_b" },
  ],
  evidence: [
    { id: "ev_resume", kind: "resume_claim", verificationState: "claimed" },
    { id: "ev_edu", kind: "education_completion", verificationState: "verified" },
    { id: "ev_license", kind: "professional_credential", verificationState: "verified" },
  ],
};

describe("Person relationship and active-context adoption", () => {
  it("keeps one Person stable while selecting one explicit organization context", () => {
    const result = resolvePersonExperienceContext(base, {
      organizationId: "org_a",
      locationId: "location_a",
      purpose: "provide_care",
      at: new Date("2026-08-29T00:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.context.personId).toBe("person_1");
    expect(result.context.membershipId).toBe("mem_a");
    expect(result.context.organizationId).toBe("org_a");
    expect(result.context.locationId).toBe("location_a");
    expect(result.context.purpose).toBe("provide_care");
    expect(result.context.availableOrganizationIds).toEqual(["org_a", "org_b"]);
  });

  it("does not silently choose a tenant or purpose for consequential work", () => {
    expect(resolvePersonExperienceContext(base, {
      organizationId: null,
      locationId: null,
      purpose: "provide_care",
      at: new Date("2026-08-29T00:00:00.000Z"),
    })).toMatchObject({ ok: false, reason: "organization_required" });

    expect(resolvePersonExperienceContext(base, {
      organizationId: "org_a",
      locationId: "location_a",
      purpose: "",
      at: new Date("2026-08-29T00:00:00.000Z"),
    })).toMatchObject({ ok: false, reason: "purpose_required" });
  });

  it("rejects inactive, future, expired, or cross-membership location context", () => {
    const withExpiredMembership: PersonContextInput = {
      ...base,
      memberships: base.memberships.map((membership) =>
        membership.id === "mem_a"
          ? { ...membership, effectiveTo: new Date("2026-06-01T00:00:00.000Z") }
          : membership,
      ),
    };

    expect(resolvePersonExperienceContext(withExpiredMembership, {
      organizationId: "org_a",
      locationId: "location_a",
      purpose: "provide_care",
      at: new Date("2026-08-29T00:00:00.000Z"),
    })).toMatchObject({ ok: false, reason: "membership_inactive" });

    expect(resolvePersonExperienceContext(base, {
      organizationId: "org_a",
      locationId: "location_b",
      purpose: "provide_care",
      at: new Date("2026-08-29T00:00:00.000Z"),
    })).toMatchObject({ ok: false, reason: "location_not_assigned" });
  });

  it("scopes domain links to the active organization instead of carrying prior-tenant records", () => {
    const orgA = resolvePersonExperienceContext(base, {
      organizationId: "org_a",
      locationId: "location_a",
      purpose: "provide_care",
      at: new Date("2026-08-29T00:00:00.000Z"),
    });
    const orgB = resolvePersonExperienceContext(base, {
      organizationId: "org_b",
      locationId: "location_b",
      purpose: "manage_clinic",
      at: new Date("2026-08-29T00:00:00.000Z"),
    });

    expect(orgA.ok && orgA.context.domainLinks.map(({ recordId }) => recordId)).toEqual([
      "user_a",
      "provider_a",
      "patient_a",
    ]);
    expect(orgB.ok && orgB.context.domainLinks.map(({ recordId }) => recordId)).toEqual(["user_b"]);
  });

  it("treats membership roles, location profession labels, relationships, resume, and EDU evidence as context/evidence rather than authority", () => {
    const result = resolvePersonExperienceContext(base, {
      organizationId: "org_a",
      locationId: "location_a",
      purpose: "provide_care",
      at: new Date("2026-08-29T00:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.context.membershipRoleKey).toBe("provider");
    expect(result.context.locationProfessionKey).toBe("rn");
    expect(result.context.inferredAuthority).toEqual({
      professional: false,
      clinical: false,
      billing: false,
      organizationBinding: false,
    });
    expect(result.context.evidence.find(({ id }) => id === "ev_resume")?.grantsAuthority).toBe(false);
    expect(result.context.evidence.find(({ id }) => id === "ev_edu")?.grantsAuthority).toBe(false);
    expect(result.context.evidence.find(({ id }) => id === "ev_license")?.grantsAuthority).toBe(false);
  });

  it("keeps patient identity out of public projection by default", () => {
    expect(projectPublicPatientIdentity(base.person)).toBeNull();
  });

  it("requires verified professional eligibility before a public professional projection exists", () => {
    expect(projectPublicProfessionalIdentity({
      person: base.person,
      relationship: base.relationships[1],
      eligibility: { verified: false, eligible: true },
      publicFields: { displayName: "Jordan Lee", headline: "Registered nurse" },
    })).toBeNull();

    expect(projectPublicProfessionalIdentity({
      person: base.person,
      relationship: base.relationships[1],
      eligibility: { verified: true, eligible: true },
      publicFields: { displayName: "Jordan Lee", headline: "Registered nurse" },
    })).toEqual({
      personId: "person_1",
      displayName: "Jordan Lee",
      headline: "Registered nurse",
      relationshipId: "rel_provider",
    });
  });
});
