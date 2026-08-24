import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const page = fs.readFileSync(path.join(process.cwd(), "src/app/(platform)/billing/page.tsx"), "utf8");
const workspace = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/billing-workspace-real.tsx"), "utf8");
const style = fs.readFileSync(path.join(process.cwd(), "src/app/(platform)/billing/billing-black-label.module.css"), "utf8");

describe("Billing Black Label revenue integrity", () => {
  it("preserves authoritative billing/payment/Grid sources and workspace authorization", () => {
    expect(page).toContain("canAccessWorkspace(session.role, \"billing\")");
    expect(page).toContain("listBillingTruthWorkspace(session)");
    expect(page).toContain("listPaymentWorkspace(session.organizationId)");
    expect(page).toContain("getGridMoney(session)");
    expect(page).toContain("<BillingWorkspaceReal");
  });

  it("removes four-card dashboard theater in favor of one financial strip", () => {
    expect(workspace).toContain('data-revenue-integrity-strip');
    expect(workspace).toContain('label: "Claim value in work"');
    expect(workspace).toContain('label: "Open denial value"');
    expect(workspace).toContain('label: "Patient balances"');
    expect(workspace).toContain('label: "Posted MTD"');
    expect(workspace).not.toContain("<StatCard");
    expect(workspace).not.toContain("xl:grid-cols-4");
  });

  it("keeps external evidence truth explicit", () => {
    expect(workspace).toContain("Stored claim status is not clearinghouse evidence");
    expect(workspace).toContain("Clearinghouse response not inferred");
    expect(workspace).toContain("837/277/835 pending production rail");
    expect(workspace).not.toContain("Claim accepted by payer");
    expect(workspace).not.toContain("Payment successful");
  });

  it("uses tabular financial typography and shared Black Label materials", () => {
    expect(workspace).toContain("tabular-nums");
    expect(style).toContain("var(--k-work-bg)");
    expect(style).toContain("var(--k-public-surface)");
    expect(style).toContain("var(--k-public-raised)");
    expect(style).toContain("var(--k-text)");
    expect(style).toContain("var(--k-muted)");
    expect(style).toContain("var(--k-line)");
    expect(style).toContain("var(--k-accent)");
  });

  it("keeps financial exceptions visually louder than completed/normal state", () => {
    expect(style).toContain("Financial exception semantics");
    expect(style).toContain("amber");
    expect(style).toContain("rose");
    expect(style).toContain("box-shadow: none !important");
  });

  it("keeps dense tables readable and responsive without converting them to card grids", () => {
    expect(workspace).toContain("<table");
    expect(workspace).toContain("overflow-x-auto");
    expect(style).toContain("font-variant-numeric: tabular-nums");
    expect(style).toContain("@media (max-width: 767px)");
    expect(style).toContain("min-height: 44px");
  });
});
