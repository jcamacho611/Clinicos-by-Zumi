import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  conservativeSmsSegmentCount,
  estimateResendEmailReservationCents,
  estimateTwilioSmsReservationCents,
} from "@/lib/commercial/provider-cost-estimates";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("provider cost reservation estimates", () => {
  it("uses conservative Unicode SMS segmentation for pre-send funding", () => {
    expect(conservativeSmsSegmentCount("")).toBe(0);
    expect(conservativeSmsSegmentCount("a".repeat(70))).toBe(1);
    expect(conservativeSmsSegmentCount("a".repeat(71))).toBe(2);
    expect(conservativeSmsSegmentCount("a".repeat(134))).toBe(2);
    expect(conservativeSmsSegmentCount("a".repeat(135))).toBe(3);
  });

  it("fails closed when an SMS reservation rate is unknown", () => {
    expect(estimateTwilioSmsReservationCents("Appointment reminder", {})).toBeNull();
    expect(estimateTwilioSmsReservationCents("Appointment reminder", {
      KLINIKOS_TWILIO_SMS_RESERVATION_CENTS_PER_SEGMENT: "0",
    })).toBeNull();
  });

  it("reserves by segment without calling the estimate an invoice cost", () => {
    expect(estimateTwilioSmsReservationCents("a".repeat(135), {
      KLINIKOS_TWILIO_SMS_RESERVATION_CENTS_PER_SEGMENT: "2",
    })).toEqual({ estimatedCostCents: 6, segments: 3, centsPerSegment: 2 });
  });

  it("keeps email closed until an explicit reservation policy exists", () => {
    expect(estimateResendEmailReservationCents({})).toBeNull();
    expect(estimateResendEmailReservationCents({ KLINIKOS_RESEND_EMAIL_RESERVATION_CENTS_PER_MESSAGE: "1" }))
      .toEqual({ estimatedCostCents: 1 });
  });

  it("keeps patient SMS behind funding before provider execution", () => {
    const source = read("src/lib/communications/patient-sms-service.ts");
    expect(source).toContain("estimateTwilioSmsReservationCents");
    expect(source).toContain("executeCustomerFundedProviderCall");
    expect(source).toContain("idempotencyKey: `patient-sms:${input.idempotencyKey}`");
    expect(source).toContain("customerFundedBeforeExecution: true");
    expect(source).not.toContain("actualCostPendingProviderReconciliation");

    const funding = source.indexOf("executeCustomerFundedProviderCall({");
    const providerCall = source.indexOf("execute: () => deliverOutbound({");
    expect(funding).toBeGreaterThan(0);
    expect(providerCall).toBeGreaterThan(funding);
  });

  it("does not settle a provider acceptance from the pre-send estimate", () => {
    const wrapper = read("src/lib/commercial/funded-provider-execution.ts");
    expect(wrapper).toContain("pending_actual_cost");
    expect(wrapper).not.toContain("settleCustomerFundedUsage");
    expect(wrapper).toContain("releaseCustomerFundedUsage");
  });
});
