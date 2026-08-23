import "server-only";

import { randomUUID } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  isDemoAuthEnabled,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  sessionCookieOptions,
} from "@/lib/auth/config";
import { normalizeClinicRole } from "@/lib/auth/rbac";
import { signSessionToken, verifySessionToken } from "@/lib/auth/token";
import type { AuthenticatedIdentity, ClinicSession } from "@/lib/auth/types";
import { buildGlobalAgreement } from "@/lib/legal/global-agreement";
import { buildEntryAgreement } from "@/lib/legal/entry-agreement";
import { hasBoundEntryAcceptance } from "@/lib/legal/entry-access";
import {
  getLegalConfigurationStatus,
  isEntryGateEnforcementEnabled,
  isLegalGateEnforcementEnabled,
} from "@/lib/legal/legal-config";
import { hasCurrentAgreementAcceptance } from "@/lib/legal/legal-access";

interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export async function createClinicSession(identity: AuthenticatedIdentity, metadata: SessionMetadata) {
  const session: ClinicSession = {
    sessionId: randomUUID(),
    userId: identity.userId,
    organizationId: identity.organizationId,
    organizationName: identity.organizationName,
    organizationSlug: identity.organizationSlug,
    email: identity.email,
    name: identity.name,
    role: identity.role,
    demo: identity.demo,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  if (identity.source === "database") {
    await db.authSession.create({
      data: {
        id: session.sessionId,
        userId: identity.userId,
        expiresAt: new Date(session.expiresAt * 1000),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    });
  }

  return { session, token: await signSessionToken(session) };
}

async function validateSession(token: string): Promise<ClinicSession | null> {
  const claims = await verifySessionToken(token);
  if (!claims) return null;

  if (claims.demo) {
    return isDemoAuthEnabled() ? claims : null;
  }

  if (!process.env.DATABASE_URL) return null;

  try {
    const persisted = await db.authSession.findUnique({
      where: { id: claims.sessionId },
      include: { user: { include: { organization: true } } },
    });

    if (
      !persisted || persisted.revokedAt || persisted.expiresAt <= new Date() ||
      persisted.user.status !== "active" || persisted.user.organization.status !== "active" ||
      persisted.userId !== claims.userId || persisted.user.organizationId !== claims.organizationId ||
      normalizeClinicRole(persisted.user.roleKey) !== claims.role
    ) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}

// Authentication truth and contractual-access truth are intentionally separate.
// Legal routes, logout, and account-recovery flows need to recognize an authenticated
// session even when that session is not yet entitled to protected product access.
export const getAuthenticationSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return token ? validateSession(token) : null;
});

export const getClinicSession = cache(async () => {
  const session = await getAuthenticationSession();
  if (!session) return null;

  const legal = getLegalConfigurationStatus();

  // Universal entry replaces the legacy authenticated baseline gate when enabled.
  // Relationship-specific/additional agreements remain separate legal workflows.
  if (isEntryGateEnforcementEnabled()) {
    if (!legal.ready) return null;
    const accepted = await hasBoundEntryAcceptance(session, buildEntryAgreement(legal.config));
    return accepted ? session : null;
  }

  if (!isLegalGateEnforcementEnabled()) return session;
  if (!legal.ready) return null;

  const accepted = await hasCurrentAgreementAcceptance(session, buildGlobalAgreement(legal.config));
  return accepted ? session : null;
});

export async function requireAuthenticationSession() {
  const session = await getAuthenticationSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireClinicSession() {
  const session = await getAuthenticationSession();
  if (!session) redirect("/login");

  const legal = getLegalConfigurationStatus();

  if (isEntryGateEnforcementEnabled()) {
    if (!legal.ready) redirect("/access");
    const accepted = await hasBoundEntryAcceptance(session, buildEntryAgreement(legal.config));
    if (!accepted) redirect("/access?returnTo=%2Flogin");
    return session;
  }

  if (!isLegalGateEnforcementEnabled()) return session;
  if (!legal.ready) redirect("/legal/accept?blocked=configuration");

  const accepted = await hasCurrentAgreementAcceptance(session, buildGlobalAgreement(legal.config));
  if (!accepted) redirect("/legal/accept");
  return session;
}

export async function revokeClinicSession(session: ClinicSession | null) {
  if (!session || session.demo || !process.env.DATABASE_URL) return;

  await db.authSession.updateMany({
    where: { id: session.sessionId, userId: session.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export { SESSION_COOKIE_NAME, sessionCookieOptions };
