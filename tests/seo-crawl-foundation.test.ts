import { describe, expect, it } from "vitest";
import robots, { privateRoutePrefixes } from "../src/app/robots";
import sitemap, { publicSitemapPaths } from "../src/app/sitemap";

describe("public crawl foundation", () => {
  it("publishes only explicit public URLs", () => {
    const entries = sitemap();
    const paths = entries.map((entry) => new URL(entry.url).pathname);

    expect(paths).toEqual(publicSitemapPaths);
    expect(paths).toContain("/");
    expect(paths).toContain("/pricing");
    expect(paths).toContain("/trust");
    expect(paths).toContain("/founding-clinic");

    for (const path of paths) {
      expect(privateRoutePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))).toBe(false);
    }
  });

  it("keeps authenticated and payment surfaces out of crawler paths", () => {
    const policy = robots();
    const rules = Array.isArray(policy.rules) ? policy.rules : [policy.rules];
    const disallowed = rules.flatMap((rule) => rule.disallow ?? []);

    expect(disallowed).toEqual(expect.arrayContaining([
      "/api",
      "/dashboard",
      "/billing",
      "/patients",
      "/payments",
      "/portal",
      "/grid/workspace",
    ]));
    expect(policy.sitemap).toBe("https://klinikos.io/sitemap.xml");
  });
});
