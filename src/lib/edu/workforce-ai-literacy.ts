import type { EduSimulationRole } from "@/lib/edu/edu-roles";

/**
 * Reusable workforce AI literacy foundation for instructor-led EDU programs.
 *
 * This is curriculum content, not an autonomous teaching or certification engine.
 * Institutions may compose these modules into short-duration workforce programs
 * without forking the product. Human instructors remain authoritative for
 * instruction, assessment, completion, and competency decisions.
 */

export const workforceAiLiteracyModuleKeys = [
  "understand_ai",
  "explore_uses",
  "direct_ai_effectively",
  "evaluate_outputs",
  "use_ai_responsibly",
] as const;

export type WorkforceAiLiteracyModuleKey =
  (typeof workforceAiLiteracyModuleKeys)[number];

export type WorkforceAiLiteracyModule = {
  key: WorkforceAiLiteracyModuleKey;
  title: string;
  learningObjectives: readonly string[];
  instructorLedExercise: string;
  assessmentEvidence: readonly string[];
};

/**
 * These five modules intentionally mirror the U.S. Department of Labor AI
 * Literacy Framework's five foundational content areas while remaining written
 * in Klinikos' own curriculum language.
 */
export const workforceAiLiteracyModules: readonly WorkforceAiLiteracyModule[] = [
  {
    key: "understand_ai",
    title: "Understand AI principles and limits",
    learningObjectives: [
      "Explain in plain language what generative AI can and cannot reliably do",
      "Distinguish assistance, prediction, and automation from human authority",
      "Recognize when a task is unsuitable for AI because consequences require accountable human judgment",
    ],
    instructorLedExercise:
      "Classify a set of workplace tasks as appropriate for AI assistance, human-only, or AI-assisted with required human review, then defend each decision.",
    assessmentEvidence: [
      "Completed task-classification worksheet",
      "Written rationale identifying at least one AI limitation and one human-authority boundary",
    ],
  },
  {
    key: "explore_uses",
    title: "Explore useful AI applications",
    learningObjectives: [
      "Identify practical AI uses that improve administrative and operational work without replacing professional judgment",
      "Compare where AI can save time against where it can introduce risk or rework",
      "Select an AI-assisted workflow based on purpose, user need, and consequences of error",
    ],
    instructorLedExercise:
      "Map a familiar workplace process, identify one low-risk AI assistance point, and describe the before/after workflow including the human review step.",
    assessmentEvidence: [
      "Before/after workflow map",
      "Short explanation of expected benefit, failure modes, and review ownership",
    ],
  },
  {
    key: "direct_ai_effectively",
    title: "Direct AI effectively and safely",
    learningObjectives: [
      "Write clear prompts that specify goal, context, constraints, audience, and desired output format",
      "Use iterative prompting without disclosing confidential, personal, patient, customer, or employer-restricted information",
      "Recognize prompt-injection or instruction-conflict patterns and stop rather than forwarding unsafe content",
    ],
    instructorLedExercise:
      "Improve a weak prompt in three iterations while removing unnecessary sensitive information and adding explicit verification requirements.",
    assessmentEvidence: [
      "Original and revised prompts",
      "Privacy/sensitivity check identifying what information was intentionally excluded",
    ],
  },
  {
    key: "evaluate_outputs",
    title: "Evaluate AI outputs for accuracy and relevance",
    learningObjectives: [
      "Check AI outputs for factual accuracy, missing context, unsupported claims, and task relevance",
      "Separate an AI-generated assertion from verified evidence",
      "Use an independent source, policy, system of record, or accountable person to verify consequential information before action",
    ],
    instructorLedExercise:
      "Review an intentionally flawed AI response, identify every material error or unsupported claim, verify the correct information, and produce a corrected version.",
    assessmentEvidence: [
      "Annotated AI output showing identified defects",
      "Verification log naming the evidence used for each consequential correction",
    ],
  },
  {
    key: "use_ai_responsibly",
    title: "Use AI responsibly, securely, and accountably",
    learningObjectives: [
      "Apply privacy, confidentiality, cybersecurity, and data-minimization principles before entering information into an AI system",
      "Recognize that AI output does not transfer accountability away from the worker or organization",
      "Escalate when policy, safety, legal, privacy, security, or professional-boundary uncertainty remains",
      "Document the human review or approval required before a consequential AI-assisted action proceeds",
    ],
    instructorLedExercise:
      "Work through a scenario containing a privacy risk, a suspicious instruction, and an inaccurate AI recommendation; stop, verify, escalate, and document the final human decision.",
    assessmentEvidence: [
      "Risk-identification checklist",
      "Escalation note and human-review record",
      "Corrected final output containing no restricted information",
    ],
  },
] as const;

export const workforceAiDeliveryPrinciples = [
  "Live instructors remain responsible for instruction, interpretation, assessment, and completion decisions.",
  "Practice uses synthetic or otherwise approved non-sensitive training information; ordinary EDU exercises do not require real patient data.",
  "Every consequential AI-assisted workflow includes an explicit verification or human-review step.",
  "Learners practice doing work, not merely recalling AI vocabulary.",
  "Examples are adapted to an occupational context without representing that AI changes licensure, scope of practice, or professional authority.",
  "Accessibility is treated as a delivery requirement across instructional materials, exercises, assessments, and the supporting software surface.",
] as const;

export type WorkforceAiOccupationalPathway = {
  key: string;
  label: string;
  status: "built_healthcare_foundation" | "configurable_methodology";
  suggestedSimulationRoles: readonly EduSimulationRole[];
  exampleOperationalContexts: readonly string[];
};

/**
 * Only healthcare has an existing Klinikos role-based simulation foundation.
 * Other RFP-relevant pathways are represented as configuration methodology,
 * not falsely claimed as completed curricula.
 */
export const workforceAiOccupationalPathways: readonly WorkforceAiOccupationalPathway[] = [
  {
    key: "healthcare",
    label: "Healthcare",
    status: "built_healthcare_foundation",
    suggestedSimulationRoles: [
      "front_desk",
      "medical_assistant",
      "nurse",
      "provider",
      "biller",
      "coder",
      "practice_manager",
      "compliance_officer",
    ],
    exampleOperationalContexts: [
      "scheduling and patient-access administration",
      "documentation support and information organization",
      "referral and follow-up coordination",
      "billing-readiness and administrative review",
      "privacy, cybersecurity, and escalation decisions",
    ],
  },
  {
    key: "manufacturing",
    label: "Manufacturing",
    status: "configurable_methodology",
    suggestedSimulationRoles: [],
    exampleOperationalContexts: ["work instructions", "quality documentation", "shift communication", "inventory and production administration"],
  },
  {
    key: "construction",
    label: "Construction",
    status: "configurable_methodology",
    suggestedSimulationRoles: [],
    exampleOperationalContexts: ["project communication", "documentation", "scheduling", "administrative safety review"],
  },
  {
    key: "logistics",
    label: "Logistics",
    status: "configurable_methodology",
    suggestedSimulationRoles: [],
    exampleOperationalContexts: ["routing administration", "exception communication", "inventory information", "handoff documentation"],
  },
  {
    key: "business_operations",
    label: "Business operations",
    status: "configurable_methodology",
    suggestedSimulationRoles: [],
    exampleOperationalContexts: ["professional communication", "document drafting", "information organization", "workflow analysis"],
  },
] as const;

export function getWorkforceAiLiteracyModule(key: string) {
  return workforceAiLiteracyModules.find((module) => module.key === key);
}

export function getWorkforceAiOccupationalPathway(key: string) {
  return workforceAiOccupationalPathways.find((pathway) => pathway.key === key);
}
