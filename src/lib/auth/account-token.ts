import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { getAuthSecret } from "@/lib/auth/config";
import type { PersonAccountSession } from "@/lib/auth/account-types";

const issuer = "klinikos";
const audience = "klinikos-person-account";

const accountSessionSchema = z.object({
  sessionId: z.string().min(1),
  accountId: z.string().min(1),
  personId: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1),
  expiresAt: z.number().int().positive(),
});

function key() {
  return new TextEncoder().encode(getAuthSecret());
}

export async function signAccountSessionToken(session: PersonAccountSession) {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(session.personId)
    .setJti(session.sessionId)
    .setIssuedAt()
    .setExpirationTime(session.expiresAt)
    .sign(key());
}

export async function verifyAccountSessionToken(token: string): Promise<PersonAccountSession | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], issuer, audience });
    return accountSessionSchema.parse(payload);
  } catch {
    return null;
  }
}
