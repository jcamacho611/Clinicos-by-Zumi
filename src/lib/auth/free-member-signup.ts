import "server-only";

import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import type { MemberAccountSession, MemberIdentity } from "@/lib/auth/account-types";
import { ACCOUNT_SESSION_TTL_SECONDS } from "@/lib/auth/account-token";
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
  name: z.string().trim().min(2, "Enter your name.").max(140),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: strongPasswordSchema,
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: "Website Terms must be accepted." }) }),
  acceptedPrivacy: z.literal(true, { errorMap: () => ({ message: "Privacy Policy acknowledgment is required." }) }),
});

export type FreeMemberSignupInput = z.infer<typeof freeMemberSignupSchema>;

export type MemberSignupAcceptanceProof = {
  acceptanceId: string;
  documentKey: string;
  documentVersion: string;
  documentSha256: string;
};

export class FreeMemberSignupError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export async function createFreeMemberAccount(
  rawInput: unknown,
  acceptance: MemberSignupAcceptanceProof,
  metadata: { ipAddress?: string; userAgent?: string } = {},
) {
  const input = freeMemberSignupSchema.parse(rawInput);
  if (!acceptance.acceptanceId || !acceptance.documentKey || !acceptance.documentVersion || !acceptance.documentSha256) {
    throw new FreeMemberSignupError("A verified baseline agreement acceptance is required before account creation.", 403);
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

      // Legacy staff credentials remain authoritative during migration. Never create a
      // second Person merely because the incoming email differs only by case.
      const legacyUser = await tx.user.findFirst({
        where: { email: { equals: input.email, mode: "insensitive" } },
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
          sourceReference: acceptance.acceptanceId,
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
        acceptanceId: acceptance.acceptanceId,
        documentKey: acceptance.documentKey,
        documentVersion: acceptance.documentVersion,
        documentSha256: acceptance.documentSha256,
        accountId: account.id,
        personId: person.id,
      }, tx);

      await tx.accountEvent.create({
        data: {
          accountId: account.id,
          eventType: "account.created",
          sourceType: "self_signup",
          sourceReference: acceptance.acceptanceId,
          metadata: {
            agreementKey: acceptance.documentKey,
            agreementVersion: acceptance.documentVersion,
            emailVerified: false,
            authorityGranted: false,
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
