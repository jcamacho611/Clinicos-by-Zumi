import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const renderBuild = readFileSync("scripts/render-build.mjs", "utf8");
const verifyRelease = readFileSync("scripts/verify-release.mjs", "utf8");
const renderYaml = readFileSync("render.yaml", "utf8");

describe("Render production migration boundary", () => {
  it("keeps commit auto-deploy but makes Render builds status-only for database migrations", () => {
    expect(renderYaml).toContain("autoDeployTrigger: commit");
    expect(renderBuild).toContain('process.env.RENDER === "true"');
    expect(renderBuild).toContain('"migrate", "status"');
    expect(renderBuild).toContain("Render will not apply database migrations automatically");
  });

  it("fails closed when a real Render build has no database connection configured", () => {
    expect(renderBuild).toContain("Render database verification requires DATABASE_URL or DIRECT_DATABASE_URL");
    expect(renderBuild).toMatch(/if \(!databaseUrl\)[\s\S]*process\.env\.RENDER === "true"[\s\S]*process\.exit\(1\)/);
  });

  it("never executes migrate deploy inside the Render branch", () => {
    /* Anchor on the deploy-detection branch, not the first RENDER guard — the first one
       is the missing-DATABASE_URL refusal. And assert the call, not the literal: the
       prisma argv now lives in the migrationStatus() helper at the top of the file, so
       requiring the raw '"migrate", "status"' string inside the branch checked where the
       code no longer is while the behaviour was correct all along. */
    const renderBranch = renderBuild.slice(
      renderBuild.indexOf("Render build detected"),
      renderBuild.indexOf("KLINIKOS_ALLOW_MIGRATION_DEPLOY"),
    );

    expect(renderBranch).not.toContain('"migrate", "deploy"');
    expect(renderBranch).toContain("migrationStatus(");
    // The helper it calls must be the status command and nothing else.
    const helper = renderBuild.slice(renderBuild.indexOf("function migrationStatus"), renderBuild.indexOf("const databaseUrl"));
    expect(helper).toContain('"migrate", "status"');
    expect(helper).not.toContain('"migrate", "deploy"');
  });

  it("allows migrate deploy only for an explicitly marked disposable verification build", () => {
    expect(renderBuild).toContain('KLINIKOS_ALLOW_MIGRATION_DEPLOY === "disposable-verification"');
    expect(renderBuild).toContain('"migrate", "deploy"');
    expect(verifyRelease).toContain('KLINIKOS_ALLOW_MIGRATION_DEPLOY: "disposable-verification"');
  });

  it("keeps the full release gate responsible for proving the disposable database before granting that marker", () => {
    const safetyCheck = verifyRelease.indexOf("assertDisposableDatabase(disposableDatabaseUrl)");
    const marker = verifyRelease.indexOf('KLINIKOS_ALLOW_MIGRATION_DEPLOY: "disposable-verification"');
    const renderBuildCall = verifyRelease.indexOf('["run", "render:build"]');

    expect(safetyCheck).toBeGreaterThan(-1);
    expect(marker).toBeGreaterThan(safetyCheck);
    expect(renderBuildCall).toBeGreaterThan(marker);
  });
});
