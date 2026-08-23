import type { EduPlatformRole } from "@/lib/edu/edu-roles";

export type WorkforceSurveyKind = "participant" | "instructor";

export function canSubmitWorkforceFeedback(role: EduPlatformRole) {
  return role !== "edu_observer";
}

export function workforceSurveyKindForRole(role: EduPlatformRole): WorkforceSurveyKind | null {
  if (role === "edu_student") return "participant";
  if (role === "edu_admin" || role === "edu_instructor" || role === "edu_assistant") return "instructor";
  return null;
}
