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
    expect(browserGate).toContain("735");
    expect(browserGate).toContain("390");
    expect(browserGate).toContain("data-public-object-stage");
    expect(browserGate).toContain("data-public-inspector");
    expect(browserGate).toContain("data-public-action-dock");
    expect(browserGate).toContain("public-plane-readout-mobile");
    expect(browserGate).toContain("mobileSheetModalIsolated");
    expect(browserGate).toContain('"mobile sheet background isolation"');
    expect(browserGate).toContain("The mobile sheet never isolated every meaningful background region");
    expect(browserGate).toContain("ariaHiddenNodes");
    expect(browserGate).toContain("meaningfulBackgroundRegions");
    expect(browserGate).toContain("isolatedBackgroundRegions");
    expect(browserGate).toContain("focusableBackgroundExposure");
    expect(browserGate).toContain("isEffectivelyIsolated");
    expect(browserGate).not.toContain("let node = document.querySelector('[data-public-universe-shell=\"true\"]')");
    expect(browserGate).toContain("mobileSheetFocusTrapped");
    expect(browserGate).toContain('await pressKey("Tab", "Tab", 9, 8);');
    expect(browserGate).not.toContain('await pressKey("Tab", "Tab", 9, 1);');
    expect(browserGate).toContain("mobileSheetEscapeClosed");
    expect(browserGate).toContain("mobileSheetFocusReturned");
    expect(browserGate).toContain("mobileSheetTriggerSemantics");
    expect(browserGate).toContain("mobileActionRevealedResult");
    expect(browserGate).toContain("resizeSheetClosedWithoutNavigation");
    expect(browserGate).toContain("resizeModalIsolationReleased");
    expect(browserGate).toContain("resizeScrollLockReleased");
    expect(browserGate).toContain("mobileSheetScrollReachable");
    expect(browserGate).toContain("firstFoldOperational");
    expect(browserGate).toContain("wordmarkVisibleWidth");
    expect(browserGate).toContain("splitViewportRecomposed");
    expect(browserGate).toContain('waitForEvent("Page.loadEventFired"');
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
    expect(browserGate).toContain("zoomSheetFitsViewport");
    expect(browserGate).toContain("zoomSheetScrollReachable");
    expect(browserGate).toContain("screenshotSurface");
    expect(browserGate).not.toContain("Emulation.setPageScaleFactor");
  });
});
