import { describe, expect, it } from "vitest";

import { resolvePublicLivingIntent } from "@/lib/orchestration/public-living-intent";

describe("public Zumi Workforce buyer routing", () => {
  it("routes workforce-board intent to the existing EDU surface with implementation-proof language", () => {
    const result = resolvePublicLivingIntent("what can you do for a workforce board");

    expect(result.destination).toMatchObject({ key: "edu", href: "/edu" });
    expect(result.body.toLowerCase()).toContain("already");
    expect(result.body.toLowerCase()).toContain("live instructor-led");
    expect(result.body.toLowerCase()).toContain("verified attendance");
    expect(result.body.toLowerCase()).toContain("instructor-controlled completion");
    expect(result.body.toLowerCase()).toContain("reporting");
  });

  it("routes AI workforce training intent to EDU without claiming a customer or award", () => {
    const result = resolvePublicLivingIntent("AI workforce training for our regional workforce system");

    expect(result.destination).toMatchObject({ key: "edu", href: "/edu" });
    expect(result.body.toLowerCase()).toContain("five occupational pathways");
    expect(result.body.toLowerCase()).toContain("career readiness");
    expect(result.body.toLowerCase()).toContain("zumi");
    expect(result.body.toLowerCase()).not.toContain("scwdb is a customer");
    expect(result.body.toLowerCase()).not.toContain("kentucky deployed");
    expect(result.body.toLowerCase()).not.toContain("award");
  });
});
