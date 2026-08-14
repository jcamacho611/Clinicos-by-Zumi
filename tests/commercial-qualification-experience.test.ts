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

  it("keeps qualification and payment boundaries explicit", () => {
    const sales = read("src/app/sales/page.tsx");
    const founding = read("src/app/founding-clinic/page.tsx");

    expect(sales).toContain("This analysis does not itself activate production access or external integrations.");
    expect(founding).toContain("Opening or returning from checkout is never proof of payment.");
    expect(founding).toContain("do not by themselves activate production PHI");
  });

  it("keeps founding prices server-controlled and removes raw-hex visual drift", () => {
    const shell = read("src/components/command/zumi-command-shell.tsx");
    const sales = read("src/app/sales/page.tsx");
    const founding = read("src/app/founding-clinic/page.tsx");
    const offers = read("src/components/command/founding-offer-cards.tsx");

    expect(offers).toContain("engagementOffers.map");
    expect(offers).toContain("offer.shortPrice");
    expect(shell).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(sales).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(founding).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(offers).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
