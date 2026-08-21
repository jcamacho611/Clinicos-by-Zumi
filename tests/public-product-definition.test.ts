import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("public product definition", () => {
  const page = read("src/app/page.tsx");
  const definition = read("src/components/marketing/public-product-definition.tsx");

  it("explains Klinikos before the visitor is asked to use public Zumi", () => {
    expect(page.indexOf("<PublicProductDefinition />")).toBeGreaterThan(0);
    expect(page.indexOf("<PublicProductDefinition />")).toBeLessThan(page.indexOf("<PublicLivingGateway />"));
    expect(definition).toContain("AI-native clinic operating system");
    expect(definition).toContain("Run your clinic from one intelligent operating system.");
    expect(definition).toContain("scheduling, follow-up, referrals, team workflows, documents, revenue work, and owner visibility");
  });

  it("states the differentiated unfinished-work job instead of relying on the operating-system label alone", () => {
    expect(definition).toContain("unfinished work stays visible");
    expect(definition).toContain("an owner and a next action");
    expect(definition).toContain("between systems and handoffs");
  });

  it("makes the ecosystem hierarchy explicit without presenting four competing products", () => {
    expect(definition).toContain('["Klinikos", "clinic operating system"]');
    expect(definition).toContain('["Zumi", "intelligence layer"]');
    expect(definition).toContain('["Grid", "healthcare network"]');
    expect(definition).toContain('["EDU", "learning and advancement"]');
  });

  it("keeps primary clinic and explanatory actions reachable without requiring a Zumi message", () => {
    expect(definition).toContain('href="/klinikos"');
    expect(definition).toContain("See Klinikos for clinics");
    expect(definition).toContain('href="/how-it-works"');
    expect(definition).toContain("See how the system works");
  });

  it("does not overclaim public Zumi authority", () => {
    expect(definition).toContain("cannot access private clinic records or make changes");
  });

  it("uses plain-language homepage metadata", () => {
    expect(page).toContain('title: "Klinikos | AI-native clinic operating system"');
    expect(page).toContain("scheduling, follow-up, referrals, team workflows, documents, revenue work, and owner visibility");
  });
});
