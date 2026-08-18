import { describe, expect, it } from "vitest";
import {
  boundedAttributionText,
  captureLuxeFirstTouch,
  sanitizeAttributionUrl,
  sourceFromReferrer,
} from "@/lib/luxe-public-attribution";

describe("Luxe public attribution", () => {
  it("removes query strings and fragments from stored URL context", () => {
    expect(sanitizeAttributionUrl("https://luxe-medi.com/botox?email=person@example.com&utm_source=ig#book")).toBe("https://luxe-medi.com/botox");
    expect(sanitizeAttributionUrl("javascript:alert(1)")).toBeUndefined();
  });

  it("maps common referral hosts without inventing a source", () => {
    expect(sourceFromReferrer("https://www.instagram.com/p/example")).toBe("instagram");
    expect(sourceFromReferrer("https://www.google.com/search?q=luxe")).toBe("google");
    expect(sourceFromReferrer("")).toBe("direct");
  });

  it("captures bounded first-touch campaign fields and sanitized URL context", () => {
    const params = new URLSearchParams("utm_source=instagram&utm_medium=social&utm_campaign=summer_glow&utm_term=botox&utm_content=hero");
    const result = captureLuxeFirstTouch(
      params,
      "https://luxe-medi.com/botox?private=value",
      "https://klinikos.io/luxe/consult?service=Botox&utm_source=instagram",
    );
    expect(result).toEqual({
      source: "instagram",
      medium: "social",
      campaign: "summer_glow",
      term: "botox",
      content: "hero",
      landingPage: "https://klinikos.io/luxe/consult",
      referrer: "https://luxe-medi.com/botox",
    });
  });

  it("bounds free-form attribution values", () => {
    expect(boundedAttributionText("x".repeat(200), 120)).toHaveLength(120);
  });
});
