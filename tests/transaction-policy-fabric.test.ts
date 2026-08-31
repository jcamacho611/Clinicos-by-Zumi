import { describe, expect, it } from "vitest";
import {
  TRANSACTION_POLICY_CLASSES,
  transactionPolicyForGridResourceClass,
  transactionPolicyForClass,
} from "@/lib/commercial/transaction-policy-fabric";

describe("transaction policy fabric", () => {
  it("defines the canonical Final-Form transaction policy vocabulary", () => {
    expect(TRANSACTION_POLICY_CLASSES).toEqual([
      "SPACE_RENTAL",
      "BUSINESS_SERVICE",
      "EDUCATION",
      "PRODUCT",
      "WORKFORCE",
      "PROFESSIONAL_SERVICE",
      "CARE_DISCOVERY",
      "REFERRAL",
      "DIAGNOSTIC_CAPACITY",
      "OTHER_ALLOWED_CLASS",
    ]);
  });

  it("maps current Grid resource classes onto the shared transaction vocabulary without duplicating fee truth", () => {
    expect(transactionPolicyForGridResourceClass("space")?.transactionClass).toBe("SPACE_RENTAL");
    expect(transactionPolicyForGridResourceClass("product")?.transactionClass).toBe("PRODUCT");
    expect(transactionPolicyForGridResourceClass("education")?.transactionClass).toBe("EDUCATION");
    expect(transactionPolicyForGridResourceClass("nonclinical_service")?.transactionClass).toBe("BUSINESS_SERVICE");
    expect(transactionPolicyForGridResourceClass("provider")?.transactionClass).toBe("WORKFORCE");
    expect(transactionPolicyForGridResourceClass("regulated_clinical_service")?.transactionClass).toBe("PROFESSIONAL_SERVICE");
    expect(transactionPolicyForGridResourceClass("referral")?.transactionClass).toBe("REFERRAL");
    expect(transactionPolicyForGridResourceClass("equipment")?.transactionClass).toBe("OTHER_ALLOWED_CLASS");
  });

  it("preserves the existing Grid fee declaration as the economic source instead of copying fee numbers", () => {
    const space = transactionPolicyForGridResourceClass("space");
    expect(space?.economicSource.resourceClass).toBe("space");
    expect(space?.economicSource.version).toBe(1);
    expect(space?.economicSource.feeModel).toBe("percentage");
    expect(space?.economicSource.legalReview).toBe("business_draft");
  });

  it("marks patient-care and referral classes as no current platform-fee policy without claiming legal approval", () => {
    const clinical = transactionPolicyForGridResourceClass("regulated_clinical_service");
    const referral = transactionPolicyForGridResourceClass("referral");

    expect(clinical?.economicSource.feeModel).toBe("none");
    expect(clinical?.economicSource.legalReview).toBe("requires_legal_review");
    expect(referral?.economicSource.feeModel).toBe("none");
    expect(referral?.economicSource.legalReview).toBe("requires_legal_review");
    expect(clinical?.requiresCounselBeforeFeeActivation).toBe(true);
    expect(referral?.requiresCounselBeforeFeeActivation).toBe(true);
  });

  it("represents future transaction classes without inventing live Grid economics", () => {
    const careDiscovery = transactionPolicyForClass("CARE_DISCOVERY");
    const diagnosticCapacity = transactionPolicyForClass("DIAGNOSTIC_CAPACITY");

    expect(careDiscovery.economicSource).toBeNull();
    expect(careDiscovery.activationState).toBe("NO_ACTIVE_ECONOMIC_SOURCE");
    expect(careDiscovery.requiresCounselBeforeFeeActivation).toBe(true);
    expect(diagnosticCapacity.economicSource).toBeNull();
    expect(diagnosticCapacity.activationState).toBe("NO_ACTIVE_ECONOMIC_SOURCE");
    expect(diagnosticCapacity.requiresCounselBeforeFeeActivation).toBe(true);
  });

  it("fails closed for unknown resource classes", () => {
    expect(transactionPolicyForGridResourceClass("future_unknown_class")).toBeNull();
  });
});
