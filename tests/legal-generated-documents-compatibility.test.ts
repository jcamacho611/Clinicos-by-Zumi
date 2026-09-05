import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const adminLegal = read("src/app/(platform)/admin/legal/page.tsx");
const registry = read("src/lib/legal/document-registry.ts");
const drafting = read("src/lib/legal/generated/nda-drafting.ts");
const lifecycle = read("src/lib/legal/generated/legal-document-lifecycle.ts");
const artifacts = read("src/lib/legal/generated/legal-artifacts.ts");
const vault = read("src/lib/legal/generated/legal-vault-store.ts");

const generatedSources = [drafting, lifecycle, artifacts, vault].join("\n");

describe("generated legal documents compatibility boundary", () => {
  it("preserves current tenant-scoped legal acceptance evidence as the admin legal authority", () => {
    expect(adminLegal).toContain("listOrganizationLegalAcceptances");
    expect(adminLegal).toContain('can(session.role, "settings", "manage")');
    expect(adminLegal).not.toContain("GeneratedLegal");
    expect(adminLegal).not.toContain("buildNdaDraftPackage");
  });

  it("does not convert generated NDAs into mandatory static product documents", () => {
    expect(registry).toContain("legalDocumentRegistry");
    expect(registry).not.toContain('"master_nda"');
    expect(registry).not.toContain("generated/nda-drafting");
  });

  it("keeps the generated-document foundation pure and persistence-neutral", () => {
    expect(generatedSources).not.toContain('from "@/lib/db"');
    expect(generatedSources).not.toContain('from "@/lib/auth/session"');
    expect(generatedSources).not.toContain('from "@prisma/client"');
    expect(generatedSources).not.toContain("prisma.");
    expect(generatedSources).not.toContain("requireClinicSession");
  });

  it("requires organization scope instead of document-id-only Legal Vault access", () => {
    expect(vault).toContain("organizationId: string");
    expect(vault).not.toMatch(/get\(documentId:/);
    expect(vault).not.toMatch(/list\(limit\??:/);
    expect(vault).not.toMatch(/appendEvent\(input:\s*\{\s*documentId:/);
    expect(vault).not.toMatch(/attachFrozenArtifact\(documentId:/);
    expect(vault).not.toMatch(/appendExecutionEvidence\(documentId:/);
  });

  it("does not introduce database schema or migration authority through generated modules", () => {
    expect(generatedSources).not.toContain("prisma/schema.prisma");
    expect(generatedSources).not.toContain("migrations/");
    expect(generatedSources).not.toContain("db.$transaction");
  });
});
