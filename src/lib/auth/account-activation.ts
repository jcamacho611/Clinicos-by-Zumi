import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { getAuthSecret } from "@/lib/auth/config";

const issuer = "clinicos";
const audience = "clinicos-account-activation";
const ACTIVATION_TTL_SECONDS = 60 * 60 * 24;

const activationSchema = z.object({
  purpose: z.literal("account_activation"),
  email: z.string().email(),
  userId: z.string().min(1),
  organizationId: z.string().min(1),
  exp: z.number().int().positive(),
});

function key() {
  return new TextEncoder().encode(getAuthSecret());
}

export async function createAccountActivationToken(input: { email: string; userId: string; organizationId: string }) {
  const exp = Math.floor(Date.now() / 1000) + ACTIVATION_TTL_SECONDS;
  const token = await new SignJWT({
    purpose: "account_activation",
    email: input.email.trim().toLowerCase(),
    userId: input.userId,
    organizationId: input.organizationId,
    exp,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(key());
  return { token, expiresAt: new Date(exp * 1000) };
}

export async function verifyAccountActivationToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], issuer, audience });
    return activationSchema.parse(payload);
  } catch {
    return null;
  }
}
