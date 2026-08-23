import type { CurriculumPackageKey } from "@/lib/edu/edu-curriculum";

export const eduDeliveryModes = ["in_person", "live_remote", "hybrid"] as const;
export type EduDeliveryMode = (typeof eduDeliveryModes)[number];

export const eduProgramLifecycleStates = ["draft", "review", "approved", "active", "closed", "archived"] as const;
export type EduProgramLifecycleState = (typeof eduProgramLifecycleStates)[number];

export type EduProgramObjective = { key: string; statement: string };

export type EduCompletionRule = {
  minimumAttendancePercent: number;
  requiredAssessmentKeys: readonly string[];
  requireInstructorReview: boolean;
  requireAllRequiredModules: boolean;
};

export type EduCertificateTemplate = {
  title: string;
  subtitle: string;
  disclaimer: string;
};

export type EduReportingField = {
  key: string;
  label: string;
  source: "enrollment" | "attendance" | "assessment" | "completion" | "feedback" | "program";
};

export type EduInstitutionalProgramTemplate = {
  key: string;
  label: string;
  templateStatus: "proposed_demo_template" | "internal_reference" | "institution_approved";
  audience: readonly string[];
  description: string;
  deliveryModes: readonly EduDeliveryMode[];
  curriculumPackageKeys: readonly CurriculumPackageKey[];
  customModuleKeys: readonly string[];
  objectives: readonly EduProgramObjective[];
  completionRule: EduCompletionRule;
  certificate: EduCertificateTemplate;
  reportingFields: readonly EduReportingField[];
  accessibilityNotes: readonly string[];
  safetyBoundaries: readonly string[];
};

export const baselineWorkforceReportingFields: readonly EduReportingField[] = [
  { key: "enrolled", label: "Enrolled participants", source: "enrollment" },
  { key: "attended", label: "Attended participants", source: "attendance" },
  { key: "completed", label: "Completed participants", source: "completion" },
  { key: "completion_rate", label: "Completion percentage", source: "completion" },
  { key: "assessment_completion", label: "Assessment completion", source: "assessment" },
  { key: "pre_post_comparison", label: "Pre/post knowledge comparison", source: "assessment" },
  { key: "pathway", label: "Occupational pathway", source: "program" },
  { key: "delivery_modality", label: "Delivery modality", source: "program" },
  { key: "module_completion", label: "Pathway and module completion", source: "completion" },
  { key: "instructor_review", label: "Instructor-reviewed evidence", source: "assessment" },
  { key: "participant_feedback", label: "Participant feedback", source: "feedback" },
  { key: "program_revision", label: "Program improvement log", source: "program" },
] as const;

export function assertInstitutionalProgramTemplate(template: EduInstitutionalProgramTemplate) {
  if (!template.key.trim() || !template.label.trim() || !template.description.trim()) {
    throw new Error("Institutional EDU program templates require stable identity and description.");
  }
  if (!template.deliveryModes.length) throw new Error("Institutional EDU programs require at least one delivery mode.");
  if (!template.curriculumPackageKeys.length && !template.customModuleKeys.length) {
    throw new Error("Institutional EDU programs require curriculum or custom modules.");
  }
  if (template.completionRule.minimumAttendancePercent < 0 || template.completionRule.minimumAttendancePercent > 100) {
    throw new Error("Minimum attendance percentage must be between 0 and 100.");
  }
  if (!template.completionRule.requireInstructorReview) {
    throw new Error("Institutional workforce templates must preserve instructor authority for completion.");
  }
  const disclaimer = template.certificate.disclaimer.toLowerCase();
  if (!disclaimer.includes("does not") || (!disclaimer.includes("license") && !disclaimer.includes("certif"))) {
    throw new Error("Certificate templates must explicitly disclaim licensure or professional certification.");
  }
  return template;
}
