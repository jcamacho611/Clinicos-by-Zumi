import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.join(process.cwd(), "src/app/payments/success/page.tsx"), "utf8");

describe("payment return page", () => {
  it("exists at the configured checkout return path and never treats browser return as proof", () => {
    expect(source).toContain("export default function PaymentReturnPage");
    expect(source).toContain("This browser return");
    expect(source).toContain("never marks an engagement paid");
    expect(source).toContain("signed server evidence");
  });

  it("is private from search indexing and offers recoverable next steps", () => {
    expect(source).toContain("robots: { index: false, follow: false }");
    expect(source).toContain('href="/"');
    expect(source).toContain('href="/private-demo"');
    expect(source).not.toMatch(/paymentStatus\s*=\s*["']paid/i);
  });
});
