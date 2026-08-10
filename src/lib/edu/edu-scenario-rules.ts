import { z } from "zod";
import { eduSimulationRoles } from "@/lib/edu/edu-roles";
import { findForbiddenScenarioAssertions, SYNTHETIC_DATA_LABELS } from "@/lib/edu/edu-safety";

/**
 * Klinikos EDU scenario engine rules.
 *
 * Defines the shape of a synthetic scenario, its lifecycle, and the split between
 * what a student may see and what stays instructor-only. Pure module: no database,
 * no network, no AI calls. The AI gateway, when it exists, must produce a payload
 * that satisfies `eduScenarioPayloadSchema` — generation never bypasses validation.
 */

export const eduScenarioStatuses = ["draft", "in_review", "published", "archived"] as const;
export type EduScenarioStatus = (typeof eduScenarioStatuses)[number];

export const eduScenarioSettings = [
  "primary_care",
  "specialty_clinic",
  "urgent_care",
  "med_spa",
  "billing_office",
  "telehealth",
] as const;

export const eduScenarioDifficulties = ["introductory", "intermediate", "advanced"] as const;

const scenarioTransitions: Record<EduScenarioStatus, readonly EduScenarioStatus[]> = {
  draft: ["in_review", "archived"],
  in_review: ["draft", "published", "archived"],
  published: ["archived"],
  archived: [],
};

export function canTransitionScenario(from: string, to: string) {
  const parsedFrom = z.enum(eduScenarioStatuses).safeParse(from);
  const parsedTo = z.enum(eduScenarioStatuses).safeParse(to);
  return Boolean(parsedFrom.success && parsedTo.success && scenarioTransitions[parsedFrom.data].includes(parsedTo.data));
}

/** Only a published scenario may be assigned to students. */
export function scenarioIsAssignable(status: string) {
  return status === "published";
}

// ---------------------------------------------------------------------------
// Synthetic scenario payload
// ---------------------------------------------------------------------------

/**
 * The synthetic patient.
 *
 * Deliberately NOT a `Patient` record and never written to the clinical tables.
 * Age is stored as a number rather than a date of birth, and there is no field for
 * a real identifier — no MRN, SSN, member id, address, or phone — so the structure
 * itself cannot carry a real person's details even if someone tried.
 */
export const syntheticPatientSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  ageYears: z.number().int().min(0).max(120),
  sexAtBirth: z.enum(["female", "male", "intersex", "unspecified"]).default("unspecified"),
  chiefConcern: z.string().trim().min(3).max(300),
  conditions: z.array(z.string().trim().min(2).max(120)).max(20).default([]),
  medications: z.array(z.string().trim().min(2).max(120)).max(20).default([]),
  allergies: z.array(z.string().trim().min(2).max(120)).max(20).default([]),
  insurancePlanLabel: z.string().trim().min(2).max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const syntheticTaskSchema = z.object({
  key: z.string().trim().min(2).max(80),
  queue: z.string().trim().min(2).max(60),
  title: z.string().trim().min(3).max(200),
  detail: z.string().trim().max(2000).optional(),
  assignedSimulationRole: z.enum(eduSimulationRoles),
  priority: z.enum(["routine", "elevated", "urgent"]).default("routine"),
  /** Whether the correct action is to escalate rather than resolve in-seat. */
  requiresEscalation: z.boolean().default(false),
});

export const syntheticEventSchema = z.object({
  key: z.string().trim().min(2).max(80),
  type: z.enum([
    "appointment",
    "intake_status",
    "referral",
    "lab_result",
    "imaging_result",
    "billing_readiness",
    "insurance_issue",
    "message",
    "document",
  ]),
  label: z.string().trim().min(3).max(200),
  detail: z.string().trim().max(2000).optional(),
  /** Flags an item the scenario intends the student to notice and act on. */
  isProblem: z.boolean().default(false),
  occursAtOffsetMinutes: z.number().int().min(-100_000).max(100_000).default(0),
});

/** Instructor-only. Must never be serialized into a student-facing response. */
export const scenarioAnswerKeySchema = z.object({
  expectedWorkflowSequence: z.array(z.object({
    step: z.number().int().min(1).max(100),
    simulationRole: z.enum(eduSimulationRoles),
    expectedAction: z.string().trim().min(3).max(300),
    rationale: z.string().trim().max(1000).optional(),
  })).min(1).max(100),
  criticalMisses: z.array(z.string().trim().min(3).max(300)).max(50).default([]),
  instructorNotes: z.string().trim().max(4000).optional(),
});

export const eduScenarioPayloadSchema = z.object({
  syntheticPatient: syntheticPatientSchema,
  tasks: z.array(syntheticTaskSchema).max(60).default([]),
  events: z.array(syntheticEventSchema).max(80).default([]),
  openingBrief: z.string().trim().min(20).max(4000),
  /** Bounded prompts the AI feedback layer may use. Educational framing only. */
  aiFeedbackPrompts: z.array(z.string().trim().min(10).max(600)).max(20).default([]),
});

export type EduScenarioPayload = z.infer<typeof eduScenarioPayloadSchema>;
export type ScenarioAnswerKey = z.infer<typeof scenarioAnswerKeySchema>;

