/**
 * Klinikos EDU role model.
 *
 * Two independent axes, deliberately kept apart:
 *
 *  - The **platform role** decides what a person may do in the EDU application.
 *  - The **simulation role** decides which clinic seat a student occupies inside a
 *    scenario. It confers nothing outside the simulation.
 *
 * Conflating them is the mistake this module exists to prevent: a student assigned
 * the `provider` seat in a scenario must not gain provider authority anywhere in
 * Klinikos, and a clinic `provider` in the real product gains no instructor rights.
 *
 * Pure module. No database, no network.
 */

export const eduPlatformRoles = ["edu_admin", "edu_instructor", "edu_assistant", "edu_student", "edu_observer"] as const;
export type EduPlatformRole = (typeof eduPlatformRoles)[number];

export const eduResources = [
  "institution",
  "program",
  "course",
  "cohort",
  "enrollment",
  "scenario",
  "assignment",
  "submission",
  "evidence",
  "rubric",
  "grade",
  "instructor_note",
  "competency",
  "certificate",
] as const;
export type EduResource = (typeof eduResources)[number];

export const eduActions = ["read", "create", "update", "grade", "manage"] as const;
export type EduAction = (typeof eduActions)[number];

/**
 * Permission matrix.
 *
 * `grade` is separated from `update` so a teaching assistant can assess work without
 * being able to restructure a course, and so an observer can never do either.
 */
const eduPermissions: Record<EduPlatformRole, Partial<Record<EduResource, readonly EduAction[]>>> = {
  edu_admin: {
    institution: ["read", "update", "manage"],
    program: ["read", "create", "update", "manage"],
    course: ["read", "create", "update", "manage"],
    cohort: ["read", "create", "update", "manage"],
    enrollment: ["read", "create", "update", "manage"],
    scenario: ["read", "create", "update", "manage"],
    assignment: ["read", "create", "update", "manage"],
    submission: ["read"],
    evidence: ["read"],
    rubric: ["read", "create", "update", "manage"],
    grade: ["read"],
    instructor_note: ["read"],
    competency: ["read", "manage"],
    certificate: ["read", "create", "manage"],
  },
  edu_instructor: {
    institution: ["read"],
    program: ["read"],
    course: ["read", "create", "update"],
    cohort: ["read", "create", "update", "manage"],
    enrollment: ["read", "create", "update"],
    scenario: ["read", "create", "update"],
    assignment: ["read", "create", "update"],
    submission: ["read", "update"],
    evidence: ["read"],
    rubric: ["read", "create", "update"],
    grade: ["read", "create", "update", "grade"],
    instructor_note: ["read", "create", "update"],
    competency: ["read", "update", "manage"],
    certificate: ["read", "create"],
  },
  edu_assistant: {
    course: ["read"],
    cohort: ["read"],
    enrollment: ["read"],
    scenario: ["read"],
    assignment: ["read"],
    submission: ["read", "update"],
    evidence: ["read"],
    rubric: ["read"],
    // A TA may record an assessment but may not finalise competency.
    grade: ["read", "create", "grade"],
    instructor_note: ["read", "create"],
    competency: ["read"],
  },
  edu_student: {
    course: ["read"],
    cohort: ["read"],
    scenario: ["read"],
    assignment: ["read"],
    submission: ["read", "create", "update"],
    evidence: ["read", "create"],
    rubric: ["read"],
    grade: ["read"],
    competency: ["read"],
    certificate: ["read"],
  },
  edu_observer: {
    institution: ["read"],
    program: ["read"],
    course: ["read"],
    cohort: ["read"],
    competency: ["read"],
  },
};

export function canEdu(role: EduPlatformRole, resource: EduResource, action: EduAction) {
  return Boolean(eduPermissions[role]?.[resource]?.includes(action));
}

/** Roles that assess student work. Used to keep grading surfaces off student views. */
export function isEduInstructorRole(role: EduPlatformRole) {
  return role === "edu_instructor" || role === "edu_assistant" || role === "edu_admin";
}

/**
 * Only an instructor or admin may finalise a competency determination.
 * Assistants assess individual work; they do not certify a competency.
 */
