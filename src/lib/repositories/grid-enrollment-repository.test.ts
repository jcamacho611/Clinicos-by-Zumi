import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  organizationFindUnique: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  membershipFindFirst: vi.fn(),
  providerCreate: vi.fn(),
  taskCreate: vi.fn(),
  auditCreate: vi.fn(),
  ensureRelationship: vi.fn(),
  hash: vi.fn(),
}));

const identity = vi.hoisted(() => {
  class IdentityRelationshipConflictError extends Error {}
  return { IdentityRelationshipConflictError };
});

const tx = {
  organization: { findUnique: (...args: unknown[]) => mocks.organizationFindUnique(...args) },
  user: {
    findUnique: (...args: unknown[]) => mocks.userFindUnique(...args),
    create: (...args: unknown[]) => mocks.userCreate(...args),
  },
  organizationMembership: { findFirst: (...args: unknown[]) => mocks.membershipFindFirst(...args) },
  provider: { create: (...args: unknown[]) => mocks.providerCreate(...args) },
  task: { create: (...args: unknown[]) => mocks.taskCreate(...args) },
  auditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
};

vi.mock("@/lib/db", () => ({
  db: { $transaction: (callback: (client: typeof tx) => unknown) => mocks.transaction(callback) },
}));

vi.mock("@/lib/identity/relationship-repository", () => ({
  ensureOrganizationRelationshipForLegacyUser: (...args: unknown[]) => mocks.ensureRelationship(...args),
  IdentityRelationshipConflictError: identity.IdentityRelationshipConflictError,
}));

vi.mock("bcryptjs", () => ({
  hash: (...args: unknown[]) => mocks.hash(...args),
}));

const { createIdentitySafeGridContractorEnrollment } = await import(
  "@/lib/repositories/grid-enrollment-repository"
);

function enrollment(overrides: Record<string, unknown> = {}) {
  return {
    organizationSlug: "luxe-medi",
    fullName: "Existing Grid User",
    email: "existing@example.test",
    phone: "2125550100",
    providerType: "Registered Nurse",
    credential: "RN",
    specialty: "Ambulatory care",
    licenseType: "STATE_LICENSE",
    licenseNumber: "RN12345",
    licenseState: "NY",
    licenseExpiration: "2027-08-27T00:00:00.000Z",
    licenseEvidenceReference: "primary-source-reference",
    malpracticeCarrier: "Example Carrier",
    malpracticePolicyNumber: "POLICY123",
    malpracticeExpiration: "2027-08-27T00:00:00.000Z",
    malpracticeCoverageAmountCents: 100_000_000,
    malpracticeEvidenceReference: "malpractice-reference",
    certifications: ["BLS"],
    servicesOffered: ["Nursing support"],
    experienceLevel: "Experienced",
    bio: "Experienced registered nurse applying for governed Grid opportunities.",
    serviceArea: "New York, NY",
    travelRadiusMiles: 20,
    mobileServiceAllowed: true,
    chairRentalAllowed: false,
    partnerLocationAllowed: true,
    atHomeAllowed: false,
    onCallNow: false,
    availability: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00", locationType: "clinic_location" }],
    ...overrides,
  };
}

const existingUser = {
  id: "user-existing",
  email: "existing@example.test",
  organizationId: "org-home",
  roleKey: "administrator",
  status: "active",
  name: "Existing Grid User",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => callback(tx));
  mocks.organizationFindUnique.mockResolvedValue({ id: "org-grid", demoMode: true, status: "active" });
  mocks.userFindUnique.mockResolvedValue(existingUser);
  mocks.membershipFindFirst.mockResolvedValue(null);
  mocks.userCreate.mockResolvedValue({
    id: "user-new",
    email: "new@example.test",
    organizationId: "org-grid",
    roleKey: "contractor",
    status: "pending_approval",
    name: "New Grid User",
  });
  mocks.providerCreate.mockResolvedValue({ id: "provider-1", displayName: "Existing Grid User", verificationStatus: "submitted" });
  mocks.taskCreate.mockResolvedValue({ id: "task-1" });
  mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  mocks.ensureRelationship.mockResolvedValue({ personId: "person-1", relationshipId: "relationship-1" });
  mocks.hash.mockResolvedValue("hashed-password");
});

