import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createFreePersonAccount,
  PersonAccountEmailTakenError,
  resolvePersonAccountSessionById,
} from "@/lib/auth/person-account-repository";
import { db } from "@/lib/db";
import type { MemberSignupAcceptanceEvidence } from "@/lib/legal/member-signup-acceptance";

/**
 * Free entry, against a real database.
 *
 * The contract test covers the shape of the request. This covers what actually lands in
 * PostgreSQL, because the parts most worth guarding are the ones a type signature cannot
 * express: that the credential is hashed, that the secret is never persisted anywhere on
 * the record, that the account confers no membership or authority, that exact legal
 * evidence is bound to the same Person/Account, and that a failed attempt leaves no
 * orphan Person behind.
 *
 * That last one is the reason this is transactional. The identity audit found older
 * creation paths that could produce a legacy user with no durable Person anchor; free
 * entry must not become another.
 */

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function buildTestLegalAcceptance(): MemberSignupAcceptanceEvidence {
  const termsSnapshot = "TEST ONLY Website Terms acceptance source";
  const privacySnapshot = "TEST ONLY Privacy Policy acknowledgment source";

  return {
    documents: [
      {
        documentKey: "website_terms",
        documentVersion: "2026-08-10.1",
        title: "Website Terms of Use",
        effectiveDate: "2026-08-10",
        kind: "agreement",
        documentSnapshot: termsSnapshot,
        documentSha256: sha256(termsSnapshot),
        acknowledgments: ["TEST ONLY acceptance"],
      },
      {
        documentKey: "privacy_policy",
        documentVersion: "2026-08-10.1",
        title: "Privacy Policy",
        effectiveDate: "2026-08-10",
        kind: "notice",
        documentSnapshot: privacySnapshot,
        documentSha256: sha256(privacySnapshot),
        acknowledgments: ["TEST ONLY acknowledgment"],
      },
    ],
  };
}

describe("free person-account signup against PostgreSQL", () => {
  it("creates one Person and one Account, records exact legal evidence, and grants no authority", async () => {
    const suffix = String(Date.now());
    const email = `free.entry.${suffix}@example.com`;
    const password = "a-long-enough-passphrase";
    const legalAcceptance = buildTestLegalAcceptance();

    const created = await createFreePersonAccount(
      { email, displayName: "Jane Camacho", password },
      { ipAddress: "203.0.113.9", userAgent: "signup-contract-test" },
      legalAcceptance,
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

    const legalRows = await db.$queryRaw<
      Array<{
        accountId: string | null;
        personId: string | null;
        documentKey: string;
        documentVersion: string;
        documentSha256: string | null;
        authorityConfirmed: boolean;
        electronicSignatureConsentedAt: Date | null;
        acknowledgedAt: Date | null;
        signedAt: Date | null;
        signatureMethod: string | null;
        source: string;
      }>
    >`
      SELECT "accountId", "personId", "documentKey", "documentVersion",
             "documentSha256", "authorityConfirmed", "electronicSignatureConsentedAt",
             "acknowledgedAt", "signedAt", "signatureMethod", "source"
      FROM "access_gate_acceptances"
      WHERE "accountId" = ${created.accountId}
      ORDER BY "documentKey" ASC
    `;

    expect(legalRows).toHaveLength(2);
    expect(legalRows).toEqual(
      expect.arrayContaining(
        legalAcceptance.documents.map((document) =>
          expect.objectContaining({
            accountId: created.accountId,
            personId: created.personId,
            documentKey: document.documentKey,
            documentVersion: document.documentVersion,
            documentSha256: document.documentSha256,
            authorityConfirmed: false,
            source: "member-signup",
          }),
        ),
      ),
    );
    for (const row of legalRows) {
      expect(row.electronicSignatureConsentedAt).toBeNull();
      expect(row.signedAt).toBeNull();
      expect(row.acknowledgedAt).toBeInstanceOf(Date);
      expect(row.signatureMethod).toBe(
        row.documentKey === "website_terms" ? "clickwrap" : "acknowledgment",
      );
    }

    // A created cookie claim is not enough. The runtime re-reads this durable session,
    // Account, and Person truth on every request before it projects the member surface.
    await expect(resolvePersonAccountSessionById(created.sessionId)).resolves.toMatchObject({
      sessionId: created.sessionId,
      accountId: created.accountId,
      personId: created.personId,
      email,
    });

    // Authentication only. An account is not an organization membership or authority.
    expect(await db.organizationMembership.count({ where: { personId: created.personId } })).toBe(0);
  });

  it("rejects a duplicate email without leaving an orphan Person", async () => {
    const suffix = String(Date.now());
    const email = `duplicate.${suffix}@example.com`;
    const legalAcceptance = buildTestLegalAcceptance();
    await createFreePersonAccount(
      { email, displayName: "First", password: "a-long-enough-passphrase" },
      {},
      legalAcceptance,
    );

    const before = await db.person.count();
    await expect(
      createFreePersonAccount(
        { email, displayName: "Second", password: "another-long-passphrase" },
        {},
        legalAcceptance,
      ),
    ).rejects.toBeInstanceOf(PersonAccountEmailTakenError);

    // The Person is created before the Account inside the transaction, so a unique
    // violation on the account must roll the Person back with it.
    expect(await db.person.count()).toBe(before);
  });

  it("rolls Person and Account back when required legal evidence fails after identity creation", async () => {
    const suffix = String(Date.now());
    const email = `legal.rollback.${suffix}@example.com`;
    const legalAcceptance = buildTestLegalAcceptance();
    const incompleteAcceptance: MemberSignupAcceptanceEvidence = {
      documents: [legalAcceptance.documents[0]],
    };

    await expect(
      createFreePersonAccount(
        { email, displayName: "Rollback Person", password: "a-long-enough-passphrase" },
        {},
        incompleteAcceptance,
      ),
    ).rejects.toThrow(/exactly the Website Terms and Privacy Policy/i);

    expect(await db.person.findFirst({ where: { primaryEmail: email } })).toBeNull();
    expect(await db.account.findUnique({ where: { primaryEmail: email } })).toBeNull();
  });
});
