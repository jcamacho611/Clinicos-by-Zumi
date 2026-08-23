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

function safeSegment(value: string, fallback: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || fallback;
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
  const organizationId = input.organizationId.trim();
  const documentId = input.documentId.trim();
  if (!organizationId) throw new Error("organizationId is required for a generated legal artifact.");
  if (!documentId) throw new Error("documentId is required for a generated legal artifact.");
  if (!Number.isInteger(input.version) || input.version < 1) throw new Error("version must be a positive integer.");
  if (input.bytes.byteLength === 0) throw new Error("A generated legal PDF artifact cannot be empty.");

  const recipient = safeSegment(input.recipientName, "recipient");
  const safeOrganization = safeSegment(organizationId, "organization");
  const safeDocument = safeSegment(documentId, "document");
  const fileName = `klinikos-nda-${recipient}-v${input.version}.pdf`;
  const storageKey = `legal/generated/${safeOrganization}/nda/${safeDocument}/v${input.version}/${fileName}`;

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
