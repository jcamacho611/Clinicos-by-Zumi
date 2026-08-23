import "server-only";

import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import type { MemberAccountSession, MemberIdentity } from "@/lib/auth/account-types";
import { ACCOUNT_SESSION_TTL_SECONDS } from "@/lib/auth/account-token";
import type { AcceptedEntryProof } from "@/lib/legal/entry-access";
import { bindAcceptanceToAccountIdentity } from "@/lib/legal/account-acceptance-binding";

const strongPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(128)
  .refine((value) => /[a-z]/.test(value), "Password needs a lowercase letter.")
  .refine((value) => /[A-Z]/.test(value), "Password needs an uppercase letter.")
  .refine((value) => /\d/.test(value), "Password needs a number.")
  .refine((value) => /[^A-Za-z0-9]/.test(value), "Password needs a symbol.");

export const freeMemberSignupSchema = z.object({
  name: z.string().trim().min(2).max(140),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: strongPasswordSchema,
});

export type FreeMemberSignupInput = z.infer<typeof freeMemberSignupSchema>;

export class FreeMemberSignupError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export async function createFreeMemberAccount(
  rawInput: unknown,
  entryProof: AcceptedEntryProof,
  metadata: { ipAddress?: string; userAgent?: string } = {},
) {
  const input = freeMemberSignupSchema.parse(rawInput);
  if (!entryProof.claims.acceptanceId) {
    throw new FreeMemberSignupError("Protected-entry acceptance is required before account creation.", 403);
  }

  const passwordHash = await hash(input.password, 12);
  const sessionId = randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + ACCOUNT_SESSION_TTL_SECONDS;

  try {
    return await db.$transaction(async (tx) => {
      const existingAccount = await tx.account.findUnique({
        where: { primaryEmail: input.email },
        select: { id: true },
      });
      if (existingAccount) {
        throw new FreeMemberSignupError("An account already exists for this email. Sign in instead.", 409);
      }

      // During migration, an old organization-bound User may exist before its Account
      // backfill is available in the current runtime. Match case-insensitively so a
      // legacy address such as Person@Example.com cannot be duplicated by a normalized
      // person@example.com signup and create a second Person identity.
      const legacyUser = await tx.user.findFirst({
        where: {
          email: {
            equals: input.email,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });
      if (legacyUser) {
        throw new FreeMemberSignupError("An existing Klinikos account uses this email. Sign in instead.", 409);
      }

      const person = await tx.person.create({
        data: {
          displayName: input.name,
          primaryEmail: input.email,
          status: "active",
          sourceType: "self_signup",
          sourceReference: entryProof.acceptance.id,
        },
        select: { id: true },
      });

      const account = await tx.account.create({
        data: {
          personId: person.id,
          primaryEmail: input.email,
          displayName: input.name,
          status: "active",
        },
        select: { id: true },
      });

      await tx.accountCredential.create({
        data: {
          accountId: account.id,
          passwordHash,
          mustReset: false,
          failedAttempts: 0,
        },
      });

      await bindAcceptanceToAccountIdentity({
        acceptanceId: entryProof.acceptance.id,
        documentKey: entryProof.claims.documentKey,
        documentVersion: entryProof.claims.documentVersion,
        documentSha256: entryProof.claims.documentSha256,
        accountId: account.id,
        personId: person.id,
      }, tx);

      await tx.accountEvent.create({
        data: {
          accountId: account.id,
          eventType: "account.created",
          sourceType: "protected_entry_signup",
          sourceReference: entryProof.acceptance.id,
          metadata: {
            entryAgreementKey: entryProof.claims.documentKey,
            entryAgreementVersion: entryProof.claims.documentVersion,
          },
        },
      });

      await tx.accountSession.create({
        data: {
          id: sessionId,
          accountId: account.id,
          expiresAt: new Date(expiresAt * 1000),
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
      });

      const identity: MemberIdentity = {
        accountId: account.id,
        personId: person.id,
        email: input.email,
        name: input.name,
        source: "account",
      };
      const session: MemberAccountSession = {
        kind: "member",
        sessionId,
        accountId: account.id,
        personId: person.id,
        email: input.email,
        name: input.name,
        demo: false,
        expiresAt,
      };

      return { identity, session };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15_000 });
  } catch (error) {
    if (error instanceof FreeMemberSignupError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new FreeMemberSignupError("An account already exists for this email. Sign in instead.", 409);
    }
    throw error;
  }
}
