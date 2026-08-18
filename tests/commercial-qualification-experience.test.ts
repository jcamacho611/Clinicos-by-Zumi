import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("commercial qualification experience", () => {
  it("keeps Klinikos as the product and Intelligence as the embedded guide", () => {
    const shell = read("src/components/command/zumi-command-shell.tsx");
    const sales = read("src/app/sales/page.tsx");
    const founding = read("src/app/founding-clinic/page.tsx");

    expect(shell).toContain("<KlinikosWordmark");
    expect(shell).toContain("Klinikos Intelligence ready");
    expect(shell).toContain('label = "Klinikos Intelligence"');
    expect(sales).toContain("while Klinikos Intelligence guides the analysis");
    expect(founding).toContain("Klinikos Intelligence organizes the operational picture");
    expect(shell).not.toContain("Zumi standing by");
  });

  it("keeps qualification, payment, and entitlement boundaries explicit", () => {
    const sales = read("src/app/sales/page.tsx");
    const founding = read("src/app/founding-clinic/page.tsx");

    expect(sales).toContain("This analysis does not itself activate production access or external integrations.");
    expect(founding).toContain("Browser return is never payment proof");
    expect(founding).toContain("manual service payment does not create a Klinikos software entitlement");
    expect(founding).toContain("do not by themselves activate production PHI");
  });

  it("presents founding commercial steps as a sequence rather than three parallel purchases", () => {
    const founding = read("src/app/founding-clinic/page.tsx");
    const offers = read("src/components/command/founding-offer-cards.tsx");

    expect(offers).toContain("Commercial sequence");
    expect(offers).toContain("One paid starting point. Later steps unlock after review.");
    expect(offers).toContain("Start Clinic Operating Analysis");
    expect(offers).toContain("After analysis + human review");
    expect(offers).toContain("After Blueprint + scope approval");
    expect(offers).toContain("const offer = demoOffers[step.key]");
    expect(offers).not.toContain("Choose how to proceed");
    expect(founding).toContain("Integrated Klinikos Stripe Checkout is preferred");
    expect(founding).not.toContain("existing GoDaddy path remains available");
  });

  it("removes raw-hex visual drift from governed commercial pages", () => {
    const shell = read("src/components/command/zumi-command-shell.tsx");
    const sales = read("src/app/sales/page.tsx");
    const founding = read("src/app/founding-clinic/page.tsx");
    const offers = read("src/components/command/founding-offer-cards.tsx");

    expect(shell).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(sales).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(founding).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(offers).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
