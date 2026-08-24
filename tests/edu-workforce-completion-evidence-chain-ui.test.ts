import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("Workforce Completion Review evidence chain UI", () => {
  it("uses the deterministic Workforce evidence projection instead of inventing a second status model", () => {
    const source = read("src/components/edu/workforce-completion-review-table.tsx");

    expect(source).toContain("projectWorkforceEvidenceChain");
    expect(source).toContain("Evidence chain");
    expect(source).toContain('"enrollment"');
    expect(source).toContain('"session"');
    expect(source).toContain('"attendance"');
    expect(source).toContain('"applied_evidence"');
    expect(source).toContain('"knowledge"');
    expect(source).toContain('"instructor_review"');
    expect(source).toContain('"completion_approval"');
    expect(source).not.toContain("aiApproved");
    expect(source).not.toContain("zumiApproved");
  });
});
