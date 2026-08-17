import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const route = readFileSync(join(process.cwd(), "src/app/api/webhooks/stripe/route.ts"), "utf8");
const guard = readFileSync(join(process.cwd(), "src/lib/commercial/stripe-evidence-guard.ts"), "utf8");
const checkout = readFileSync(join(process.cwd(), "src/lib/commercial/checkout-service.ts"), "utf8");

describe("Stripe live-money truth contract", () => {
  it("verifies the untouched raw body instead of a parsed browser/provider claim", () => {
    expect(route).toContain("await request.text()");
    expect(route).toContain('request.headers.get("stripe-signature")');
    expect(route).not.toContain("request.json()");
  });

  it("re-loads server-owned amount currency product and mode before applying evidence", () => {
    expect(guard).toContain('"amountCents"');
    expect(guard).toContain('"currency"');
    expect(guard).toContain('intent.productKey !== input.productKey');
    expect(guard).toContain('processorMode(intent.metadata) !== input.mode');
    expect(guard).toContain('intent.provider !== "stripe"');
  });

  it("does not expose live Stripe checkout until signed webhook verification is configured", () => {
    expect(checkout).toContain('stripeModeReady("live")');
    expect(checkout).toContain('product.billing === "one_time"');
    expect(checkout).toContain("return createGoDaddyCommercialCheckout(input)");
  });
});
