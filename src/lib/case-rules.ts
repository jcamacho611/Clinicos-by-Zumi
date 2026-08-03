import { z } from "zod";

export const caseTypes = ["nofault", "workers_comp"] as const;
export const caseTypeSchema = z.enum(caseTypes);
export type CaseType = z.infer<typeof caseTypeSchema>;

export const caseStatuses = ["active", "on_hold", "disputed", "closed"] as const;
export const caseStatusSchema = z.enum(caseStatuses);

export const casePacketTypes = ["carrier_submission", "attorney_packet", "billing_packet", "medical_necessity"] as const;
export const casePacketTypeSchema = z.enum(casePacketTypes);
export type CasePacketType = z.infer<typeof casePacketTypeSchema>;

const optionalText = z.string().trim().max(2_000).optional().nullable();
const optionalDate = z.string().datetime({ offset: true }).optional().nullable();

export const caseContactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().max(200).optional().nullable(),
  organization: z.string().trim().max(160).optional().nullable(),
});

export type CaseContact = z.infer<typeof caseContactSchema>;

export const createCaseSchema = z.object({
  caseType: caseTypeSchema,
  patientId: z.string().trim().min(1).max(160),
  accidentDate: z.string().date(),
  claimNumber: z.string().trim().min(3).max(100),
  carrier: z.string().trim().min(2).max(160),
  policyNumber: z.string().trim().max(120).optional().nullable(),
  injuredBodyParts: z.array(z.string().trim().min(2).max(80)).min(1).max(20),
  diagnosisCodes: z.array(z.string().trim().toUpperCase().min(3).max(12)).max(40).default([]),
  treatmentPlan: optionalText,
  workStatus: optionalText,
  returnToWorkStatus: optionalText,
  assignmentBenefitsStatus: z.string().trim().max(120).optional().nullable(),
  nf2Status: z.string().trim().max(120).optional().nullable(),
  nf3Status: z.string().trim().max(120).optional().nullable(),
  c4Status: z.string().trim().max(120).optional().nullable(),
  priorAuthStatus: z.string().trim().max(120).optional().nullable(),
  authorizationStatus: z.string().trim().max(120).optional().nullable(),
  imeStatus: z.string().trim().max(120).optional().nullable(),
  denialStatus: z.string().trim().max(120).optional().nullable(),
  appealStatus: z.string().trim().max(120).optional().nullable(),
  narrativeDueAt: optionalDate,
  adjuster: caseContactSchema.optional().nullable(),
  attorney: caseContactSchema.optional().nullable(),
  employer: caseContactSchema.optional().nullable(),
}).superRefine((value, context) => {
  if (value.caseType === "workers_comp" && !value.employer) {
    context.addIssue({ code: "custom", message: "Workers compensation cases require an employer contact.", path: ["employer"] });
  }
});

export const updateCaseSchema = z.object({
  status: caseStatusSchema.optional(),
  carrier: z.string().trim().min(2).max(160).optional(),
  policyNumber: z.string().trim().max(120).optional().nullable(),
  injuredBodyParts: z.array(z.string().trim().min(2).max(80)).min(1).max(20).optional(),
  diagnosisCodes: z.array(z.string().trim().toUpperCase().min(3).max(12)).max(40).optional(),
  treatmentPlan: optionalText,
  workStatus: optionalText,
  returnToWorkStatus: optionalText,
  assignmentBenefitsStatus: z.string().trim().max(120).optional().nullable(),
  nf2Status: z.string().trim().max(120).optional().nullable(),
  nf3Status: z.string().trim().max(120).optional().nullable(),
  c4Status: z.string().trim().max(120).optional().nullable(),
  priorAuthStatus: z.string().trim().max(120).optional().nullable(),
  authorizationStatus: z.string().trim().max(120).optional().nullable(),
  imeStatus: z.string().trim().max(120).optional().nullable(),
  denialStatus: z.string().trim().max(120).optional().nullable(),
  appealStatus: z.string().trim().max(120).optional().nullable(),
  narrativeDueAt: optionalDate,
  adjuster: caseContactSchema.optional().nullable(),
  attorney: caseContactSchema.optional().nullable(),
  employer: caseContactSchema.optional().nullable(),
  note: z.string().trim().min(8).max(2_000),
});

export const createCaseTaskSchema = z.object({
  title: z.string().trim().min(3).max(240),
  ownerId: z.string().trim().min(1).max(160).optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  dueAt: optionalDate,
  note: z.string().trim().min(8).max(1_000),
});

export const caseTaskTransitionSchema = z.object({
  action: z.enum(["complete", "reopen", "cancel"]),
  note: z.string().trim().min(8).max(1_000),
});

export const createCasePacketSchema = z.object({
  type: casePacketTypeSchema,
  note: z.string().trim().min(8).max(1_000),
});

export const casePacketTransitionSchema = z.object({
  action: z.enum(["mark_item", "mark_ready", "generate_manual", "approve", "reopen"]),
  itemKey: z.string().trim().min(1).max(100).optional(),
  complete: z.boolean().optional(),
  note: z.string().trim().min(8).max(1_000),
}).superRefine((value, context) => {
  if (value.action === "mark_item" && (!value.itemKey || value.complete === undefined)) {
    context.addIssue({ code: "custom", message: "Checklist item and completion state are required.", path: ["itemKey"] });
  }
});

