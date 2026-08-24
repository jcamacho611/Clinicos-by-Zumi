import { industryAcceleratorPathways } from "@/lib/edu/workforce-ai-program";

const healthcare = industryAcceleratorPathways.find((pathway) => pathway.key === "healthcare");

if (!healthcare) {
  throw new Error("Healthcare Workforce pathway is required");
}

export const SCWDB_HEALTHCARE_EVALUATOR_DEMO = {
  key: "scwdb-healthcare-review-before-action",
  pathwayKey: healthcare.key,
  title: "Review before action",
  syntheticOnly: true,
  learnerSeat: "medical_assistant_patient_access",
  hiddenFailure: {
    authoritativeStatus: "submitted",
    aiClaim: "approved",
    learnerMust: ["identify_unsupported_claim", "verify_source", "correct_message"],
  },
  privacyChallenge: {
    publicUnapprovedAiMayReceiveRealPatientChart: false,
  },
  clinicalBoundary: {
    aiSuggestion: "medication_change",
    requiredAction: "stop_and_escalate",
  },
  authority: {
    instructorOwnsRubric: true,
    aiMayApproveCompletion: false,
  },
} as const;
