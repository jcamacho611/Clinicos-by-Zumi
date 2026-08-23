import { aiCareerReadinessModule } from "@/lib/edu/ai-career-readiness";
import { assertInstitutionalProgramTemplate, baselineWorkforceReportingFields } from "@/lib/edu/institutional-program";
import { workforceAiLiteracyModuleKeys } from "@/lib/edu/workforce-ai-literacy";

export type KentuckyIndustryPathwayKey = "manufacturing" | "construction" | "logistics" | "healthcare" | "business_operations";

export type KentuckySampleExercise = {
  title: string;
  scenario: string;
  participantTasks: readonly string[];
  evidence: readonly string[];
};

export type KentuckyIndustryPathway = {
  key: KentuckyIndustryPathwayKey;
  label: string;
  templateStatus: "proposed_demo_template";
  durationHours: { minimum: 6; maximum: 8 };
  deliveryModes: readonly ["in_person", "live_remote"] | readonly ["in_person", "live_remote", "hybrid"];
  learningObjectives: readonly string[];
  sampleExercise: KentuckySampleExercise;
  humanAuthorityBoundary: string;
  participantTakeaway: readonly string[];
};

const sharedDeliveryModes = ["in_person", "live_remote", "hybrid"] as const;
const sharedParticipantTakeaway = [
  "Responsible AI quick-reference guide",
  "Prompting and verification checklist",
  "Privacy, security, and employer-policy decision guide",
  "Certificate of completion when approved completion requirements are met",
] as const;

