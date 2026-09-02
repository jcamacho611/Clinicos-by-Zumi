import "server-only";

import { randomUUID } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ACCOUNT_SESSION_TTL_SECONDS } from "@/lib/auth/account-session-config";
import type { PersonAccountSession } from "@/lib/auth/account-types";
import type { PersonAccountSignupInput } from "@/lib/auth/person-account-signup";
import type { MemberSignupAcceptanceEvidence } from "@/lib/legal/member-signup-acceptance";
import { recordMemberSignupLegalEvidence } from "@/lib/legal/member-signup-legal-evidence";

type PersonAccountIdentityInput = Pick<
  PersonAccountSignupInput,
  "email" | "displayName" | "password"
>;

/**
 * Free entry, written against the canonical identity substrate.
 *
 * Person is the lifelong identity; Account proves authentication and nothing else.
 * Both are created in ONE transaction together with the credential, the first session,
 * the baseline legal evidence and the audit event, so a partial failure can never leave
 * a Person with no way to sign in, an Account with no Person behind it, or an Account
 * whose required baseline acceptance evidence failed to persist.
 *
 * This grants no organization membership, no professional or clinical authority, no
 * Grid eligibility and no patient access. Those are separate decisions with separate
 * evidence, and nothing here may stand in for them.
 */

export class PersonAccountEmailTakenError extends Error {
  constructor() {
    super("An account already exists for that email address.");
    this.name = "PersonAccountEmailTakenError";
  }
}

export type CreatedPersonAccount = {
  accountId: string;
  personId: string;
  sessionId: string;
  expiresAt: Date;
};

const LOCK_AFTER_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function createFreePersonAccount(
  input: PersonAccountIdentityInput,
  context: { ipAddress?: string; userAgent?: string } = {},
  legalAcceptance: MemberSignupAcceptanceEvidence,
): Promise<CreatedPersonAccount> {
  // Cost 12 matches the existing credential store; the hash is computed outside the
  // transaction so a slow KDF never holds a database transaction open.
  const passwordHash = await hash(input.password, 12);
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + ACCOUNT_SESSION_TTL_SECONDS * 1_000);

  try {
    return await db.$transaction(async (tx) => {
      // Legacy clinic identities stay on the clinic-authentication rail. Free signup
      // must not silently duplicate an email into a second Person with less context.
      const legacy = await tx.user.findUnique({ where: { email: input.email }, select: { id: true } });
      if (legacy) throw new PersonAccountEmailTakenError();

      const existingPerson = await tx.person.findFirst({
        where: { primaryEmail: { equals: input.email, mode: "insensitive" } },
        select: { id: true },
      });
      if (existingPerson) throw new PersonAccountEmailTakenError();

      const person = await tx.person.create({
        data: {
          displayName: input.displayName,
          primaryEmail: input.email,
          status: "active",
          sourceType: "free_entry",
        },
        select: { id: true },
      });

      const account = await tx.account.create({
        data: {
          personId: person.id,
          primaryEmail: input.email,
          displayName: input.displayName,
          status: "active",
          credential: { create: { passwordHash } },
          sessions: {
            create: {
              id: sessionId,
              expiresAt,
              ipAddress: context.ipAddress,
              userAgent: context.userAgent,
            },
          },
        },
        select: { id: true },
      });

      await recordMemberSignupLegalEvidence(tx, {
        accountId: account.id,
        personId: person.id,
        email: input.email,
        sessionId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        legalAcceptance,
      });

      await tx.accountEvent.create({
        data: {
          accountId: account.id,
          eventType: "account_created",
          sourceType: "free_entry",
          // No password, no token, no request body — an audit trail records that this
          // happened, never the secret that made it possible.
          metadata: { hasSession: true, baselineLegalEvidenceRecorded: true },
        },
      });

      return { accountId: account.id, personId: person.id, sessionId, expiresAt };
    });
  } catch (error) {
    // Account.primaryEmail is unique. A duplicate is an ordinary outcome of two people
    // racing the same address, not a server fault.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new PersonAccountEmailTakenError();
    }
    throw error;
  }
}

