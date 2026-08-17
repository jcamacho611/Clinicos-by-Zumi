import "server-only";

import { decryptSensitiveContent, encryptSensitiveContent } from "@/lib/encrypted-content";

export function encryptDocumentContent(content: Buffer) {
  return encryptSensitiveContent(content);
}

export function decryptDocumentContent(input: {
  encryptedContent: Uint8Array;
  encryptionIv: Uint8Array;
  encryptionAuthTag: Uint8Array;
  checksumSha256: string | null;
}) {
  return decryptSensitiveContent(input);
}