export const createEduScenarioSchema = z.object({
  title: z.string().trim().min(4).max(200),
  summary: z.string().trim().min(20).max(1000),
  setting: z.enum(eduScenarioSettings),
  difficulty: z.enum(eduScenarioDifficulties),
  simulationRoles: z.array(z.enum(eduSimulationRoles)).min(1).max(8),
  curriculumPackageKey: z.string().trim().min(2).max(80).optional(),
  estimatedMinutes: z.number().int().min(5).max(600).default(45),
  payload: eduScenarioPayloadSchema,
  answerKey: scenarioAnswerKeySchema,
});

export type CreateEduScenarioInput = z.infer<typeof createEduScenarioSchema>;

/** Natural-language authoring request. Produces a draft for the instructor to edit. */
export const scenarioPromptSchema = z.object({
  prompt: z.string().trim().min(20).max(2000),
  setting: z.enum(eduScenarioSettings).default("primary_care"),
  difficulty: z.enum(eduScenarioDifficulties).default("intermediate"),
  simulationRoles: z.array(z.enum(eduSimulationRoles)).min(1).max(8),
  curriculumPackageKey: z.string().trim().min(2).max(80).optional(),
});

export const eduScenarioTransitionSchema = z.object({
  targetStatus: z.enum(eduScenarioStatuses),
  note: z.string().trim().min(8).max(1000),
});

// ---------------------------------------------------------------------------
// Safety validation
// ---------------------------------------------------------------------------

export type ScenarioSafetyIssue = { field: string; issue: string };

/**
 * Validate a scenario against the EDU safety boundaries.
 *
 * Checks the free-text surfaces a student will read for language that would present
 * the simulation as real care. Runs independently of the Zod schema because a
 * payload can be structurally valid and still say something it must not.
 */
export function validateScenarioSafety(input: {
  title: string;
  summary: string;
  payload: EduScenarioPayload;
}): ScenarioSafetyIssue[] {
  const issues: ScenarioSafetyIssue[] = [];

  const check = (field: string, text: string | undefined) => {
    if (!text) return;
    for (const phrase of findForbiddenScenarioAssertions(text)) {
      issues.push({ field, issue: `Contains "${phrase}", which presents the simulation as real care.` });
    }
  };

  check("title", input.title);
  check("summary", input.summary);
  check("payload.openingBrief", input.payload.openingBrief);
  input.payload.tasks.forEach((task, index) => {
    check(`payload.tasks[${index}].title`, task.title);
    check(`payload.tasks[${index}].detail`, task.detail);
  });
  input.payload.events.forEach((event, index) => {
    check(`payload.events[${index}].label`, event.label);
    check(`payload.events[${index}].detail`, event.detail);
  });
  input.payload.aiFeedbackPrompts.forEach((prompt, index) => {
    check(`payload.aiFeedbackPrompts[${index}]`, prompt);
  });

  return issues;
}

/** A scenario may only be published once it carries no safety issues. */
export function scenarioReadyToPublish(input: { title: string; summary: string; payload: EduScenarioPayload; answerKey: ScenarioAnswerKey }) {
  const safetyIssues = validateScenarioSafety(input);
  const blockers: string[] = safetyIssues.map((issue) => `${issue.field}: ${issue.issue}`);
  if (!input.answerKey.expectedWorkflowSequence.length) {
    blockers.push("answerKey: an expected workflow sequence is required before publication.");
  }
  if (!input.payload.tasks.length && !input.payload.events.length) {
    blockers.push("payload: a scenario needs at least one task or event for a student to act on.");
  }
  return { ready: blockers.length === 0, blockers };
}

// ---------------------------------------------------------------------------
// Student-facing projection
// ---------------------------------------------------------------------------

export type StudentScenarioView = {
  title: string;
  summary: string;
  setting: string;
  difficulty: string;
  estimatedMinutes: number;
  syntheticLabels: readonly string[];
  openingBrief: string;
  simulationRole: string;
  /** Only the tasks routed to this student's seat. */
  tasks: { key: string; queue: string; title: string; detail?: string; priority: string }[];
  events: { key: string; type: string; label: string; detail?: string; occursAtOffsetMinutes: number }[];
};

/**
 * Project a scenario for a student.
 *
 * This is the only function that should ever build a student-facing scenario
 * response. It drops the answer key, the expected sequence, the critical-miss list,
 * the instructor notes, the AI feedback prompts, and the `isProblem` /
 * `requiresEscalation` flags — those flags are the assessment itself, and leaking
 * them would tell the student exactly which items to act on.
 */
export function projectScenarioForStudent(input: {
  title: string;
  summary: string;
  setting: string;
  difficulty: string;
  estimatedMinutes: number;
  payload: EduScenarioPayload;
  simulationRole: string;
}): StudentScenarioView {
  return {
    title: input.title,
    summary: input.summary,
    setting: input.setting,
    difficulty: input.difficulty,
    estimatedMinutes: input.estimatedMinutes,
    syntheticLabels: SYNTHETIC_DATA_LABELS,
    openingBrief: input.payload.openingBrief,
    simulationRole: input.simulationRole,
    tasks: input.payload.tasks
      .filter((task) => task.assignedSimulationRole === input.simulationRole)
      .map((task) => ({ key: task.key, queue: task.queue, title: task.title, detail: task.detail, priority: task.priority })),
    events: input.payload.events.map((event) => ({
      key: event.key,
      type: event.type,
      label: event.label,
      detail: event.detail,
      occursAtOffsetMinutes: event.occursAtOffsetMinutes,
    })),
  };
}
