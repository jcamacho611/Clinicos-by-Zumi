import { describe, expect, it } from "vitest";
import { buildFrozenLegalPdfArtifact, hashLegalArtifact } from "@/lib/legal/legal-artifacts";

describe("legal artifact boundary", () => {
  it("produces deterministic SHA-256 hashes", () => {
    const bytes = new TextEncoder().encode("frozen legal document bytes");
    const first = hashLegalArtifact(bytes);
    const second = hashLegalArtifact(bytes);

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it("builds a version-addressed immutable PDF artifact descriptor", () => {
    const bytes = new TextEncoder().encode("%PDF-1.7 test artifact");
    const artifact = buildFrozenLegalPdfArtifact({
      documentId: "legal_nda_123",
      version: 2,
      recipientName: "Melissa Example",
      bytes,
      renderedAt: "2026-08-18T17:00:00.000Z",
    });

    expect(artifact.fileName).toBe("klinicos-nda-melissa-example-v2.pdf");
    expect(artifact.storageKey).toBe("legal/nda/legal_nda_123/v2/klinikos-nda-melissa-example-v2.pdf");
    expect(artifact.mimeType).toBe("application/pdf");
    expect(artifact.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(artifact.byteLength).toBe(bytes.byteLength);
    expect(artifact.renderedAt).toBe("2026-08-18T17:00:00.000Z");
  });

  it("rejects empty or invalid artifacts before storage/signature", () => {
    expect(() => buildFrozenLegalPdfArtifact({
      documentId: "legal_nda_123",
      version: 1,
      recipientName: "Melissa Example",
      bytes: new Uint8Array(),
    })).toThrow("cannot be empty");

    expect(() => buildFrozenLegalPdfArtifact({
      documentId: "legal_nda_123",
      version: 0,
      recipientName: "Melissa Example",
      bytes: new TextEncoder().encode("document"),
    })).toThrow("positive integer");
  });
});
