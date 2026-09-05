import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildFrozenGeneratedLegalPdfArtifact,
  hashGeneratedLegalArtifact,
} from "@/lib/legal/generated/legal-artifacts";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const vaultSource = read("src/lib/legal/generated/legal-vault-store.ts");

const bytes = new TextEncoder().encode("%PDF-1.7\nKlinikos generated NDA\n%%EOF");

describe("generated legal artifact and vault contracts", () => {
  it("hashes exact bytes to lowercase SHA-256 and rejects empty artifacts", () => {
    expect(hashGeneratedLegalArtifact(bytes)).toMatch(/^[0-9a-f]{64}$/);
    expect(() => buildFrozenGeneratedLegalPdfArtifact({
      organizationId: "org-bfm",
      documentId: "legal_nda_1",
      version: 1,
      recipientName: "Melissa Example",
      bytes: new Uint8Array(),
    })).toThrow(/empty/i);
  });

  it("builds deterministic organization-scoped names and storage keys", () => {
    const artifact = buildFrozenGeneratedLegalPdfArtifact({
      organizationId: "org-bfm",
      documentId: "legal_nda_1",
      version: 2,
      recipientName: "Melissa Example, MD",
      bytes,
      renderedAt: "2026-08-23T05:30:00.000Z",
    });
    expect(artifact.fileName).toBe("klinikos-nda-melissa-example-md-v2.pdf");
    expect(artifact.storageKey).toBe("legal/generated/org-bfm/nda/legal_nda_1/v2/klinikos-nda-melissa-example-md-v2.pdf");
    expect(artifact.organizationId).toBe("org-bfm");
    expect(artifact.documentId).toBe("legal_nda_1");
    expect(artifact.version).toBe(2);
    expect(artifact.sha256).toBe(hashGeneratedLegalArtifact(bytes));
  });

  it("requires organization scope on every Legal Vault operation", () => {
    for (const operation of ["create", "get", "list", "appendEvent", "attachFrozenArtifact", "appendExecutionEvidence", "compareAndSetStatus"]) {
      expect(vaultSource).toMatch(new RegExp(`${operation}[\\s\\S]{0,260}organizationId`));
    }
    expect(vaultSource).not.toMatch(/get\(documentId:/);
    expect(vaultSource).not.toMatch(/attachFrozenArtifact\(documentId:/);
  });

  it("keeps Legal Vault append-only, immutable and compare-and-set by contract", () => {
    expect(vaultSource).toContain("appendOnlyEvents: true");
    expect(vaultSource).toContain("appendOnlyExecutionEvidence: true");
    expect(vaultSource).toContain("immutableArtifacts: true");
    expect(vaultSource).toContain("destructiveDeleteSupported: false");
    expect(vaultSource).toContain("compareAndSetTransitions: true");
    expect(vaultSource).not.toMatch(/\bdelete\s*\(/);
    expect(vaultSource).not.toMatch(/\bremove\s*\(/);
  });
});
