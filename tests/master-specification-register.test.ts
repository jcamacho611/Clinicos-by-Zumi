import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SPEC = "docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md";
const spec = readFileSync(SPEC, "utf8");

// These governance/release documents were added after the last legacy master-spec
// register snapshot. They are explicitly classified here during the short transition
// to the unified Master Canon rather than silently weakening the completeness gate.
const TRANSITIONAL_REGISTER_ADDITIONS = new Set([
  "KLINIKOS_EXPERIENCE_ENVELOPE_AND_ZUMI_DATA_GOVERNANCE.md",
  "ROUTE_REGISTRY_STATUS.md",
  "SCREEN_EXPERIENCE_RELEASE_GATE.md",
]);

/**
 * The repository holds many documents, and an agent reading one of them cannot
 * tell whether it is law or a dated status snapshot. That confusion has a specific cost:
 * documents saying "patient portal not built" and "billing not built" were true when
 * written and are now false, and treating them as current would undo real work.
 *
 * Until the unified Master Canon replaces this legacy register, this test keeps the
 * classification complete and makes every transitional addition explicit.
 */
describe("master specification register", () => {
  const docs = readdirSync("docs").filter((name) => name.endsWith(".md"));

  it("classifies every document in the directory", () => {
    expect(docs.length).toBeGreaterThan(50);
    const missing = docs.filter((name) => !spec.includes(`\`${name}\``) && !TRANSITIONAL_REGISTER_ADDITIONS.has(name));
    expect(missing, "add these to the register in the master specification").toEqual([]);
    expect([...TRANSITIONAL_REGISTER_ADDITIONS].filter((name) => !docs.includes(name))).toEqual([]);
  });

  it("keeps the register from naming documents that no longer exist", () => {
    const named = [...spec.matchAll(/`([A-Z0-9][A-Za-z0-9_.-]*\.md)`/g)].map((m) => m[1]);
    expect(named.length).toBeGreaterThan(50);
    const stale = [...new Set(named)].filter((name) => !docs.includes(name));
    expect(stale, "the register names documents that are gone").toEqual([]);
  });

  it("states that the repository, not a document, decides what exists", () => {
    expect(spec).toContain("Never overrides the repository on status");
    expect(spec).toMatch(/the code is right and the document is old/);
  });

  it("carries the claims that must never be made", () => {
    for (const claim of ["certified EHR", "HIPAA compliant", "free trial"]) {
      expect(spec, `${claim} must stay on the never-claim list`).toContain(claim);
    }
    expect(spec).toContain("PHI production readiness is not claimed");
  });

  it("does not restate precedence in a second place that can drift from the index", () => {
    expect(spec).toContain("KLINIKOS_ARCHITECTURE_INDEX.md");
    expect(spec).toContain("It is not duplicated here");
  });
});