export const kentuckyIndustryPathways: readonly KentuckyIndustryPathway[] = [
  {
    key: "manufacturing",
    label: "Manufacturing",
    templateStatus: "proposed_demo_template",
    durationHours: { minimum: 6, maximum: 8 },
    deliveryModes: sharedDeliveryModes,
    learningObjectives: [
      "Use AI to support work instructions, production documentation, and shift communication without bypassing approved procedures.",
      "Review AI-generated quality and troubleshooting suggestions against approved specifications and source documentation.",
      "Protect proprietary production information, credentials, safety information, and employer-restricted data.",
      "Identify when process, equipment, maintenance, or safety changes require authorized human approval.",
    ],
    sampleExercise: {
      title: "Draft, Verify, Then Release",
      scenario: "A synthetic shift handoff describes a recurring packaging-line stoppage. An AI draft improves the handoff but also invents a sensor-tolerance change not found in the supplied approved work instruction.",
      participantTasks: [
        "Identify the unsupported sensor-tolerance recommendation.",
        "Compare the draft against the supplied synthetic approved work instruction.",
        "Remove unsupported or unsafe steps and rewrite the handoff using verified facts only.",
        "Identify proprietary or credential information that should not enter an unapproved AI service.",
        "Name the role that must authorize any process or parameter change.",
      ],
      evidence: ["Corrected shift handoff", "Verification note", "Escalation decision", "Data-minimization note"],
    },
    humanAuthorityBoundary:
      "AI cannot authorize equipment settings, bypass lockout/tagout or safety procedures, approve maintenance changes, or release process deviations.",
    participantTakeaway: sharedParticipantTakeaway,
  },
  {
    key: "construction",
    label: "Construction",
    templateStatus: "proposed_demo_template",
    durationHours: { minimum: 6, maximum: 8 },
    deliveryModes: sharedDeliveryModes,
    learningObjectives: [
      "Use AI for bounded project planning, meeting notes, field documentation, materials coordination, and communication.",
      "Verify AI output against drawings, specifications, approved site instructions, schedules, and applicable authoritative sources.",
      "Protect confidential project information and recognize unsafe document-upload or credential-sharing practices.",
      "Escalate engineering, code, permit, safety-plan, inspection, or contractual decisions to authorized personnel.",
    ],
    sampleExercise: {
      title: "Plan Support Is Not Site Authority",
      scenario: "A synthetic superintendent note asks AI to organize tomorrow's concrete-pour coordination. The draft invents a curing-time assumption and recommends moving a temporary barrier to improve access.",
      participantTasks: [
        "Identify the invented curing-time assumption.",
        "Flag the barrier recommendation as a safety/site-authority issue.",
        "Verify scheduling facts against the supplied plan and approved instruction.",
        "Produce a corrected coordination note using supported facts only.",
        "Identify what project information should not be uploaded to an unapproved AI tool.",
      ],
      evidence: ["Corrected coordination note", "Verification sources", "Safety escalation note", "Confidentiality rationale"],
    },
    humanAuthorityBoundary:
      "AI cannot approve engineering decisions, code interpretations, safety-plan changes, permits, inspections, professional sign-off, or contractual commitments.",
    participantTakeaway: sharedParticipantTakeaway,
  },
  {
    key: "logistics",
    label: "Logistics",
    templateStatus: "proposed_demo_template",
    durationHours: { minimum: 6, maximum: 8 },
    deliveryModes: sharedDeliveryModes,
    learningObjectives: [
      "Use AI to support shipment communication, inventory review, scheduling, exception triage, and warehouse documentation.",
      "Verify AI-generated routing, ETA, inventory, and customer statements against authoritative TMS/WMS or supplied records.",
      "Recognize phishing, credential, document, shipment-security, and confidential-customer-data risks.",
      "Preserve human dispatch, commercial, regulatory, and hazardous-material authority.",
    ],
    sampleExercise: {
      title: "Exception Triage Without Inventing the Shipment",
      scenario: "A synthetic delayed shipment contains an updated carrier ETA, customer window, and receiving cutoff. An AI response invents a guaranteed delivery commitment and suggests an unapproved reroute.",
      participantTasks: [
        "Identify the invented commitment and unverified reroute.",
        "Verify the ETA and receiving cutoff from the supplied source record.",
        "Draft a truthful customer and operations update.",
        "Identify shipment or customer data that should be withheld from an unapproved AI tool.",
        "State which role may authorize a reroute or commercial commitment.",
      ],
      evidence: ["Corrected customer update", "Verification log", "Authority decision", "Data-minimization note"],
    },
    humanAuthorityBoundary:
      "AI cannot independently commit delivery terms, alter regulated routing, authorize hazardous-material handling, or override dispatch, safety, or security rules.",
    participantTakeaway: sharedParticipantTakeaway,
  },
  {
    key: "healthcare",
    label: "Healthcare",
    templateStatus: "proposed_demo_template",
    durationHours: { minimum: 6, maximum: 8 },
    deliveryModes: sharedDeliveryModes,
    learningObjectives: [
      "Use AI responsibly for nonclinical healthcare scheduling, communication, documentation support, information organization, and follow-up workflows.",
      "Verify AI-assisted administrative documentation against the synthetic source record before action.",
      "Apply privacy, confidentiality, cybersecurity, minimum-disclosure, and employer-policy boundaries.",
      "Recognize when scheduling, documentation, referral, compliance, or other work must be escalated to an authorized person.",
      "Use the Virtual Clinic Lab to correct intentionally flawed AI output without converting the exercise into clinical decision-making.",
    ],
    sampleExercise: {
      title: "Review Before Action",
      scenario: "A synthetic clinic workflow shows an overdue referral, incomplete intake paperwork, and a scheduling conflict. An AI administrative summary contains one unsupported factual claim and one recommendation outside the learner's assigned role.",
      participantTasks: [
        "Identify the unsupported factual claim.",
        "Identify the role-boundary violation.",
        "Verify the source facts and correct the administrative documentation using supported information only.",
        "Explain what must be escalated and to which authorized role.",
        "Identify information that should not enter an unapproved external AI system.",
      ],
      evidence: ["Corrected administrative draft", "Verification note", "Escalation decision", "Minimum-disclosure note"],
    },
    humanAuthorityBoundary:
      "AI cannot diagnose, prescribe, select treatment, authorize care, determine professional scope, certify competence, sign clinical records, or replace licensed clinical judgment.",
    participantTakeaway: sharedParticipantTakeaway,
  },
  {
    key: "business_operations",
    label: "Business Operations",
    templateStatus: "proposed_demo_template",
    durationHours: { minimum: 6, maximum: 8 },
    deliveryModes: sharedDeliveryModes,
    learningObjectives: [
      "Use AI for office productivity, professional communication, meeting/report preparation, scheduling, and process documentation.",
      "Verify generated numbers, dates, policies, commitments, and business claims against authoritative records.",
      "Protect confidential financial, employee, customer, vendor, credential, and intellectual-property information.",
      "Preserve human approval for finance, HR, legal, contract, access-control, and other consequential decisions.",
    ],
    sampleExercise: {
      title: "Useful Draft, Real Numbers",
      scenario: "A synthetic operations report is summarized by AI. The draft invents a 12% savings figure, misstates a renewal date, and tells a vendor that an extension has been approved.",
      participantTasks: [
        "Identify the fabricated metric, incorrect date, and unauthorized commitment.",
        "Verify the figures and date using the supplied synthetic source table and contract excerpt.",
        "Rewrite the report and vendor message using supported facts only.",
        "Identify confidential business information that should not be entered into an unapproved AI service.",
        "Name the authorized role for contract or financial approval.",
      ],
      evidence: ["Corrected report", "Verification table", "Corrected vendor message", "Approval/escalation note"],
    },
    humanAuthorityBoundary:
      "AI cannot approve contracts, make financial commitments, invent KPIs, make employment decisions, or act as legal, HR, finance, security, or executive authority.",
    participantTakeaway: sharedParticipantTakeaway,
  },
] as const;

