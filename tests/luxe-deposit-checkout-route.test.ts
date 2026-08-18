import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  createCheckout,
  depositStatus,
  openJourney,
  recordCheckoutStarted,
  resolveContext,
} = vi.hoisted(() => ({
  createCheckout: vi.fn(),
  depositStatus: vi.fn(),
  openJourney: vi.fn(),
  recordCheckoutStarted: vi.fn(),
  resolveContext: vi.fn(),
}));

vi.mock("@/lib/luxe-acquisition-journey-token", () => ({
  LUXE_ACQUISITION_JOURNEY_COOKIE: "klinikos_luxe_journey",
  openLuxeAcquisitionJourney: openJourney,
}));

vi.mock("@/lib/luxe-stripe-deposit", () => ({
  createLuxeStripeDepositCheckout: createCheckout,
  luxeStripeDepositStatus: depositStatus,
}));

vi.mock("@/lib/repositories/luxe-deposit-checkout-repository", () => ({
  recordLuxeDepositCheckoutStarted: recordCheckoutStarted,
}));

vi.mock("@/lib/repositories/luxe-processor-payment-evidence-repository", () => ({
  resolveLuxeDepositCheckoutContext: resolveContext,
}));

import { POST } from "@/app/api/public/luxe-medi/deposit/checkout/route";

function request() {
  return new NextRequest("https://klinikos.io/api/public/luxe-medi/deposit/checkout", {
    method: "POST",
    headers: { cookie: "klinikos_luxe_journey=opaque-cookie" },
  });
}

describe("Luxe public deposit checkout route", () => {
  beforeEach(() => {
    depositStatus.mockReset();
    openJourney.mockReset();
    resolveContext.mockReset();
    createCheckout.mockReset();
    recordCheckoutStarted.mockReset();

    depositStatus.mockReturnValue({ publicCheckoutAvailable: true });
    openJourney.mockReturnValue({ leadId: "lead_luxe_123456", expiresAt: new Date("2026-09-01T00:00:00Z") });
    resolveContext.mockResolvedValue({
      organizationId: "org_luxe",
      leadId: "lead_luxe_123456",
      email: "customer@example.test",
      serviceInterest: "Botox",
    });
    createCheckout.mockResolvedValue({
      checkoutUrl: "https://checkout.stripe.com/c/pay/cs_live_example",
      externalCheckoutId: "cs_live_example",
      amountCents: 15_000,
    });
    recordCheckoutStarted.mockResolvedValue({ recorded: true, idempotent: false, eventId: "event-1" });
  });

  it("creates server checkout, records abandonment evidence, and redirects", async () => {
    const response = await POST(request());
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://checkout.stripe.com/c/pay/cs_live_example");
    expect(createCheckout).toHaveBeenCalledWith(expect.objectContaining({
      journeyToken: "opaque-cookie",
      email: "customer@example.test",
      returnUrl: "https://klinikos.io/luxe/consult?deposit=returned",
    }));
    expect(recordCheckoutStarted).toHaveBeenCalledWith({
      leadId: "lead_luxe_123456",
      externalCheckoutId: "cs_live_example",
      amountCents: 15_000,
    });
  });

  it("still redirects when abandonment tracking fails after Stripe checkout exists", async () => {
    recordCheckoutStarted.mockRejectedValueOnce(new Error("database telemetry unavailable"));
    const response = await POST(request());
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://checkout.stripe.com/c/pay/cs_live_example");
  });

  it("does not expose checkout unless the explicit public business flag is enabled", async () => {
    depositStatus.mockReturnValueOnce({ publicCheckoutAvailable: false });
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(createCheckout).not.toHaveBeenCalled();
  });

  it("requires a valid opaque acquisition journey before creating checkout", async () => {
    openJourney.mockReturnValueOnce(null);
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(createCheckout).not.toHaveBeenCalled();
  });

  it("rejects terminal or already processor-verified lead context", async () => {
    resolveContext.mockResolvedValueOnce(null);
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(createCheckout).not.toHaveBeenCalled();
  });
});
