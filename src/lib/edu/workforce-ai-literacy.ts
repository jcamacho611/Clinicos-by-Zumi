import type { EduSimulationRole } from "@/lib/edu/edu-roles";

export const workforceAiLiteracyModuleKeys = [
  "understand_ai",
  "explore_uses",
  "direct_ai_effectively",
  "evaluate_outputs",
  "use_ai_responsibly",
] as const;

export type WorkforceAiLiteracyModuleKey = (typeof workforceAiLiteracyModuleKeys)[number];

export type WorkforceAiLiteracyModule = {
  key: WorkforceAiLiteracyModuleKey;
  title: string;
  learningObjectives: readonly string[];
  instructorLedExercise: string;
  assessmentEvidence: readonly string[];
};

export const workforceAiLiteracyModules: readonly WorkforceAiLiteracyModule[] = [
  {
    key: "understand_ai",
    title: "Understand AI principles and limits",
    learningObjectives: [
      "Explain in plain language what generative AI can and cannot reliably do",
      "Distinguish assistance, prediction, and automation from accountable human authority",
      "Recognize when the consequences of error make a task unsuitable for unreviewed AI use",
    ],
    instructorLedExercise:
      "Classify workplace tasks as human-only, AI-assisted with required review, or appropriate for bounded AI assistance, then defend each decision.",
    assessmentEvidence: ["Task-classification worksheet", "Written limitation and human-authority rationale"],
  },
  {
    key: "explore_uses",
    title: "Explore useful AI applications",
    learningObjectives: [
      "Identify practical AI uses that improve operational work without replacing professional judgment",
      "Compare productivity benefit against risk, rework, and verification cost",
      "Choose an AI-assisted workflow based on purpose, consequences, and available human review",
    ],
    instructorLedExercise:
      "Map a familiar workplace process, select one low-risk AI assistance point, and document the before/after workflow including verification and approval.",
    assessmentEvidence: ["Before/after workflow map", "Benefit, risk, and review-ownership explanation"],
  },
  {
    key: "direct_ai_effectively",
    title: "Direct AI effectively and safely",
    learningObjectives: [
      "Write clear prompts that define goal, context, constraints, audience, and expected output format",
      "Iterate on prompts without disclosing confidential, personal, patient, customer, or employer-restricted information",
      "Recognize conflicting or suspicious instructions and stop rather than forwarding unsafe content",
    ],
    instructorLedExercise:
      "Improve a weak prompt in three iterations while removing unnecessary sensitive information and adding explicit verification requirements.",
    assessmentEvidence: ["Original and revised prompts", "Privacy and sensitivity check"],
  },
  {
    key: "evaluate_outputs",
    title: "Evaluate AI outputs for accuracy and relevance",
    learningObjectives: [
      "Check AI output for factual accuracy, missing context, unsupported claims, bias, and task relevance",
      "Separate an AI-generated assertion from verified evidence",
      "Verify consequential information against an independent source, policy, system of record, or accountable person before action",
    ],
    instructorLedExercise:
      "Review an intentionally flawed AI response, identify material errors or unsupported claims, verify the correct information, and produce a corrected version.",
    assessmentEvidence: ["Annotated AI output", "Verification log naming evidence for each consequential correction"],
  },
  {
    key: "use_ai_responsibly",
    title: "Use AI responsibly, securely, and accountably",
    learningObjectives: [
      "Apply privacy, confidentiality, cybersecurity, intellectual-property, and data-minimization principles before using AI",
      "Recognize that AI output does not transfer human accountability away from the worker or organization",
      "Escalate when policy, safety, legal, privacy, security, or professional-boundary uncertainty remains",
      "Document required human review or approval before consequential AI-assisted action proceeds",
    ],
    instructorLedExercise:
      "Work through a scenario containing a privacy risk, suspicious instruction, and inaccurate AI recommendation; stop, verify, escalate, and document the final human decision.",
    assessmentEvidence: ["Risk-identification checklist", "Escalation note", "Corrected final output containing no restricted information"],
  },
] as const;

export const workforceAiDeliveryPrinciples = [
  "Live instructors remain responsible for instruction, interpretation, assessment, and completion decisions.",
  "Practice uses synthetic or otherwise approved non-sensitive training information; ordinary EDU exercises do not require real patient data.",
  "Every consequential AI-assisted workflow includes an explicit verification or human-review step.",
  "Learners practice doing work, not merely recalling AI vocabulary.",
  "Occupational examples do not imply that AI changes licensure, scope of practice, employer authority, safety rules, or legal responsibility.",
  "Accessibility is treated as a delivery requirement across materials, exercises, assessments, and software surfaces.",
] as const;

export type WorkforceAiOccupationalPathway = {
  key: "manufacturing" | "construction" | "logistics" | "healthcare" | "business_operations";
  label: string;
  status: "built_healthcare_foundation" | "configured_training_pathway";
  suggestedSimulationRoles: readonly EduSimulationRole[];
  exampleOperationalContexts: readonly string[];
};

export const workforceAiOccupationalPathways: readonly WorkforceAiOccupationalPathway[] = [
  {
    key: "manufacturing",
    label: "Manufacturing",
    status: "configured_training_pathway",
    suggestedSimulationRoles: [],
    exampleOperationalContexts: [
      "quality documentation and approved-work-instruction review",
      "production and shift communication",
      "inventory and maintenance-log organization",
      "process-improvement drafts that preserve supervisor and safety authority",
    ],
  },
  {
    key: "construction",
    label: "Construction",
    status: "configured_training_pathway",
    suggestedSimulationRoles: [],
    exampleOperationalContexts: [
      "project and field communication",
      "schedule and material coordination",
      "documentation and meeting summaries",
      "administrative safety review that preserves site and licensed-professional authority",
    ],
  },
  {
    key: "logistics",
    label: "Logistics",
    status: "configured_training_pathway",
    suggestedSimulationRoles: [],
    exampleOperationalContexts: [
      "inventory and shipment information review",
      "routing and scheduling support",
      "exception communication",
      "warehouse and supply-chain documentation",
    ],
  },
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
      "privacy, cybersecurity, verification, and escalation decisions",
    ],
  },
  {
    key: "business_operations",
    label: "Business operations",
    status: "configured_training_pathway",
    suggestedSimulationRoles: [],
    exampleOperationalContexts: [
      "office productivity and professional communication",
      "meeting and report preparation",
      "data review and scheduling",
      "process documentation and decision-support drafts",
    ],
  },
] as const;

export function getWorkforceAiLiteracyModule(key: string) {
  return workforceAiLiteracyModules.find((module) => module.key === key);
}

export function getWorkforceAiOccupationalPathway(key: string) {
  return workforceAiOccupationalPathways.find((pathway) => pathway.key === key);
}
