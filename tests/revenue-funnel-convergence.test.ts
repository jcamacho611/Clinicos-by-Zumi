import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { clinicCommercialOffers } from "@/lib/commercial/klinikos-commercial";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const salesPage = read("src/app/sales/page.tsx");
const interview = read("src/components/command/zumi-interview.tsx");
const privateDemo = read("src/app/private-demo/page.tsx");
const intake = read("src/components/sales/sales-intake-form.tsx");
const paymentReturn = read("src/app/payments/success/page.tsx");
const salesGuide = read("docs/SALES-AUDIT-FUNNEL.md");

describe("clinic revenue funnel convergence", () => {
  it("binds both public analysis surfaces to the server-owned commercial offer", () => {
    expect(clinicCommercialOffers.privateWorkflowReview.name).toBe("Clinic Operating Analysis");
    expect(clinicCommercialOffers.privateWorkflowReview.priceCents).toBe(50_000);
    expect(clinicCommercialOffers.privateWorkflowReview.priceLabel).toBe("$500");
    expect(salesPage).toContain("clinicCommercialOffers.privateWorkflowReview");
    expect(privateDemo).toContain("clinicCommercialOffers.privateWorkflowReview");
  });

  it("uses the guided operating map to drive one paid next step instead of three competing checkout choices", () => {
    expect(interview).toContain("Next paid step");
    expect(interview).toContain('href="/private-demo#reserve"');
    expect(interview).toContain("Implementation Blueprint, Founding Clinic Implementation, and recurring software are later decisions");
    expect(interview).not.toContain("engagementOffers.map");
  });

  it("locks the public persisted intake to the Clinic Operating Analysis compatibility key", () => {
    expect(intake).toContain('const ANALYSIS_OFFER_KEY: DemoOfferKey = "private_workflow_demo"');
    expect(intake).toContain("selectedOffer: ANALYSIS_OFFER_KEY");
    expect(intake).toContain("wantsFoundingEvaluation: false");
    expect(intake).toContain("wantsFoundingProgram: false");
    expect(intake).not.toContain("demoOfferKeys.map");
  });

  it("does not imply the $500 analysis activates production software", () => {
    expect(privateDemo).toContain("Automatic production account activation");
    expect(interview).toContain("does not activate production software");
    expect(paymentReturn).toContain("does not activate production software");
    expect(salesGuide).toContain("PAYMENT != SOFTWARE ENTITLEMENT");
  });

  it("never sends a checkout return back into the paid-analysis intake", () => {
    expect(paymentReturn).not.toContain('href="/private-demo"');
    expect(paymentReturn).toContain('href="/pricing"');
    expect(paymentReturn).toContain("Do not create a second reservation for the same purchase");
  });

  it("preserves the current Stripe sales-rail hierarchy from the authoritative sales guide", () => {
    expect(salesGuide).toContain("Integrated Klinikos checkout — preferred");
    expect(salesGuide).toContain("Canonical shareable Stripe Payment Link — manual-service fallback");
    expect(salesGuide).toContain("never infer payment from browser return or checkout launch");
    expect(salesGuide).toContain("does not create or unlock a Klinikos software entitlement");
  });
});
