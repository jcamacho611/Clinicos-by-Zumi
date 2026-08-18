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

  it("keeps payment and usage truth explicit on the commercial surface", () => {
    const page = read("src/app/pricing/page.tsx");

    // These are facts a buyer must be told, not phrasings to preserve. The wording
    // moved from internal vocabulary ("payment evidence", "bounded overage",
    // "commercial access") to language an ordinary customer reads without a glossary;
    // the guard follows the fact, not the jargon.

    // 1. Coming back from the payment page is not proof of payment.
    expect(page).toMatch(/coming back from the payment page does not by itself mean you have paid/i);
    expect(page).toMatch(/we confirm that with the payment provider/i);

    // 2. Paying buys capability, never authority.
    expect(page).toMatch(/paying never changes who can sign in/i);
    expect(page).toMatch(/still needs a person to approve/i);

    // 3. Usage beyond the included allowance is never silent.
    expect(page).toMatch(/usage allowance/i);
    expect(page).toMatch(/before anything extra applies/i);

    // And the internal vocabulary must not come back.
    for (const jargon of ["payment evidence", "bounded overage", "commercial access", "payment rail", "operating depth"]) {
      expect(page.toLowerCase(), `"${jargon}" is internal vocabulary`).not.toContain(jargon);
    }
  });

  it("uses the current Klinikos design system without raw hex drift", () => {
    const page = read("src/app/pricing/page.tsx");

    expect(page).toContain("<DsSurface>");
    expect(page).toContain("<KlinikosWordmark");
    expect(page).toContain("var(--obsidian)");
    expect(page).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
