import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("public pricing experience", () => {
  it("renders pricing from server-owned commercial definitions instead of duplicating price literals", () => {
    const page = read("src/app/pricing/page.tsx");

    expect(page).toContain("clinicCommercialOffers");
    expect(page).toContain("clinicPlans");
    expect(page).toContain("commercialAddOns");
    expect(page).toContain("plan.monthlyPriceLabel");
    expect(page).toContain("step.offer.priceLabel");
    expect(page).not.toContain('const plans = [{');
  });

  it("keeps payment and external usage truth explicit on the commercial surface", () => {
    const page = read("src/app/pricing/page.tsx");

    expect(page).toContain("Returning from checkout is never payment evidence");
    expect(page).toContain("Commercial access never becomes clinical or integration authority.");
    expect(page).toContain("prepaid customer funds");
    expect(page).toContain("explicitly authorized bounded overage");
  });

  it("uses the current Klinikos design system without raw hex drift", () => {
    const page = read("src/app/pricing/page.tsx");

    expect(page).toContain("<DsSurface>");
    expect(page).toContain("<KlinikosWordmark");
    expect(page).toContain("var(--obsidian)");
    expect(page).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
