import { aiCareerReadinessModule } from "@/lib/edu/ai-career-readiness";
import { workforceAiLiteracyModules, workforceAiOccupationalPathways } from "@/lib/edu/workforce-ai-literacy";

export type WorkforceDeliveryMode = "in_person" | "live_remote" | "hybrid";

export type WorkforceAppliedExercise = {
  title: string;
  participantTasks: readonly string[];
  evidence: readonly string[];
};

export type WorkforceLessonSegment = {
  title: string;
  minutes: number;
  purpose: string;
};

export type WorkforceSampleLessonSegment = {
  title: string;
  scenario: string;
  instructorPrompts: readonly string[];
  learnerEvidence: readonly string[];
};

export type WorkforceIndustryPathway = {
  key: "manufacturing" | "construction" | "logistics" | "healthcare" | "business_operations";
  label: string;
  objective: string;
  operationalContexts: readonly string[];
  lessonSequence: readonly WorkforceLessonSegment[];
  sampleLessonSegment: WorkforceSampleLessonSegment;
  appliedExercise: WorkforceAppliedExercise;
  humanAuthorityBoundary: string;
};

const pathwayFoundation = Object.fromEntries(
  workforceAiOccupationalPathways.map((pathway) => [pathway.key, pathway]),
);

function lessonSequenceFor(industry: string, appliedExerciseTitle: string): readonly WorkforceLessonSegment[] {
  return [
    { title: "AI foundations and limits", minutes: 45, purpose: `Understand what modern generative AI can and cannot reliably do in ${industry} work.` },
    { title: "Safe prompting, privacy, and minimum disclosure", minutes: 60, purpose: "Practice giving AI useful context without unnecessarily exposing restricted, confidential, personal, or proprietary information." },
    { title: `${industry} use cases and workflow selection`, minutes: 60, purpose: "Separate appropriate assistance tasks from work that requires an authoritative system, qualified person, approved procedure, or employer decision." },
    { title: "Verification, hallucinations, bias, and error detection", minutes: 60, purpose: "Check consequential facts against authoritative sources and recognize unsupported, stale, biased, or invented output." },
    { title: "Cybersecurity, employer policy, and human authority", minutes: 45, purpose: "Recognize social-engineering, credential, data-handling, policy, safety, and approval boundaries before AI-supported work is used." },
    { title: appliedExerciseTitle, minutes: 90, purpose: "Complete a realistic hands-on exercise that requires correction, verification, data minimization, and appropriate escalation." },
    { title: "Instructor rubric, debrief, assessment, and take-away", minutes: 60, purpose: "Demonstrate learning, receive human-reviewed feedback, and leave with a repeatable verify-before-use method." },
  ];
}

