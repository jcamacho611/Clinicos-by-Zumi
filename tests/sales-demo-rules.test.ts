import { describe, expect, it } from "vitest";
import { clinicCommercialOffers } from "@/lib/commercial/klinikos-commercial";
import {
  buildDemoRecapDraft,
  buildSyntheticDemoScenario,
  canTransitionDemoReservation,
  demoOffers,
  salesIntakeSchema,
} from "@/lib/sales-demo-rules";

const validIntake = {
  clinicName: "Northstar Family Practice",
  contactName: "Jordan Rivera",
  contactRole: "Practice owner",
  contactEmail: "jordan@example.test",
  contactPhone: "(212) 555-0198",
  clinicType: "Primary care",
  providerCount: 4,
  locationCount: 2,
  currentSystems: { ehr: "Demo EHR", scheduling: "Calendar tool", billing: "Billing vendor", crm: "None", patientMessaging: "Phone" },
  estimatedSoftwareSpendDollars: 2400,
  biggestPainPoint: "referrals",
  painPoints: ["referrals", "staff_accountability"],
  selectedOffer: "private_workflow_demo",
  wantsFreeIntro: false,
  wantsPaidDemo: true,
  wantsFoundingEvaluation: false,
  wantsFoundingProgram: false,
  acknowledgesSyntheticData: true,
};

describe("Clinic Operating Analysis safety and lifecycle rules", () => {
  it("validates a complete clinic intake without accepting tenant identifiers", () => {
    expect(salesIntakeSchema.parse(validIntake).clinicName).toBe("Northstar Family Practice");
    expect(salesIntakeSchema.safeParse({ ...validIntake, organizationId: "org-other" }).success).toBe(false);
    expect(salesIntakeSchema.safeParse({ ...validIntake, acknowledgesSyntheticData: false }).success).toBe(false);
  });

  it("keeps compatibility offer display truth aligned with the canonical commercial catalog", () => {
    expect(demoOffers.private_workflow_demo).toMatchObject({
      name: clinicCommercialOffers.privateWorkflowReview.name,
      priceCents: clinicCommercialOffers.privateWorkflowReview.priceCents,
      shortPrice: clinicCommercialOffers.privateWorkflowReview.priceLabel,
      creditForward: clinicCommercialOffers.privateWorkflowReview.creditForward,
    });
    expect(demoOffers.founding_clinic_evaluation).toMatchObject({
      name: clinicCommercialOffers.foundingEvaluation.name,
      priceCents: clinicCommercialOffers.foundingEvaluation.priceCents,
      shortPrice: clinicCommercialOffers.foundingEvaluation.priceLabel,
      creditForward: clinicCommercialOffers.foundingEvaluation.creditForward,
    });
    expect(demoOffers.founding_clinic_program).toMatchObject({
      name: clinicCommercialOffers.foundingImplementation.name,
      priceCents: clinicCommercialOffers.foundingImplementation.priceCents,
      shortPrice: clinicCommercialOffers.foundingImplementation.priceLabel,
      creditForward: clinicCommercialOffers.foundingImplementation.creditForward,
    });
  });

  it("generates an explicitly synthetic, human-reviewed scenario", () => {
    const scenario = buildSyntheticDemoScenario({ clinicType: "Primary care", biggestPainPoint: "referrals", painPoints: ["referrals"] });
    expect(scenario.syntheticPatient.synthetic).toBe(true);
    expect(scenario.syntheticPatient.notice).toContain("Not a real patient");
    expect(scenario.syntheticResult.status).toBe("Awaiting provider review");
    expect(scenario.syntheticBillingItem.submission).toContain("Blocked");
    expect(scenario.recommendedWorkflow.productStatus).toContain("Human review required");
  });

  it("enforces forward lifecycle transitions and explicit recovery paths", () => {
    expect(canTransitionDemoReservation("inquiry", "qualified")).toBe(true);
    expect(canTransitionDemoReservation("inquiry", "completed")).toBe(false);
    expect(canTransitionDemoReservation("scheduled", "no_show")).toBe(true);
    expect(canTransitionDemoReservation("no_show", "scheduled")).toBe(true);
    expect(canTransitionDemoReservation("moved_to_founding", "inquiry")).toBe(false);
  });

  it("marks generated recaps as drafts requiring human review and uses canonical next-step language", () => {
    const recap = buildDemoRecapDraft({ clinicName: "Northstar", clinicType: "Primary care", biggestPainPoint: "referrals", painPoints: ["referrals"], scenarioTitle: "Referral command" });
    expect(recap.status).toBe("draft");
    expect(recap.reviewStatus).toBe("human_review_required");
    expect(recap.callToAction).toContain("Implementation Blueprint");
    expect(recap.callToAction).toContain("human reviews");
    expect(recap.recommendedNextStep).not.toContain("Founding Clinic Evaluation");
  });
});
