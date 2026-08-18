import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const schema = read("prisma/schema.prisma");
const ledger = read("src/lib/commercial/commercial-ledger-repository.ts");
const commercialMigration = read("prisma/migrations/20260812131500_commercial_payment_and_usage/migration.sql");

describe("commercial ledger organization table contract", () => {
  it("uses the physical organizations table that Prisma and commercial migrations define", () => {
    expect(schema).toContain('@@map("organizations")');
    expect(commercialMigration).toContain('REFERENCES "organizations"("id")');
    expect(ledger).toContain('FROM "organizations"');
    expect(ledger).not.toContain('FROM "Organization"');
  });

  it("keeps paid subscription access period-bounded before reserving customer-funded usage", () => {
    expect(ledger).toContain('FROM "subscriptions"');
    expect(ledger).toContain('AND "status" = \'active\'');
    expect(ledger).toContain('AND ("currentPeriodEndsAt" IS NULL OR "currentPeriodEndsAt" > CURRENT_TIMESTAMP)');
    expect(ledger).toContain('paymentConfirmed: Boolean(subscription?.paymentConfirmedAt)');
  });
});
