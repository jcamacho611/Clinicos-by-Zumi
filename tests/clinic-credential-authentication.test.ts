import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const userFindUnique = vi.fn();
const userUpdate = vi.fn();
const authCredentialUpdate = vi.fn();
const authCredentialUpdateMany = vi.fn();
const transaction = vi.fn();
const compare = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => userFindUnique(...args),
      update: (...args: unknown[]) => userUpdate(...args),
    },
    authCredential: {
      update: (...args: unknown[]) => authCredentialUpdate(...args),
      updateMany: (...args: unknown[]) => authCredentialUpdateMany(...args),
    },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

vi.mock("bcryptjs", () => ({
  compare: (...args: unknown[]) => compare(...args),
}));

import { authenticateCredentials } from "@/lib/auth/credentials";

const activeClinicUser = {
  id: "clinic-user-1",
  organizationId: "clinic-org-1",
  email: "operator@example.test",
  name: "Clinic Operator",
  roleKey: "clinic_owner",
  status: "active",
  organization: {
    id: "clinic-org-1",
    name: "Example Clinic",
    slug: "example-clinic",
    status: "active",
  },
  authCredential: {
    id: "credential-1",
    passwordHash: "stored-hash",
    failedAttempts: 0,
    lockedUntil: null,
  },
};

describe("legacy clinic credential lockout", () => {
  let persistedFailedAttempts: number;
  let persistedLockedUntil: Date | null;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("DATABASE_URL", "postgresql://test.invalid/klinikos");
    vi.stubEnv("DEMO_AUTH", "false");
    persistedFailedAttempts = 0;
    persistedLockedUntil = null;
    userFindUnique.mockResolvedValue(activeClinicUser);
    compare.mockResolvedValue(false);
    authCredentialUpdate.mockImplementation(async (args: {
      data: { failedAttempts?: number | { increment: number } };
    }) => {
      const mutation = args.data.failedAttempts;
      if (typeof mutation === "number") persistedFailedAttempts = mutation;
      if (typeof mutation === "object") persistedFailedAttempts += mutation.increment;
      return { failedAttempts: persistedFailedAttempts };
    });
    authCredentialUpdateMany.mockImplementation(async (args: {
      where: { OR?: Array<{ lockedUntil: null | { lte: Date } }> };
      data: { lockedUntil: Date };
    }) => {
      const currentLock = persistedLockedUntil;
      const eligible = currentLock === null
        || (args.where.OR ?? []).some((condition) => (
          condition.lockedUntil !== null
          && currentLock <= condition.lockedUntil.lte
        ));
      if (!eligible) return { count: 0 };
      persistedLockedUntil = args.data.lockedUntil;
      return { count: 1 };
    });
    userUpdate.mockResolvedValue({});
    transaction.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("atomically records every concurrent bad password and establishes the threshold lock", async () => {
    await Promise.all(Array.from({ length: 5 }, () => authenticateCredentials(
      "operator@example.test",
      "wrong-password-value",
    )));

    expect(persistedFailedAttempts).toBe(5);
    expect(authCredentialUpdate).toHaveBeenCalledTimes(5);
    for (const [call] of authCredentialUpdate.mock.calls) {
      expect(call).toEqual(expect.objectContaining({
        where: { userId: "clinic-user-1" },
        data: { failedAttempts: { increment: 1 } },
      }));
    }
    expect(authCredentialUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        userId: "clinic-user-1",
        failedAttempts: { gte: 5 },
        OR: [{ lockedUntil: null }, { lockedUntil: { lte: expect.any(Date) } }],
      }),
      data: { lockedUntil: expect.any(Date) },
    }));
    expect(persistedLockedUntil).toBeInstanceOf(Date);
  });

  it("does not extend an already-active fresh lock when another in-flight failure returns", async () => {
    persistedFailedAttempts = 4;

    await authenticateCredentials("operator@example.test", "wrong-password-value");
    const firstLock = persistedLockedUntil;
    expect(firstLock).toBeInstanceOf(Date);

    await authenticateCredentials("operator@example.test", "wrong-password-value");

    expect(persistedFailedAttempts).toBe(6);
    expect(authCredentialUpdateMany).toHaveBeenCalledTimes(2);
    expect(persistedLockedUntil).toBe(firstLock);
  });
});
