import { describe, expect, it } from "vitest";
import {
  LUXE_MANUAL_PAYMENT_EVENT,
  LUXE_PROCESSOR_PAYMENT_EVENT,
  manualLuxePaymentEvidenceSchema,
  summarizeLeadPaymentEvidence,
} from "@/lib/luxe-payment-evidence-rules";

describe("Luxe payment evidence rules", () => {
  it("accepts explicit manual reconciliation evidence with integer cents", () => {
    const parsed = manualLuxePaymentEvidenceSchema.parse({
      provider: "godaddy_payments",
      externalReference: "PAY-EXAMPLE-001",
      amountCents: 15000,
      currency: "USD",
      paymentKind: "deposit",
      evidenceSource: "processor_dashboard",
      receivedAt: "2026-08-18T13:00:00-04:00",
      note: "Confirmed against the provider dashboard by authorized staff.",
    });
    expect(parsed.amountCents).toBe(15000);
  });

  it("rejects zero, negative, fractional, and unsupported-currency amounts", () => {
    const base = {
      provider: "godaddy_payments",
      externalReference: "PAY-EXAMPLE-001",
      paymentKind: "deposit",
      evidenceSource: "processor_dashboard",
      receivedAt: "2026-08-18T13:00:00-04:00",
      note: "Confirmed against the provider dashboard by authorized staff.",
    };
    expect(manualLuxePaymentEvidenceSchema.safeParse({ ...base, amountCents: 0 }).success).toBe(false);
    expect(manualLuxePaymentEvidenceSchema.safeParse({ ...base, amountCents: -1 }).success).toBe(false);
    expect(manualLuxePaymentEvidenceSchema.safeParse({ ...base, amountCents: 150.5 }).success).toBe(false);
    expect(manualLuxePaymentEvidenceSchema.safeParse({ ...base, amountCents: 15000, currency: "EUR" }).success).toBe(false);
  });

  it("never counts manual reconciliation as processor verification", () => {
    const summary = summarizeLeadPaymentEvidence([
      { leadId: "lead-1", eventType: LUXE_MANUAL_PAYMENT_EVENT, amountCents: 15000, processorVerified: false, verificationMethod: "manual_reconciliation" },
      { leadId: "lead-1", eventType: LUXE_PROCESSOR_PAYMENT_EVENT, amountCents: 30000, processorVerified: true, verificationMethod: "processor_verification" },
    ]);
    expect(summary.manualReconciledCents).toBe(15000);
    expect(summary.processorVerifiedCents).toBe(30000);
    expect(summary.collectedWithEvidenceCents).toBe(45000);
  });

  it("ignores mislabeled evidence rather than inflating revenue", () => {
    const summary = summarizeLeadPaymentEvidence([
      { leadId: "lead-1", eventType: LUXE_MANUAL_PAYMENT_EVENT, amountCents: 15000, processorVerified: true, verificationMethod: "manual_reconciliation" },
      { leadId: "lead-1", eventType: LUXE_PROCESSOR_PAYMENT_EVENT, amountCents: 30000, processorVerified: false, verificationMethod: "processor_verification" },
    ]);
    expect(summary.collectedWithEvidenceCents).toBe(0);
  });
});