export function canFinalizeCompetency(role: EduPlatformRole) {
  return role === "edu_instructor" || role === "edu_admin";
}

// ---------------------------------------------------------------------------
// Simulation roles
// ---------------------------------------------------------------------------

export const eduSimulationRoles = [
  "front_desk",
  "medical_assistant",
  "nurse",
  "provider",
  "biller",
  "coder",
  "practice_manager",
  "compliance_officer",
] as const;
export type EduSimulationRole = (typeof eduSimulationRoles)[number];

export type EduSimulationRoleDefinition = {
  key: EduSimulationRole;
  label: string;
  /** What this seat is responsible for inside the simulation. */
  focus: string;
  /** Work-queue categories this seat receives. */
  queues: readonly string[];
  /** Competency areas a rubric for this seat typically assesses. */
  competencyAreas: readonly string[];
};

export const eduSimulationRoleCatalog: readonly EduSimulationRoleDefinition[] = [
  {
    key: "front_desk",
    label: "Front Desk",
    focus: "Arrival, scheduling, eligibility checks, and routing inbound requests to the right seat.",
    queues: ["check_in", "scheduling", "inbound_message", "eligibility"],
    competencyAreas: ["patient_access", "scheduling_accuracy", "insurance_eligibility", "escalation_routing"],
  },
  {
    key: "medical_assistant",
    label: "Medical Assistant",
    focus: "Rooming, intake completeness, vitals capture, and preparing the encounter for the provider.",
    queues: ["rooming", "intake", "task"],
    competencyAreas: ["intake_completeness", "documentation_accuracy", "workflow_sequencing"],
  },
  {
    key: "nurse",
    label: "Nurse",
    focus: "Triage, result follow-up, patient instruction, and recognising what must be escalated.",
    queues: ["triage", "result_follow_up", "task", "inbound_message"],
    competencyAreas: ["triage_judgment", "escalation_routing", "result_follow_up", "documentation_accuracy"],
  },
  {
    key: "provider",
    label: "Provider",
    focus: "Encounter documentation, orders, result review, and closing the loop on referrals.",
    queues: ["encounter", "result_review", "referral", "task"],
    competencyAreas: ["documentation_accuracy", "order_completeness", "result_review", "care_coordination"],
  },
  {
    key: "biller",
    label: "Biller",
    focus: "Claim readiness, eligibility problems, denials, and patient balance handling.",
    queues: ["claim_readiness", "denial", "eligibility", "balance"],
    competencyAreas: ["claim_readiness", "denial_management", "insurance_eligibility", "revenue_integrity"],
  },
  {
    key: "coder",
    label: "Coder",
    focus: "Diagnosis and procedure code selection supported by the documentation actually present.",
    queues: ["coding_review", "documentation_query"],
    competencyAreas: ["coding_accuracy", "documentation_support", "compliance_awareness"],
  },
  {
    key: "practice_manager",
    label: "Practice Manager",
    focus: "Throughput, staffing, queue backlogs, and operational escalations across the clinic.",
    queues: ["operations", "escalation", "task"],
    competencyAreas: ["operational_oversight", "escalation_routing", "resource_allocation"],
  },
  {
    key: "compliance_officer",
    label: "Compliance Officer",
    focus: "Privacy, access appropriateness, audit review, and incident handling.",
    queues: ["privacy_review", "audit_review", "incident"],
    competencyAreas: ["privacy_operations", "audit_review", "incident_response", "compliance_awareness"],
  },
];

export function getSimulationRole(key: string): EduSimulationRoleDefinition | undefined {
  return eduSimulationRoleCatalog.find((role) => role.key === key);
}

export function simulationRoleQueues(key: string): readonly string[] {
  return getSimulationRole(key)?.queues ?? [];
}

/**
 * A simulation seat grants nothing outside the simulation.
 *
 * Exported as an explicit function so the property is asserted by tests rather than
 * merely documented, and so no call site can mistake a simulation seat for a
 * clinical authorization.
 */
export function simulationRoleGrantsClinicalAuthority(_role: EduSimulationRole): false {
  return false;
}
