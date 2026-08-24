import { workforceAiLiteracyModules } from "@/lib/edu/workforce-ai-literacy";

export const WORKFORCE_APPLIED_LEARNING_LOOP = [
  {
    key: "frame",
    label: "Frame",
    purpose: "Define the work objective, role, source records, and decision boundary.",
  },
  {
    key: "protect",
    label: "Protect",
    purpose: "Remove unnecessary restricted, confidential, personal, or proprietary information.",
  },
  {
    key: "direct",
    label: "Direct",
    purpose: "Give AI bounded context, constraints, and a clear task.",
  },
  {
    key: "inspect",
    label: "Inspect",
    purpose: "Look for unsupported facts, overconfidence, missing context, bias, or unsafe assumptions.",
  },
  {
    key: "verify",
    label: "Verify",
    purpose: "Check consequential claims against an authoritative source or accountable human.",
  },
  {
    key: "correct_or_escalate",
    label: "Correct / escalate",
    purpose: "Correct supported work and escalate decisions outside the learner's authority.",
  },
  {
    key: "explain_and_evidence",
    label: "Explain / evidence",
    purpose: "Explain what changed, why, what source was used, and who remained accountable.",
  },
] as const;

export function getDolAiLiteracyAlignment() {
  return workforceAiLiteracyModules.map((module) => ({
    moduleKey: module.key,
    title: module.title,
    learningObjectives: module.learningObjectives,
    exercise: module.instructorLedExercise,
    evidence: module.assessmentEvidence,
  }));
}
