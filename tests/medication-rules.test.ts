import { describe, expect, it } from "vitest";
import {
  createPrescriptionSchema,
  deterministicMedicationWarnings,
  nextPrescriptionStatus,
  nextReconciliationStatus,
  nextRefillStatus,
  normalizeMedicationTerm,
  transitionRefillSchema,
} from "@/lib/medication-rules";

describe("medication lifecycle rules", () => {
  it("requires explicit legal reconciliation transitions", () => {
    expect(nextReconciliationStatus("draft", "complete")).toBe("completed");
    expect(nextReconciliationStatus("completed", "reopen")).toBe("reopened");
    expect(nextReconciliationStatus("draft", "reopen")).toBeNull();
  });

  it("keeps refill intake separate from provider decision and delivery", () => {
    expect(nextRefillStatus("requested", "route_provider")).toBe("needs_provider");
    expect(nextRefillStatus("needs_provider", "approve")).toBe("approved");
    expect(nextRefillStatus("approved", "confirm_sent")).toBeNull();
    expect(nextRefillStatus("approved", "queue")).toBe("queued");
    expect(nextRefillStatus("queued", "confirm_sent")).toBe("sent");
    expect(nextRefillStatus("sent", "complete")).toBe("completed");
  });

  it("requires reasons for denial and a receipt for sent confirmation", () => {
    expect(transitionRefillSchema.safeParse({ action: "deny" }).success).toBe(false);
    expect(transitionRefillSchema.safeParse({ action: "deny", note: "Provider denied after chart review." }).success).toBe(true);
    expect(transitionRefillSchema.safeParse({ action: "confirm_sent" }).success).toBe(false);
    expect(transitionRefillSchema.safeParse({ action: "confirm_sent", manualConfirmation: "Staff confirmed receipt with pharmacy." }).success).toBe(true);
  });

  it("requires controlled substances to use the EPCS adapter boundary", () => {
    const common = { patientId: "p1", medicationId: "m1", providerId: "pr1", dosageInstructions: "Use as directed", quantity: "30", controlledSubstance: true, deaSchedule: "II" };
    expect(createPrescriptionSchema.safeParse({ ...common, deliveryMethod: "manual" }).success).toBe(false);
    expect(createPrescriptionSchema.safeParse({ ...common, deliveryMethod: "electronic_adapter", integrationId: "i1" }).success).toBe(true);
  });

  it("enforces legal prescription status order", () => {
    expect(nextPrescriptionStatus("draft", "approve")).toBe("approved");
    expect(nextPrescriptionStatus("draft", "queue")).toBeNull();
    expect(nextPrescriptionStatus("approved", "queue")).toBe("queued");
    expect(nextPrescriptionStatus("queued", "confirm_sent")).toBe("sent");
    expect(nextPrescriptionStatus("failed", "retry")).toBe("queued");
  });
});

describe("deterministic medication warning provenance", () => {
  it("normalizes punctuation without inferring drug-class relationships", () => {
    expect(normalizeMedicationTerm("  Metformin-HCl  ")).toBe("metformin hcl");
    const warnings = deterministicMedicationWarnings({
      medicationName: "Amoxicillin",
      allergies: [{ id: "a1", substance: "Penicillin", reaction: "rash", severity: "severe" }],
      activeMedications: [],
    });
    expect(warnings).toEqual([]);
  });

  it("creates source-labeled exact allergy and duplicate warnings", () => {
    const warnings = deterministicMedicationWarnings({
      medicationId: "m2",
      medicationName: "Penicillin",
      allergies: [{ id: "a1", substance: "Penicillin", reaction: "hives", severity: "severe" }],
      activeMedications: [{ id: "m1", name: "Penicillin" }, { id: "m2", name: "Penicillin" }],
    });
    expect(warnings).toHaveLength(2);
    expect(warnings.map((warning) => warning.warningType)).toEqual(["exact_allergy_name_match", "exact_active_duplicate"]);
    expect(warnings.every((warning) => warning.source === "clinicos_exact_name_rule")).toBe(true);
    expect(warnings[0].severity).toBe("urgent");
  });
});
