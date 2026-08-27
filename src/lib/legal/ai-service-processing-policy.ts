export const AI_SERVICE_PROCESSING_AGREEMENT_KEY = "global_terms_ai_service_processing";

export const AI_SERVICE_PROCESSING_POLICY = {
  agreementKey: AI_SERVICE_PROCESSING_AGREEMENT_KEY,
  status: "COUNSEL_REVIEW_REQUIRED",
  requiresCounselReview: true,
  notice:
    "Klinikos may use approved AI model providers and other approved subprocessors to process the minimum data reasonably necessary to provide a requested AI-supported service. This permission is purpose-limited and does not grant an unrestricted right to reuse customer, user, clinical, or confidential data for general-purpose model training, unrelated advertising, or unrelated product development.",
  principles: [
    "purpose-limited",
    "minimum-necessary",
    "approved-subprocessors-only",
    "no-general-purpose-model-training-by-default",
    "no-cross-purpose-reuse",
    "phi-only-in-approved-hipaa-gated-workflows",
    "operational-personalization-is-distinct-from-commercial-targeting",
    "active-experience-envelope-bounds-zumi-context",
    "authorization-remains-deterministic-and-server-side",
    "agreement-acceptance-does-not-create-professional-clinical-or-organization-authority",
  ],
  servicePurposes: [
    "intent-understanding",
    "navigation",
    "summarization",
    "information-retrieval",
    "workflow-assistance",
    "draft-preparation",
    "authorized-tool-orchestration",
    "education-assistance",
    "grid-discovery-assistance",
    "clinic-operations-assistance",
    "clinical-documentation-assistance-only-in-approved-healthcare-workflows",
  ],
  prohibitedUses: [
    "use-clinical-or-phi-context-for-generic-commercial-targeting",
    "send-public-zumi-phi",
    "treat-ai-output-as-authority",
    "reuse-user-data-for-unrestricted-provider-model-training",
    "silently-expand-ai-data-scope-beyond-active-experience-envelope",
    "silently-cross-organization-context",
    "use-authentication-secrets-as-ai-context",
    "use-payment-secrets-as-ai-context",
    "convert-a-self-claim-into-a-verified-fact",
    "convert-an-ai-recommendation-into-clinical-signature-or-payment-truth",
  ],
  dataClassRules: {
    public: {
      aiAllowed: true,
      phiAllowed: false,
      conditions: ["public-safe-purpose", "no-secret-or-restricted-data"],
    },
    accountAndProfile: {
      aiAllowed: true,
      phiAllowed: false,
      conditions: ["service-purpose", "minimum-necessary", "active-experience-envelope"],
    },
    professionalAndCredentialMetadata: {
      aiAllowed: true,
      phiAllowed: false,
      conditions: ["service-purpose", "minimum-necessary", "verification-status-preserved"],
    },
    organizationOperational: {
      aiAllowed: true,
      phiAllowed: false,
      conditions: ["authorized-organization-context", "service-purpose", "minimum-necessary"],
    },
    education: {
      aiAllowed: true,
      phiAllowed: false,
      conditions: ["education-purpose", "assigned-program-scope", "synthetic-data-first-for-clinical-simulation"],
    },
    grid: {
      aiAllowed: true,
      phiAllowed: false,
      conditions: ["grid-purpose", "eligibility-remains-deterministic", "minimum-necessary"],
    },
    clinicalAndPhi: {
      aiAllowed: true,
      phiAllowed: true,
      conditions: [
        "approved-hipaa-gated-ai-rail",
        "organization-and-user-authority",
        "minimum-necessary",
        "baa-when-legally-required",
        "authorized-healthcare-purpose",
        "screen-experience-contract-allows-data-class",
      ],
    },
    secrets: {
      aiAllowed: false,
      phiAllowed: false,
      conditions: ["never-place-authentication-payment-encryption-or-platform-secrets-in-model-context"],
    },
  },
  commercialTargetingBoundary: {
    allowed: [
      "contextual-product-education-from-non-sensitive-user-intent",
      "organization-level-operational-product-guidance-when-permitted-by-contract-and-policy",
    ],
    prohibited: [
      "clinical-condition-based-upsell",
      "phi-based-advertising-or-generic-commercial-targeting",
      "patient-message-or-transcript-based-ad-targeting",
      "sale-of-private-ai-conversation-content-as-an-ad-audience",
      "cross-customer-identifiable-benchmark-marketing",
    ],
  },
  modelTraining: {
    default: "not-permitted",
    providerGeneralPurposeTraining: "not-permitted-by-default",
    futureOptionalTrainingProgram:
      "requires-separate-explicit-lawful-opt-in-with-specific-purpose-data-class-retention-and-withdrawal-terms; never infer consent from ordinary service acceptance",
  },
  phiControls: {
    publicZumi: "forbidden",
    approvedHealthcareWorkflow: "minimum-necessary-and-hipaa-gated",
    externalProviderRequirement: "approved-vendor-contract-and-baa-when-legally-required",
    screenRequirement: "screen-experience-contract-must-explicitly-allow-the-data-class-and-purpose",
  },
  agreementProvenance: {
    captureVersion: true,
    captureTimestamp: true,
    captureActor: true,
    captureSurface: true,
    captureProcessingPurpose: true,
    captureDataClass: true,
    captureAgreementKey: true,
    captureDocumentHashWhenSigned: true,
  },
  executionBoundary: {
    zumiMay: ["interpret", "retrieve", "organize", "summarize", "recommend", "prepare-draft", "invoke-authorized-tool"],
    zumiMayNot: [
      "grant-authority",
      "create-credential-truth",
      "create-clinical-truth",
      "create-payment-or-settlement-truth",
      "override-policy-engine",
      "override-human-signature-requirement",
    ],
  },
  releaseGate: [
    "every-ai-enabled-screen-identifies-processing-purpose",
    "every-ai-enabled-screen-identifies-allowed-and-prohibited-data-classes",
    "every-ai-enabled-screen-identifies-phi-gate",
    "every-ai-enabled-screen-identifies-agreement-key",
    "every-ai-enabled-screen-identifies-zumi-read-infer-recommend-draft-execute-and-forbidden-scope",
    "every-ai-enabled-screen-identifies-audit-and-provenance",
  ],
} as const;

export type AiServiceProcessingPolicy = typeof AI_SERVICE_PROCESSING_POLICY;
