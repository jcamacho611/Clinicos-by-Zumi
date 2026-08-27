import "server-only";

import { randomUUID } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { normalizeClinicRole } from "@/lib/auth/rbac";
import {
  accountIdentityHasClinicContext,
  projectClinicSessionFromAccount,
  type AccountSession,
  type ClinicAccountIdentity,
  type MemberIdentity,
} from "@/lib/auth/account-types";
import {
  ACCOUNT_SESSION_COOKIE_NAME,
  ACCOUNT_SESSION_TTL_SECONDS,
  accountSessionCookieOptions,
  signAccountSessionToken,
  verifyAccountSessionToken,
} from "@/lib/auth/account-token";

interface SessionMetadata { ipAddress?: string; userAgent?: string }

export async function createAccountSession(identity: MemberIdentity | ClinicAccountIdentity, metadata: SessionMetadata = {}) {
  const base = {
    sessionId: randomUUID(), accountId: identity.accountId, personId: identity.personId,
    email: identity.email, name: identity.name, demo: false as const,
    expiresAt: Math.floor(Date.now() / 1000) + ACCOUNT_SESSION_TTL_SECONDS,
  };
  const session: AccountSession = accountIdentityHasClinicContext(identity)
    ? { kind: "clinic", ...base, legacyUserId: identity.legacyUserId, organizationId: identity.organizationId, organizationName: identity.organizationName, organizationSlug: identity.organizationSlug, role: identity.role }
    : { kind: "member", ...base };
  await db.accountSession.create({ data: { id: session.sessionId, accountId: session.accountId, expiresAt: new Date(session.expiresAt * 1000), ipAddress: metadata.ipAddress, userAgent: metadata.userAgent } });
  return { session, token: await signAccountSessionToken(session) };
}

async function validateAccountSession(token: string): Promise<AccountSession | null> {
  const claims = await verifyAccountSessionToken(token);
  if (!claims || !process.env.DATABASE_URL) return null;
  try {
    const persisted = await db.accountSession.findUnique({
      where: { id: claims.sessionId },
      include: { account: { include: { person: true, legacyLinks: { orderBy: { createdAt: "asc" } } } } },
    });
    if (!persisted || persisted.revokedAt || persisted.expiresAt <= new Date() || persisted.accountId !== claims.accountId || persisted.account.status !== "active" || persisted.account.person.status !== "active" || persisted.account.personId !== claims.personId || persisted.account.primaryEmail !== claims.email) return null;
    if (claims.kind === "member") {
      if (persisted.account.legacyLinks.length > 0) return null;
      return claims;
    }
    const linked = persisted.account.legacyLinks.some((link) => link.legacyUserId === claims.legacyUserId);
    if (!linked) return null;
    const legacyUser = await db.user.findUnique({ where: { id: claims.legacyUserId }, include: { organization: true } });
    if (!legacyUser || legacyUser.status !== "active" || legacyUser.organization.status !== "active" || legacyUser.organizationId !== claims.organizationId || legacyUser.organization.name !== claims.organizationName || legacyUser.organization.slug !== claims.organizationSlug || legacyUser.email.trim().toLowerCase() !== claims.email || normalizeClinicRole(legacyUser.roleKey) !== claims.role) return null;
    return claims;
  } catch { return null; }
}

export const getAccountSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCOUNT_SESSION_COOKIE_NAME)?.value;
  return token ? validateAccountSession(token) : null;
});

export async function requireAccountSession() {
  const session = await getAccountSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAccountClinicSession() {
  const session = await requireAccountSession();
  if (session.kind !== "clinic") redirect("/member?needs=clinic");
  return projectClinicSessionFromAccount(session);
}

export async function revokeAccountSession(session: AccountSession | null) {
  if (!session || !process.env.DATABASE_URL) return;
  await db.accountSession.updateMany({ where: { id: session.sessionId, accountId: session.accountId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export { ACCOUNT_SESSION_COOKIE_NAME, accountSessionCookieOptions };
