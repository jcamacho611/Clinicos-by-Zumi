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
    "Responsible use of AI to improve job-search quality, communication, and interview preparation while preserving truthful qualifications, privacy, verification, employer policy, and human review.",
  recommendedDurationMinutes: 150,
  objectives: [
    "Use AI to improve the clarity of truthful resume content without inventing experience, credentials, results, or responsibilities.",
    "Use AI to research roles and prepare application materials while checking employer-specific facts and requirements.",
    "Use AI for interview preparation and rehearsal while preserving the learner's own experience and voice.",
    "Translate prior work history and transferable skills into current occupational language without misrepresentation.",
    "Recognize privacy, confidentiality, intellectual-property, and employer-policy boundaries before sharing information with an AI system.",
    "Explain when and how AI-assisted work was checked before use or submission.",
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
      key: "job_search_strategy",
      title: "Job-search strategy",
      purpose: "Use AI to organize a job search, compare roles, and prepare research questions without fabricating employer facts.",
      prohibited: ["inventing job openings", "inventing employer policies", "misstating job requirements"],
      reviewQuestions: ["Which employer facts need independent verification?", "What is the authoritative job posting?", "Is the search strategy realistic for the learner's actual background?"],
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
    {
      key: "after_hire_ai_use",
      title: "Responsible AI after hire",
      purpose: "Practice recognizing employer-policy, privacy, verification, and accountability requirements after employment begins.",
      prohibited: ["uploading restricted employer data", "bypassing required review", "treating AI output as policy authority"],
      reviewQuestions: ["Is this tool approved?", "What information is restricted?", "Who remains accountable for the final work?"],
    },
  ] satisfies readonly CareerReadinessActivity[],
  authorityRule:
    "AI may draft, critique, organize, research, and simulate practice. The learner and instructor remain responsible for factual accuracy, privacy, verification, final submission, and any claim about qualifications or readiness.",
} as const;
