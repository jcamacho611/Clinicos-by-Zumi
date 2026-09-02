import { describe, expect, it } from "vitest";
import { resolvePublicLivingIntent } from "@/lib/orchestration/public-living-intent";
import { projectPublicLivingUniverseForIntent } from "@/lib/orchestration/public-living-universe";
import { isUniverseProjection } from "@/components/marketing/public-living-gateway";

function project(prompt: string) {
  const resolution = resolvePublicLivingIntent(prompt);
  return {
    resolution,
    universe: projectPublicLivingUniverseForIntent(prompt, resolution.destination?.key ?? null),
  };
}

describe("public Living Universe direction and governance", () => {
  it.each([
    ["I need care", "patient-find-care"],
    ["I need work", "find-extra-work"],
    ["I need someone tomorrow", "fill-staffing-need"],
    ["I have my own client and need somewhere to treat them", "find-healthcare-resource"],
    ["I need a room to treat a client", "find-healthcare-resource"],
    ["I have space available at my clinic", "clinic-monetize-capacity"],
    ["I want to learn a healthcare skill", null],
    ["I need a clinical placement", "student-clinical-placement"],
    ["I can take students for clinical placement", "organization-education-partner"],
    ["Help me run my practice", "clinic-operational-optimization"],
    ["I need to get paid for work we already did", "clinic-improve-revenue"],
    ["I want to grow my healthcare business", "provider-to-clinic-owner"],
  ])("keeps the advertised action %s on its intended governed Path", (prompt, expectedPathId) => {
    expect(project(prompt).universe?.pathId ?? null).toBe(expectedPathId);
  });

  it("projects offered room capacity through the supply side of the same Grid", () => {
    const { universe } = project("I have an exam room available Fridays");
    expect(universe).toMatchObject({
      side: "have",
      pathId: "clinic-monetize-capacity",
      availability: "available_now",
      continuationHref: "/member?path=clinic-monetize-capacity",
    });
  });

  it("projects a treatment-room need without mislabeling it as professional work", () => {
    const { universe } = project("I need a treatment room Saturday");
    expect(universe).toMatchObject({
      side: "need",
      pathId: "find-healthcare-resource",
      availability: "requires_setup",
    });
    expect(JSON.stringify(universe)).not.toMatch(/real availability|currently published resource truth/i);
  });

  it("keeps generic work on the professional-work Path instead of collapsing it into equipment discovery", () => {
    const { resolution, universe } = project("I need work");

    expect(resolution.destination?.key).toBe("grid");
    expect(universe).toMatchObject({
      side: "need",
      pathId: "find-extra-work",
      availability: "requires_verification",
    });
  });

  it("does not invent a clinical-placement Path for a generic learning request", () => {
    const { resolution, universe } = project("I want to learn a healthcare skill");

    expect(resolution.destination?.key).toBe("edu");
    expect(universe).toBeNull();
  });

  it("keeps patient discovery private and outside public Grid supply", () => {
    const { universe } = project("Book an appointment for me");
    expect(universe).toMatchObject({
      side: "need",
      pathId: "patient-find-care",
      continuationHref: "/member?path=patient-find-care",
    });
    expect(universe?.governance).toMatch(/privacy|patient choice/i);
  });

  it("routes every goal through the person-owned Living Home while preserving only the catalog path id", () => {
    const rawPrompt = "I need a 240-hour clinical placement in Queens for my fall term";
    const universe = projectPublicLivingUniverseForIntent(rawPrompt, "edu");

    expect(universe).toMatchObject({
      pathId: "student-clinical-placement",
      continuationHref: "/member?path=student-clinical-placement",
    });
    expect(JSON.stringify(universe)).not.toContain(rawPrompt);
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

  it("rejects malformed wire projections and mismatched continuation ids", () => {
    const valid = projectPublicLivingUniverseForIntent("I need work", "grid");
    expect(valid?.pathId).toBe("find-extra-work");
    expect(isUniverseProjection(valid)).toBe(true);
    expect(isUniverseProjection({ ...valid, steps: [null] })).toBe(false);
    expect(isUniverseProjection({ ...valid, availability: "live_and_verified" })).toBe(false);
    expect(isUniverseProjection({ ...valid, continuationHref: "/member?path=patient-find-care" })).toBe(false);
  });
});
