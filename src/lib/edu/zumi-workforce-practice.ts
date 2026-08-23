import type { EduPlatformRole } from "@/lib/edu/edu-roles";

export const eduZumiPracticeModeKeys = ["guided_practice", "output_critique", "instructor_assist"] as const;
export type EduZumiPracticeModeKey = (typeof eduZumiPracticeModeKeys)[number];

export type EduZumiPracticeMode = {
  key: EduZumiPracticeModeKey;
  label: string;
  capability: "edu_guided_practice" | "edu_output_critique" | "edu_instructor_assist";
  description: string;
  authorityBoundary: string;
  allowedRoles: readonly EduPlatformRole[];
  examplePrompt: string;
};

export const eduZumiPracticeModes: readonly EduZumiPracticeMode[] = [
  {
    key: "guided_practice",
    label: "Guided practice",
    capability: "edu_guided_practice",
    description: "Ask Zumi for hints, explanations, prompt coaching, or a step-by-step way to reason through a workforce exercise without having Zumi complete assessed work for you.",
    authorityBoundary: "Zumi may teach and coach. The learner remains responsible for the submitted work, and the instructor remains responsible for assessment and completion decisions.",
    allowedRoles: ["edu_admin", "edu_instructor", "edu_assistant", "edu_student", "edu_observer"],
    examplePrompt: "Help me improve this prompt so it protects private information and still gives the AI enough context to be useful.",
  },
  {
    key: "output_critique",
    label: "AI-output critique",
    capability: "edu_output_critique",
    description: "Practice spotting unsupported claims, hallucinations, privacy problems, unsafe assumptions, bias, and work that should be escalated to a person.",
    authorityBoundary: "Zumi may explain why an answer is risky or unsupported, but it does not make the final workplace, clinical, safety, legal, financial, HR, or compliance decision.",
    allowedRoles: ["edu_admin", "edu_instructor", "edu_assistant", "edu_student", "edu_observer"],
    examplePrompt: "Critique this AI answer. Tell me what I should verify, what looks invented, and what requires human escalation before it could be used.",
  },
  {
    key: "instructor_assist",
    label: "Instructor assist",
    capability: "edu_instructor_assist",
    description: "Draft feedback, summarize recurring learner misconceptions, suggest discussion prompts, or prepare a lesson-support note for instructor review.",
    authorityBoundary: "Zumi may draft or summarize. A human instructor owns grading, feedback release, competency decisions, attendance verification, and completion approval.",
    allowedRoles: ["edu_admin", "edu_instructor", "edu_assistant"],
    examplePrompt: "Draft feedback that helps this learner understand why verification matters without giving away the answer to the assessment.",
  },
];

export function getEduZumiPracticeMode(key: string) {
  return eduZumiPracticeModes.find((mode) => mode.key === key);
}

export function mayUseEduZumiPracticeMode(role: EduPlatformRole, key: string) {
  const mode = getEduZumiPracticeMode(key);
  return Boolean(mode?.allowedRoles.includes(role));
}

export function buildEduZumiServerContext(input: {
  role: EduPlatformRole;
  institutionId: string;
  enrollmentId: string | null;
  mode: EduZumiPracticeMode;
  pathway?: string | null;
}) {
  return {
    product: "Klinikos EDU",
    surface: "education",
    educationRole: input.role,
    institutionId: input.institutionId,
    enrollmentId: input.enrollmentId,
    practiceMode: input.mode.key,
    pathway: input.pathway ?? null,
    authorityBoundary: input.mode.authorityBoundary,
    syntheticDataFirst: true,
    noRealPhiRequired: true,
    learnerOwnsSubmittedWork: true,
    instructorOwnsAssessment: true,
    aiMayCertifyCompetence: false,
    aiMayVerifyAttendance: false,
    aiMayApproveCompletion: false,
    aiMayIssueProfessionalAuthority: false,
  } as const;
}
