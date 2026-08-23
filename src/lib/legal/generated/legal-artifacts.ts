import "server-only";

import { createHash } from "node:crypto";

export type FrozenGeneratedLegalArtifact = {
  organizationId: string;
  documentId: string;
  version: number;
  fileName: string;
  mimeType: "application/pdf";
  sha256: string;
  byteLength: number;
  storageKey: string;
  renderedAt: string;
};

function safeNameSegment(value: string, fallback: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || fallback;
}

function stableIdSegment(value: string, field: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${field} is required for a generated legal artifact.`);
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(trimmed)) throw new Error(`${field} contains unsupported storage-key characters.`);
  return trimmed;
}

export function hashGeneratedLegalArtifact(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function buildFrozenGeneratedLegalPdfArtifact(input: {
  organizationId: string;
  documentId: string;
  version: number;
  recipientName: string;
  bytes: Uint8Array;
  renderedAt?: string;
}): FrozenGeneratedLegalArtifact {
  const organizationId = stableIdSegment(input.organizationId, "organizationId");
  const documentId = stableIdSegment(input.documentId, "documentId");
  if (!Number.isInteger(input.version) || input.version < 1) throw new Error("version must be a positive integer.");
  if (input.bytes.byteLength === 0) throw new Error("A generated legal PDF artifact cannot be empty.");

  const recipient = safeNameSegment(input.recipientName, "recipient");
  const fileName = `klinikos-nda-${recipient}-v${input.version}.pdf`;
  const storageKey = `legal/generated/${organizationId}/nda/${documentId}/v${input.version}/${fileName}`;

  return {
    organizationId,
    documentId,
    version: input.version,
    fileName,
    mimeType: "application/pdf",
    sha256: hashGeneratedLegalArtifact(input.bytes),
    byteLength: input.bytes.byteLength,
    storageKey,
    renderedAt: input.renderedAt ?? new Date().toISOString(),
  };
}
