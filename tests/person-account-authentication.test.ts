import { beforeEach, describe, expect, it, vi } from "vitest";

const accountFindUnique = vi.fn();
const accountSessionFindUnique = vi.fn();
const accountSessionCreate = vi.fn();
const accountSessionUpdateMany = vi.fn();
const accountCredentialUpdate = vi.fn();
const accountEventCreate = vi.fn();
const transaction = vi.fn();
const compare = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    account: { findUnique: (...args: unknown[]) => accountFindUnique(...args) },
    accountSession: {
      findUnique: (...args: unknown[]) => accountSessionFindUnique(...args),
      create: (...args: unknown[]) => accountSessionCreate(...args),
      updateMany: (...args: unknown[]) => accountSessionUpdateMany(...args),
    },
    accountCredential: { update: (...args: unknown[]) => accountCredentialUpdate(...args) },
    accountEvent: { create: (...args: unknown[]) => accountEventCreate(...args) },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

vi.mock("bcryptjs", () => ({
  compare: (...args: unknown[]) => compare(...args),
  hash: vi.fn(),
}));

import {
  authenticatePersonAccount,
  resolvePersonAccountSessionById,
} from "@/lib/auth/person-account-repository";

const activeAccount = {
  id: "account-1",
  personId: "person-1",
  primaryEmail: "member@example.test",
  displayName: "Member Example",
  status: "active",
  credential: {
    id: "credential-1",
    passwordHash: "hash",
    failedAttempts: 0,
    lockedUntil: null,
  },
  person: { id: "person-1", status: "active" },
};

describe("person-account authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accountFindUnique.mockResolvedValue(activeAccount);
    accountCredentialUpdate.mockResolvedValue({});
    accountSessionCreate.mockResolvedValue({});
    accountSessionUpdateMany.mockResolvedValue({ count: 1 });
    accountEventCreate.mockResolvedValue({});
    transaction.mockResolvedValue([]);
    compare.mockResolvedValue(true);
  });

  it("creates a person session without organization or professional authority", async () => {
    const session = await authenticatePersonAccount(
      "Member@Example.Test",
      "a-long-enough-passphrase",
      { ipAddress: "203.0.113.20", userAgent: "auth-test" },
    );

    expect(session).toMatchObject({
      accountId: "account-1",
      personId: "person-1",
      email: "member@example.test",
      displayName: "Member Example",
    });
    expect(session).not.toHaveProperty("organizationId");
    expect(session).not.toHaveProperty("role");
    expect(accountSessionCreate).toHaveBeenCalledOnce();
    expect(accountEventCreate).toHaveBeenCalledOnce();
  });

  it("fails closed and records a bounded failed attempt for a bad password", async () => {
    compare.mockResolvedValue(false);

    await expect(authenticatePersonAccount("member@example.test", "wrong-password-value"))
      .resolves.toBeNull();
    expect(accountCredentialUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { accountId: "account-1" },
      data: expect.objectContaining({ failedAttempts: 1 }),
    }));
    expect(accountSessionCreate).not.toHaveBeenCalled();
  });

  it("re-reads active Account and Person truth before accepting a cookie session", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    accountSessionFindUnique.mockResolvedValue({
      id: "session-1",
      accountId: "account-1",
      expiresAt,
      revokedAt: null,
      lastSeenAt: new Date(),
      account: activeAccount,
    });

    const session = await resolvePersonAccountSessionById("session-1");
    expect(session).toMatchObject({ sessionId: "session-1", personId: "person-1" });
    expect(session?.expiresAt).toBe(Math.floor(expiresAt.getTime() / 1_000));
  });

  it.each([
    { revokedAt: new Date(), expiresAt: new Date(Date.now() + 60_000), accountStatus: "active", personStatus: "active" },
    { revokedAt: null, expiresAt: new Date(Date.now() - 1), accountStatus: "active", personStatus: "active" },
    { revokedAt: null, expiresAt: new Date(Date.now() + 60_000), accountStatus: "disabled", personStatus: "active" },
    { revokedAt: null, expiresAt: new Date(Date.now() + 60_000), accountStatus: "active", personStatus: "inactive" },
  ])("rejects revoked, expired, or inactive session truth", async ({ revokedAt, expiresAt, accountStatus, personStatus }) => {
    accountSessionFindUnique.mockResolvedValue({
      id: "session-1",
      accountId: "account-1",
      expiresAt,
      revokedAt,
      lastSeenAt: new Date(),
      account: {
        ...activeAccount,
        status: accountStatus,
        person: { ...activeAccount.person, status: personStatus },
      },
    });
    await expect(resolvePersonAccountSessionById("session-1")).resolves.toBeNull();
  });
});
