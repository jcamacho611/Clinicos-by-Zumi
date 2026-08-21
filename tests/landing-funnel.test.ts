import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  clinicCommercialOffers,
  clinicPlans,
  eduPlans,
  serviceEngagements,
} from "@/lib/commercial/klinikos-commercial";
import { GRID_MEMBERSHIP } from "@/lib/commercial/grid-economics";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

const page = read("src/app/klinikos/page.tsx");
const component = read("src/components/marketing/landing-funnel.tsx");

describe("Klinikos landing funnel", () => {
  it("never hardcodes a price into the marketing surface", () => {
    // A marketing page carrying its own numbers is a second source of truth, and the
    // two drift the first time one changes. Prices are read from the commercial
    // module; the page and component must contain no currency literal of their own.
    for (const [label, source] of [["page", page], ["component", component]] as const) {
      const literals = [...source.matchAll(/\$[\d,]+/g)].map((match) => match[0]);
      expect(literals, `${label} hardcodes ${literals.join(", ")}`).toEqual([]);
    }
  });

  it("publishes the same clinic prices the pricing page does", () => {
    // Two public surfaces quoting different numbers for the same product is the
    // failure this binds against.
    const pricing = read("src/app/pricing/page.tsx");
    for (const plan of Object.values(clinicPlans)) {
      expect(pricing).toContain("clinicPlans");
      expect(page).toContain("clinicPlans");
      expect(plan.monthlyPriceLabel.length).toBeGreaterThan(0);
    }
  });

  it("carries every revenue line the commercial module declares", () => {
    // The page maps over the whole object rather than naming tiers one by one, so a
    // plan added to the commercial module reaches the public surface automatically
    // instead of being silently left off it.
    for (const source of ["clinicPlans", "GRID_MEMBERSHIP", "eduPlans"]) {
      expect(page, `${source} is not rendered in full`).toContain(`Object.values(${source})`);
    }
    expect(page).toContain("serviceEngagements");
    expect(page).toContain("clinicCommercialOffers");

    // Every declared plan carries the fields the surface renders, so none of them can
    // reach the page as a blank card.
    for (const [label, plans] of [["grid", GRID_MEMBERSHIP], ["edu", eduPlans]] as const) {
      for (const [key, plan] of Object.entries(plans)) {
        expect(plan.name.length, `${label}.${key} has no name`).toBeGreaterThan(0);
        expect(plan.priceLabel.length, `${label}.${key} has no price label`).toBeGreaterThan(0);
        expect(plan.includes.length, `${label}.${key} lists nothing`).toBeGreaterThan(0);
      }
    }
    for (const [key, engagement] of Object.entries(serviceEngagements)) {
      expect(engagement.priceLabel.length, `${key} has no price label`).toBeGreaterThan(0);
      expect(engagement.includes.length, `${key} lists nothing`).toBeGreaterThan(0);
    }
  });

  it("keeps the browser-side analysis from claiming more than the reader told it", () => {
    // The funnel has no access to the reader's clinic. It restates their own answers
    // and names the engine that owns each — it must not price, benchmark or project.
    expect(component).toContain("it will not tell you what any of it costs you");
    expect(component).toContain("Nothing is sent anywhere");
    expect(component).not.toMatch(/you (?:are |could be )?los(?:e|ing) \$/i);
    expect(component).not.toMatch(/average (?:clinic|practice) (?:loses|recovers)/i);
  });

  it("states payment truth on the public surface", () => {
    // Browser state is not payment truth, and paying never widens authority. Both are
    // standing Klinikos rules; the page a buyer reads is where they belong.
    expect(component).toContain("Returning from checkout is not payment");
    expect(component).toContain("Payment never overrides governance");
    expect(component).toContain("A saved card is not a blank cheque");
  });

  it("does not promise a certification EDU cannot give", () => {
    expect(eduPlans.pathway.excludes.join(" ")).toMatch(/does not guarantee placement/i);
    for (const forbidden of ["board certified", "licensure included", "guaranteed job", "guaranteed placement"]) {
      expect(page.toLowerCase()).not.toContain(forbidden);
      expect(component.toLowerCase()).not.toContain(forbidden);
    }
  });

  it("keeps the free tiers of Grid genuinely free", () => {
    // Charging for presence prices out the supply a marketplace needs; the rule is
    // published, so it must match the plan that implements it.
    expect(GRID_MEMBERSHIP.individualFree.monthlyPriceCents).toBe(0);
    expect(GRID_MEMBERSHIP.individualFree.priceLabel).toBe("Free");
    // Organizations list for nothing too: a marketplace with no supply earns no fee,
    // so a subscription at the door costs more than it collects.
    expect(GRID_MEMBERSHIP.organizationFree.monthlyPriceCents).toBe(0);
  });

  it("credits the analysis fee it advertises", () => {
    expect(clinicCommercialOffers.privateWorkflowReview.creditForward).toMatch(/credited/i);
    expect(page).toContain("creditForward");
  });
});
