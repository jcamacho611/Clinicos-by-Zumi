import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const renderBuild = readFileSync("scripts/render-build.mjs", "utf8");
const migrationPolicy = readFileSync(
  "scripts/release/production-migration-policy.mjs",
  "utf8",
);
const verifyRelease = readFileSync("scripts/verify-release.mjs", "utf8");
const renderYaml = readFileSync("render.yaml", "utf8");
const qualityWorkflow = readFileSync(".github/workflows/quality.yml", "utf8");

describe("Render production migration boundary", () => {
  it("keeps commit auto-deploy and a governed migration path", () => {
    expect(renderYaml).toContain("autoDeployTrigger: commit");
    expect(renderBuild).toContain('process.env.RENDER === "true"');
    expect(renderBuild).toContain('"migrate", "status"');
    expect(renderBuild).toContain("validatePendingMigrations");
    expect(renderBuild).toContain("Applying explicitly approved additive production migrations");
  });

  it("fails closed when a real Render build has no database connection configured", () => {
    expect(renderBuild).toContain(
      "Render database verification requires DATABASE_URL or DIRECT_DATABASE_URL",
    );
    expect(renderBuild).toMatch(
      /if \(!databaseUrl\)[\s\S]*process\.env\.RENDER === "true"[\s\S]*process\.exit\(1\)/,
    );
  });

  it("validates pending migrations before migrate deploy inside the Render branch", () => {
    const renderBranch = renderBuild.slice(
      renderBuild.indexOf("Render build detected"),
      renderBuild.indexOf("KLINIKOS_ALLOW_MIGRATION_DEPLOY"),
    );
    const validate = renderBranch.indexOf("validatePendingMigrations");
    const deploy = renderBranch.indexOf('["node_modules/prisma/build/index.js", "migrate", "deploy"]');

    expect(validate).toBeGreaterThan(-1);
    expect(deploy).toBeGreaterThan(validate);
    expect(renderBranch).toContain("Production migration state is not approved");
  });

  it("requires an explicit additive manifest and exact migration checksum", () => {
    expect(migrationPolicy).toContain('classification !== "additive-only"');
    expect(migrationPolicy).toContain("automaticProductionDeploy !== true");
    expect(migrationPolicy).toContain("manifest.sha256 !== actualSha256");
    expect(migrationPolicy).toContain("FORBIDDEN_SQL");
    expect(migrationPolicy).toContain("Failing closed");
  });

  it("still allows migrate deploy for explicitly marked disposable verification", () => {
    expect(renderBuild).toContain(
      'KLINIKOS_ALLOW_MIGRATION_DEPLOY === "disposable-verification"',
    );
    expect(verifyRelease).toContain(
      'KLINIKOS_ALLOW_MIGRATION_DEPLOY: "disposable-verification"',
    );
  });

  it("keeps the full release gate responsible for proving the disposable database", () => {
    const safetyCheck = verifyRelease.indexOf(
      "assertDisposableDatabase(disposableDatabaseUrl)",
    );
    const marker = verifyRelease.indexOf(
      'KLINIKOS_ALLOW_MIGRATION_DEPLOY: "disposable-verification"',
    );
    const renderBuildCall = verifyRelease.indexOf('["run", "render:build"]');

    expect(safetyCheck).toBeGreaterThan(-1);
    expect(marker).toBeGreaterThan(safetyCheck);
    expect(renderBuildCall).toBeGreaterThan(marker);
  });

  it("proves the database is disposable inside the disposable branch, before any migration runs", () => {
    const disposableBranch = renderBuild.slice(
      renderBuild.indexOf('KLINIKOS_ALLOW_MIGRATION_DEPLOY === "disposable-verification"'),
    );
    const assertion = disposableBranch.indexOf("assertDisposableDatabase");
    const deploy = disposableBranch.indexOf('["node_modules/prisma/build/index.js", "migrate", "deploy"]');

    expect(assertion).toBeGreaterThan(-1);
    expect(deploy).toBeGreaterThan(assertion);
  });

  it("keeps one shared implementation of the disposable-database check", () => {
    expect(renderBuild).toContain("release/disposable-database-safety.mjs");
    expect(verifyRelease).toContain("release/disposable-database-safety.mjs");
    expect(verifyRelease).not.toMatch(/async function assertDisposableDatabase/);
    expect(renderBuild).not.toMatch(/async function assertDisposableDatabase/);
  });

  it("never grants the migration flag to a whole CI job", () => {
    const deployContract = qualityWorkflow.slice(qualityWorkflow.indexOf("deploy-contract:"));
    const jobEnv = deployContract.slice(
      deployContract.indexOf("env:"),
      deployContract.indexOf("services:"),
    );
    expect(jobEnv).not.toContain("KLINIKOS_ALLOW_MIGRATION_DEPLOY");
  });

  it("runs disposable database tests in Quality without widening migration authority", () => {
    const verifyJob = qualityWorkflow.slice(
      qualityWorkflow.indexOf("verify:"),
      qualityWorkflow.indexOf("deploy-contract:"),
    );
    const jobEnv = verifyJob.slice(
      verifyJob.indexOf("env:"),
      verifyJob.indexOf("services:"),
    );
    const testStep = verifyJob.slice(
      verifyJob.indexOf("- name: Test"),
      verifyJob.indexOf("- name: Verify MVP journeys"),
    );

    expect(jobEnv).not.toContain("KLINIKOS_ALLOW_MIGRATION_DEPLOY");
    expect(jobEnv).not.toContain("KLINIKOS_ALLOW_DISPOSABLE_DATABASE_TESTS");
    expect(testStep).toContain(
      "KLINIKOS_ALLOW_DISPOSABLE_DATABASE_TESTS: disposable-verification",
    );
    expect(testStep).not.toContain("KLINIKOS_ALLOW_MIGRATION_DEPLOY");
  });
});
