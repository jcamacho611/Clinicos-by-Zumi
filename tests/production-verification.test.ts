import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The production gate complements exact-head CI and local release checks with an
 * external, read-only view of the runtime. This checks the properties that make the
 * gate trustworthy, since a verification script nobody verifies is comfortable noise.
 */

const source = fs.readFileSync(path.join(process.cwd(), "scripts/verify-production.mjs"), "utf8");

describe("the production gate is read-only and can actually fail", () => {
  it("acts as an external runtime complement rather than a substitute for CI", () => {
    expect(source).toContain("external runtime complement to exact-head CI and local release gates");
    expect(source).not.toContain("CI cannot execute");
  });

  it("performs no write of any kind against production", () => {
    // A verification script that can change production is a liability, not a check.
    expect(source).not.toMatch(/method:\s*["'](POST|PUT|PATCH|DELETE)["']/i);
    expect(source).not.toMatch(/\bprisma\b|\bdb\./);
    // No credentials are sent, so it can only ever see what an anonymous visitor sees.
    expect(source).not.toMatch(/Authorization|Cookie:|api[_-]?key/i);
  });

  it("fails the run rather than reporting a problem and exiting zero", () => {
    expect(source).toContain("process.exitCode = 1");
    expect(source).toContain("failures.push");
  });

  it("treats a private route rendering to an anonymous visitor as a failure", () => {
    // This is the check worth the most: a 200 with records here is a data exposure, not
    // a broken link.
    expect(source).toContain("RENDERS TO AN ANONYMOUS VISITOR");
    for (const route of ["/dashboard", "/patients", "/billing", "/settings"]) {
      expect(source, `${route} is not probed`).toContain(`"${route}"`);
    }
  });

  it("requires production to name the commit it is running", () => {
    // Before the build stamped its own commit this was always null, and "what is
    // actually running?" was unanswerable during exactly the incident where it matters.
    expect(source).toContain("cannot name the commit it is running");
    expect(source).toContain("is not on origin/main");
  });

  it("proves the browser-visible Living Universe came from the running release", () => {
    expect(source).toContain("klinikos-release");
    expect(source).toContain("htmlCommit !== liveCommit");
    expect(source).toContain("ROOT_DOCUMENT_LIMIT");
    for (const marker of [
      'data-public-universe-shell="true"',
      'data-public-object-stage="true"',
      'data-public-plane-lens="true"',
      'data-public-inspector="true"',
      'data-public-action-dock="true"',
      'data-public-intent-constellation="true"',
      "What do you need today?",
    ]) {
      expect(source, `does not require ${marker}`).toContain(marker);
    }
    expect(source).toContain("data-public-action-id");
    expect(source).toContain("publicActionIds.size < 12");
    expect(source).toContain('for (const side of ["need", "have"])');
    for (const retired of ["One system, three extensions", "What it actually does"]) {
      expect(source, `does not reject ${retired}`).toContain(retired);
    }
  });

  it("checks the public health payload carries no secret", () => {
    for (const secret of ["postgres://", "sk_live", "whsec_", "AUTH_SECRET"]) {
      expect(source, `does not check for ${secret}`).toContain(secret);
    }
  });

  it("is wired as a script so it can be run without remembering the path", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    expect(pkg.scripts["verify:production"]).toBe("node scripts/verify-production.mjs");
  });
});
