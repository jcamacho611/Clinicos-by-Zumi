import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

function channel(value: number) {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function luminance(hex: string) {
  const raw = hex.replace("#", "");
  const red = channel(parseInt(raw.slice(0, 2), 16));
  const green = channel(parseInt(raw.slice(2, 4), 16));
  const blue = channel(parseInt(raw.slice(4, 6), 16));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: string, background: string) {
  const first = luminance(foreground);
  const second = luminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("adversarial buyer and accessibility baseline", () => {
  const layout = read("src/app/layout.tsx");
  const accessibility = read("src/app/accessibility.css");
  const home = read("src/components/marketing/public-living-gateway.tsx");
  const trust = read("src/app/trust/page.tsx");
  const legalStatus = read("src/app/legal/[document]/page.tsx");
  const legalRegistry = read("src/lib/legal/document-registry.ts");
  const story = read("src/lib/brand/public-company-story.ts");
  const about = read("src/app/about/page.tsx");
  const renderBuild = read("scripts/render-build.mjs");

  it("provides a global keyboard bypass target and visible focus treatment loaded after theme CSS", () => {
    expect(layout).toContain('href="#klinikos-page-content"');
    expect(layout).toContain('id="klinikos-page-content"');
    expect(layout).toContain('className="klinikos-skip-link"');
    const convergenceImport = layout.indexOf('import "./experience-convergence.css"');
    const accessibilityImport = layout.indexOf('import "./accessibility.css"');
    expect(convergenceImport).toBeGreaterThan(0);
    expect(accessibilityImport).toBeGreaterThan(convergenceImport);
    expect(accessibility).toContain(":focus-visible");
    expect(accessibility).toContain("outline: 3px solid");
    expect(accessibility).toContain("forced-colors: active");
  });

  it("provides a global reduced-motion fallback", () => {
    expect(accessibility).toContain("prefers-reduced-motion: reduce");
    expect(accessibility).toContain("animation-duration: 0.001ms");
    expect(accessibility).toContain("transition-duration: 0.001ms");
    expect(accessibility).toContain("scroll-behavior: auto");
  });

  it("keeps key small public rose text and placeholders at or above the normal-text contrast floor", () => {
    for (const color of ["#9a817c", "#8f7773", "#ad928d", "#b99a95"]) {
      expect(contrast(color, "#050303")).toBeGreaterThanOrEqual(4.5);
    }
    expect(accessibility).toContain("#zumi-presence-panel");
    expect(accessibility).toContain("color: #9a817c !important");
    expect(home).not.toContain("#806f6c");
    expect(home).not.toContain("#5d4b49");
    // Pinning one file let this rule die quietly: the component was deleted and the
    // tones reappeared on a sibling the guard never read, taking the whole suite file
    // down with it. Sweep the public marketing surfaces instead, so the rule survives
    // a component being renamed, split, or replaced.
    const marketingDir = path.join(process.cwd(), "src/components/marketing");
    const lowContrastOnDark = ["#806965", "#655653"];
    const offenders: string[] = [];
    for (const file of fs.readdirSync(marketingDir)) {
      if (!file.endsWith(".tsx")) continue;
      const source = fs.readFileSync(path.join(marketingDir, file), "utf8");
      for (const tone of lowContrastOnDark) {
        if (source.includes(tone)) offenders.push(`${file} uses ${tone}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("publishes readiness as bounded status rather than compliance or integration theater", () => {
    expect(trust).toContain("Proof before promises.");
    expect(trust).toContain("Production clinical use is not implied.");
    expect(trust).toContain("Pending runtime proof");
    expect(trust).toContain("Blocked until approved");
    expect(trust).toContain("Counsel / diligence review");
    expect(trust).toContain("not a certification");
    expect(trust).toContain("Repository presence does not prove the deployed endpoint");
    expect(trust).not.toContain("live Stripe webhook endpoint is configured");
    expect(trust).not.toContain("HIPAA compliant");
    expect(trust).not.toContain("HIPAA-certified");
  });

  it("resolves every governed legal route without inventing final legal language", () => {
    expect(legalStatus).toContain("legalDocumentRegistry");
    expect(legalStatus).toContain("counsel has approved");
    expect(legalStatus).toContain("Production approved");
    expect(legalStatus).toContain("not final contractual language");
    expect(legalRegistry).toContain("counselReviewRequired: true");
    expect(legalRegistry).toContain("productionApproved: false");
  });

  it("keeps public credibility product-led rather than using academic badges as enterprise proof", () => {
    for (const phrase of ["President's List", "Dean's List", "Phi Theta Kappa", "3.8 GPA"]) {
      expect(story).not.toContain(phrase);
      expect(about).not.toContain(phrase);
    }
    expect(story).toContain("Healthcare operations exposure");
    expect(story).toContain("Security-focused technical training");
    expect(about).toContain("Leadership diligence");
    expect(about).toContain("Qualified buyers should verify leadership identity");
  });

  it("builds the application before applying deployment migrations", () => {
    /* Render builds first, then inspects migration status, and may advance the database
       only through explicitly approved additive migrations. The original rule this locked
       — never let an unbuilt or unapproved candidate change a production database — is
       unchanged; the mechanism that enforces it is now the approval gate. */
    const build = renderBuild.indexOf("Building Klinikos for production before database verification");
    const verify = renderBuild.indexOf("Verifying production migration status");
    expect(build).toBeGreaterThan(0);
    expect(verify).toBeGreaterThan(build);
    // Ordering is asserted inside the Render branch so the import of the policy helper
    // at the top of the file cannot satisfy it.
    const renderBranch = renderBuild.slice(
      renderBuild.indexOf("Render build detected"),
      renderBuild.indexOf("KLINIKOS_ALLOW_MIGRATION_DEPLOY"),
    );
    const validate = renderBranch.indexOf("validatePendingMigrations");
    const deploy = renderBranch.indexOf('"migrate", "deploy"');
    // Nothing may reach migrate deploy without passing the approval gate first.
    expect(validate).toBeGreaterThan(-1);
    expect(deploy).toBeGreaterThan(validate);
    // The unapproved deploy path stays behind the explicit disposable-verification flag.
    expect(renderBuild.indexOf("KLINIKOS_ALLOW_MIGRATION_DEPLOY")).toBeGreaterThan(verify);
    // The rule lives in a wrapped comment, so match the prose with comment markers and
    // line breaks flattened rather than requiring it to sit on one physical line.
    const prose = renderBuild.replace(/^\s*\/\/ ?/gm, "").replace(/\s+/g, " ");
    expect(prose).toContain("the old and new application versions can overlap");
    expect(prose).toContain("only explicitly approved additive migrations may advance automatically");
  });
});
