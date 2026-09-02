import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("persistent public Living Universe stage", () => {
  const gateway = read("src/components/marketing/public-living-gateway.tsx");
  const footer = read("src/components/marketing/public-trust-footer.tsx");
  const stage = read("src/components/marketing/public-living-universe-stage.tsx");
  const materials = read("src/components/marketing/public-living-universe-shell.module.css");
  const publicActions = read("src/lib/marketing/public-living-actions.ts");
  const publicInterface = read("src/lib/marketing/public-living-interface.ts");

  it("renders the Living Universe before a visitor sends a message", () => {
    expect(gateway).toContain('data-public-universe-shell="true"');
    expect(gateway).toContain('data-public-object-stage="true"');
    expect(gateway).toContain('data-public-plane-lens="true"');
    expect(gateway).toContain('data-public-inspector="true"');
    expect(gateway).toContain('data-public-action-dock="true"');
    expect(gateway).toContain("Tell Klinikos what you need, what you have, or what you are trying to become.");
  });

  it("keeps one active Path stage instead of appending a stage for every turn", () => {
    expect(gateway).toContain("activeUniverse");
    expect(gateway).toContain("setActiveUniverse");
    expect(gateway.match(/<PublicLivingUniverseObjectStage/g) ?? []).toHaveLength(1);

    const turnLoop = gateway.slice(
      gateway.indexOf("turns.map((turn)"),
      gateway.indexOf("pendingPrompt &&"),
    );
    expect(turnLoop).not.toContain("PublicLivingUniverseObjectStage");
    expect(gateway).toContain('activeUniverse\n                        ? "One active path · governed continuation"');
    expect(gateway).toContain('"More context needed · no path inferred"');
  });

  it("uses one client-safe action vocabulary for the stage and server projection", () => {
    expect(publicActions).toContain("PUBLIC_LIVING_ACTIONS");
    expect(publicActions).toContain('side: "need"');
    expect(publicActions).toContain('side: "have"');
    expect(publicActions).not.toContain("klinikosPathCatalog");
    expect(publicActions).not.toContain("pathId:");
    expect(gateway).toContain('from "@/lib/marketing/public-living-actions"');
    expect(gateway).not.toContain("const quickIntentActions = [");
    expect(gateway).toContain("sendPrompt(action.prompt, action.id)");
    expect(gateway).toContain("...(actionId ? { actionId } : {})");
  });

  it("preserves the active Path on contextual follow-up and clears it only for safety", () => {
    expect(gateway).toContain("if (suppressUniverse) setActiveUniverse(null)");
    expect(gateway).toContain("else if (replaceUniverse) setActiveUniverse(universe)");
    expect(gateway).toContain("else if (universe) setActiveUniverse(universe)");
    expect(gateway).not.toMatch(/^\s*setActiveUniverse\(universe\);/m);
  });

  it("projects exactly five presentation lenses without introducing a sixth plane", () => {
    expect(publicInterface).toContain("PUBLIC_LIVING_PLANE_LENSES");
    expect(publicInterface.match(/id: "(?:healthcare_universe|economic_resource|lifecycle|operating_infrastructure|compounding_business)"/g) ?? []).toHaveLength(5);
    expect(publicInterface).not.toMatch(/sixth[ _-]?plane/i);
    expect(gateway).toContain('aria-controls="public-plane-readout"');
    expect(gateway.match(/id="public-plane-readout"/g) ?? []).toHaveLength(1);
  });

  it("keeps the composer persistent as the action dock", () => {
    expect(gateway).toContain('id="living-composer"');
    expect(gateway).toContain('aria-label="Ask Zumi"');
    expect(gateway).toContain("Message Zumi...");
    expect(gateway).toContain("Do not enter patient information here.");
  });

  it("uses the approved identity artwork and a scarce Living Edge", () => {
    expect(gateway).toContain("<KlinikosWordmark");
    expect(gateway).toContain("<KlinikosMark");
    expect(footer).toContain("<KlinikosWordmark");
    expect(gateway).toContain("data-living-edge");
    expect(gateway.match(/data-living-edge/g) ?? []).toHaveLength(2);
  });

  it("keeps the active Path readable as Obsidian inside the Marble Object Stage", () => {
    expect(stage).toContain('bg-[#12090b]');
    expect(stage).toContain('data-material={variant}');
    expect(gateway).toContain('variant="obsidian"');
  });

  it("keeps the Zumi dock in the viewport while the stage content scrolls", () => {
    expect(materials).toContain("height: calc(100svh - 88px)");
    expect(materials).toContain("overflow: hidden");
    expect(materials).toContain("overflow-y: auto");
    expect(materials).toContain("height: calc(100svh - 74px)");
    expect(materials).toContain("@media (max-width: 960px)");
    expect(materials).not.toContain(".stage { min-height: 720px; }");
  });

  it("keeps stage, lenses, and intent in the same DOM and visual order", () => {
    const stageIndex = gateway.indexOf(`<section className={styles.stage}`);
    const lensIndex = gateway.indexOf(`<aside className={styles.lensRail}`);
    const intentIndex = gateway.indexOf(`<aside className={styles.intentRail}`);
    expect(stageIndex).toBeGreaterThan(0);
    expect(lensIndex).toBeGreaterThan(stageIndex);
    expect(intentIndex).toBeGreaterThan(lensIndex);
    expect(materials).toContain('grid-template-areas: "lens stage intent"');
    expect(materials).toContain('grid-template-areas: "stage" "lens" "intent"');
  });
});
