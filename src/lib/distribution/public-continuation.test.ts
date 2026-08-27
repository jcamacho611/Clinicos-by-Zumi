import { describe, expect, it } from "vitest";
import {
  protectedPublicContinuationHref,
  publicContinuationHref,
  publicLivingDestinationHref,
} from "@/lib/distribution/public-continuation";

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
    expect(publicContinuationHref("https://evil.example", "grid")).toBe("/");
    expect(publicContinuationHref("//evil.example", "grid")).toBe("/");
  });

  it("drops unsafe free-text intent instead of serializing it", () => {
    expect(protectedPublicContinuationHref("/dashboard", "patient record for Jane Doe")).toBe(
      "/login?returnTo=%2Fdashboard%3Ffrom%3Dpublic-zumi",
    );
    expect(publicContinuationHref("/grid", "patient record for Jane Doe")).toBe(
      "/grid?from=public-zumi",
    );
  });

  it("does not place raw healthcare prompts in the continuation URL", () => {
    const href = protectedPublicContinuationHref("/provider", "care");
    expect(href).not.toContain("patient");
    expect(href).not.toContain("prompt");
    expect(href).toContain("intent%3Dcare");
  });

  it("preserves safe structured Zumi intent when the next value surface is public", () => {
    expect(publicContinuationHref("/grid", "staffing")).toBe(
      "/grid?from=public-zumi&intent=staffing",
    );
    expect(publicContinuationHref("/edu?track=clinical", "edu")).toBe(
      "/edu?track=clinical&from=public-zumi&intent=edu",
    );
  });

  it("routes a public Zumi destination without losing the value-first journey", () => {
    expect(publicLivingDestinationHref({ href: "/grid", key: "staffing" })).toBe(
      "/grid?from=public-zumi&intent=staffing",
    );
    expect(publicLivingDestinationHref({ href: "/edu", key: "edu" })).toBe(
      "/edu?from=public-zumi&intent=edu",
    );
    expect(publicLivingDestinationHref({ href: "/portal", key: "patient" })).toBe(
      "/portal/login",
    );
    expect(publicLivingDestinationHref({ href: "/dashboard", key: "clinic" })).toBe(
      "/login?returnTo=%2Fdashboard%3Ffrom%3Dpublic-zumi%26intent%3Dclinic",
    );
  });
});
