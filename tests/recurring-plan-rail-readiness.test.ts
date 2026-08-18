import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { goDaddyClinicPlanCheckoutStatus } from "@/lib/commercial/payment-connectors/godaddy";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const adminPage = read("src/app/(platform)/admin/commercial/page.tsx");
const desk = read("src/components/commercial/clinic-activation-desk.tsx");
const goDaddy = read("src/lib/commercial/payment-connectors/godaddy.ts");
const stripe = read("src/lib/commercial/payment-connectors/stripe.ts");
const activationApi = read("src/app/api/onboarding/activate/route.ts");
const dashboard = read("src/app/(platform)/dashboard/page.tsx");
const firstLoginTruth = read("src/lib/commercial/clinic-launch-briefing.ts");

describe("recurring clinic plan rail readiness", () => {
  it("derives plan-level checkout readiness from the existing GoDaddy status helper", () => {
    expect(adminPage).toContain("goDaddyClinicPlanCheckoutStatus");
    expect(adminPage).toContain('checkoutConfigured: configured.has("clinic_core")');
    expect(adminPage).toContain('checkoutConfigured: configured.has("clinic_growth")');
    expect(adminPage).toContain('checkoutConfigured: configured.has("clinic_scale")');
    expect(adminPage).toContain("railSummary={{ configuredPlanCount: railStatus.configuredPlanKeys.length, totalPlanCount: plans.length }}");
  });

  it("blocks the sales desk from creating a recurring checkout for an unconfigured plan", () => {
    expect(desk).toContain("checkoutConfigured: boolean");
    expect(desk).toContain("firstConfiguredPlan");
    expect(desk).toContain("!selectedPlan?.checkoutConfigured");
    expect(desk).toContain("This recurring plan does not have its exact approved checkout rail configured.");
    expect(desk).toContain("disabled={!plan.checkoutConfigured}");
    expect(desk).toContain("Klinikos will not substitute the $500 analysis link or another plan&apos;s paylink");
  });

  it("makes manual processor truth explicit instead of presenting reconciliation as webhook verification", () => {
    expect(desk).toContain("operator-managed recurring fallback");
    expect(desk).toContain("no processor webhook or authoritative verification API connected");
    expect(desk).toContain("Processor verification remains false for this recurring fallback");
    expect(desk).toContain("A staff reconciliation record is not the same thing as a signed processor webhook");
    expect(desk).toContain("operator-reconciled paid software entitlement is active");
    expect(desk).toContain("does not enable production PHI, approve connectors, or certify deployment readiness");
  });

  it("uses exact plan-specific recurring paylink variables rather than the analysis payment link", () => {
    expect(goDaddy).toContain("KLINIKOS_GODADDY_CORE_PAYLINK");
    expect(goDaddy).toContain("KLINIKOS_GODADDY_GROWTH_PAYLINK");
    expect(goDaddy).toContain("KLINIKOS_GODADDY_SCALE_PAYLINK");
    expect(goDaddy).toContain("configuredPlanKeys");
    expect(goDaddy).toContain("webhookConfigured: false");
    expect(goDaddy).toContain("processorVerification: false");
    expect(goDaddy).toContain("processorVerificationAvailable: false");
  });

  it("keeps the current Stripe connector from pretending one-time Checkout supports monthly subscriptions", () => {
    expect(stripe).toContain('if (request.product.billing !== "one_time")');
    expect(stripe).toContain("This Stripe slice supports only the one-time Clinic Operating Analysis.");
    expect(stripe).toContain('mode: "payment"');
    expect(stripe).not.toContain('mode: "subscription"');
  });

  it("preserves the paid subscription to signed activation to first-login Living Home chain", () => {
    expect(activationApi).toContain('redirectTo: "/dashboard?onboarding=complete"');
    expect(dashboard).toContain("ClinicFirstLoginLaunch");
    expect(firstLoginTruth).toContain('subscription.status === "active"');
    expect(firstLoginTruth).toContain("subscription.paymentConfirmedAt");
    expect(firstLoginTruth).toContain('onboarding.mode === "paid_activation"');
    expect(firstLoginTruth).toContain('["commercial_access", "organization", "owner", "location", "workspace"]');
    expect(firstLoginTruth).toContain("verifiedFirstLogin: paidAccess && paidWorkspaceCompleted");
  });

  it("calculates plan readiness from configuration presence without exposing secret values", () => {
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
