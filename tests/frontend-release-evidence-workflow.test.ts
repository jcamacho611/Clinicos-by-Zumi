import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/quality.yml", "utf8");

describe("frontend release evidence workflow", () => {
  it("captures reviewable Living Universe screenshots for the tested merge and records every Git identity", () => {
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
    expect(workflow).toContain("FRONTEND_BROWSER_ZOOM_PERCENT=200");
    expect(workflow).toContain("browser-zoom-200.json");
    expect(workflow).toContain("zoom_method=verified_chrome_profile_page_zoom_200_percent");
    expect(workflow).toContain("zoom_verification=css_viewport_and_responsive_layout_asserted");
    expect(workflow).not.toContain("partition: { default_zoom_level");
    expect(workflow).not.toContain("force-device-scale-factor=2");
    expect(workflow).toContain("tested_merge_sha=");
    expect(workflow).toContain("pr_head_sha=");
    expect(workflow).toContain("base_sha=");
    expect(workflow).not.toContain("head_sha=%s");
    expect(workflow).toContain('data-living-universe-stage="true"');
    expect(workflow).toContain('data-public-action-dock="true"');
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
