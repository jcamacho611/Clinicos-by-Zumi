import { describe, expect, it } from "vitest";
import type { PublicLivingUniverseProjection } from "@/lib/orchestration/public-living-universe";
import { publicPathRealityProjection } from "@/lib/living-reality/public-path-reality-projection";

const item: PublicLivingUniverseProjection = {
  id: "work",
  label: "Find healthcare work",
  side: "need",
  pathId: "find-extra-work",
  title: "Find extra healthcare work",
  summary: "Move from a work need into governed matching.",
  from: "I need work",
  to: "A governed work opportunity",
  availability: "requires_verification",
  availabilityCopy: "Needs verification first",
  governance: "Professional verification and eligibility remain separate decisions.",
  commercialBoundary: null,
  continuationHref: "/member?path=find-extra-work",
  steps: [
    { label: "Create identity", description: "Start with one Person identity.", state: "complete" },
    { label: "Verify evidence", description: "Review credentials and evidence.", state: "current" },
    { label: "Match", description: "Eligible opportunities can be compared.", state: "upcoming" },
  ],
};

describe("P01 public Path Reality", () => {
  it("contains only the real Path and its real checkpoints", () => {
    const projection = publicPathRealityProjection(item);
    expect(projection.nodes).toHaveLength(item.steps.length + 1);
    expect(projection.edges).toHaveLength(item.steps.length);
    expect(projection.nodes.map((node) => node.label)).toEqual([
      item.title,
      ...item.steps.map((step) => step.label),
    ]);
  });

  it("does not synthesize people, patients, organizations or network density", () => {
    const projection = publicPathRealityProjection(item);
    expect(projection.nodes.map((node) => node.kind)).toEqual([
      "public_path",
      "path_checkpoint",
      "path_checkpoint",
      "path_checkpoint",
    ]);
    expect(JSON.stringify(projection)).not.toMatch(/patient|person_|organization_|network population|density/i);
  });

  it("derives attention only from explicit Path step states", () => {
    const projection = publicPathRealityProjection(item);
    expect(projection.attention).toEqual([
      {
        nodeId: "checkpoint:find-extra-work:1",
        level: "elevated",
        explanation: "Current modeled stage",
      },
    ]);
  });
});