export const kentuckyCareerReadinessWorkshop = {
  key: "kentucky_ai_powered_career_readiness",
  title: "AI-Powered Career Readiness",
  templateStatus: "proposed_demo_template" as const,
  durationHours: { minimum: 2, maximum: 3 } as const,
  deliveryModes: sharedDeliveryModes,
  module: aiCareerReadinessModule,
  completionEvidence: [
    "Verified attendance",
    "Truthful resume or professional-communication activity",
    "Interview-preparation or job-search exercise",
    "Responsible-AI/privacy/verification knowledge check",
    "Instructor-confirmed completion",
  ] as const,
};

export const kentuckyHealthcareAiWorkforceTemplate = assertInstitutionalProgramTemplate({
  key: "kentucky_healthcare_ai_workforce_demo",
  label: "Healthcare AI Workforce Readiness Pathway",
  templateStatus: "proposed_demo_template",
  audience: ["Dislocated workers", "Healthcare workforce participants", "Allied health learners", "Healthcare operations staff"],
  description:
    "A proposed live instructor-led workforce pathway for responsible AI use in nonclinical healthcare operations. It combines applied activities, instructor review, and synthetic Virtual Clinic Lab scenarios without teaching regulated clinical decision-making.",
  deliveryModes: sharedDeliveryModes,
  curriculumPackageKeys: [
    "ai_in_healthcare_operations",
    "privacy_security_hipaa_operations",
    "medical_office_operations",
    "referral_care_coordination",
    "clinical_documentation_lab",
  ],
  customModuleKeys: [...workforceAiLiteracyModuleKeys, "ai_career_readiness"],
  objectives: getIndustryObjectives("healthcare"),
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
      "This certificate documents completion of the named learning activities. It does not grant a professional license, clinical scope of practice, accreditation, or independent professional certification.",
  },
  reportingFields: baselineWorkforceReportingFields,
  accessibilityNotes: [
    "Support keyboard operation, visible focus, semantic navigation, reflow, zoom, and non-color-only status.",
    "Provide accessible alternate response modes when pointer interaction is not itself the learning objective.",
    "Live delivery should support captions or transcripts where required and available through the approved delivery platform.",
  ],
  safetyBoundaries: [
    "Synthetic training data is the normal operating mode; real patient data is not required.",
    "AI is assistive and reviewable; instructors remain authoritative for grading and completion.",
    "The pathway is nonclinical and does not train or authorize regulated clinical decision-making.",
    "AI must not fabricate participant qualifications, credentials, experience, or outcomes.",
    "This is a proposed configuration and must not be represented as SCWDB-approved until written approval exists.",
  ],
});

export const kentuckyAiWorkforceProgram = {
  key: "kentucky_ai_workforce_readiness_network_demo",
  title: "Kentucky AI Workforce Readiness Network",
  templateStatus: "proposed_demo_template" as const,
  services: ["industry_accelerator", "career_readiness"] as const,
  industryPathwayKeys: kentuckyIndustryPathways.map((pathway) => pathway.key),
  commonModuleKeys: workforceAiLiteracyModuleKeys,
  deliveryModes: sharedDeliveryModes,
  requiredProgramElements: [
    "live_instructor",
    "hands_on_activity",
    "participant_takeaway_resource",
    "certificate_of_completion",
    "assessment_evidence",
    "instructor_review",
    "accessibility_support",
    "attendance_and_completion_documentation",
    "participant_survey",
    "monthly_reporting",
    "quarterly_curriculum_review",
  ] as const,
  safetyStatement:
    "AI assists learning and workplace practice; humans remain accountable for verification, policy compliance, professional authority, grading, and completion.",
} as const;

export const kentuckyHealthcareAiSessionSequence = [
  { key: "foundations", title: "AI foundations and workplace boundaries", emphasis: "strengths, limitations, terminology, appropriate use" },
  { key: "prompting", title: "Safe prompting, privacy and verification", emphasis: "minimum disclosure, fact checking, bias/error detection" },
  { key: "operations", title: "AI in healthcare operations", emphasis: "scheduling, communication, organization, documentation support" },
  { key: "lab", title: "Virtual Clinic Lab: review before action", emphasis: "synthetic role simulation, flawed AI output, correction and escalation" },
  { key: "career", title: "AI-powered career readiness", emphasis: "truthful resume, applications, interviews, professional communication" },
] as const;

function getIndustryObjectives(key: KentuckyIndustryPathwayKey) {
  const pathway = getKentuckyIndustryPathway(key);
  return (pathway?.learningObjectives ?? []).map((statement, index) => ({ key: `${key}_${index + 1}`, statement }));
}

export function getKentuckyIndustryPathway(key: string) {
  return kentuckyIndustryPathways.find((pathway) => pathway.key === key);
}
