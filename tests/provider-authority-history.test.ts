import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";

const providerCredentialFindFirst = vi.fn();
const providerCredentialCreate = vi.fn();
const providerCredentialUpdate = vi.fn();
const providerCredentialUpdateMany = vi.fn();
const providerCredentialFindUnique = vi.fn();
const providerFindFirst = vi.fn();
const providerFindUnique = vi.fn();
const providerCreate = vi.fn();
const providerUpdate = vi.fn();
const providerUpdateMany = vi.fn();
const privilegeFindFirst = vi.fn();
const privilegeCreate = vi.fn();
const privilegeUpdate = vi.fn();
const privilegeUpdateMany = vi.fn();
const privilegeFindUnique = vi.fn();
const facilityFindFirst = vi.fn();
const organizationFindUnique = vi.fn();
const userFindUnique = vi.fn();
const userCreate = vi.fn();
const taskCreate = vi.fn();
const taskUpdateMany = vi.fn();
const auditCreate = vi.fn();
const authorityEventCreate = vi.fn();

const tx = {
  organization: { findUnique: (...args: unknown[]) => organizationFindUnique(...args) },
  user: {
    findUnique: (...args: unknown[]) => userFindUnique(...args),
    create: (...args: unknown[]) => userCreate(...args),
    update: vi.fn(),
  },
  authSession: { updateMany: vi.fn() },
  provider: {
    findFirst: (...args: unknown[]) => providerFindFirst(...args),
    findUnique: (...args: unknown[]) => providerFindUnique(...args),
    create: (...args: unknown[]) => providerCreate(...args),
    update: (...args: unknown[]) => providerUpdate(...args),
    updateMany: (...args: unknown[]) => providerUpdateMany(...args),
  },
  providerCredential: {
    findFirst: (...args: unknown[]) => providerCredentialFindFirst(...args),
    findUnique: (...args: unknown[]) => providerCredentialFindUnique(...args),
    create: (...args: unknown[]) => providerCredentialCreate(...args),
    update: (...args: unknown[]) => providerCredentialUpdate(...args),
    updateMany: (...args: unknown[]) => providerCredentialUpdateMany(...args),
  },
  providerFacilityPrivilege: {
    findFirst: (...args: unknown[]) => privilegeFindFirst(...args),
    findUnique: (...args: unknown[]) => privilegeFindUnique(...args),
    create: (...args: unknown[]) => privilegeCreate(...args),
    update: (...args: unknown[]) => privilegeUpdate(...args),
    updateMany: (...args: unknown[]) => privilegeUpdateMany(...args),
  },
  providerAvailability: { updateMany: vi.fn() },
  gridServiceListing: { updateMany: vi.fn() },
  facility: { findFirst: (...args: unknown[]) => facilityFindFirst(...args) },
  task: {
    create: (...args: unknown[]) => taskCreate(...args),
    updateMany: (...args: unknown[]) => taskUpdateMany(...args),
  },
  auditLog: { create: (...args: unknown[]) => auditCreate(...args) },
  providerAuthorityEvent: { create: (...args: unknown[]) => authorityEventCreate(...args) },
};

const transaction = vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: (callback: (client: typeof tx) => unknown) => transaction(callback),
    providerCredential: { findFirst: (...args: unknown[]) => providerCredentialFindFirst(...args) },
  },
}));

vi.mock("bcryptjs", () => ({ hash: vi.fn().mockResolvedValue("test-password-hash") }));

const {
  createFacilityPrivilege,
  createProviderCredential,
  transitionFacilityPrivilege,
  transitionProviderCredential,
} = await import("@/lib/repositories/credentialing-repository");
const {
  createGridContractorEnrollment,
  createGridProvider,
  reviewGridCredential,
  reviewGridMalpractice,
} = await import("@/lib/repositories/grid-repository");

const now = new Date("2026-08-29T16:00:00.000Z");

const session: ClinicSession = {
  sessionId: "session-authority-review",
  userId: "reviewer-1",
  organizationId: "org-1",
  organizationName: "Example Clinic",
  organizationSlug: "example-clinic",
  email: "reviewer@example.test",
  name: "Credential Reviewer",
  role: "clinic_owner",
  demo: true,
  expiresAt: now.getTime() + 60_000,
};