export const industryAcceleratorPathways: readonly WorkforceIndustryPathway[] = [
  {
    key: "manufacturing",
    label: "Manufacturing",
    objective: "Use AI responsibly for quality review, work instructions, documentation, troubleshooting support, maintenance logs, and process-improvement drafts while preserving approved procedures and safety authority.",
    operationalContexts: pathwayFoundation.manufacturing.exampleOperationalContexts,
    lessonSequence: lessonSequenceFor("Manufacturing", "Applied lab — Draft, verify, then release"),
    sampleLessonSegment: {
      title: "Unsupported process change in a shift handoff",
      scenario: "A synthetic AI-generated shift handoff accurately summarizes most production events but quietly recommends changing a sensor tolerance that is not supported by the supplied approved work instruction.",
      instructorPrompts: ["Which statement requires an authoritative source before use?", "Who is authorized to approve a process-parameter change?", "What proprietary information is unnecessary in the prompt?"],
      learnerEvidence: ["Annotated AI draft identifying the unsupported change", "Corrected shift handoff tied to the approved source", "Written escalation decision"],
    },
    appliedExercise: {
      title: "Draft, verify, then release",
      participantTasks: [
        "Review an AI-generated shift handoff containing an unsupported process change.",
        "Verify the draft against a synthetic approved work instruction.",
        "Remove unsupported steps and produce a corrected handoff.",
        "Identify what must be escalated to authorized technical or safety personnel.",
      ],
      evidence: ["Corrected shift handoff", "Verification note", "Escalation decision"],
    },
    humanAuthorityBoundary: "AI cannot authorize equipment settings, bypass safety controls, alter approved procedures, or approve process deviations.",
  },
  {
    key: "construction",
    label: "Construction",
    objective: "Use AI for bounded planning, communication, field-documentation, material coordination, and schedule support while preserving safety, code, contract, and licensed-professional authority.",
    operationalContexts: pathwayFoundation.construction.exampleOperationalContexts,
    lessonSequence: lessonSequenceFor("Construction", "Applied lab — Plan support is not site authority"),
    sampleLessonSegment: {
      title: "Coordination draft with an invented site assumption",
      scenario: "A synthetic AI daily-plan draft invents a concrete curing-time assumption and recommends moving a temporary barrier even though neither action is supported by the supplied project documents.",
      instructorPrompts: ["What must be checked against drawings, specifications, or approved instructions?", "Which recommendation crosses a safety or authorization boundary?", "What should the corrected coordination note say instead?"],
      learnerEvidence: ["Corrected coordination note", "Source-verification list", "Safety/authority escalation rationale"],
    },
    appliedExercise: {
      title: "Plan support is not site authority",
      participantTasks: [
        "Review an AI-generated daily plan containing an invented project assumption.",
        "Verify scheduling and material facts against synthetic source documents.",
        "Correct the coordination note using supported facts only.",
        "Escalate any safety, engineering, or authorization decision to the responsible human role.",
      ],
      evidence: ["Corrected coordination note", "Verification sources", "Escalation rationale"],
    },
    humanAuthorityBoundary: "AI cannot approve engineering decisions, code interpretations, safety-plan changes, permits, inspections, or professional sign-off.",
  },
  {
    key: "logistics",
    label: "Logistics",
    objective: "Use AI for inventory review, routing and scheduling support, shipment communication, warehouse documentation, exception handling, and supply-chain analysis while preserving dispatch and regulatory authority.",
    operationalContexts: pathwayFoundation.logistics.exampleOperationalContexts,
    lessonSequence: lessonSequenceFor("Logistics", "Applied lab — Exception triage without inventing the shipment"),
    sampleLessonSegment: {
      title: "Estimated arrival turned into a false commitment",
      scenario: "A synthetic delayed-shipment summary turns an estimated arrival time into a guaranteed delivery commitment and proposes a reroute that has not been approved by dispatch.",
      instructorPrompts: ["Which source is authoritative for the current shipment state?", "What wording distinguishes an estimate from a commitment?", "Which decision belongs to dispatch or another authorized role?"],
      learnerEvidence: ["Corrected customer/operations update", "Shipment-data verification log", "Reroute/commitment escalation decision"],
    },
    appliedExercise: {
      title: "Exception triage without inventing the shipment",
      participantTasks: [
        "Review a delayed-shipment summary containing an invented delivery commitment.",
        "Verify ETA and receiving information against synthetic shipment records.",
        "Draft a truthful customer and operations update.",
        "Escalate rerouting or commercial commitments to the authorized role.",
      ],
      evidence: ["Corrected shipment update", "Verification log", "Authority decision"],
    },
    humanAuthorityBoundary: "AI cannot independently commit delivery terms, override dispatch controls, authorize regulated routing, or change hazardous-material handling requirements.",
  },
  {
    key: "healthcare",
    label: "Healthcare",
    objective: "Use AI responsibly for nonclinical healthcare operations including communication, scheduling, documentation support, information organization, referral follow-up, privacy awareness, and verification.",
    operationalContexts: pathwayFoundation.healthcare.exampleOperationalContexts,
    lessonSequence: lessonSequenceFor("Healthcare operations", "Virtual Clinic Lab — Review before action"),
    sampleLessonSegment: {
      title: "Administrative AI output that crosses the learner's role",
      scenario: "A synthetic patient-access workflow contains an overdue referral, incomplete paperwork, and a scheduling conflict. An AI administrative summary introduces one unsupported fact and recommends an action outside the learner's assigned role.",
      instructorPrompts: ["What fact is not supported by the synthetic record?", "Which information should not be entered into an unapproved AI tool?", "Who owns the decision that falls outside this role?"],
      learnerEvidence: ["Corrected administrative summary", "Verification note", "Data-minimization decision", "Human escalation rationale"],
    },
    appliedExercise: {
      title: "Review before action",
      participantTasks: [
        "Review a synthetic healthcare administrative workflow and AI-generated summary.",
        "Identify an unsupported factual claim and a recommendation outside the learner's role.",
        "Verify source facts and correct the administrative draft.",
        "Escalate work that requires a supervisor, clinician, compliance role, or other authorized human.",
      ],
      evidence: ["Corrected administrative draft", "Verification note", "Escalation decision", "Data-minimization note"],
    },
    humanAuthorityBoundary: "AI cannot make clinical decisions, authorize care, determine professional scope, certify competence, or replace licensed human judgment.",
  },
  {
    key: "business_operations",
    label: "Business Operations",
    objective: "Use AI responsibly for office productivity, customer communication, meeting and report preparation, data review, scheduling, process documentation, and decision-support drafts.",
    operationalContexts: pathwayFoundation.business_operations.exampleOperationalContexts,
    lessonSequence: lessonSequenceFor("Business Operations", "Applied lab — Useful draft, real numbers"),
    sampleLessonSegment: {
      title: "A polished report with invented numbers and authority",
      scenario: "A synthetic AI business summary invents a cost-saving percentage, misstates a renewal date, and tells a vendor that a contract extension has already been approved.",
      instructorPrompts: ["Which claims must be verified against source records?", "Who can approve the contractual commitment?", "How should the message distinguish draft analysis from an approved decision?"],
      learnerEvidence: ["Corrected report with source-backed numbers", "Verification table", "Rewritten vendor communication", "Approval/escalation note"],
    },
    appliedExercise: {
      title: "Useful draft, real numbers",
      participantTasks: [
        "Review an AI-generated business summary containing a fabricated metric and incorrect contract date.",
        "Verify numbers and dates against synthetic source records.",
        "Rewrite the summary and communication using supported facts only.",
        "Escalate financial, contractual, HR, or legal commitments to the authorized human role.",
      ],
      evidence: ["Corrected report", "Verification table", "Corrected communication", "Approval/escalation note"],
    },
    humanAuthorityBoundary: "AI cannot approve contracts, make financial commitments, invent business metrics, make employment decisions, or act as legal, HR, or finance authority.",
  },
] as const;

