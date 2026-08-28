import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePublicLivingIntent } from "@/lib/orchestration/public-living-intent";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("public Zumi access and typo routing", () => {
  it("understands the reported 'what sgoing on' typo as page context instead of generic fallback", () => {
    const result = resolvePublicLivingIntent("what sgoing on");

    expect(result.confidence).toBeGreaterThan(0.25);
    expect(result.title).toBe("You’re in Klinikos.");
    expect(result.body.toLowerCase()).toContain("public front door");
  });

  it("answers sign-up intent with the truthful access-verification path", () => {
    const result = resolvePublicLivingIntent("sign up");

    expect(result.confidence).toBeGreaterThan(0.25);
    expect(result.destination).toMatchObject({
      key: "explore",
      href: "/access",
      action: "Request Klinikos access",
    });
    expect(result.body.toLowerCase()).toContain("work email");
    expect(result.body.toLowerCase()).toContain("sign in");
    expect(result.body.toLowerCase()).not.toContain("account created");
    expect(result.body.toLowerCase()).not.toContain("self-serve account creation is live");
  });

  it("keeps existing-user login separate from new evaluation access", () => {
    const result = resolvePublicLivingIntent("log in");

    expect(result.destination).toMatchObject({ key: "signin", href: "/login" });
  });

  it("keeps the real access-verification route public on both public Zumi surfaces", () => {
    const livingHome = read("src/components/marketing/public-living-gateway.tsx");
    const siteControl = read("src/components/marketing/public-zumi-site-control.tsx");

    expect(livingHome).toContain('"/access"');
    expect(siteControl).toContain('"/access"');
    expect(livingHome).toContain("publicActionPaths.has(destination.href)");
    expect(siteControl).toContain("publicActionPaths.has(href)");
  });
});
