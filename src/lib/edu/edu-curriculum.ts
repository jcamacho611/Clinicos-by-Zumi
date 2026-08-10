import type { EduSimulationRole } from "@/lib/edu/edu-roles";

/**
 * Klinikos EDU curriculum packages.
 *
 * The eight launch packages, defined in code so a deployment cannot ship a course
 * catalog that drifts from the specification. Institutions instantiate an
 * `EducationCourse` from a package; the package is the template, the course is the
 * institution's own offering of it.
 *
 * Pure module. No database, no network.
 */

export const curriculumPackageKeys = [
  "medical_office_operations",
  "intro_ehr_clinical_systems",
  "medical_billing_claims",
  "clinical_documentation_lab",
  "referral_care_coordination",
  "privacy_security_hipaa_operations",
  "ai_in_healthcare_operations",
  "healthcare_entrepreneurship",
] as const;

export type CurriculumPackageKey = (typeof curriculumPackageKeys)[number];

export type CurriculumLesson = {
  key: string;
  title: string;
  objectives: readonly string[];
};

export type CurriculumPackage = {
  key: CurriculumPackageKey;
  title: string;
  summary: string;
  /** Programs this package is written for. Advisory, not a restriction. */
  audiences: readonly string[];
  primarySimulationRoles: readonly EduSimulationRole[];
  learningObjectives: readonly string[];
  lessons: readonly CurriculumLesson[];
  competencyAreas: readonly string[];
  /**
   * Whether completing this package may issue a certificate of completion.
   * A certificate of completion attests attendance and assessed coursework only.
   */
  offersCertificateOfCompletion: boolean;
  estimatedHours: number;
};

