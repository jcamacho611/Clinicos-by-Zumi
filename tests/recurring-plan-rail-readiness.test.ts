import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { goDaddyClinicPlanCheckoutStatus } from "@/lib/commercial/payment-connectors/godaddy";
import { stripeRecurringSubscriptionStatus } from "@/lib/commercial/stripe-clinic-subscriptions";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const adminPage = read("src/app/(platform)/admin/commercial/page.tsx");
const desk = read("src/components/commercial/clinic-activation-desk.tsx");
const goDaddy = read("src/lib/commercial/payment-connectors/godaddy.ts");
const stripe = read("src/lib/commercial/payment-connectors/stripe.ts");
const stripeRecurring = read("src/lib/commercial/stripe-clinic-subscriptions.ts");
const checkoutApi = read("src/app/api/admin/commercial/clinic-checkouts/route.ts");
const activationApi = read("src/app/api/onboarding/activate/route.ts");
const dashboard = read("src/app/(platform)/dashboard/page.tsx");
const firstLoginTruth = read("src/lib/commercial/clinic-launch-briefing.ts");

describe("recurring clinic plan rail readiness", () => {
  it("prefers native Stripe recurring only when its explicit gate and verified webhook rail are ready", () => {
    expect(adminPage).toContain("stripeRecurringSubscriptionStatus");
    expect(adminPage).toContain("const stripeReady = stripeStatus.processorVerification");
    expect(adminPage).toContain('railProvider: stripeReady ? "stripe" as const');
    expect(checkoutApi).toContain("recurringStripe.processorVerification");
    expect(checkoutApi).toContain("createStripeClinicSubscriptionCheckout");
    expect(checkoutApi).toContain("createClinicPlanCheckout");

    expect(stripeRecurringSubscriptionStatus({
      STRIPE_SECRET_KEY: "sk_live_unit_test",
      STRIPE_WEBHOOK_SECRET: "whsec_unit_test",
    } as NodeJS.ProcessEnv).processorVerification).toBe(false);
    expect(stripeRecurringSubscriptionStatus({
      STRIPE_SECRET_KEY: "sk_live_unit_test",
      STRIPE_WEBHOOK_SECRET: "whsec_unit_test",
      KLINIKOS_STRIPE_RECURRING_ENABLED: "true",
    } as NodeJS.ProcessEnv).processorVerification).toBe(true);
  });

  it("keeps exact-plan GoDaddy readiness as the manual fallback", () => {
    expect(adminPage).toContain("goDaddyClinicPlanCheckoutStatus");
    expect(adminPage).toContain("goDaddyConfigured.has(key)");
    expect(adminPage).toContain('goDaddyReady ? "godaddy" as const : null');
    expect(goDaddy).toContain("KLINIKOS_GODADDY_CORE_PAYLINK");
    expect(goDaddy).toContain("KLINIKOS_GODADDY_GROWTH_PAYLINK");
    expect(goDaddy).toContain("KLINIKOS_GODADDY_SCALE_PAYLINK");
    expect(goDaddy).toContain("processorVerification: false");
    expect(goDaddy).toContain("processorVerificationAvailable: false");
  });

  it("blocks an unconfigured recurring plan without substituting another product or rail", () => {
    expect(desk).toContain("checkoutConfigured: boolean");
    expect(desk).toContain("firstConfiguredPlan");
    expect(desk).toContain("!selectedPlan?.checkoutConfigured");
    expect(desk).toContain("This recurring plan does not have an approved checkout rail configured.");
    expect(desk).toContain("disabled={!plan.checkoutConfigured}");
    expect(desk).toContain("Klinikos will not substitute the $500 analysis link or another plan&apos;s paylink");
  });

  it("never exposes a manual-paid control for a Stripe checkout", () => {
    expect(desk).toContain('checkout.status === "created" && checkout.provider === "godaddy"');
    expect(desk).toContain('checkout.status === "created" && checkout.provider === "stripe"');
    expect(desk).toContain("Awaiting signed Stripe invoice");
    expect(desk).toContain('checkout.status === "completed" && checkout.provider === "stripe"');
    expect(desk).toContain("Issue owner activation link");
    expect(desk).toContain("Staff cannot manually mark a Stripe checkout paid");
  });

  it("keeps the existing one-time Stripe connector isolated from subscription Checkout", () => {
    expect(stripe).toContain('if (request.product.billing !== "one_time")');
    expect(stripe).toContain("This Stripe slice supports only the one-time Clinic Operating Analysis.");
    expect(stripe).toContain('mode: "payment"');
    expect(stripe).not.toContain('mode: "subscription"');
    expect(stripeRecurring).toContain('mode: "subscription"');
    expect(stripeRecurring).toContain('recurring: { interval: "month" }');
  });

  it("preserves payment entitlement versus production readiness boundaries", () => {
    expect(desk).toContain("browser return never activates software");
    expect(desk).toContain("does not enable production PHI, approve connectors, or certify deployment readiness");
    expect(stripeRecurring).toContain("invoice_failed");
    expect(stripeRecurring).toContain("accessExtended: false");
  });

  it("preserves the paid subscription to signed activation to first-login Living Home chain", () => {
    expect(checkoutApi).toContain('action: z.literal("issue_activation")');
    expect(activationApi).toContain('redirectTo: "/dashboard?onboarding=complete"');
    expect(dashboard).toContain("ClinicFirstLoginLaunch");
    expect(firstLoginTruth).toContain('subscription.status === "active"');
    expect(firstLoginTruth).toContain("subscription.paymentConfirmedAt");
    expect(firstLoginTruth).toContain('onboarding.mode === "paid_activation"');
    expect(firstLoginTruth).toContain('["commercial_access", "organization", "owner", "location", "workspace"]');
    expect(firstLoginTruth).toContain("verifiedFirstLogin: paidAccess && paidWorkspaceCompleted");
  });

  it("calculates fallback plan readiness from configuration presence without exposing secret values", () => {
    const status = goDaddyClinicPlanCheckoutStatus({
      KLINIKOS_GODADDY_CORE_PAYLINK: "https://payments.example/core",
    } as NodeJS.ProcessEnv);

    expect(status.configuredPlanKeys).toEqual(["clinic_core"]);
    expect(status.missing).toEqual([
      "KLINIKOS_GODADDY_GROWTH_PAYLINK",
      "KLINIKOS_GODADDY_SCALE_PAYLINK",
    ]);
    expect(status.allConfigured).toBe(false);
  });
});
