import "server-only";

import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import { requestMetadata } from "@/lib/auth/request-metadata";
import type { SessionRiskSignals } from "@/lib/security/risk-engine";

function normalized(value: string | null | undefined) {
  return value?.trim() || null;
}

/**
 * Compare the current request with the persisted login session metadata. This does not
 * attempt geolocation/impossible-travel yet; it provides reliable device/IP drift
 * signals that higher-level policy can combine with edge/identity-provider telemetry.
 */
export async function deriveSessionRiskSignals(
  session: ClinicSession,
  request: Request,
): Promise<SessionRiskSignals> {
  if (session.demo) return { demoSession: true };

  const current = requestMetadata(request);
  const persisted = await db.authSession.findUnique({
    where: { id: session.sessionId },
    select: { ipAddress: true, userAgent: true, createdAt: true },
  }).catch(() => null);

  if (!persisted) {
    return { newIp: true, newUserAgent: true };
  }

  const currentIp = normalized(current.ipAddress);
  const loginIp = normalized(persisted.ipAddress);
  const currentUa = normalized(current.userAgent);
  const loginUa = normalized(persisted.userAgent);

  return {
    newIp: Boolean(currentIp && loginIp && currentIp !== loginIp),
    newUserAgent: Boolean(currentUa && loginUa && currentUa !== loginUa),
    staleAuthenticationMinutes: Math.max(0, Math.floor((Date.now() - persisted.createdAt.getTime()) / 60_000)),
  };
}
