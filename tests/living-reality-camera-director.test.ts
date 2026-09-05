import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const directorPath = "src/components/living-reality/scene/camera-director.tsx";
const canvasPath = "src/components/living-reality/living-reality-canvas.tsx";
const director = existsSync(directorPath) ? readFileSync(directorPath, "utf8") : "";
const canvas = readFileSync(canvasPath, "utf8");

const cameraIntents = [
  "ARRIVAL",
  "FOCUS_OBJECT",
  "SHOW_RELATIONSHIPS",
  "INSPECT",
  "MISSION",
  "OUTCOME",
  "NETWORK_OVERVIEW",
  "TIME_COMPARE",
  "PRECISION_LOCK",
] as const;

describe("Living Reality CameraDirector", () => {
  it("exists and is wired into the one canonical Canvas", () => {
    expect(existsSync(directorPath)).toBe(true);
    expect(canvas).toContain("CameraDirector");
    expect(canvas).toContain('frameloop="demand"');
  });

  it("covers the complete camera vocabulary with bounded presentation presets", () => {
    expect(director).toContain("CAMERA_PRESETS");
    for (const intent of cameraIntents) expect(director).toContain(intent);
    expect(director).toContain("TRANSITION_MS");
    expect(director).toContain("requestAnimationFrame");
    expect(director).toContain("cancelAnimationFrame");
  });

  it("honors reduced motion with a direct snap instead of cinematic travel", () => {
    expect(director).toContain("prefers-reduced-motion: reduce");
    expect(director).toContain("reducedMotion");
    expect(director).toContain("camera.position.set");
    expect(director).toContain("invalidate()");
  });

  it("stays presentation-only without route or network side effects", () => {
    for (const forbidden of ["useRouter", "router.push", "router.replace", "fetch(", "axios"]) {
      expect(director).not.toContain(forbidden);
    }
  });
});
