export const kentuckyDemoKit = {
  evaluatorJourney: [
    { step: 1, label: "Institutional program", detail: "Open the reusable workforce program layer and show both required service families plus all five Industry Accelerator pathways.", href: "/edu/programs" },
    { step: 2, label: "Healthcare pathway", detail: "Show the strongest applied pathway: responsible, nonclinical healthcare AI with operational scenarios and explicit human authority.", href: "/edu/programs/healthcare" },
    { step: 3, label: "Zumi workforce practice", detail: "Demonstrate governed coaching and AI-output critique. Zumi can teach and explain; it cannot complete assessed work or certify competence.", href: "/edu/zumi-practice?pathway=healthcare" },
    { step: 4, label: "Virtual Clinic Lab", detail: "Enter synthetic role-based healthcare simulation and demonstrate workflow practice without real PHI.", href: "/edu/scenarios" },
    { step: 5, label: "Live instructor session", detail: "Show a scheduled instructor-led session with modality, curriculum/material provenance, roster, verified attendance evidence, and scored pre/post knowledge evidence.", href: "/edu/sessions" },
    { step: 6, label: "Instructor review", detail: "Show submission review, rubric scoring, feedback, and the human-controlled assessment boundary.", href: "/edu/grading" },
    { step: 7, label: "Completion review", detail: "Show the deterministic evidence gate: verified instructional time, released applied work, comparable knowledge evidence, then explicit instructor approval.", href: "/edu/completions" },
    { step: 8, label: "Program reporting", detail: "Show enrollment, verified attendance, completion, scored knowledge change, feedback, and curriculum-version evidence as separate reportable facts.", href: "/edu/reports" },
    { step: 9, label: "Completion evidence", detail: "Show completion records and certificate language that documents learning without implying licensure or independent professional certification.", href: "/edu/certificates" },
    { step: 10, label: "Career Readiness", detail: "Show the separate 2–3 hour AI-Powered Career Readiness service, including truthful resume/application/interview support and privacy/verification boundaries.", href: "/edu/programs/career-readiness" },
    { step: 11, label: "Curriculum governance", detail: "Show version-controlled teaching materials moving through draft, review, approval, activation, retirement, and archive states with auditable human authority.", href: "/edu/settings" },
  ],
  slideOutline: [
    "What generative AI is and is not",
    "Where AI can improve workplace productivity",
    "Why confident AI can still be wrong",
    "Safe prompting and minimum disclosure",
    "Privacy, confidentiality, cybersecurity, intellectual property, and employer policy",
    "Fact-checking, source verification, bias awareness, and error detection",
    "Human authority and escalation",
    "Occupational pathway demonstration",
    "Hands-on correction of intentionally flawed AI output",
    "Review, evidence, and take-away checklist",
  ],
  participantActivity: {
    title: "Review Before Action",
    role: "Medical Assistant",
    dataBoundary: "Synthetic Virtual Clinic Lab data only; real patient information is not required or permitted for the ordinary exercise.",
    task:
      "Review an AI-generated administrative summary containing one unsupported factual claim and one recommendation outside the learner's assigned authority, verify the source facts, correct the draft, minimize sensitive disclosure, and document the appropriate escalation.",
  },
  assessmentItems: [
    {
      type: "knowledge_check",
      prompt: "When may consequential AI output be acted on?",
      expectedPrinciple: "After required verification and human review under applicable employer/professional policy.",
    },
    {
      type: "error_identification",
      prompt: "AI calls a short course-completion record a professional certification. What is wrong?",
      expectedPrinciple: "Completion evidence must not be represented as licensure, accreditation, scope of practice, or independent professional certification.",
    },
    {
      type: "privacy_decision",
      prompt: "A participant is about to paste restricted personal or employer data into a public AI service. What should happen?",
      expectedPrinciple: "Stop and use only an approved tool/data flow or approved synthetic/non-sensitive training information.",
    },
    {
      type: "verification",
      prompt: "AI introduces a percentage improvement not present in the supplied source data. What should happen?",
      expectedPrinciple: "Remove it or independently calculate and verify it from an authoritative source before use.",
    },
  ],
  rubric: [
    { domain: "Accuracy", demonstrated: "Uses supported facts and corrects material AI error." },
    { domain: "Verification", demonstrated: "Checks consequential output against an authoritative source or accountable person." },
    { domain: "Privacy / confidentiality", demonstrated: "Withholds restricted and unnecessary information from unapproved AI systems." },
    { domain: "Human authority / escalation", demonstrated: "Correctly identifies who owns the consequential decision." },
    { domain: "Documentation", demonstrated: "Records the final human-owned action and evidence truthfully." },
    { domain: "Accountability", demonstrated: "Explains why the final action is defensible without treating the AI output as proof." },
  ],
  instructorGuide: {
    title: "Responsible AI in Healthcare Operations — Review Before Action",
    durationMinutes: 120,
    agenda: [
      "15 min — AI foundations and limitations",
      "20 min — privacy, cybersecurity, employer policy, and safe prompting",
      "20 min — fact-checking and error-detection demonstration",
      "35 min — Virtual Clinic Lab activity",
      "20 min — instructor-led rubric review and debrief",
      "10 min — knowledge check and completion instructions",
    ],
    facilitationPrompts: [
      "What source supports that statement?",
      "What would you verify before acting?",
      "Is that decision inside this role?",
      "What information could be removed from the prompt?",
      "Who retains authority for the next action?",
    ],
  },
  certificate: {
    title: "Certificate of Completion",
    subtitle: "[Program / Pathway Name]",
    disclaimer:
      "This certificate documents completion of the named learning activities. It does not grant a professional license, clinical scope of practice, accreditation, or independent professional certification.",
  },
  authorityStatement:
    "AI may assist drafting, practice, critique, and explanation. The instructor remains the final authority for grading and completion, while applicable workplace-authorized humans retain authority for consequential real-world decisions.",
} as const;
