export const curriculumVersionStatuses = ["draft", "review", "approved", "active", "retired", "archived"] as const;
export type CurriculumVersionStatus = (typeof curriculumVersionStatuses)[number];

const allowedTransitions: Record<CurriculumVersionStatus, readonly CurriculumVersionStatus[]> = {
  draft: ["review", "archived"],
  review: ["draft", "approved", "archived"],
  approved: ["active", "retired", "archived"],
  active: ["retired"],
  retired: ["archived"],
  archived: [],
};

export function canTransitionCurriculumVersion(from: CurriculumVersionStatus, to: CurriculumVersionStatus) {
  return allowedTransitions[from].includes(to);
}

export function curriculumVersionRequiresApproval(status: CurriculumVersionStatus) {
  return status === "approved" || status === "active" || status === "retired";
}
