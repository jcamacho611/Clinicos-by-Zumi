import { assertInstitutionalProgramTemplate, baselineWorkforceReportingFields } from "@/lib/edu/institutional-program";

export const kentuckyHealthcareAiWorkforceTemplate = assertInstitutionalProgramTemplate({
  key: "kentucky_healthcare_ai_workforce_demo",
  label: "Healthcare AI Workforce Readiness Pathway",
  templateStatus: "proposed_demo_template",
  audience: ["Healthcare workforce participants", "Allied health learners", "Healthcare operations staff"],
  description:
    "A proposed instructor-led workforce pathway for responsible AI use in healthcare operations. It combines live instruction, applied activities, instructor review, and synthetic Virtual Clinic Lab scenarios without teaching regulated clinical decision-making.",
  deliveryModes: ["in_person", "live_remote", "hybrid"],
  curriculumPackageKeys: [
    "ai_in_healthcare_operations",
    "privacy_security_hipaa_operations",
    "medical_office_operations",
    "referral_care_coordination",
    "clinical_documentation_lab",
  ],
  customModuleKeys: ["ai_foundations", "safe_prompting_verification", "ai_career_readiness"],
  objectives: [
    { key: "ai_foundations", statement: "Explain what generative AI can and cannot reliably do in workplace settings." },
    { key: "safe_prompting", statement: "Create useful prompts without unnecessarily exposing confidential or protected information." },
    { key: "verification", statement: "Fact-check AI output and identify hallucinations, unsupported claims, and missing context before use." },
    { key: "privacy_security", statement: "Apply privacy, confidentiality, cybersecurity, and employer-policy boundaries to AI-assisted work." },
    { key: "operations", statement: "Use AI appropriately for administrative and operational healthcare work such as scheduling, organization, documentation support, and follow-up." },
    { key: "human_authority", statement: "Recognize when work must be escalated to a supervisor, licensed clinician, compliance role, or other authorized person." },
    { key: "applied_lab", statement: "Complete synthetic Virtual Clinic Lab activities that require responsible AI review and correction." },
    { key: "career_readiness", statement: "Use AI responsibly for job-search, resume, communication, and interview preparation without fabricating qualifications." },
  ],
  completionRule: {
    minimumAttendancePercent: 80,
    requiredAssessmentKeys: ["pre_knowledge", "responsible_ai_scenario", "ai_output_critique", "post_knowledge"],
    requireInstructorReview: true,
    requireAllRequiredModules: true,
  },
  certificate: {
    title: "Certificate of Completion",
    subtitle: "Healthcare AI Workforce Readiness",
    disclaimer:
      "This certificate documents completion of the named Klinikos EDU learning activities. It does not grant a professional license, clinical scope of practice, accreditation, or independent professional certification.",
  },
  reportingFields: baselineWorkforceReportingFields,
  accessibilityNotes: [
    "Instructor materials and participant activities should support keyboard operation and semantic navigation.",
    "Assessment status must not rely on color alone.",
    "Live delivery materials should support captions/transcripts where the delivery platform permits them.",
    "Documents intended for participant distribution should be prepared for accessible reading order and reflow.",
  ],
  safetyBoundaries: [
    "Synthetic training data is the normal operating mode; real patient data is not required.",
    "AI assistance is educational and reviewable; instructors remain authoritative for grading and completion.",
    "The pathway does not train or authorize regulated clinical decision-making.",
    "AI must not fabricate participant qualifications, credentials, experience, or program outcomes.",
    "The template is proposed/demo content and must not be represented as SCWDB-approved until written approval exists.",
  ],
});

export const kentuckyHealthcareAiSessionSequence = [
  { key: "foundations", title: "AI foundations and workplace boundaries", emphasis: "what AI does, where it fails, employer policy" },
  { key: "prompting", title: "Safe prompting, privacy and verification", emphasis: "minimum disclosure, fact checking, hallucination detection" },
  { key: "operations", title: "AI in healthcare operations", emphasis: "scheduling, communication, information organization, documentation support" },
  { key: "lab", title: "Virtual Clinic Lab: review before action", emphasis: "synthetic role simulation, intentionally flawed AI output, escalation" },
  { key: "career", title: "AI-powered career readiness", emphasis: "resume support, applications, interviews, professional communication without fabrication" },
] as const;
