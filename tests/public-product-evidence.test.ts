import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PUBLIC_ACTION_CENTER_EXAMPLE } from "@/lib/marketing/product-evidence";

/**
 * An outside reviewer read the site and could not say what the product does, then asked
 * for a pitch deck. The page whose whole job was answering that question was 305 words of
 * categories with nothing shown. These cover the properties that make the fix real rather
 * than decorative.
 */
describe("public product evidence", () => {
  // The honesty-critical parts live in one component so the homepage and the explainer
  // cannot drift apart or disagree about how the example is labelled.
  const figure = readFileSync("src/components/marketing/product-evidence-figure.tsx", "utf8");
  const howItWorks = readFileSync("src/app/how-it-works/page.tsx", "utf8");
  const homeSection = readFileSync("src/components/marketing/product-evidence-section.tsx", "utf8");

  it("shows the product using the real component, not a drawing of it", () => {
    // A hand-built mock drifts the first time the component changes, and a picture of a
    // screen that no longer exists is a false claim about what a buyer is buying.
    expect(figure).toContain('from "@/components/clinic/workspaces/action-center"');
    expect(figure).toContain("<ActionCenterWorkspace");
    expect(figure).toContain("PUBLIC_ACTION_CENTER_EXAMPLE");
  });

  it("labels the example as an example, in text a reader will see", () => {
    expect(figure).toMatch(/<figcaption/);
    expect(figure).toMatch(/>Example</);
    expect(figure).toContain("rendered by the same component a signed-in clinic uses");
    expect(figure).toMatch(/illustrative/);
  });

  it("renders no control a signed-out visitor could press", () => {
    // taskId null is what suppresses the claim/complete controls, which call authenticated
    // APIs. A public page must not present buttons that cannot work.
    const items = (PUBLIC_ACTION_CENTER_EXAMPLE.buckets ?? []).flatMap((bucket) => bucket.items);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.taskId, `${item.id} would render live controls`).toBeNull();
      expect(item.canClaim).toBe(false);
      expect(item.canComplete).toBe(false);
    }
  });

  it("keeps the example out of the tab order rather than merely unclickable", () => {
    // The rows link into the authenticated app. Without inert, a keyboard user tabs into
    // seven links that go nowhere useful; the figcaption carries the same information.
    expect(figure).toMatch(/\n\s*inert\n/);
  });

  it("answers the question on the page people actually land on", () => {
    // The reviewer never reached the explainer. Evidence one click away is evidence the
    // person who needed it did not see, so the landing page must carry real product
    // evidence rather than pointing at it.
    //
    // That law is unchanged. What satisfies it moved: the action-first contract
    // (PR #442) removed the standalone evidence section from the root because a stack of
    // marketing sections is the brochure shape the Living Universe replaces. The landing
    // page now carries one integrated Living Universe stage inside the gateway. Zumi
    // recomposes that same stage from the server-owned Path projection; there is no
    // second, below-fold Path browser pretending to be another application.
    expect(homeSection).toContain("<ProductEvidenceFigure");
    expect(howItWorks).toContain("<ProductEvidenceFigure");
    const home = readFileSync("src/app/page.tsx", "utf8");
    const gateway = readFileSync("src/components/marketing/public-living-gateway.tsx", "utf8");
    expect(home).toContain("<PublicLivingGateway />");
    expect(home).not.toContain("<PublicLivingUniverse />");
    expect(gateway).toContain('data-living-universe-stage="true"');
    expect(gateway).toContain("<PublicLivingUniverseObjectStage");
  });

  it("puts no person in the example", () => {
    const items = (PUBLIC_ACTION_CENTER_EXAMPLE.buckets ?? []).flatMap((bucket) => bucket.items);
    const text = items.map((item) => `${item.title} ${item.detail}`).join(" ");

    // Rows are described by category, risk and team — the same discipline the component
    // itself follows, because this summary ends up on shared screens.
    expect(text).not.toMatch(/\b(?:Mr|Mrs|Ms|Dr)\.?\s+[A-Z][a-z]+/);
    expect(text).not.toMatch(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
    expect(text).not.toMatch(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/);
    expect(text).not.toMatch(/\bMRN\b|\bDOB\b|@/);
    // Every row still carries a real due state, so the screen is not a blank shell.
    expect(items.some((item) => item.urgency === "overdue")).toBe(true);
    expect(items.some((item) => item.urgency === "due_soon")).toBe(true);
  });

  it("stays on the public design system instead of reintroducing a third palette", () => {
    // This page was light-blue while the rest of the public site is dark rose.
    expect(howItWorks).not.toMatch(/#174ea6|#f7f8fa|bg-white\b/);
    expect(howItWorks).toContain("#050303");
  });
});
