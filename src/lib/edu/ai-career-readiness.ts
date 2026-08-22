export type CareerReadinessActivity = {
  key: string;
  title: string;
  purpose: string;
  prohibited: readonly string[];
  reviewQuestions: readonly string[];
};

export const aiCareerReadinessModule = {
  key: "ai_career_readiness",
  title: "AI-Powered Career Readiness",
  summary:
    "Responsible use of AI to improve job-search quality, communication, and interview preparation while preserving truthful qualifications, privacy, and human review.",
  objectives: [
    "Use AI to improve the clarity of truthful resume content without inventing experience, credentials, results, or responsibilities.",
    "Use AI to prepare application materials and professional communication while checking employer-specific facts and requirements.",
    "Use AI for interview practice while preserving the learner's own experience and voice.",
    "Recognize privacy, confidentiality, intellectual-property, and employer-policy boundaries before sharing information with an AI system.",
    "Explain when and how AI-assisted work was reviewed and verified before use.",
  ],
  activities: [
    {
      key: "resume_truth_check",
      title: "Resume truth check",
      purpose: "Turn real experience into clearer accomplishment language and identify unsupported claims introduced by an AI draft.",
      prohibited: ["inventing employment", "inventing credentials", "inventing metrics", "inventing management responsibility"],
      reviewQuestions: ["Can every claim be supported?", "Did the AI add a fact that was not provided?", "Would the learner defend this statement in an interview?"],
    },
    {
      key: "application_alignment",
      title: "Application alignment",
      purpose: "Compare a real job description with the learner's actual experience and draft truthful application language.",
      prohibited: ["automatic submission", "claiming unmet required credentials", "copying confidential employer information"],
      reviewQuestions: ["Which requirements are actually met?", "Which gaps should be stated honestly?", "Which facts need verification before use?"],
    },
    {
      key: "professional_communication",
      title: "Professional communication",
      purpose: "Draft a concise professional email or follow-up and revise it for accuracy, tone, and audience.",
      prohibited: ["impersonation", "fabricated relationships", "fabricated commitments"],
      reviewQuestions: ["Is the sender represented truthfully?", "Are dates, names, and commitments accurate?", "Would the learner send this under their own name?"],
    },
    {
      key: "interview_practice",
      title: "Interview practice",
      purpose: "Use AI as a practice partner for role-specific questions and improve answers without manufacturing experience.",
      prohibited: ["inventing projects", "inventing outcomes", "memorizing false examples"],
      reviewQuestions: ["Is the example real?", "Does the answer explain the learner's actual contribution?", "Did AI feedback change a fact?"],
    },
  ] satisfies readonly CareerReadinessActivity[],
  authorityRule:
    "AI may draft, critique, organize, and simulate practice. The learner and instructor remain responsible for factual accuracy, final submission, and any claim about qualifications or readiness.",
} as const;
