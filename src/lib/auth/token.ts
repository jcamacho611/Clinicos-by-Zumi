import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { getAuthSecret } from "@/lib/auth/config";
import { clinicRoleSchema } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";

const issuer = "clinicos";
const audience = "clinicos-app";

const sessionSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().min(1),
  organizationId: z.string().min(1),
  organizationName: z.string().min(1),
  organizationSlug: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  role: clinicRoleSchema,
  demo: z.boolean(),
  expiresAt: z.number().int().positive(),
});

function key() {
  return new TextEncoder().encode(getAuthSecret());
}

export async function signSessionToken(session: ClinicSession) {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(session.userId)
    .setJti(session.sessionId)
    .setIssuedAt()
    .setExpirationTime(session.expiresAt)
    .sign(key());
}

export async function verifySessionToken(token: string): Promise<ClinicSession | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], issuer, audience });
    return sessionSchema.parse(payload);
  } catch {
    return null;
  }
}
