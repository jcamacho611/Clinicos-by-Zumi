import { describe, expect, it } from "vitest";
import { AI_SERVICE_PROCESSING_POLICY } from "@/lib/legal/ai-service-processing-policy";

describe("Klinikos AI service processing policy", () => {
  it("requires purpose limitation and minimum necessary processing", () => {
    expect(AI_SERVICE_PROCESSING_POLICY.requiresCounselReview).toBe(true);
    expect(AI_SERVICE_PROCESSING_POLICY.principles).toEqual(expect.arrayContaining([
      "purpose-limited",
      "minimum-necessary",
      "approved-subprocessors-only",
      "no-general-purpose-model-training-by-default",
      "no-cross-purpose-reuse",
      "phi-only-in-approved-hipaa-gated-workflows",
      "operational-personalization-is-distinct-from-commercial-targeting",
    ]));
  });

  it("forbids blanket AI reuse of healthcare and user data", () => {
    expect(AI_SERVICE_PROCESSING_POLICY.prohibitedUses).toEqual(expect.arrayContaining([
      "use-clinical-or-phi-context-for-generic-commercial-targeting",
      "send-public-zumi-phi",
      "treat-ai-output-as-authority",
      "reuse-user-data-for-unrestricted-provider-model-training",
      "silently-expand-ai-data-scope-beyond-active-experience-envelope",
    ]));
  });

  it("records agreement and processing provenance", () => {
    expect(AI_SERVICE_PROCESSING_POLICY.agreementProvenance).toEqual(expect.objectContaining({
      captureVersion: true,
      captureTimestamp: true,
      captureActor: true,
      captureSurface: true,
      captureProcessingPurpose: true,
      captureDataClass: true,
    }));
  });
});
