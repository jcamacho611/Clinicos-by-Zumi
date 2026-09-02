import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/quality.yml", "utf8");

describe("frontend release evidence workflow", () => {
  it("captures reviewable Living Universe screenshots on the exact PR head", () => {
    expect(workflow).toContain("Capture frontend release evidence");
    expect(workflow).toMatch(/google-chrome|chromium/);
    expect(workflow).toContain("1402,1122");
    expect(workflow).toContain("1440,1000");
    expect(workflow).toContain("1920,1080");
    expect(workflow).toContain("1024,900");
    expect(workflow).toContain("768,1024");
    expect(workflow).toContain("390,844");
    expect(workflow).toContain("force-prefers-reduced-motion");
    expect(workflow).toContain("zoom-200-1402x1122");
    expect(workflow).toContain("701,561");
    expect(workflow).toContain("force-device-scale-factor=2");
  });

  it("uploads the evidence instead of leaving it only on the runner", () => {
    expect(workflow).toContain("actions/upload-artifact@v4");
    expect(workflow).toContain("living-universe-release-evidence");
    expect(workflow).toContain("artifacts/frontend-evidence");
  });

  it("renders only the local exact-head build and does not weaken deploy or confidentiality gates", () => {
    expect(workflow).toContain("http://127.0.0.1:3000/");
    expect(workflow).toContain("Source confidentiality gates");
    expect(workflow).toContain("Post-build confidentiality gates");
    expect(workflow).toContain("KLINIKOS_ALLOW_MIGRATION_DEPLOY: disposable-verification");
  });
});
