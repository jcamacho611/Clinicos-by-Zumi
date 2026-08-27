import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("public Clinic OS entry", () => {
  it("starts with one operating question instead of a commercial brochure", () => {
    const page = read("src/app/founding-clinic/page.tsx");
    expect(page).toContain("What needs to happen in your clinic?");
    expect(page).toContain("run_clinic");
    expect(page).toContain("fix_workflow");
    expect(page).toContain("see_klinikos");
    expect(page).toContain("claim_organization");
    expect(page).not.toContain("Three reviewed stages before production");
    expect(page).not.toContain("The $500 analysis has two truthful payment modes");
    expect(page).not.toContain("FoundingOfferCards");
  });

  it("keeps the terms-first gate and authority boundaries on direct Clinic entry", () => {
    const page = read("src/app/founding-clinic/page.tsx");
    expect(page).toContain("PublicPlatformShell");
    expect(page).toContain("Claiming an organization does not grant tenant access");
    expect(page).toContain("Do not enter patient information");
  });

  it("routes consequential next steps into existing governed surfaces", () => {
    const page = read("src/app/founding-clinic/page.tsx");
    expect(page).toContain('href="/sales"');
    expect(page).toContain("/login?returnTo=");
    expect(page).toContain("/grid/join");
    expect(page).not.toContain("activateProduction");
  });
});
