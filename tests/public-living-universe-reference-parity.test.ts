import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");
const gateway = read("src/components/marketing/public-living-gateway.tsx");
const stage = read("src/components/marketing/public-living-universe-stage.tsx");
const materials = read("src/components/marketing/public-living-universe-shell.module.css");

function cssRule(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const start = materials.search(new RegExp(`(?:^|\\n)${escaped}\\s*\\{`));
  if (start < 0) return "";
  const open = materials.indexOf("{", start);
  const close = materials.indexOf("}", open);
  return open < 0 || close < 0 ? "" : materials.slice(open + 1, close);
}

describe("public Living Universe approved-reference convergence", () => {
  it("uses the approved 102px header, identity assets, and rose environment", () => {
    expect(gateway).toContain("<KlinikosWordmark");
    expect(cssRule(".header")).toContain("min-height: 102px");
    expect(materials).toContain("url('/klinikos-rose-hero-production.png')");
    expect(materials).toContain("url('/klinikos-rose-wide-production.png')");
  });

  it("renders a truthful public-interface progress rail in the approved order", () => {
    const labels = ["Listening", "Understanding", "Connecting", "Preparing", "Ready"];
    let previous = -1;
    for (const label of labels) {
      const index = gateway.indexOf(`\"${label}\"`);
      expect(index, `${label} is missing from the public-interface rail`).toBeGreaterThan(previous);
      previous = index;
    }
    expect(gateway).toContain("This rail reflects this page only");
    expect(gateway).toContain("data-interface-state");
  });

  it("keeps the action-first Object Stage dominant with an overlapping Zumi composer", () => {
    expect(gateway).toContain('data-public-object-stage="true"');
    expect(gateway).toContain("What do you need today?");
    expect(gateway).toContain("styles.zumiPresence");
    expect(gateway).toContain("styles.composerDock");
    expect(cssRule(".composer")).toContain("min-height: 112px");
    expect(cssRule(".composerDock")).toContain("width: min(780px, 100%)");
    expect(cssRule(".zumiPresence > span")).toContain("width: 92px");
    expect(cssRule(".zumiPresence > span")).toContain("height: 92px");
    expect(materials).toContain("position: absolute");
  });

  it("offers four real action objects and every existing ordinary-language intent", () => {
    expect(gateway).toContain('const FEATURED_ACTION_IDS = ["care", "work", "rooms", "placement"] as const');
    expect(gateway).toContain("FEATURED_PUBLIC_ACTIONS.map");
    expect(gateway).toContain("PUBLIC_LIVING_ACTIONS.filter");
    expect(gateway).toContain("sendPrompt(action.prompt, action.id)");
    expect(gateway).toContain('data-public-object-row="true"');
    expect(gateway).toContain('data-public-lower-strip="true"');
    expect(gateway).toContain('data-public-inspector="true"');
  });

  it("uses a healthcare-network lower strip and never restores automobile imagery", () => {
    expect(gateway).toContain('data-public-lower-strip="true"');
    expect(`${gateway}\n${materials}`).not.toMatch(/speedster|automobile|porsche|sports[ -]?car|car-image/i);
  });

  it("uses progressive-disclosure drawers and bottom navigation below desktop", () => {
    expect(gateway).toContain('aria-label="Living Universe mobile controls"');
    expect(gateway).toContain("styles.mobileDrawer");
    expect(gateway).toContain("styles.mobileDock");
    expect(materials).toContain("@media (max-width: 1024px)");
    expect(materials).not.toContain('grid-template-areas: "stage" "lens" "intent"');
  });

  it("keeps public typography at or above 12px", () => {
    const cssSizes = [...materials.matchAll(/font-size:\s*([0-9.]+)px/g)].map((match) => Number(match[1]));
    const arbitraryTextSizes = [...`${gateway}\n${stage}`.matchAll(/text-\[([0-9.]+)px\]/g)]
      .map((match) => Number(match[1]));

    expect(cssSizes.length).toBeGreaterThan(0);
    expect(Math.min(...cssSizes), `CSS typography dropped below 12px: ${cssSizes.join(", ")}`).toBeGreaterThanOrEqual(12);
    expect(
      arbitraryTextSizes.length ? Math.min(...arbitraryTextSizes) : 12,
      `TSX typography dropped below 12px: ${arbitraryTextSizes.join(", ")}`,
    ).toBeGreaterThanOrEqual(12);
  });

  it("gives every public control family at least a 44px target", () => {
    for (const selector of [
      ".headerLink",
      ".joinLink",
      ".mobileMenu summary",
      ".planeButton",
      ".actionButton",
      ".featuredButton",
      ".intentLibrary summary",
      ".mobileDrawer summary",
    ]) {
      const target = cssRule(selector).match(/min-height:\s*([0-9.]+)px/);
      expect(Number(target?.[1] ?? 0), `${selector} has no 44px target contract`).toBeGreaterThanOrEqual(44);
    }
    expect(cssRule(".sendButton")).toMatch(/(?:width|height):\s*(?:44|4[5-9]|[5-9][0-9])px/);
  });
});
