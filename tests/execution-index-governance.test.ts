import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const agents = readFileSync("AGENTS.md", "utf8");
const indexPath = "docs/KLINIKOS_EXECUTION_INDEX.md";

describe("Klinikos execution organization index", () => {
  it("is mandatory from the root agent bootstrap", () => {
    expect(agents).toContain(indexPath);
  });

  it("is explicitly non-authoritative and points back to the Master Canon", () => {
    const index = readFileSync(indexPath, "utf8");
    expect(index).toContain("NON-AUTHORITATIVE EXECUTION INDEX");
    expect(index).toContain("docs/KLINIKOS_MASTER_CANON.md");
    expect(index).toContain("does not override");
  });

  it("organizes work by authority, implementation state, PR ownership, evidence, and next action", () => {
    const index = readFileSync(indexPath, "utf8");
    for (const phrase of [
      "Authority stack",
      "Active execution board",
      "Implementation states",
      "Pull-request ownership",
      "Evidence discipline",
      "Retirement and provenance",
      "Next execution order",
    ]) {
      expect(index).toContain(phrase);
    }
  });

  it("preserves one-Klinikos and anti-duplication laws", () => {
    const index = readFileSync(indexPath, "utf8");
    expect(index.toLowerCase()).toContain("one klinikos");
    expect(index).toContain("REUSE → EXTEND → GENERALIZE → CONNECT → PARTNER → BUILD NEW");
    expect(index).toContain("Never create a second Master Canon");
  });
});
