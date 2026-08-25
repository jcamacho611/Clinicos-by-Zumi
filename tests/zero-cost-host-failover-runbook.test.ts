import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runbook = readFileSync("docs/ops/ZERO_COST_HOST_FAILOVER_2026-08-25.md", "utf8");

describe("zero-cost host failover runbook", () => {
  it("requires exact release proof before domain cutover", () => {
    expect(runbook).toContain("/api/health");
    expect(runbook).toContain("exact current `main` SHA");
    expect(runbook).toContain("Do not attach `klinikos.io`");
  });

  it("keeps database migrations outside the Vercel build", () => {
    expect(runbook).toContain("never runs production migrations");
    expect(runbook).toContain("Neon remains the production database");
  });

  it("requires truth-preserving environment transfer", () => {
    expect(runbook).toContain("Do not copy blank or unverified capability flags as `true`");
    expect(runbook).toContain("production-approved credentials");
  });
});
