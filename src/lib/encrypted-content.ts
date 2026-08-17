import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function decodeConfiguredKey(value: string) {
  const trimmed = value.trim();
  const decoded = /^[a-f0-9]{64}$/i.test(trimmed) ? Buffer.from(trimmed, "hex") : Buffer.from(trimmed, "base64");
  if (decoded.length !== 32) throw new NetworkAccessError("DOCUMENT_ENCRYPTION_KEY must decode to exactly 32 bytes.", 503);
  return decoded;
}

function resolveEncryptedContentKey() {
  if (process.env.DOCUMENT_ENCRYPTION_KEY) return decodeConfiguredKey(process.env.DOCUMENT_ENCRYPTION_KEY);
  if (process.env.NODE_ENV === "production") throw new NetworkAccessError("Encrypted content storage is not configured.", 503);
  if (!process.env.AUTH_SECRET) throw new NetworkAccessError("AUTH_SECRET is required for the encrypted development fallback.", 503);
  return createHash("sha256").update(`clinicos-encrypted-development:${process.env.AUTH_SECRET}`).digest();
}

export function encryptSensitiveContent(content: Buffer) {
  const key = resolveEncryptedContentKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encryptedContent = Buffer.concat([cipher.update(content), cipher.final()]);
  const encryptionAuthTag = cipher.getAuthTag();
  const checksumSha256 = createHash("sha256").update(content).digest("hex");
  const encryptionKeyId = createHash("sha256").update(key).digest("hex").slice(0, 16);
  return { encryptedContent, encryptionIv: iv, encryptionAuthTag, checksumSha256, encryptionKeyId };
}

export function decryptSensitiveContent(input: {
  encryptedContent: Uint8Array;
  encryptionIv: Uint8Array;
  encryptionAuthTag: Uint8Array;
  checksumSha256: string | null;
}) {
  const key = resolveEncryptedContentKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(input.encryptionIv));
  decipher.setAuthTag(Buffer.from(input.encryptionAuthTag));
  const content = Buffer.concat([decipher.update(Buffer.from(input.encryptedContent)), decipher.final()]);
  const checksum = createHash("sha256").update(content).digest("hex");
  if (input.checksumSha256 && checksum !== input.checksumSha256) {
    throw new NetworkAccessError("Encrypted content integrity verification failed.", 409);
  }
  return content;
}