export const curriculumPackages: readonly CurriculumPackage[] = [
  {
    key: "medical_office_operations",
    title: "Medical Office Operations",
    summary: "Running the front of a clinic: access, scheduling, intake, and the routing decisions that keep a day from collapsing.",
    audiences: ["Medical assisting", "Health administration", "Workforce development"],
    primarySimulationRoles: ["front_desk", "medical_assistant", "practice_manager"],
    learningObjectives: [
      "Process patient arrival, scheduling, and rescheduling against clinic capacity",
      "Identify incomplete intake and resolve it before the encounter begins",
      "Route inbound requests to the correct role rather than resolving them out of scope",
      "Recognise which operational problems require escalation to a manager or clinician",
    ],
    lessons: [
      { key: "clinic_day", title: "Anatomy of a clinic day", objectives: ["Map the operational path of a visit end to end"] },
      { key: "access_scheduling", title: "Patient access and scheduling", objectives: ["Book, reschedule, and prioritise against capacity"] },
      { key: "intake_completeness", title: "Intake completeness", objectives: ["Detect and close intake gaps before rooming"] },
      { key: "routing_escalation", title: "Routing and escalation", objectives: ["Apply role boundaries when triaging inbound work"] },
    ],
    competencyAreas: ["patient_access", "scheduling_accuracy", "intake_completeness", "escalation_routing"],
    offersCertificateOfCompletion: true,
    estimatedHours: 20,
  },
  {
    key: "intro_ehr_clinical_systems",
    title: "Introduction to EHR and Clinical Systems",
    summary: "How an electronic health record is actually structured, and how work moves through it.",
    audiences: ["Nursing", "Medical assisting", "Informatics", "Health administration"],
    primarySimulationRoles: ["medical_assistant", "nurse", "provider"],
    learningObjectives: [
      "Navigate a longitudinal chart and locate information by clinical domain",
      "Distinguish structured data from narrative documentation and explain why it matters",
      "Trace an order from placement through result to review and patient notification",
      "Describe how audit logging records access to a chart",
    ],
    lessons: [
      { key: "chart_structure", title: "Chart structure and navigation", objectives: ["Locate information across clinical domains"] },
      { key: "orders_results", title: "Orders and results", objectives: ["Follow an order through its full lifecycle"] },
      { key: "documentation_types", title: "Structured versus narrative data", objectives: ["Choose the correct capture method"] },
      { key: "access_audit", title: "Access and audit", objectives: ["Explain what a chart access record contains"] },
    ],
    competencyAreas: ["system_navigation", "order_completeness", "documentation_accuracy", "privacy_operations"],
    offersCertificateOfCompletion: true,
    estimatedHours: 24,
  },
  {
    key: "medical_billing_claims",
    title: "Medical Billing and Claims Workflow",
    summary: "Eligibility, claim readiness, denials, and appeals as an operational sequence rather than a vocabulary list.",
    audiences: ["Billing and coding", "Health administration", "Workforce development"],
    primarySimulationRoles: ["biller", "coder", "front_desk"],
    learningObjectives: [
      "Verify insurance eligibility and identify coverage problems before service",
      "Assess whether an encounter is ready to bill and what is blocking it",
      "Interpret a denial and select an appropriate corrective action",
      "Explain why a claim was not submitted rather than resubmitting blindly",
    ],
    lessons: [
      { key: "eligibility", title: "Eligibility and coverage", objectives: ["Detect and resolve eligibility problems"] },
      { key: "claim_readiness", title: "Claim readiness", objectives: ["Identify what blocks a clean claim"] },
      { key: "denials", title: "Denials and appeals", objectives: ["Classify a denial and choose a corrective path"] },
      { key: "balances", title: "Patient balances", objectives: ["Handle balance communication accurately"] },
    ],
    competencyAreas: ["insurance_eligibility", "claim_readiness", "denial_management", "revenue_integrity"],
    offersCertificateOfCompletion: true,
    estimatedHours: 28,
  },
  {
    key: "clinical_documentation_lab",
    title: "Clinical Documentation Lab",
    summary: "Documentation that supports the care described, the codes selected, and the reviewer who reads it later.",
    audiences: ["Nursing", "Medical assisting", "Billing and coding", "Provider programs"],
    primarySimulationRoles: ["provider", "nurse", "coder"],
    learningObjectives: [
      "Produce documentation that supports the level of service described",
      "Identify documentation gaps that would block coding or billing",
      "Draft a documentation query without leading the responder",
      "Distinguish an addendum from an edit and explain when each applies",
    ],
    lessons: [
      { key: "note_structure", title: "Note structure", objectives: ["Organise a structured encounter note"] },
      { key: "support_and_gaps", title: "Support and gaps", objectives: ["Find what the documentation fails to support"] },
      { key: "queries", title: "Documentation queries", objectives: ["Write a non-leading query"] },
      { key: "amendments", title: "Amendments and addenda", objectives: ["Apply the correct correction mechanism"] },
    ],
    competencyAreas: ["documentation_accuracy", "documentation_support", "coding_accuracy", "compliance_awareness"],
    offersCertificateOfCompletion: true,
    estimatedHours: 24,
  },
  {
    key: "referral_care_coordination",
    title: "Referral and Care Coordination",
    summary: "Closing the loop: referrals, handoffs, and the follow-up that determines whether care actually happened.",
    audiences: ["Nursing", "Care coordination", "Health administration"],
    primarySimulationRoles: ["nurse", "front_desk", "practice_manager"],
    learningObjectives: [
      "Prepare a referral with the minimum necessary information",
      "Track a referral to a confirmed outcome instead of assuming delivery",
      "Recognise a failed handoff and recover it",
      "Explain what consent governs before information is shared",
    ],
    lessons: [
      { key: "referral_prep", title: "Preparing a referral", objectives: ["Assemble minimum necessary content"] },
      { key: "closing_loop", title: "Closing the loop", objectives: ["Track to confirmed outcome"] },
      { key: "failed_delivery", title: "Failed delivery recovery", objectives: ["Detect and recover a failed handoff"] },
      { key: "consent_bounds", title: "Consent boundaries", objectives: ["Apply purpose and category limits"] },
    ],
    competencyAreas: ["care_coordination", "result_follow_up", "escalation_routing", "privacy_operations"],
    offersCertificateOfCompletion: true,
    estimatedHours: 20,
  },
  {
    key: "privacy_security_hipaa_operations",
    title: "Healthcare Privacy, Security and HIPAA Operations",
    summary: "Privacy as daily operational practice: access decisions, minimum necessary, audit review, and incident handling.",
    audiences: ["All allied health programs", "Compliance", "Health administration"],
    primarySimulationRoles: ["compliance_officer", "practice_manager", "front_desk"],
    learningObjectives: [
      "Apply minimum necessary to a specific access request",
      "Distinguish appropriate access from a privacy incident",
      "Review an audit trail and describe what it does and does not prove",
      "Follow an incident through documentation and escalation",
    ],
    lessons: [
      { key: "minimum_necessary", title: "Minimum necessary in practice", objectives: ["Scope an access decision"] },
      { key: "access_decisions", title: "Access decisions", objectives: ["Separate appropriate access from a breach"] },
      { key: "audit_review", title: "Audit review", objectives: ["Read an access log critically"] },
      { key: "incidents", title: "Incident handling", objectives: ["Document and escalate an incident"] },
    ],
    competencyAreas: ["privacy_operations", "audit_review", "incident_response", "compliance_awareness"],
    offersCertificateOfCompletion: true,
    estimatedHours: 16,
  },
  {
    key: "ai_in_healthcare_operations",
    title: "AI in Healthcare Operations",
    summary: "Where AI helps clinic operations, where it must not be trusted, and how to supervise it.",
    audiences: ["Informatics", "Health administration", "All allied health programs"],
    primarySimulationRoles: ["practice_manager", "compliance_officer", "biller"],
    learningObjectives: [
      "Identify operational tasks where AI assistance is appropriate",
      "Identify decisions that must remain human regardless of AI confidence",
      "Review an AI draft and correct it rather than accepting it",
      "Explain why an AI output requires provenance and human review before action",
    ],
    lessons: [
      { key: "appropriate_use", title: "Appropriate use", objectives: ["Separate suitable from unsuitable AI tasks"] },
      { key: "human_authority", title: "Human authority", objectives: ["Defend which decisions stay human"] },
      { key: "reviewing_drafts", title: "Reviewing AI drafts", objectives: ["Correct a flawed AI draft"] },
      { key: "provenance", title: "Provenance and accountability", objectives: ["Trace an AI output to its basis"] },
    ],
    competencyAreas: ["ai_supervision", "compliance_awareness", "operational_oversight", "documentation_accuracy"],
    offersCertificateOfCompletion: true,
    estimatedHours: 16,
  },
  {
    key: "healthcare_entrepreneurship",
    title: "Healthcare Entrepreneurship and Practice Management",
    summary: "The operating and financial mechanics of running a practice, from capacity to margin.",
    audiences: ["Health administration", "Workforce development", "Practice ownership"],
    primarySimulationRoles: ["practice_manager", "biller", "front_desk"],
    learningObjectives: [
      "Relate schedule capacity to revenue and staffing decisions",
      "Interpret operational metrics without overreading them",
      "Identify the operational causes behind a revenue problem",
      "Build a defensible operating plan for a small practice",
    ],
    lessons: [
      { key: "capacity_revenue", title: "Capacity and revenue", objectives: ["Connect schedule to financial outcome"] },
      { key: "metrics", title: "Operational metrics", objectives: ["Read metrics with appropriate caution"] },
      { key: "revenue_diagnosis", title: "Diagnosing revenue problems", objectives: ["Trace revenue loss to operations"] },
      { key: "operating_plan", title: "Building an operating plan", objectives: ["Produce a defensible plan"] },
    ],
    competencyAreas: ["operational_oversight", "resource_allocation", "revenue_integrity", "compliance_awareness"],
    offersCertificateOfCompletion: true,
    estimatedHours: 24,
  },
];

export function getCurriculumPackage(key: string): CurriculumPackage | undefined {
  return curriculumPackages.find((entry) => entry.key === key);
}

/** Every competency area referenced by any package, de-duplicated and sorted. */
export function allCompetencyAreas(): string[] {
  return [...new Set(curriculumPackages.flatMap((entry) => entry.competencyAreas))].sort();
}

export function packagesForSimulationRole(role: EduSimulationRole) {
  return curriculumPackages.filter((entry) => entry.primarySimulationRoles.includes(role));
}
