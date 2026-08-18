import "server-only";
import { createHash } from "node:crypto";

export type FrozenLegalPdfArtifact = {
  fileName: string;
  mimeType: "application/pdf";
  sha256: string;
  byteLength: number;
  storageKey: string;
  renderedAt: string;
};

function safeFileSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "recipient";
}

export function hashLegalArtifact(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function buildFrozenLegalPdfArtifact(input: {
  documentId: string;
  version: number;
  recipientName: string;
  bytes: Uint8Array;
  renderedAt?: string;
}): FrozenLegalPdfArtifact {
  if (!input.documentId.trim()) throw new Error("documentId is required");
  if (!Number.isInteger(input.version) || input.version < 1) throw new Error("version must be a positive integer");
  if (input.bytes.byteLength === 0) throw new Error("A legal PDF artifact cannot be empty");

  const recipient = safeFileSegment(input.recipientName);
  const fileName = `klinicos-nda-${recipient}-v${input.version}.pdf`;
  const storageKey = `legal/nda/${input.documentId}/v${input.version}/${fileName}`;

  return {
    fileName,
    mimeType: "application/pdf",
    sha256: hashLegalArtifact(input.bytes),
    byteLength: input.bytes.byteLength,
    storageKey,
    renderedAt: input.renderedAt ?? new Date().toISOString(),
  };
}