describe("identity-safe Grid contractor enrollment", () => {
  it("reuses the exact authenticated account without creating or changing account authority", async () => {
    const result = await createIdentitySafeGridContractorEnrollment(enrollment(), {
      userId: "user-existing",
      email: "existing@example.test",
    });

    expect(mocks.userCreate).not.toHaveBeenCalled();
    expect(mocks.hash).not.toHaveBeenCalled();
    expect(mocks.providerCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        organizationId: "org-grid",
        userId: null,
        verificationStatus: "submitted",
        status: "pending_approval",
      }),
    }));
    expect(mocks.ensureRelationship).toHaveBeenCalledWith(expect.objectContaining({
      userId: "user-existing",
      organizationId: "org-grid",
      membershipType: "grid_contractor_applicant",
      status: "pending_approval",
      sourceReference: "provider-1",
    }), tx);
    expect(result).toMatchObject({
      providerId: "provider-1",
      status: "submitted",
      accountStatus: "active",
      accountReused: true,
    });
  });

  it("refuses to attach an existing email without a validated session identity", async () => {
    await expect(createIdentitySafeGridContractorEnrollment(enrollment(), null))
      .rejects.toMatchObject({ status: 409 });
    expect(mocks.providerCreate).not.toHaveBeenCalled();
    expect(mocks.ensureRelationship).not.toHaveBeenCalled();
  });

  it("refuses a signed-in identity that does not own the existing account", async () => {
    await expect(createIdentitySafeGridContractorEnrollment(enrollment(), {
      userId: "user-attacker",
      email: "existing@example.test",
    })).rejects.toMatchObject({ status: 409 });
    expect(mocks.providerCreate).not.toHaveBeenCalled();
  });

  it("fails closed when that account already has a Grid application relationship", async () => {
    mocks.membershipFindFirst.mockResolvedValue({ id: "existing-relationship" });
    await expect(createIdentitySafeGridContractorEnrollment(enrollment(), {
      userId: "user-existing",
      email: "existing@example.test",
    })).rejects.toMatchObject({ status: 409 });
    expect(mocks.providerCreate).not.toHaveBeenCalled();
  });

  it("requires a password when there is no existing account to reuse", async () => {
    mocks.userFindUnique.mockResolvedValue(null);
    await expect(createIdentitySafeGridContractorEnrollment(enrollment({ email: "new@example.test", fullName: "New Grid User" }), null))
      .rejects.toMatchObject({ status: 400 });
    expect(mocks.userCreate).not.toHaveBeenCalled();
    expect(mocks.hash).not.toHaveBeenCalled();
  });

  it("creates a pending contractor account only for a genuinely new email with a valid password", async () => {
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.providerCreate.mockResolvedValue({ id: "provider-new", displayName: "New Grid User", verificationStatus: "submitted" });

    const result = await createIdentitySafeGridContractorEnrollment(enrollment({
      email: "new@example.test",
      fullName: "New Grid User",
      password: "StrongPassword123!",
    }), null);

    expect(mocks.hash).toHaveBeenCalledWith("StrongPassword123!", 12);
    expect(mocks.userCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        organizationId: "org-grid",
        email: "new@example.test",
        roleKey: "contractor",
        status: "pending_approval",
        authCredential: { create: { passwordHash: "hashed-password" } },
      }),
    }));
    expect(mocks.providerCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: "user-new", status: "pending_approval" }),
    }));
    expect(mocks.ensureRelationship).toHaveBeenCalledWith(expect.objectContaining({
      userId: "user-new",
      organizationId: "org-grid",
      membershipType: "grid_contractor_applicant",
    }), tx);
    expect(result).toMatchObject({ providerId: "provider-new", accountStatus: "pending_approval", accountReused: false });
  });
});
