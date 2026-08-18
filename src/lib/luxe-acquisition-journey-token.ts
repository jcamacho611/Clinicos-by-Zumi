import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const LUXE_ACQUISITION_JOURNEY_COOKIE = "klinikos_luxe_journey";
export const LUXE_ACQUISITION_JOURNEY_TTL_SECONDS = 30 * 24 * 60 * 60;
const TOKEN_VERSION = 1;

type JourneyPayload = {
  v: number;
  leadId: string;
  exp: number;
};

function keyFromSecret(secret: string) {
  return createHash("sha256").update(secret, "utf8").digest();
}

function configuredSecret() {
  const secret = process.env.LUXE_MEDI_JOURNEY_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

export function luxeAcquisitionJourneyEnabled() {
  return Boolean(configuredSecret());
}

export function sealLuxeAcquisitionJourney(leadId: string, now = Date.now(), ttlSeconds = LUXE_ACQUISITION_JOURNEY_TTL_SECONDS) {
  const secret = configuredSecret();
  if (!secret) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFromSecret(secret), iv);
  const payload: JourneyPayload = {
    v: TOKEN_VERSION,
    leadId,
    exp: Math.floor(now / 1000) + Math.max(300, Math.min(LUXE_ACQUISITION_JOURNEY_TTL_SECONDS, ttlSeconds)),
  };
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function openLuxeAcquisitionJourney(token: string | null | undefined, now = Date.now()) {
  const secret = configuredSecret();
  if (!secret || !token) return null;
  try {
    const bytes = Buffer.from(token, "base64url");
    if (bytes.length < 29) return null;
    const iv = bytes.subarray(0, 12);
    const tag = bytes.subarray(12, 28);
    const encrypted = bytes.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", keyFromSecret(secret), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    const payload = JSON.parse(plain) as Partial<JourneyPayload>;
    if (payload.v !== TOKEN_VERSION || typeof payload.leadId !== "string" || payload.leadId.length < 10 || typeof payload.exp !== "number") return null;
    if (payload.exp <= Math.floor(now / 1000)) return null;
    return { leadId: payload.leadId, expiresAt: new Date(payload.exp * 1000) };
  } catch {
    return null;
  }
}
