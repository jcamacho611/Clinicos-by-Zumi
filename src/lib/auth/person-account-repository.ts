import "server-only";

import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ACCOUNT_SESSION_TTL_SECONDS } from "@/lib/auth/account-session";
import type { PersonAccountSignupInput } from "@/lib/auth/person-account-signup";

/**
 * Free entry, written against the canonical identity substrate.
 *
 * Person is the lifelong identity; Account proves authentication and nothing else.
 * Both are created in ONE transaction together with the credential, the first session
 * and the audit event, so a partial failure can never leave a Person with no way to
 * sign in, or an Account with no Person behind it. That fragmentation is exactly the
 * defect the identity audit found in the older creation paths.
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

export async function createFreePersonAccount(
  input: PersonAccountSignupInput,
  context: { ipAddress?: string; userAgent?: string } = {},
): Promise<CreatedPersonAccount> {
  // Cost 12 matches the existing credential store; the hash is computed outside the
  // transaction so a slow KDF never holds a database transaction open.
  const passwordHash = await hash(input.password, 12);
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + ACCOUNT_SESSION_TTL_SECONDS * 1_000);

  try {
    return await db.$transaction(async (tx) => {
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

      await tx.accountEvent.create({
        data: {
          accountId: account.id,
          eventType: "account_created",
          sourceType: "free_entry",
          // No password, no token, no request body — an audit trail records that this
          // happened, never the secret that made it possible.
          metadata: { hasSession: true },
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
