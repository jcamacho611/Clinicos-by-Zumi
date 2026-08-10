import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BANNED_VISUAL_DEVICES,
  beatOrbState,
  classifySurface,
  governanceFor,
  motionIsPermitted,
  NARRATIVE_SEQUENCE,
  QUALITY_TESTS,
  SIGNATURE_DEVICE,
} from "@/lib/design/design-architecture";
import { zumiStates } from "@/components/ds";

/**
 * The four references each have one job. The failure mode this guards against is
 * averaging them into generic futuristic SaaS — in particular, letting the
 * marketing site's narrative motion leak into a workspace.
 */

describe("surface classification", () => {
  it("treats the marketing narrative and the workspace as different disciplines", () => {
    expect(classifySurface("/sales")).toBe("marketing");
    expect(classifySurface("/edu")).toBe("marketing");
    expect(classifySurface("/edu/dashboard")).toBe("product");
    expect(classifySurface("/grid/requests")).toBe("product");
    expect(classifySurface("/admin/grid")).toBe("product");
  });

  it("resolves by longest prefix, so a nested workspace beats its marketing parent", () => {
    // /edu is the public landing; /edu/grading is a workspace inside it.
    expect(classifySurface("/edu")).toBe("marketing");
    expect(classifySurface("/edu/grading")).toBe("product");
    expect(classifySurface("/grid/join")).toBe("marketing");
    expect(classifySurface("/grid/browse")).toBe("marketplace");
  });

  it("defaults an unclassified route to the stricter budget", () => {
    // A new workspace nobody classified must not inherit permission to animate.
    expect(classifySurface("/some/new/workspace")).toBe("product");
    expect(governanceFor("/some/new/workspace").motionBudget).toBe("state-change-only");
  });

  it("puts each surface on the ground its discipline calls for", () => {
    expect(governanceFor("/sales").ground).toBe("obsidian");
    expect(governanceFor("/edu/dashboard").ground).toBe("obsidian");
    expect(governanceFor("/grid/browse").ground).toBe("paper");
  });
});

describe("the motion rule", () => {
  it("removes motion that teaches nothing, on any surface", () => {
    const decorative = { teaches: "", reportsStateChange: false, isInputFeedback: false };
    for (const route of ["/sales", "/edu/dashboard", "/grid/browse"]) {
      expect(motionIsPermitted(route, decorative)).toMatchObject({ permitted: false, reason: "teaches_nothing" });
    }
  });

  it("allows narrative motion on marketing, where the movement is the argument", () => {
    const narrative = { teaches: "fragmented signals converging into continuity", reportsStateChange: false, isInputFeedback: false };
    expect(motionIsPermitted("/sales", narrative).permitted).toBe(true);
  });

  it("refuses that same narrative motion inside a workspace", () => {
    // An operator already knows what Klinikos is. Narrative motion here is an
    // interruption wearing a costume.
    const narrative = { teaches: "fragmented signals converging into continuity", reportsStateChange: false, isInputFeedback: false };
    expect(motionIsPermitted("/edu/dashboard", narrative)).toMatchObject({
      permitted: false,
      reason: "narrative_motion_in_workspace",
    });
  });

  it("allows a workspace to report a real state change", () => {
    const stateChange = { teaches: "this submission moved to graded", reportsStateChange: true, isInputFeedback: false };
    expect(motionIsPermitted("/edu/grading", stateChange).permitted).toBe(true);
  });

  it("confines the marketplace to acknowledging input", () => {
    const stateChange = { teaches: "a listing changed availability", reportsStateChange: true, isInputFeedback: false };
    expect(motionIsPermitted("/grid/browse", stateChange)).toMatchObject({ permitted: false, reason: "motion_beyond_feedback" });

    const press = { teaches: "", reportsStateChange: false, isInputFeedback: true };
    expect(motionIsPermitted("/grid/browse", press).permitted).toBe(true);
  });
});

describe("the signature", () => {
  it("names exactly one signature device", () => {
    expect(SIGNATURE_DEVICE).toBe("zumi-orb");
  });

  it("maps every narrative beat to a real orb state", () => {
    for (const beat of NARRATIVE_SEQUENCE) {
      expect(zumiStates).toContain(beatOrbState[beat]);
    }
  });

  it("opens dormant and closes resolved, so the story lands somewhere", () => {
    expect(beatOrbState[NARRATIVE_SEQUENCE[0]]).toBe("dormant");
    expect(beatOrbState[NARRATIVE_SEQUENCE[NARRATIVE_SEQUENCE.length - 1]]).toBe("resolved");
  });

  it("carries the full seven-beat narrative", () => {
    expect(NARRATIVE_SEQUENCE).toEqual([
      "fragmentation", "observation", "connection", "intelligence", "action", "accountability", "control",
    ]);
  });
});

describe("banned visual devices", () => {
  const designSources = [
    "src/lib/design/command-system.ts",
    "src/lib/design/marketplace-system.ts",
  ];

  it("uses no decorative gradient wash", () => {
    // The system permits flat obsidian or flat paper. The only texture allowed is
    // the Zumi orb's own geometry.
    for (const source of designSources) {
      const text = readFileSync(join(process.cwd(), source), "utf8");
      const gradients = text.match(/bg-\[(?:radial|linear)-gradient/g) ?? [];
      expect({ source, gradients }).toEqual({ source, gradients: [] });
    }
  });

  it("pops no shadow on hover", () => {
    for (const source of [...designSources, "src/components/grid/marketplace-browser.tsx"]) {
      const text = readFileSync(join(process.cwd(), source), "utf8");
      expect({ source, hits: text.match(/hover:shadow/g) ?? [] }).toEqual({ source, hits: [] });
    }
  });

  it("enumerates the devices the system rules out", () => {
    expect(BANNED_VISUAL_DEVICES).toContain("pill buttons");
    expect(BANNED_VISUAL_DEVICES).toContain("shadow-pop on hover");
    expect(BANNED_VISUAL_DEVICES).toContain("emoji");
  });
});

describe("acceptance tests", () => {
  it("keeps all four reference tests with the code", () => {
    expect(QUALITY_TESTS.map((test) => test.name)).toEqual(["Jensen", "Virgil", "Nolan", "Jobs"]);
    for (const test of QUALITY_TESTS) {
      expect(test.question.endsWith("?") || test.question.includes("remove it")).toBe(true);
    }
  });
});
