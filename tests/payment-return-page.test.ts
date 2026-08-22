import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// The return surface is a route file plus the client component it renders. Reading only
// the route made the guard fail when the copy moved into the component, which is a file
// boundary rather than a change in what the page tells a buyer — so read both.
const routeSource = fs.readFileSync(path.join(process.cwd(), "src/app/payments/success/page.tsx"), "utf8");
const experienceSource = fs.readFileSync(path.join(process.cwd(), "src/components/commercial/payment-return-experience.tsx"), "utf8");
const source = routeSource + experienceSource;

describe("payment return page", () => {
  it("exists at the configured checkout return path and never treats browser return as proof", () => {
    expect(routeSource).toContain("export default async function PaymentReturnPage");
    expect(source).toContain("This browser return");
    expect(source).toContain("never marks an engagement paid");
    expect(source).toContain("signed server evidence");
  });

  it("is private from search indexing and offers recoverable next steps", () => {
    expect(routeSource).toContain("robots: { index: false, follow: false }");
    // "Recoverable" means the person can actually get somewhere from here. Pinning one
    // specific destination made the guard fail when a better next step replaced it, so
    // assert the property instead: more than one way out, and every one of them real.
    const hrefs = [...source.matchAll(/href="(\/[^"]*)"/g)].map((match) => match[1]);
    expect(new Set(hrefs).size).toBeGreaterThan(1);
    expect(hrefs).toContain("/");
    for (const href of new Set(hrefs)) {
      const segments = href.split(/[?#]/)[0].split("/").filter(Boolean);
      const dir = path.join(process.cwd(), "src/app", ...segments);
      expect(fs.existsSync(path.join(dir, "page.tsx")), `${href} has no page`).toBe(true);
    }
    expect(source).not.toMatch(/paymentStatus\s*=\s*["']paid/i);
  });
});
