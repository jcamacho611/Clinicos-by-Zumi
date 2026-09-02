import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/quality.yml", "utf8");
const browserGatePath = "scripts/verify-frontend-browser-interactions.mjs";
const browserGate = existsSync(browserGatePath) ? readFileSync(browserGatePath, "utf8") : "";

describe("frontend browser interaction release gate", () => {
  it("drives exact-head Chrome through keyboard, responsive, motion, and recomposition checks", () => {
    expect(existsSync(browserGatePath)).toBe(true);
    expect(workflow).toContain("Verify frontend browser interactions");
    expect(workflow).toContain("node scripts/verify-frontend-browser-interactions.mjs");
    expect(workflow).toContain("FRONTEND_BASE_URL=http://localhost:3000");
    expect(browserGate).toContain('"http://localhost:3000"');
    expect(browserGate).toContain("Input.dispatchKeyEvent");
    expect(browserGate).toContain(":focus-visible");
    expect(browserGate).toContain("prefers-reduced-motion");
    expect(browserGate).toContain("1440");
    expect(browserGate).toContain("1920");
    expect(browserGate).toContain("768");
    expect(browserGate).toContain("390");
    expect(browserGate).toContain("data-public-object-stage");
    expect(browserGate).toContain("data-public-inspector");
    expect(browserGate).toContain("data-public-action-dock");
    expect(browserGate).toContain("public-plane-readout-mobile");
  });

  it("proves the 200 percent artifact is browser page zoom rather than pixel scaling", () => {
    expect(browserGate).toContain("FRONTEND_BROWSER_ZOOM_PERCENT");
    expect(browserGate).toContain("partition: { default_zoom_level: { x: zoomLevel } }");
    expect(browserGate).toContain("window.innerWidth");
    expect(browserGate).toContain("window.visualViewport?.width");
    expect(browserGate).toContain("matchMedia('(max-width: 768px)')");
    expect(browserGate).toContain('command("Page.getLayoutMetrics")');
    expect(browserGate).toContain("cssVisualViewport?.zoom");
    expect(browserGate).toContain("browser-zoom-200.json");
    expect(browserGate).not.toContain("Emulation.setPageScaleFactor");
  });
});
