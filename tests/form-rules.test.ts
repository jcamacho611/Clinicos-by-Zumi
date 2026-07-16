import { describe, expect, it } from "vitest";
import {
  createFormAssignmentSchema,
  createFormTemplateSchema,
  evaluateFormAnswers,
  formSubmissionTransitionSchema,
  missingSignatureRoles,
  nextFormSubmissionState,
  signFormSubmissionSchema,
} from "@/lib/form-rules";

const definition = {
  sections: [{
    id: "health",
    title: "Health history",
    fields: [
      { id: "has_allergies", label: "Do you have allergies?", type: "yes_no", required: true, options: [] },
      { id: "allergy_details", label: "Allergy details", type: "textarea", required: true, options: [], condition: { fieldId: "has_allergies", operator: "equals", value: true } },
      { id: "contact_email", label: "Email", type: "email", required: false, options: [] },
    ],
  }],
};

describe("governed intake form rules", () => {
  it("validates unique field definitions and signature policy", () => {
    const base = { name: "New patient intake", category: "intake", completionModes: ["patient"], definition };
    expect(createFormTemplateSchema.safeParse(base).success).toBe(true);
    expect(createFormTemplateSchema.safeParse({ ...base, requiresWitness: true }).success).toBe(false);
    expect(createFormTemplateSchema.safeParse({ ...base, definition: { sections: [{ ...definition.sections[0], fields: [...definition.sections[0].fields, definition.sections[0].fields[0]] }] } }).success).toBe(false);
  });

  it("evaluates conditional required fields and completion", () => {
    const noAllergies = evaluateFormAnswers(definition, { has_allergies: false });
    expect(noAllergies.missingRequired).toEqual([]);
    expect(noAllergies.visibleFields.map((field) => field.id)).not.toContain("allergy_details");
    const allergies = evaluateFormAnswers(definition, { has_allergies: true });
    expect(allergies.missingRequired).toEqual(["Allergy details"]);
    expect(evaluateFormAnswers(definition, { has_allergies: true, allergy_details: "Penicillin", contact_email: "invalid" }).invalidFields).toEqual(["Email"]);
  });

  it("enforces assignment dates and attested signer identity", () => {
    expect(createFormAssignmentSchema.safeParse({ patientId: "pt-1", templateId: "tpl-1", completionMode: "patient", deliveryMethod: "portal", dueAt: "2026-07-20", expiresAt: "2026-07-19" }).success).toBe(false);
    expect(signFormSubmissionSchema.safeParse({ signerType: "submitter", signerName: "Maya Thompson", signatureText: "Maya Thompson", attestationAccepted: true }).success).toBe(true);
    expect(signFormSubmissionSchema.safeParse({ signerType: "submitter", signerName: "Maya Thompson", signatureText: "Maya Thompson", attestationAccepted: false }).success).toBe(false);
  });

  it("routes submissions through required human review stages", () => {
    const staffFirst = nextFormSubmissionState({ status: "draft", staffReviewRequired: true, providerReviewRequired: true, requiresProviderSignature: true, signatures: ["submitter"] }, "submit");
    expect(staffFirst).toEqual({ status: "staff_review", currentReviewStage: "staff" });
    expect(nextFormSubmissionState({ status: "staff_review", staffReviewRequired: true, providerReviewRequired: true, requiresProviderSignature: true, signatures: ["submitter"] }, "approve_staff")).toEqual({ status: "provider_review", currentReviewStage: "provider" });
    expect(() => nextFormSubmissionState({ status: "provider_review", staffReviewRequired: true, providerReviewRequired: true, requiresProviderSignature: true, signatures: ["submitter"] }, "approve_provider")).toThrow("signature");
    expect(nextFormSubmissionState({ status: "provider_review", staffReviewRequired: true, providerReviewRequired: true, requiresProviderSignature: true, signatures: ["submitter", "provider"] }, "approve_provider")).toEqual({ status: "approved", currentReviewStage: null });
  });

  it("requires review notes and prevents locked mutation", () => {
    expect(formSubmissionTransitionSchema.safeParse({ action: "request_correction" }).success).toBe(false);
    expect(formSubmissionTransitionSchema.safeParse({ action: "request_correction", note: "Please clarify the allergy details." }).success).toBe(true);
    expect(() => nextFormSubmissionState({ status: "locked", staffReviewRequired: false, providerReviewRequired: false, requiresProviderSignature: false, signatures: [] }, "submit")).toThrow("immutable");
  });

  it("reports outstanding patient and witness signatures", () => {
    expect(missingSignatureRoles({ requiresSignature: true, requiresWitness: true }, [])).toEqual(["submitter", "witness"]);
    expect(missingSignatureRoles({ requiresSignature: true, requiresWitness: true }, ["submitter", "witness"])).toEqual([]);
  });
});
