import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PUBLIC_ACTION_CENTER_EXAMPLE } from "@/lib/marketing/product-evidence";

describe("public product evidence", () => {
  const figure = readFileSync("src/components/marketing/product-evidence-figure.tsx", "utf8");
  const howItWorks = readFileSync("src/app/how-it-works/page.tsx", "utf8");
  const homeSection = readFileSync("src/components/marketing/product-evidence-section.tsx", "utf8");

  it("shows the product using the real component, not a drawing of it", () => {
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
    const items = (PUBLIC_ACTION_CENTER_EXAMPLE.buckets ?? []).flatMap((bucket) => bucket.items);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.taskId, `${item.id} would render live controls`).toBeNull();
      expect(item.canClaim).toBe(false);
      expect(item.canComplete).toBe(false);
    }
  });

  it("keeps the example out of the tab order rather than merely unclickable", () => {
    expect(figure).toMatch(/\n\s*inert\n/);
  });

  it("keeps evidence available on the dedicated explainer without turning the entry screen into a brochure", () => {
    expect(homeSection).toContain("<ProductEvidenceFigure");
    expect(howItWorks).toContain("<ProductEvidenceFigure");
    const home = readFileSync("src/app/page.tsx", "utf8");
    expect(home).not.toContain("<ProductEvidenceSection />");
    expect(home).toContain("<PublicLivingGateway />");
  });

  it("puts no person in the example", () => {
    const items = (PUBLIC_ACTION_CENTER_EXAMPLE.buckets ?? []).flatMap((bucket) => bucket.items);
    const text = items.map((item) => `${item.title} ${item.detail}`).join(" ");
    expect(text).not.toMatch(/\b(?:Mr|Mrs|Ms|Dr)\.?\s+[A-Z][a-z]+/);
    expect(text).not.toMatch(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
    expect(text).not.toMatch(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/);
    expect(text).not.toMatch(/\bMRN\b|\bDOB\b|@/);
    expect(items.some((item) => item.urgency === "overdue")).toBe(true);
    expect(items.some((item) => item.urgency === "due_soon")).toBe(true);
  });

  it("stays on the public design system instead of reintroducing a third palette", () => {
    expect(howItWorks).not.toMatch(/#174ea6|#f7f8fa|bg-white\b/);
    expect(howItWorks).toContain("#050303");
  });
});
