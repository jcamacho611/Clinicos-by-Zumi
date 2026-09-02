import { describe, expect, it } from "vitest";
import {
  createFreePersonAccount,
  PersonAccountEmailTakenError,
  resolvePersonAccountSessionById,
} from "@/lib/auth/person-account-repository";
import { db } from "@/lib/db";

/**
 * Free entry, against a real database.
 *
 * The contract test covers the shape of the request. This covers what actually lands in
 * PostgreSQL, because the parts most worth guarding are the ones a type signature cannot
 * express: that the credential is hashed, that the secret is never persisted anywhere on
 * the record, that the account confers no membership or authority, and that a failed
 * attempt leaves no orphan Person behind.
 *
 * That last one is the reason this is transactional. The identity audit found older
 * creation paths that could produce a legacy user with no durable Person anchor; free
 * entry must not become another.
 */
describe("free person-account signup against PostgreSQL", () => {
  it("creates one Person and one Account, and grants no authority", async () => {
    const email = `free.entry.${Date.now()}@example.com`;
    const password = "a-long-enough-passphrase";

    const created = await createFreePersonAccount(
      { email, displayName: "Jane Camacho", password },
      { ipAddress: "203.0.113.9", userAgent: "signup-contract-test" },
    );

    const person = await db.person.findUnique({
      where: { id: created.personId },
      select: { primaryEmail: true, sourceType: true },
    });
    const account = await db.account.findUnique({
      where: { id: created.accountId },
      select: {
        primaryEmail: true,
        personId: true,
        credential: { select: { passwordHash: true } },
        sessions: { select: { id: true } },
        events: { select: { eventType: true, metadata: true } },
      },
    });

    expect(person?.primaryEmail).toBe(email);
    expect(person?.sourceType).toBe("free_entry");
    expect(account?.personId).toBe(created.personId);

    // Hashed, and the secret appears nowhere on the stored record.
    expect(account?.credential?.passwordHash.startsWith("$2")).toBe(true);
    expect(JSON.stringify(account)).not.toContain(password);

    expect(account?.sessions).toHaveLength(1);
    expect(account?.events[0]?.eventType).toBe("account_created");
    expect(JSON.stringify(account?.events[0]?.metadata)).not.toContain(password);

    // A created cookie claim is not enough. The runtime re-reads this durable session,
    // Account, and Person truth on every request before it projects the member surface.
    await expect(resolvePersonAccountSessionById(created.sessionId)).resolves.toMatchObject({
      sessionId: created.sessionId,
      accountId: created.accountId,
      personId: created.personId,
      email,
    });

    // Authentication only. An account is not a membership.
    expect(await db.organizationMembership.count({ where: { personId: created.personId } })).toBe(0);
  });

  it("rejects a duplicate email without leaving an orphan Person", async () => {
    const email = `duplicate.${Date.now()}@example.com`;
    await createFreePersonAccount({ email, displayName: "First", password: "a-long-enough-passphrase" });

    const before = await db.person.count();
    await expect(
      createFreePersonAccount({ email, displayName: "Second", password: "another-long-passphrase" }),
    ).rejects.toBeInstanceOf(PersonAccountEmailTakenError);

    // The Person is created before the Account inside the transaction, so a unique
    // violation on the account must roll the Person back with it.
    expect(await db.person.count()).toBe(before);
  });
});