export interface CaseChecklistItem {
  key: string;
  label: string;
  required: boolean;
  complete: boolean;
  completedAt: string | null;
  completedBy: string | null;
  note: string | null;
}

const commonPacketRequirements = [
  { key: "accident_intake", label: "Accident and injury intake", required: true },
  { key: "patient_demographics", label: "Patient demographics", required: true },
  { key: "clinical_notes", label: "Relevant treatment notes", required: true },
  { key: "diagnosis_procedure", label: "Diagnosis and procedure support", required: true },
] as const;

const packetRequirements: Record<CaseType, Record<CasePacketType, ReadonlyArray<{ key: string; label: string; required: boolean }>>> = {
  nofault: {
    carrier_submission: [...commonPacketRequirements, { key: "assignment_benefits", label: "Assignment of benefits", required: true }, { key: "nf2_status", label: "NF-2 status or manual fallback note", required: true }, { key: "billing_support", label: "Billing support", required: true }],
    attorney_packet: [...commonPacketRequirements, { key: "attorney_authorization", label: "Attorney authorization or request", required: true }, { key: "narrative", label: "Medical-necessity narrative", required: true }, { key: "billing_summary", label: "Billing summary", required: false }],
    billing_packet: [...commonPacketRequirements, { key: "assignment_benefits", label: "Assignment of benefits", required: true }, { key: "claim_form", label: "CMS-1500 or manual claim form", required: true }, { key: "authorization", label: "Authorization evidence", required: false }],
    medical_necessity: [...commonPacketRequirements, { key: "narrative", label: "Medical-necessity narrative", required: true }, { key: "imaging_labs", label: "Supporting imaging or laboratory evidence", required: false }],
  },
  workers_comp: {
    carrier_submission: [...commonPacketRequirements, { key: "employer_details", label: "Employer details", required: true }, { key: "work_status", label: "Current work-status documentation", required: true }, { key: "c4_status", label: "C-4 status or manual fallback note", required: true }],
    attorney_packet: [...commonPacketRequirements, { key: "attorney_authorization", label: "Attorney authorization or request", required: true }, { key: "work_status", label: "Current work-status documentation", required: true }, { key: "narrative", label: "Narrative report", required: true }],
    billing_packet: [...commonPacketRequirements, { key: "employer_details", label: "Employer details", required: true }, { key: "claim_form", label: "Claim form or manual billing fallback", required: true }, { key: "authorization", label: "Authorization evidence", required: true }],
    medical_necessity: [...commonPacketRequirements, { key: "work_status", label: "Current work-status documentation", required: true }, { key: "narrative", label: "Medical-necessity narrative", required: true }, { key: "imaging_labs", label: "Supporting imaging or laboratory evidence", required: false }],
  },
};

export function buildCaseChecklist(caseType: CaseType, type: CasePacketType): CaseChecklistItem[] {
  return packetRequirements[caseType][type].map((item) => ({ ...item, complete: false, completedAt: null, completedBy: null, note: null }));
}

export function parseCaseChecklist(value: unknown): CaseChecklistItem[] {
  const schema = z.array(z.object({
    key: z.string(), label: z.string(), required: z.boolean(), complete: z.boolean(),
    completedAt: z.string().nullable(), completedBy: z.string().nullable(), note: z.string().nullable(),
  }));
  return schema.safeParse(value).data ?? [];
}

export function casePacketReadiness(checklist: CaseChecklistItem[]) {
  const required = checklist.filter((item) => item.required);
  if (!required.length) return 0;
  return Math.round((required.filter((item) => item.complete).length / required.length) * 100);
}

export function canMarkCasePacketReady(checklist: CaseChecklistItem[]) {
  return checklist.some((item) => item.required) && checklist.filter((item) => item.required).every((item) => item.complete);
}

export function nextCaseTaskStatus(current: string, action: z.infer<typeof caseTaskTransitionSchema>["action"]) {
  if (action === "complete" && current === "open") return "completed";
  if (action === "cancel" && current === "open") return "cancelled";
  if (action === "reopen" && ["completed", "cancelled"].includes(current)) return "open";
  throw new Error(`Cannot ${action} a ${current} case task.`);
}

export function assertCasePacketTransition(current: string, action: z.infer<typeof casePacketTransitionSchema>["action"], checklist: CaseChecklistItem[]) {
  if (action === "mark_item" && ["draft", "needs_attention"].includes(current)) return;
  if (action === "mark_ready" && ["draft", "needs_attention"].includes(current) && canMarkCasePacketReady(checklist)) return;
  if (action === "generate_manual" && current === "ready") return;
  if (action === "approve" && current === "generated_manual") return;
  if (action === "reopen" && ["ready", "generated_manual", "approved"].includes(current)) return;
  throw new Error(`Cannot ${action.replaceAll("_", " ")} a ${current} packet.`);
}