export async function authenticatePersonAccount(
  emailInput: string,
  password: string,
  context: { ipAddress?: string; userAgent?: string } = {},
): Promise<PersonAccountSession | null> {
  const email = emailInput.trim().toLowerCase();
  const account = await db.account.findUnique({
    where: { primaryEmail: email },
    include: { credential: true, person: true },
  });

  if (!account || account.status !== "active" || account.person.status !== "active" || !account.credential) return null;
  const credential = account.credential;
  if (credential.lockedUntil && credential.lockedUntil > new Date()) return null;

  const valid = await compare(password, credential.passwordHash);
  if (!valid) {
    // Prisma's atomic increment is evaluated by PostgreSQL against the persisted
    // value. A read/modify/write based on `credential.failedAttempts` loses failures
    // when wrong-password requests arrive together.
    const failedCredential = await db.accountCredential.update({
      where: { accountId: account.id },
      data: { failedAttempts: { increment: 1 } },
      select: { failedAttempts: true },
    });

    if (failedCredential.failedAttempts >= LOCK_AFTER_ATTEMPTS) {
      const now = new Date();
      // Only the first concurrent request that reaches the threshold establishes
      // the active lock. A later request may renew an expired lock, but cannot keep
      // extending a lock another request just created.
      await db.accountCredential.updateMany({
        where: {
          accountId: account.id,
          failedAttempts: { gte: LOCK_AFTER_ATTEMPTS },
          OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
        },
        data: { lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60 * 1_000) },
      });
    }
    return null;
  }

  const sessionId = randomUUID();
  const expiresAtDate = new Date(Date.now() + ACCOUNT_SESSION_TTL_SECONDS * 1_000);
  await db.$transaction([
    db.accountCredential.update({
      where: { accountId: account.id },
      data: { failedAttempts: 0, lockedUntil: null },
    }),
    db.accountSession.create({
      data: {
        id: sessionId,
        accountId: account.id,
        expiresAt: expiresAtDate,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    }),
    db.accountEvent.create({
      data: {
        accountId: account.id,
        eventType: "account_signed_in",
        sourceType: "password",
        metadata: { sessionCreated: true },
      },
    }),
  ]);

  return {
    sessionId,
    accountId: account.id,
    personId: account.personId,
    email: account.primaryEmail,
    displayName: account.displayName,
    expiresAt: Math.floor(expiresAtDate.getTime() / 1_000),
  };
}

export async function resolvePersonAccountSessionById(sessionId: string): Promise<PersonAccountSession | null> {
  try {
    const persisted = await db.accountSession.findUnique({
      where: { id: sessionId },
      include: { account: { include: { person: true } } },
    });
    if (
      !persisted
      || persisted.id !== sessionId
      || persisted.accountId !== persisted.account.id
      || persisted.revokedAt
      || persisted.expiresAt <= new Date()
      || persisted.account.status !== "active"
      || persisted.account.person.status !== "active"
      || persisted.account.personId !== persisted.account.person.id
    ) return null;

    if (persisted.lastSeenAt < new Date(Date.now() - 15 * 60 * 1_000)) {
      await db.accountSession.updateMany({
        where: { id: persisted.id, accountId: persisted.accountId, revokedAt: null },
        data: { lastSeenAt: new Date() },
      });
    }

    return {
      sessionId: persisted.id,
      accountId: persisted.account.id,
      personId: persisted.account.personId,
      email: persisted.account.primaryEmail,
      displayName: persisted.account.displayName,
      expiresAt: Math.floor(persisted.expiresAt.getTime() / 1_000),
    };
  } catch {
    return null;
  }
}

export async function revokePersonAccountSessionById(sessionId: string, accountId: string) {
  await db.accountSession.updateMany({
    where: { id: sessionId, accountId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
