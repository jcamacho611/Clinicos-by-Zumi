import { aiCareerReadinessModule } from "@/lib/edu/ai-career-readiness";
import { workforceAiLiteracyModules, workforceAiOccupationalPathways } from "@/lib/edu/workforce-ai-literacy";

export type WorkforceDeliveryMode = "in_person" | "live_remote" | "hybrid";

export type WorkforceAppliedExercise = {
  title: string;
  participantTasks: readonly string[];
  evidence: readonly string[];
};

export type WorkforceIndustryPathway = {
  key: "manufacturing" | "construction" | "logistics" | "healthcare" | "business_operations";
  label: string;
  objective: string;
  operationalContexts: readonly string[];
  appliedExercise: WorkforceAppliedExercise;
  humanAuthorityBoundary: string;
};

const pathwayFoundation = Object.fromEntries(
  workforceAiOccupationalPathways.map((pathway) => [pathway.key, pathway]),
);

export const industryAcceleratorPathways: readonly WorkforceIndustryPathway[] = [
  {
    key: "manufacturing",
    label: "Manufacturing",
    objective: "Use AI responsibly for quality review, work instructions, documentation, troubleshooting support, maintenance logs, and process-improvement drafts while preserving approved procedures and safety authority.",
    operationalContexts: pathwayFoundation.manufacturing.exampleOperationalContexts,
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
