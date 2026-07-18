import "server-only";

import { randomUUID } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  PORTAL_SESSION_COOKIE_NAME,
  PORTAL_SESSION_TTL_SECONDS,
  portalSessionCookieOptions,
} from "@/lib/auth/config";
import { signPortalSessionToken, verifyPortalSessionToken } from "@/lib/auth/portal-token";
import type { AuthenticatedPortalIdentity, PortalSession } from "@/lib/auth/portal-types";

interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export async function createPortalSession(identity: AuthenticatedPortalIdentity, metadata: SessionMetadata) {
  const session: PortalSession = {
    sessionId: randomUUID(),
    ...identity,
    expiresAt: Math.floor(Date.now() / 1000) + PORTAL_SESSION_TTL_SECONDS,
  };
  await db.portalSession.create({
    data: {
      id: session.sessionId,
      portalAccountId: identity.accountId,
      expiresAt: new Date(session.expiresAt * 1000),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      authLevel: identity.authLevel,
    },
  });
  return { session, token: await signPortalSessionToken(session) };
}

async function validatePortalSession(token: string): Promise<PortalSession | null> {
  const claims = await verifyPortalSessionToken(token);
  if (!claims || !process.env.DATABASE_URL) return null;
  try {
    const persisted = await db.portalSession.findUnique({
      where: { id: claims.sessionId },
      include: { portalAccount: { include: { organization: true, patient: true } } },
    });
    if (
      !persisted || persisted.revokedAt || persisted.expiresAt <= new Date() ||
      persisted.portalAccount.status !== "active" || persisted.portalAccount.organization.status !== "active" ||
      persisted.portalAccount.patient.status !== "active" || persisted.portalAccount.patient.portalStatus !== "active" ||
      persisted.portalAccountId !== claims.accountId || persisted.portalAccount.patientId !== claims.patientId ||
      persisted.portalAccount.organizationId !== claims.organizationId
    ) return null;

    if (persisted.lastSeenAt < new Date(Date.now() - 15 * 60 * 1000)) {
      await db.portalSession.updateMany({ where: { id: persisted.id, revokedAt: null }, data: { lastSeenAt: new Date() } });
    }
    return claims;
  } catch {
    return null;
  }
}

export const getPortalSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_SESSION_COOKIE_NAME)?.value;
  return token ? validatePortalSession(token) : null;
});

export async function requirePortalSession() {
  const session = await getPortalSession();
  if (!session) redirect("/portal/login");
  return session;
}

export async function revokePortalSession(session: PortalSession | null) {
  if (!session || !process.env.DATABASE_URL) return;
  await db.$transaction([
    db.portalSession.updateMany({ where: { id: session.sessionId, portalAccountId: session.accountId, revokedAt: null }, data: { revokedAt: new Date() } }),
    db.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.accountId, actorType: "patient", action: "portal.logout", resourceType: "portal_session", resourceId: session.sessionId, patientId: session.patientId } }),
  ]);
}

export { PORTAL_SESSION_COOKIE_NAME, portalSessionCookieOptions };
