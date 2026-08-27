import "server-only";

import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { findAccountAuthenticationRecordByEmail, resolveAccountIdentity } from "@/lib/auth/account-repository";
import type { ClinicAccountIdentity, MemberIdentity } from "@/lib/auth/account-types";

const LOCK_AFTER_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function authenticateAccountCredentials(emailInput: string, password: string): Promise<MemberIdentity | ClinicAccountIdentity | null> {
  if (!process.env.DATABASE_URL) return null;
  const account = await findAccountAuthenticationRecordByEmail(emailInput);
  if (!account?.credential || account.status !== "active" || account.person.status !== "active") return null;

  // Backfilled clinic credentials are compatibility evidence only until explicit account-auth cutover.
  if (account.legacyLinks.length > 0) return null;

  const credential = account.credential;
  const now = new Date();
  if (credential.lockedUntil && credential.lockedUntil > now) return null;
  const valid = await compare(password, credential.passwordHash);
  if (!valid) {
    const failedAttempts = credential.failedAttempts + 1;
    await db.accountCredential.update({
      where: { accountId: account.id },
      data: {
        failedAttempts,
        lockedUntil: failedAttempts >= LOCK_AFTER_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null,
      },
    });
    return null;
  }
  await db.accountCredential.update({ where: { accountId: account.id }, data: { failedAttempts: 0, lockedUntil: null } });
  return resolveAccountIdentity(account);
}
