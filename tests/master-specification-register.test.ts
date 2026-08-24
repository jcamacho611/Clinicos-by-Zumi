import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SPEC = "docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md";
const spec = readFileSync(SPEC, "utf8");

/**
 * The repository holds seventy-five documents, and an agent reading one of them cannot
 * tell whether it is law or a dated status snapshot. That confusion has a specific cost:
 * documents saying "patient portal not built" and "billing not built" were true when
 * written and are now false, and treating them as current would undo real work.
 *
 * The master specification classifies every document on that axis. These keep the
 * classification honest — a register that silently falls behind the directory is worse
 * than none, because it looks complete.
 */
describe("master specification register", () => {
  const docs = readdirSync("docs").filter((name) => name.endsWith(".md"));

  it("classifies every document in the directory", () => {
    expect(docs.length).toBeGreaterThan(50);
    const missing = docs.filter((name) => !spec.includes(`\`${name}\``));
    expect(missing, "add these to the register in the master specification").toEqual([]);
  });

  it("keeps the register from naming documents that no longer exist", () => {
    const named = [...spec.matchAll(/`([A-Z0-9][A-Za-z0-9_.-]*\.md)`/g)].map((m) => m[1]);
    expect(named.length).toBeGreaterThan(50);
    const stale = [...new Set(named)].filter((name) => !docs.includes(name));
    expect(stale, "the register names documents that are gone").toEqual([]);
  });

  it("states that the repository, not a document, decides what exists", () => {
    // The whole point. Without this the register is just another opinion.
    expect(spec).toContain("Never overrides the repository on status");
    expect(spec).toMatch(/the code is right and the document is old/);
  });

  it("carries the claims that must never be made", () => {
    for (const claim of ["certified EHR", "HIPAA compliant", "free trial"]) {
      expect(spec, `${claim} must stay on the never-claim list`).toContain(claim);
    }
    // PHI readiness is the one an enterprise buyer will test first.
    expect(spec).toContain("PHI production readiness is not claimed");
  });

  it("does not restate precedence in a second place that can drift from the index", () => {
    // KLINIKOS_ARCHITECTURE_INDEX.md owns the chain. Two copies would disagree.
    expect(spec).toContain("KLINIKOS_ARCHITECTURE_INDEX.md");
    expect(spec).toContain("It is not duplicated here");
  });
});
