import { describe, expect, it } from "vitest";
import {
  normalizePublicSalesReservationInput,
  paidAnalysisCheckoutSchema,
} from "@/lib/sales/paid-analysis-checkout";

const minimalCheckout = {
  clinicName: "Northstar Family Practice",
  contactName: "Jordan Rivera",
  contactEmail: "jordan@northstar.example",
  clinicType: "Primary care" as const,
  biggestPainPoint: "follow_ups" as const,
  painPoints: ["follow_ups", "no_shows"] as const,
  acknowledgesSyntheticData: true as const,
};

describe("paid analysis checkout", () => {
  it("normalizes the minimum buyer payload without inventing qualification data", () => {
    const normalized = normalizePublicSalesReservationInput(minimalCheckout);

    expect(normalized.clinicName).toBe(minimalCheckout.clinicName);
    expect(normalized.contactName).toBe(minimalCheckout.contactName);
    expect(normalized.contactEmail).toBe(minimalCheckout.contactEmail);
    expect(normalized.selectedOffer).toBe("private_workflow_demo");
    expect(normalized.wantsPaidDemo).toBe(true);
    expect(normalized.providerCount).toBe(0);
    expect(normalized.locationCount).toBe(0);
    expect(normalized.contactRole).toBe("Not collected before purchase");
    expect(normalized.contactPhone).toBe("Not collected before purchase");
    expect(normalized.currentSystems).toEqual({
      ehr: "",
      scheduling: "",
      billing: "",
      crm: "",
      patientMessaging: "",
    });
    expect(normalized.estimatedSoftwareSpendDollars).toBeNull();
    expect(normalized.painPoints).toEqual(["follow_ups", "no_shows"]);
  });

  it("requires the synthetic-data boundary before checkout", () => {
    expect(
      paidAnalysisCheckoutSchema.safeParse({
        ...minimalCheckout,
        acknowledgesSyntheticData: false,
      }).success,
    ).toBe(false);
  });

  it("rejects client-controlled commercial and tenancy state", () => {
    for (const injected of [
      { priceCents: 1 },
      { organizationId: "attacker-tenant" },
      { paymentStatus: "payment_recorded" },
      { selectedOffer: "founding_clinic_program" },
    ]) {
      expect(
        paidAnalysisCheckoutSchema.safeParse({
          ...minimalCheckout,
          ...injected,
        }).success,
      ).toBe(false);
    }
  });

  it("keeps the existing full sales intake backward compatible", () => {
    const legacy = normalizePublicSalesReservationInput({
      clinicName: "Northstar Family Practice",
      contactName: "Jordan Rivera",
      contactRole: "Owner",
      contactEmail: "jordan@northstar.example",
      contactPhone: "2125550100",
      clinicType: "Primary care",
      providerCount: 4,
      locationCount: 2,
      currentSystems: {
        ehr: "Legacy EHR",
        scheduling: "Scheduler",
        billing: "Billing vendor",
        crm: "",
        patientMessaging: "",
      },
      estimatedSoftwareSpendDollars: 2500,
      biggestPainPoint: "follow_ups",
      painPoints: ["follow_ups"],
      selectedOffer: "private_workflow_demo",
      wantsFreeIntro: false,
      wantsPaidDemo: true,
      wantsFoundingEvaluation: false,
      wantsFoundingProgram: false,
      acknowledgesSyntheticData: true,
      website: "",
    });

    expect(legacy.providerCount).toBe(4);
    expect(legacy.locationCount).toBe(2);
    expect(legacy.currentSystems.ehr).toBe("Legacy EHR");
    expect(legacy.estimatedSoftwareSpendDollars).toBe(2500);
  });
});
