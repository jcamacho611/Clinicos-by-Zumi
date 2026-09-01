import { describe, expect, it } from "vitest";
import { resolvePublicLivingIntent } from "@/lib/orchestration/public-living-intent";
import { projectPublicLivingUniverseForIntent } from "@/lib/orchestration/public-living-universe";

function project(prompt: string) {
  const resolution = resolvePublicLivingIntent(prompt);
  return {
    resolution,
    universe: projectPublicLivingUniverseForIntent(prompt, resolution.destination?.key ?? null),
  };
}

describe("public Living Universe direction and governance", () => {
  it("projects offered room capacity through the supply side of the same Grid", () => {
    const { universe } = project("I have an exam room available Fridays");
    expect(universe).toMatchObject({
      side: "have",
      pathId: "clinic-monetize-capacity",
      availability: "available_now",
    });
  });

  it("projects a treatment-room need without mislabeling it as professional work", () => {
    const { universe } = project("I need a treatment room Saturday");
    expect(universe).toMatchObject({ side: "need", pathId: "find-healthcare-resource" });
  });

  it("keeps patient discovery private and outside public Grid supply", () => {
    const { universe } = project("Book an appointment for me");
    expect(universe).toMatchObject({ side: "need", pathId: "patient-find-care" });
    expect(universe?.governance).toMatch(/privacy|patient choice/i);
  });

  it("does not invent a Path for an unresolved objective", () => {
    const { resolution, universe } = project("Help me make this better");
    expect(resolution.destination).toBeNull();
    expect(universe).toBeNull();
  });

  it("recognizes procurement language but labels the Path as defined, not live", () => {
    const { resolution, universe } = project("Prepare our healthcare workforce RFP response");
    expect(resolution.destination).toMatchObject({ key: "procurement", href: "/dashboard" });
    expect(universe).toMatchObject({
      pathId: "prepare-procurement-response",
      availability: "defined",
    });
    expect(universe?.governance).toMatch(/authorized humans|submission/i);
  });
});
