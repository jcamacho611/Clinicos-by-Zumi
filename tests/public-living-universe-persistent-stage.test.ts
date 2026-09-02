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
    expect(gateway).toContain("Ask Klinikos anything...");
    expect(gateway).toContain("Do not enter patient information here.");
  });

  it("uses the approved identity artwork and a scarce Living Edge", () => {
    expect(gateway).toContain("<KlinikosWordmark");
    expect(footer).toContain("<KlinikosWordmark");
    expect(gateway).toContain("data-living-edge");
    expect(gateway.match(/data-living-edge/g) ?? []).toHaveLength(2);
  });

  it("keeps the active Path readable as Obsidian inside the Marble Object Stage", () => {
    expect(stage).toContain('bg-[#12090b]');
    expect(stage).toContain('data-material={variant}');
    expect(gateway).toContain('variant="obsidian"');
  });

  it("keeps one Zumi action dock inside the dominant Object Stage", () => {
    const stageIndex = gateway.indexOf(`<section className={styles.stage}`);
    const composerIndex = gateway.indexOf(`<div className={styles.composerDock}`);
    const stageCloseIndex = gateway.indexOf(`<aside className={styles.contextRail}`);
    expect(stageIndex).toBeGreaterThan(0);
    expect(composerIndex).toBeGreaterThan(stageIndex);
    expect(composerIndex).toBeLessThan(stageCloseIndex);
    expect(gateway.match(/className=\{styles\.composerDock\}/g) ?? []).toHaveLength(1);
    expect(materials).toContain(".composerDock");
    expect(materials).toContain("min-height: 112px");
  });

  it("keeps progress, Object Stage, and context in the approved desktop order without mobile column stacking", () => {
    const progressIndex = gateway.indexOf(`<aside aria-label="Public interface progress"`);
    const stageIndex = gateway.indexOf(`<section className={styles.stage}`);
    const contextIndex = gateway.indexOf(`<aside className={styles.contextRail}`);
    expect(progressIndex).toBeGreaterThan(0);
    expect(stageIndex).toBeGreaterThan(progressIndex);
    expect(contextIndex).toBeGreaterThan(stageIndex);
    expect(materials).toContain('grid-template-areas: "progress stage context"');
    expect(materials).toContain("@media (max-width: 1024px)");
    expect(materials).toContain(".experienceRail,");
    expect(materials).toContain(".contextRail { display: none; }");
    expect(materials).not.toContain('grid-template-areas: "stage" "progress" "context"');
  });
});