function credential(overrides: Record<string, unknown> = {}) {
  return {
    id: "credential-1",
    organizationId: "org-1",
    providerId: "provider-1",
    type: "STATE_LICENSE",
    number: "SYNTH-LICENSE-001",
    state: "NY",
    expiresAt: new Date("2027-08-29T00:00:00.000Z"),
    status: "pending",
    verificationStatus: "pending",
    verificationSource: "manual intake",
    primarySourceVerifiedAt: null,
    evidenceDocumentId: "document-1",
    evidenceReference: "evidence://license/1",
    exceptionReason: null,
    verifiedBy: null,
    reviewNotes: null,
    authorityVersion: 1,
    createdAt: now,
    updatedAt: now,
    provider: { id: "provider-1", name: "Example Provider", userId: "provider-user-1", engagementType: "staff" },
    ...overrides,
  };
}

function privilege(overrides: Record<string, unknown> = {}) {
  return {
    id: "privilege-1",
    organizationId: "org-1",
    providerId: "provider-1",
    facilityId: "facility-1",
    status: "pending",
    grantedAt: null,
    expiresAt: new Date("2027-08-29T00:00:00.000Z"),
    verificationSource: null,
    notes: "Requested for outpatient services.",
    authorityVersion: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function provider(overrides: Record<string, unknown> = {}) {
  return {
    id: "provider-1",
    organizationId: "org-1",
    userId: "provider-user-1",
    name: "Example Provider",
    displayName: "Example Provider",
    legalName: "Example Provider",
    engagementType: "staff",
    malpracticeCarrier: "Synthetic Coverage Company",
    malpracticePolicyNumber: "SYNTH-POLICY-001",
    malpracticeExpiration: new Date("2027-08-29T00:00:00.000Z"),
    malpracticeCoverageAmountCents: 100_000_000,
    malpracticeEvidenceReference: "evidence://malpractice/1",
    malpracticeVerificationStatus: "pending",
    malpracticeVerifiedAt: null,
    malpracticeVerifiedBy: null,
    malpracticeReviewNotes: null,
    malpracticeAuthorityVersion: 1,
    verificationStatus: "submitted",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  organizationFindUnique.mockResolvedValue({ id: "org-1", demoMode: true, status: "active" });
  userFindUnique.mockResolvedValue(null);
  userCreate.mockResolvedValue({ id: "provider-user-1", status: "pending_approval" });
  providerFindFirst.mockResolvedValue(provider());
  providerFindUnique.mockResolvedValue(provider());
  facilityFindFirst.mockResolvedValue({ id: "facility-1", name: "Example Facility" });
  providerCredentialFindFirst.mockResolvedValue(credential());
  providerCredentialCreate.mockResolvedValue(credential());
  providerCredentialUpdate.mockResolvedValue(credential({ status: "active", verificationStatus: "verified", authorityVersion: 2 }));
  providerCredentialUpdateMany.mockResolvedValue({ count: 1 });
  providerCredentialFindUnique.mockResolvedValue(credential({ status: "active", verificationStatus: "verified", authorityVersion: 2 }));
  privilegeFindFirst.mockResolvedValue(privilege());
  privilegeCreate.mockResolvedValue(privilege());
  privilegeUpdate.mockResolvedValue(privilege({ status: "active", grantedAt: now, authorityVersion: 2 }));
  privilegeUpdateMany.mockResolvedValue({ count: 1 });
  privilegeFindUnique.mockResolvedValue(privilege({ status: "active", grantedAt: now, authorityVersion: 2 }));
  providerUpdate.mockResolvedValue(provider({ malpracticeVerificationStatus: "verified", malpracticeVerifiedAt: now, malpracticeVerifiedBy: "reviewer-1", malpracticeReviewNotes: "Primary coverage source reviewed.", malpracticeAuthorityVersion: 2 }));
  providerUpdateMany.mockResolvedValue({ count: 1 });
  taskCreate.mockResolvedValue({ id: "task-1" });
  taskUpdateMany.mockResolvedValue({ count: 1 });
  auditCreate.mockResolvedValue({ id: "audit-1" });
  authorityEventCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({ id: `event-${data.authorityKind}`, ...data }));
});

describe("provider authority history", () => {
  it("records a complete initial credential authority revision in the creation transaction", async () => {
    await createProviderCredential(session, {
      providerId: "provider-1",
      type: "STATE_LICENSE",
      number: "SYNTH-LICENSE-001",
      state: "NY",
      expiresAt: "2027-08-29T00:00:00.000Z",
      verificationSource: "manual intake",
      evidenceDocumentId: "document-1",
    });

    expect(authorityEventCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      organizationId: "org-1",
      providerId: "provider-1",
      authorityKind: "credential",
      authorityRecordId: "credential-1",
      authorityVersion: 1,
      action: "credentialing.credential_created",
      actorId: "reviewer-1",
      beforeState: null,
      evidenceDocumentId: "document-1",
      afterState: expect.objectContaining({
        number: "SYNTH-LICENSE-001",
        verificationStatus: "pending",
        authorityVersion: 1,
      }),
    }) });
  });

  it("preserves the prior and resulting credential state on a verified transition", async () => {
    providerCredentialFindFirst.mockResolvedValue(credential());
    providerCredentialFindUnique.mockResolvedValue(credential({
      status: "active",
      verificationStatus: "verified",
      verificationSource: "state board",
      primarySourceVerifiedAt: now,
      authorityVersion: 2,
    }));

    await transitionProviderCredential(session, "credential-1", {
      action: "verify",
      note: "State board record matched the submitted license.",
      verificationSource: "state board",
    });

    expect(providerCredentialUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "credential-1", organizationId: "org-1", authorityVersion: 1 },
      data: expect.objectContaining({ authorityVersion: { increment: 1 } }),
    }));
    expect(authorityEventCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      authorityKind: "credential",
      authorityVersion: 2,
      action: "credentialing.credential_verify",
      beforeState: expect.objectContaining({ status: "pending", verificationStatus: "pending", authorityVersion: 1 }),
      afterState: expect.objectContaining({ status: "active", verificationStatus: "verified", authorityVersion: 2 }),
      evidenceDocumentId: "document-1",
      evidenceReference: "evidence://license/1",
      note: "State board record matched the submitted license.",
    }) });
  });

  it("records an initial facility privilege and every later authority decision", async () => {
    await createFacilityPrivilege(session, {
      providerId: "provider-1",
      facilityId: "facility-1",
      expiresAt: "2027-08-29T00:00:00.000Z",
      notes: "Requested for outpatient services.",
    });

    expect(authorityEventCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      authorityKind: "facility_privilege",
      authorityRecordId: "privilege-1",
      authorityVersion: 1,
      action: "credentialing.facility_privilege_created",
      beforeState: null,
      afterState: expect.objectContaining({ facilityId: "facility-1", status: "pending", authorityVersion: 1 }),
    }) });

    authorityEventCreate.mockClear();
    await transitionFacilityPrivilege(session, "privilege-1", {
      action: "grant",
      note: "Credentialing committee approved this facility privilege.",
      verificationSource: "credentialing committee minutes",
    });

    expect(privilegeUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "privilege-1", organizationId: "org-1", authorityVersion: 1 },
      data: expect.objectContaining({ authorityVersion: { increment: 1 } }),
    }));
    expect(authorityEventCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      authorityKind: "facility_privilege",
      authorityVersion: 2,
      action: "credentialing.facility_privilege_grant",
      beforeState: expect.objectContaining({ status: "pending", authorityVersion: 1 }),
      afterState: expect.objectContaining({ status: "active", authorityVersion: 2 }),
    }) });
  });

  it("preserves Grid credential-review decisions through the same credential history", async () => {
    providerCredentialFindFirst.mockResolvedValue(credential());
    providerCredentialFindUnique.mockResolvedValue(credential({
      verificationStatus: "rejected",
      verificationSource: "state board",
      verifiedBy: "reviewer-1",
      reviewNotes: "The submitted identifier did not match the board record.",
      authorityVersion: 2,
    }));

    await reviewGridCredential(session, "provider-1", "credential-1", {
      decision: "rejected",
      note: "The submitted identifier did not match the board record.",
      verificationSource: "state board",
    });

    expect(authorityEventCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      authorityKind: "credential",
      authorityRecordId: "credential-1",
      authorityVersion: 2,
      action: "grid.credential_rejected",
      actorId: "reviewer-1",
      beforeState: expect.objectContaining({ verificationStatus: "pending", authorityVersion: 1 }),
      afterState: expect.objectContaining({ verificationStatus: "rejected", authorityVersion: 2 }),
      evidenceReference: "evidence://license/1",
    }) });
  });

  it("preserves malpractice review evidence without storing raw policy content", async () => {
    providerFindFirst.mockResolvedValue(provider());
    providerFindUnique.mockResolvedValue(provider({
      malpracticeVerificationStatus: "verified",
      malpracticeVerifiedAt: now,
      malpracticeVerifiedBy: "reviewer-1",
      malpracticeReviewNotes: "Primary coverage source reviewed.",
      malpracticeAuthorityVersion: 2,
    }));

    await reviewGridMalpractice(session, "provider-1", {
      decision: "verified",
      note: "Primary coverage source reviewed.",
    });

    expect(providerUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "provider-1", organizationId: "org-1", malpracticeAuthorityVersion: 1 },
      data: expect.objectContaining({ malpracticeAuthorityVersion: { increment: 1 } }),
    }));
    expect(authorityEventCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      authorityKind: "malpractice",
      authorityRecordId: "provider-1",
      authorityVersion: 2,
      action: "grid.malpractice_verified",
      beforeState: expect.objectContaining({ verificationStatus: "pending", authorityVersion: 1 }),
      afterState: expect.objectContaining({ verificationStatus: "verified", authorityVersion: 2 }),
      evidenceReference: "evidence://malpractice/1",
      evidenceDocumentId: null,
    }) });
    expect(JSON.stringify(authorityEventCreate.mock.calls)).not.toContain("rawPolicyContent");
  });

  it("records both credential and malpractice baselines for public contractor enrollment", async () => {
    const enrollmentCredential = credential({ id: "credential-enrollment", evidenceDocumentId: null, evidenceReference: "evidence://license/enrollment" });
    providerCreate.mockResolvedValue(provider({
      id: "provider-enrollment",
      engagementType: "independent_contractor",
      credentials: [enrollmentCredential],
      malpracticeEvidenceReference: "evidence://malpractice/enrollment",
    }));

    await createGridContractorEnrollment({
      organizationSlug: "example-clinic",
      fullName: "Example Applicant",
      email: "applicant@example.test",
      phone: "2125550199",
      password: "Synthetic!Password123",
      providerType: "Registered Nurse",
      credential: "RN",
      specialty: "Outpatient care",
      licenseType: "STATE_LICENSE",
      licenseNumber: "SYNTH-LICENSE-002",
      licenseState: "NY",
      licenseExpiration: "2027-08-29T00:00:00.000Z",
      licenseEvidenceReference: "evidence://license/enrollment",
      malpracticeCarrier: "Synthetic Coverage Company",
      malpracticePolicyNumber: "SYNTH-POLICY-002",
      malpracticeExpiration: "2027-08-29T00:00:00.000Z",
      malpracticeCoverageAmountCents: 100_000_000,
      malpracticeEvidenceReference: "evidence://malpractice/enrollment",
      certifications: [],
      servicesOffered: ["Outpatient support"],
      experienceLevel: "Experienced",
      bio: "Synthetic enrollment profile used only for repository behavior testing.",
      serviceArea: "New York",
      travelRadiusMiles: 20,
      mobileServiceAllowed: true,
      chairRentalAllowed: false,
      partnerLocationAllowed: false,
      atHomeAllowed: false,
      onCallNow: false,
      availability: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00", locationType: "mobile" }],
    });

    const events = authorityEventCreate.mock.calls.map(([call]) => call.data);
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({ authorityKind: "credential", authorityRecordId: "credential-enrollment", authorityVersion: 1, action: "grid.contractor_credential_created" }),
      expect.objectContaining({ authorityKind: "malpractice", authorityRecordId: "provider-enrollment", authorityVersion: 1, action: "grid.contractor_malpractice_created", evidenceReference: "evidence://malpractice/enrollment" }),
    ]));
    expect(JSON.stringify(events)).not.toContain("Synthetic!Password123");
  });

  it("records both credential and malpractice baselines for operator-created Grid providers", async () => {
    const createdCredential = credential({ id: "credential-grid-created", evidenceDocumentId: null, evidenceReference: null });
    providerCreate.mockResolvedValue(provider({ id: "provider-grid-created", credentials: [createdCredential] }));

    await createGridProvider(session, {
      displayName: "Example Provider",
      legalName: "Example Provider",
      providerType: "Registered Nurse",
      credential: "RN",
      specialty: "Outpatient care",
      licenseType: "STATE_LICENSE",
      licenseNumber: "SYNTH-LICENSE-003",
      licenseState: "NY",
      licenseExpiration: "2027-08-29T00:00:00.000Z",
      malpracticeCarrier: "Synthetic Coverage Company",
      malpracticePolicyNumber: "SYNTH-POLICY-003",
      malpracticeExpiration: "2027-08-29T00:00:00.000Z",
      certifications: [],
      servicesOffered: ["Outpatient support"],
      experienceLevel: "Experienced",
      bio: "Synthetic operator-created profile used for repository behavior testing.",
      serviceLocations: ["New York"],
      mobileServiceAllowed: true,
      chairRentalAllowed: false,
      atHomeAllowed: false,
      travelRadiusMiles: 20,
    });

    const events = authorityEventCreate.mock.calls.map(([call]) => call.data);
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({ authorityKind: "credential", authorityRecordId: "credential-grid-created", authorityVersion: 1, action: "grid.provider_credential_created" }),
      expect.objectContaining({ authorityKind: "malpractice", authorityRecordId: "provider-grid-created", authorityVersion: 1, action: "grid.provider_malpractice_created" }),
    ]));
  });
});
