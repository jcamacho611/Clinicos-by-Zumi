import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const legalAcceptance = readFileSync(
  join(process.cwd(), "src/app/legal/accept/LegalAcceptanceClient.tsx"),
  "utf8",
);
const landingFunnel = readFileSync(
  join(process.cwd(), "src/components/marketing/landing-funnel.tsx"),
  "utf8",
);

/**
 * The signing ceremony locks the acknowledgment and signature steps until the agreement
 * has been read. It did that with `pointer-events-none` and `aria-disabled` on a
 * `<section>`, which locks nothing: pointer-events does not affect the keyboard, and
 * aria-disabled is not a supported attribute on the implicit `region` role, so assistive
 * technology was told nothing at all.
 *
 * Someone using a keyboard could tab into the checkboxes and the signature field of a
 * step that looked disabled, before reading the agreement they were about to sign.
 */
describe("legal acceptance gating", () => {
  it("removes locked steps from the keyboard and the accessibility tree, not just the mouse", () => {
    // `inert` is the attribute that actually does both.
    const inertUses = legalAcceptance.match(/inert=\{!reviewToken\}/g) ?? [];
    expect(inertUses).toHaveLength(2);
  });

  it("no longer claims a section is disabled with an attribute that role ignores", () => {
    expect(legalAcceptance).not.toContain("aria-disabled");
  });

  it("keeps the visual treatment so the lock is legible to someone who can see it", () => {
    expect(legalAcceptance).toContain("opacity-45");
  });

  it("still tells the reader why the steps are locked", () => {
    // The live region carries the reason; without it, `inert` would silently swallow
    // the controls with no explanation.
    expect(legalAcceptance).toContain('aria-live="polite"');
    expect(legalAcceptance).toContain("Scroll through the agreement to continue.");
  });

  it("declares the review call the mount effect depends on", () => {
    // The effect marks a short agreement reviewed on mount. It is safe to re-run
    // because markReviewed returns early once a token exists, so the dependency can be
    // declared honestly rather than suppressed.
    expect(legalAcceptance).toContain("const markReviewed = useCallback(");
    expect(legalAcceptance).toContain("}, [markReviewed]);");
  });
});

/**
 * The paid analysis is 100% credited toward implementation when the clinic proceeds.
 * The offer catalog said so, the value was passed into the funnel, and the page never
 * rendered it — a lint warning about an unused prop was the only trace.
 */
describe("paid analysis offer terms", () => {
  it("shows the credit-back term where the price is asked for", () => {
    expect(landingFunnel).toContain("{analysisCredit}");
  });

  it("keeps the term next to the call to action rather than further down the funnel", () => {
    const cta = landingFunnel.indexOf("Book the {analysisPriceLabel} analysis");
    const credit = landingFunnel.indexOf("{analysisCredit}</p>");

    expect(cta).toBeGreaterThan(-1);
    expect(credit).toBeGreaterThan(cta);
    // Same step block: no other step opens between them.
    expect(landingFunnel.slice(cta, credit)).not.toContain("setStep(");
  });
});
