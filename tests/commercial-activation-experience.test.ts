import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("commercial activation experience", () => {
  it("keeps the paid customer activation screen inside the Klinikos design and signed-link boundary", () => {
    const page = read("src/app/activate/page.tsx");

    expect(page).toContain("<DsSurface>");
    expect(page).toContain("<KlinikosWordmark");
    expect(page).toContain("Signed paid-workspace activation");
    expect(page).toContain("Your paid state stays server-owned");
    expect(page).toContain("Production patient data stays gated");
    expect(page).toContain("Secrets are not autosaved");
    expect(page).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it("preserves resumable non-secret setup while keeping password and production PHI truth explicit", () => {
    const form = read("src/components/commercial/clinic-activation-form.tsx");

    expect(form).toContain('method: "PATCH"');
    expect(form).toContain('method: "POST"');
    expect(form).toContain("Password is never included in autosaved onboarding progress.");
    expect(form).toContain("Paid software access does not itself approve production patient-data use");
    expect(form).toContain("Activate my Klinikos workspace");
    expect(form).toContain("Living Home");
    expect(form).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it("keeps checkout, payment evidence, and owner activation as separate operator steps", () => {
    const desk = read("src/components/commercial/clinic-activation-desk.tsx");

    expect(desk).toContain("Opening or returning from checkout is never payment evidence.");
    expect(desk).toContain('confirmation: "I_VERIFIED_PAYMENT"');
    // The desk now sells over two rails, so the honesty rule is stated per rail rather
    // than as one global sentence. What must survive is that neither rail lets a human
    // or a browser assert payment: signed Stripe invoice evidence activates the Stripe
    // rail and staff cannot override it, and the GoDaddy fallback is declared as having
    // no authoritative verification at all.
    expect(desk).toContain("Staff cannot manually mark a Stripe checkout paid.");
    expect(desk).toContain("no processor webhook or authoritative verification API");
    expect(desk).toMatch(/signed live invoice evidence/i);
    expect(desk).toContain("The owner setup link is ready.");
    expect(desk).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
