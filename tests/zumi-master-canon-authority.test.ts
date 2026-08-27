import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SOURCE = "src/features/zumi/canonical-context.ts";
const DIRECTIVE = "src/features/zumi/master-directive.ts";
const source = readFileSync(SOURCE, "utf8");
const directive = readFileSync(DIRECTIVE, "utf8");

function manifestPathIndex(path: string) {
  return source.indexOf(`path: \"${path}\"`);
}

describe("Zumi canonical retrieval authority", () => {
  it("includes the unified Master Canon as the highest-priority founder canon", () => {
    expect(source).toContain('path: "docs/KLINIKOS_MASTER_CANON.md"');
    expect(source).toMatch(/KLINIKOS_MASTER_CANON\.md[^\n]+priority:\s*(?:1(?:0[1-9]|[1-9][0-9])|[2-9][0-9]{2,})/);
  });

  it("does not retrieve superseded or parallel master documents as current canonical context", () => {
    expect(source).not.toContain('path: "docs/CLINICOS_MASTER_CANON.md"');
    expect(source).not.toContain('path: "docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md"');
    expect(source).not.toContain('path: "docs/KLINIKOS_CONSTITUTION.md"');
  });

  it("places the Master Canon before status snapshots in the retrieval manifest", () => {
    const master = manifestPathIndex("docs/KLINIKOS_MASTER_CANON.md");
    const status = manifestPathIndex("docs/FEATURE_STATUS.md");
    const founding = manifestPathIndex("docs/BUILD_STATUS_2026_FOUNDING_CLINIC_PLAN.md");

    expect(master).toBeGreaterThanOrEqual(0);
    expect(status).toBeGreaterThan(master);
    if (founding >= 0) expect(founding).toBeGreaterThan(master);
  });

  it("does not treat the historical founding-clinic build snapshot as canonical product law", () => {
    const line = source
      .split(/\r?\n/)
      .find((candidate) => candidate.includes('path: "docs/BUILD_STATUS_2026_FOUNDING_CLINIC_PLAN.md"'));

    if (line) {
      expect(line).not.toContain('domains: ["canon"');
      expect(line).not.toContain('priority: 100');
      expect(line).not.toContain('priority: 95');
    }
  });

  it("keeps the authority map discoverable to founder canonical retrieval", () => {
    expect(source).toContain('path: "docs/KLINIKOS_AUTHORITY_MAP.yaml"');
  });

  it("tells Zumi that the unified Master Canon is the sole product-direction authority", () => {
    expect(directive).toContain("docs/KLINIKOS_MASTER_CANON.md");
    expect(directive).toContain("sole active product, architecture, business, and experience authority");
    expect(directive).toContain("Historical and superseded documents are provenance only");
  });

  it("locks prototype language to real underlying business architecture", () => {
    expect(directive).toContain("prototype or UI statement");
    expect(directive).toContain("identity, relationship, authority, workflow, evidence, financial, network, and data infrastructure");
  });
});