export const careerReadinessWorkshop = {
  key: "career_readiness",
  label: "AI-Powered Career Readiness",
  durationHours: { min: 2, max: 3 },
  module: aiCareerReadinessModule,
} as const;

export const workforceAiReadinessProgram = {
  key: "workforce_ai_readiness",
  label: "Workforce AI Readiness",
  summary: "Live instructor-led AI workforce training with applied occupational practice, human-reviewed assessment, responsible-AI governance, completion evidence, and reusable institutional configuration.",
  deliveryModes: ["in_person", "live_remote", "hybrid"] satisfies readonly WorkforceDeliveryMode[],
  serviceFamilies: [
    { key: "industry_accelerator", label: "AI Industry Accelerator" },
    { key: "career_readiness", label: "AI-Powered Career Readiness" },
  ] as const,
  industryAccelerator: {
    key: "industry_accelerator",
    label: "AI Industry Accelerator",
    durationHours: { min: 6, max: 8 },
    commonModules: workforceAiLiteracyModules.map((module) => module.key),
    pathways: industryAcceleratorPathways.map((pathway) => pathway.key),
  },
  careerReadiness: careerReadinessWorkshop,
  authorityRule: "Live instructors remain responsible for instruction, interpretation, assessment, feedback, and completion decisions.",
  productBoundary: "Institution-specific names, branding, reporting fields, and approved program configuration are applied through scoped configuration rather than changing the reusable Klinikos EDU engine.",
} as const;
