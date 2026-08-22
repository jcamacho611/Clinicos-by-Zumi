import { describe, expect, it } from "vitest";
import { isLive, nextTruthStage, truthChain, truthStates, type TruthStage } from "@/lib/design/truth-state";
import { RoseAtmosphere } from "@/components/brand/rose-atmosphere";
import fs from "node:fs";
import path from "node:path";

describe("truth states never collapse into one green check", () => {
  it("keeps every stage distinguishable without relying on colour", () => {
    const labels = new Set<string>();
    const marks = new Set<string>();
    for (const spec of Object.values(truthStates)) {
      labels.add(spec.label);
      marks.add(spec.mark);
    }
    // A state a person cannot tell apart from another is a state the product has not
    // really made. Distinct labels and distinct non-colour marks, both required.
    expect(labels.size).toBe(Object.keys(truthStates).length);
    expect(marks.size).toBe(Object.keys(truthStates).length);
  });

  it("separates configured, verified, authorized and actually working", () => {
    // The four facts a single green check destroys.
    const ranks = truthChain.map((stage) => truthStates[stage].rank);
    expect(ranks).toEqual([0, 1, 2, 3, 4]);
    for (const stage of ["configured", "provider_verified", "authorized"] as TruthStage[]) {
      expect(isLive(stage), `${stage} must not read as live`).toBe(false);
    }
    expect(isLive("proven_in_production")).toBe(true);
  });

  it("treats the off-path states as stops, not steps toward production", () => {
    for (const stage of ["manual_fallback", "human_review", "blocked", "failed"] as TruthStage[]) {
      expect(truthStates[stage].rank, `${stage} should not sit on the chain`).toBeNull();
      expect(isLive(stage)).toBe(false);
      expect(nextTruthStage(stage)).toBeNull();
    }
  });

  it("walks the chain forward and stops at the end", () => {
    expect(nextTruthStage("not_configured")).toBe("configured");
    expect(nextTruthStage("authorized")).toBe("proven_in_production");
    expect(nextTruthStage("proven_in_production")).toBeNull();
  });

  it("says what is not true at each stage, not only what is", () => {
    for (const spec of Object.values(truthStates)) {
      expect(spec.meaning.length, `${spec.stage} has no meaning`).toBeGreaterThan(30);
      expect(spec.meaning.endsWith("."), `${spec.stage} meaning is not a sentence`).toBe(true);
    }
    // The three stages most often over-claimed each explicitly disclaim the next one.
    expect(truthStates.configured.meaning).toMatch(/does not mean/i);
    expect(truthStates.provider_verified.meaning).toMatch(/not yet/i);
    expect(truthStates.authorized.meaning).toMatch(/nothing has gone through/i);
  });
});

describe("the rose is atmosphere, and stays out of the way", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/components/brand/rose-atmosphere.tsx"), "utf8");

  it("exists as one reusable layer with the four approved intensities", () => {
    expect(RoseAtmosphere).toBeTypeOf("function");
    for (const variant of ["living-home", "public-funnel", "transition", "workspace"]) {
      expect(source).toContain(`"${variant}"`);
    }
  });

  it("moves the background slower than the content, which is what reads as depth", () => {
    const drifts = [...source.matchAll(/drift:\s*([\d.]+)/g)].map((match) => Number(match[1]));
    expect(drifts.length).toBe(4);
    for (const drift of drifts) {
      expect(drift, "a drift of 0 is a static image; 1 or more moves with the page").toBeGreaterThan(0);
      expect(drift).toBeLessThan(1);
    }
    // The funnel variant is the one asked to follow the composition at roughly a third
    // of scroll velocity, so it reads as one object rather than an image per section.
    const funnelDrift = Number(source.match(/"public-funnel":\s*\{\s*drift:\s*([\d.]+)/)?.[1]);
    expect(funnelDrift).toBeGreaterThanOrEqual(0.25);
    expect(funnelDrift).toBeLessThanOrEqual(0.35);
  });

  it("keeps a giant flower off the operational surfaces", () => {
    // A table of money that needs attention should not compete with a rose.
    const workspaceOpacity = Number(source.match(/workspace:\s*\{[\s\S]*?opacity:\s*([\d.]+)/)?.[1]);
    const homeOpacity = Number(source.match(/"living-home":\s*\{[\s\S]*?opacity:\s*([\d.]+)/)?.[1]);
    expect(workspaceOpacity).toBeLessThan(homeOpacity);
    expect(workspaceOpacity).toBeLessThanOrEqual(0.2);
  });

  it("removes the parallax under reduced motion but keeps the atmosphere", () => {
    expect(source).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
    // The reduced-motion answer is a still background, not a missing one: the layer is
    // still rendered, only its transform is cleared.
    expect(source).toMatch(/if \(!motionAllowed\)[\s\S]{0,400}style\.transform = ""/);
    expect(source).not.toMatch(/if \(!motionAllowed\)[\s\S]{0,200}return null/);
  });

  it("is decorative to assistive technology and never intercepts a click", () => {
    expect(source).toContain('aria-hidden="true"');
    expect(source).toContain('role="presentation"');
    expect(source).toContain('pointerEvents: "none"');
    // No alt text: there is nothing here a screen reader should narrate.
    expect(source).not.toMatch(/alt=/);
  });

  it("writes at most one transform per frame", () => {
    // Scroll handlers that write on every event cause layout thrash on the operational
    // surfaces where this runs beside real work.
    expect(source).toContain("requestAnimationFrame");
    expect(source).toContain("{ passive: true }");
    expect(source).toMatch(/if \(!frame\) frame = window\.requestAnimationFrame/);
  });
});
