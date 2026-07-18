import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { getAuthSecret } from "@/lib/auth/config";
import type { PortalSession } from "@/lib/auth/portal-types";

const issuer = "clinicos";
const audience = "clinicos-patient-portal";

const portalSessionSchema = z.object({
  sessionId: z.string().min(1),
  accountId: z.string().min(1),
  patientId: z.string().min(1),
  organizationId: z.string().min(1),
  organizationName: z.string().min(1),
  organizationSlug: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  authLevel: z.enum(["password", "mfa", "passkey"]),
  expiresAt: z.number().int().positive(),
});

function key() {
  return new TextEncoder().encode(getAuthSecret());
}

export async function signPortalSessionToken(session: PortalSession) {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(session.patientId)
    .setJti(session.sessionId)
    .setIssuedAt()
    .setExpirationTime(session.expiresAt)
    .sign(key());
}

export async function verifyPortalSessionToken(token: string): Promise<PortalSession | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], issuer, audience });
    return portalSessionSchema.parse(payload);
  } catch {
    return null;
  }
}
