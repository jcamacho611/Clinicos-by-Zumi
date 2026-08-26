import { describe, expect, it } from "vitest";
import { protectedPublicContinuationHref } from "@/lib/distribution/public-continuation";

describe("public intent continuation", () => {
  it("carries only bounded structured intent through canonical returnTo", () => {
    expect(protectedPublicContinuationHref("/dashboard", "clinic")).toBe(
      "/login?returnTo=%2Fdashboard%3Ffrom%3Dpublic-zumi%26intent%3Dclinic",
    );
  });

  it("preserves an existing destination query while adding source metadata", () => {
    const href = protectedPublicContinuationHref("/grid/workspace?tab=matches", "grid");
    expect(decodeURIComponent(href)).toContain("/grid/workspace?tab=matches&from=public-zumi&intent=grid");
  });

  it("rejects external destinations", () => {
    expect(protectedPublicContinuationHref("https://evil.example", "grid")).toBe("/login");
    expect(protectedPublicContinuationHref("//evil.example", "grid")).toBe("/login");
  });

  it("drops unsafe free-text intent instead of serializing it", () => {
    expect(protectedPublicContinuationHref("/dashboard", "patient record for Jane Doe")).toBe(
      "/login?returnTo=%2Fdashboard%3Ffrom%3Dpublic-zumi",
    );
  });

  it("does not place raw healthcare prompts in the continuation URL", () => {
    const href = protectedPublicContinuationHref("/provider", "care");
    expect(href).not.toContain("patient");
    expect(href).not.toContain("prompt");
    expect(href).toContain("intent%3Dcare");
  });
});
