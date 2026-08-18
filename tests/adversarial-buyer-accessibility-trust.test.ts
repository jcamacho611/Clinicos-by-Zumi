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
  const terms = read("src/app/legal/terms/page.tsx");
  const acceptableUse = read("src/app/legal/acceptable-use/page.tsx");
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
  });

  it("publishes buyer-safe trust principles without revealing infrastructure readiness or vendor topology", () => {
    expect(trust).toContain("Clear boundaries without publishing the security blueprint.");
    expect(trust).toContain("Public surfaces are not PHI intake");
    expect(trust).toContain("Human authority remains consequential");
    expect(trust).not.toContain("GitHub Actions");
    expect(trust).not.toContain("webhook endpoint");
    expect(trust).not.toContain("feature gate");
    expect(trust).not.toContain("deployed application SHA");
    expect(trust).not.toContain("HIPAA compliant");
    expect(trust).not.toContain("HIPAA-certified");
  });

  it("publishes operative public terms and acceptable-use rules while keeping internal legal readiness private", () => {
    expect(terms).toContain("Agreement to these Terms");
    expect(terms).toContain("Ownership and intellectual property");
    expect(acceptableUse).toContain("No implied permission to test security");
    expect(fs.existsSync(path.join(process.cwd(), "src/app/legal/[document]/page.tsx"))).toBe(false);
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
    const build = renderBuild.indexOf("Building Klinikos for production before database migration");
    const migrate = renderBuild.indexOf("Application build passed. Applying Klinikos database migrations");
    expect(build).toBeGreaterThan(0);
    expect(migrate).toBeGreaterThan(build);
    expect(renderBuild).toContain("Migrations must still remain backward-compatible");
  });
});
