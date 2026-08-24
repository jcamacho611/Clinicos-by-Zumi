import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("Workforce completion review batching", () => {
  it("loads completion review through one institutional batch path instead of per-enrollment repository fan-out", () => {
    const page = read("src/app/edu/(lab)/completions/page.tsx");
    const repository = read("src/lib/edu/workforce-completion-repository.ts");

    expect(page).toContain("listWorkforceCompletionEvidence");
    expect(page).not.toContain("Promise.all(enrollments.map");
    expect(repository).toContain("export async function listWorkforceCompletionEvidence");
    expect(repository).toContain("educationScenarioAssignment.groupBy");
    expect(repository).toContain("educationSubmission.groupBy");
    expect(repository).toContain("Prisma.join(enrollmentIds)");
  });

  it("keeps single-enrollment finalization on the existing authoritative evidence path", () => {
    const repository = read("src/lib/edu/workforce-completion-repository.ts");

    expect(repository).toContain("export async function getEnrollmentCompletionEvidence");
    expect(repository).toContain("export async function finalizeEnrollmentCompletion");
    expect(repository).toContain("const preview = await getEnrollmentCompletionEvidence");
  });
});
