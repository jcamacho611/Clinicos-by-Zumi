import { z } from "zod";

export const formFieldTypeSchema = z.enum([
  "text", "textarea", "email", "phone", "number", "date", "yes_no",
  "checkbox", "select", "multiselect", "radio",
]);

export const formConditionSchema = z.object({
  fieldId: z.string().trim().min(1).max(80),
  operator: z.enum(["equals", "not_equals", "contains", "truthy", "falsy"]),
  value: z.union([z.string().max(500), z.number(), z.boolean()]).optional(),
});

export const formFieldSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  label: z.string().trim().min(2).max(180),
  type: formFieldTypeSchema,
  required: z.boolean().default(false),
  placeholder: z.string().trim().max(240).optional(),
  helpText: z.string().trim().max(500).optional(),
  options: z.array(z.object({
    label: z.string().trim().min(1).max(120),
    value: z.string().trim().min(1).max(120),
  })).max(50).default([]),
  condition: formConditionSchema.optional(),
}).superRefine((field, context) => {
  if (["select", "multiselect", "radio"].includes(field.type) && field.options.length < 2) {
    context.addIssue({ code: "custom", message: `${field.label} requires at least two options.`, path: ["options"] });
  }
});

export const formSectionSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(500).optional(),
  repeatable: z.boolean().default(false),
  condition: formConditionSchema.optional(),
  fields: z.array(formFieldSchema).min(1).max(100),
});

export const formDefinitionSchema = z.object({
  sections: z.array(formSectionSchema).min(1).max(30),
}).superRefine((definition, context) => {
  const ids = definition.sections.flatMap((section) => [section.id, ...section.fields.map((field) => field.id)]);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", message: "Every form section and field ID must be unique." });
  const fieldIds = new Set(definition.sections.flatMap((section) => section.fields.map((field) => field.id)));
  for (const section of definition.sections) {
    if (section.condition && !fieldIds.has(section.condition.fieldId)) context.addIssue({ code: "custom", message: `Section ${section.title} references an unknown condition field.` });
    for (const field of section.fields) {
      if (field.condition && !fieldIds.has(field.condition.fieldId)) context.addIssue({ code: "custom", message: `Field ${field.label} references an unknown condition field.` });
    }
  }
});

export const createFormTemplateSchema = z.object({
  name: z.string().trim().min(3).max(180),
  description: z.string().trim().max(1_000).optional(),
  category: z.enum(["intake", "consent", "history", "clinical", "financial", "case", "medical_spa", "general"]),
  audience: z.enum(["patient", "staff", "provider", "mixed"]).default("patient"),
  completionModes: z.array(z.enum(["patient", "staff", "provider"])).min(1).max(3),
  definition: formDefinitionSchema,
  requiresSignature: z.boolean().default(false),
  requiresWitness: z.boolean().default(false),
  requiresProviderSignature: z.boolean().default(false),
  staffReviewRequired: z.boolean().default(true),
  providerReviewRequired: z.boolean().default(false),
  expirationDays: z.coerce.number().int().min(1).max(36_500).optional(),
  renewalReminderDays: z.coerce.number().int().min(1).max(3_650).optional(),
}).superRefine((value, context) => {
  if (value.requiresWitness && !value.requiresSignature) context.addIssue({ code: "custom", message: "Witness capture requires a submitter signature.", path: ["requiresWitness"] });
  if (value.renewalReminderDays && value.expirationDays && value.renewalReminderDays >= value.expirationDays) context.addIssue({ code: "custom", message: "Renewal reminder must occur before expiration.", path: ["renewalReminderDays"] });
});

export const createFormTemplateVersionSchema = createFormTemplateSchema.extend({
  reason: z.string().trim().min(12).max(2_000),
});

export const formTemplateTransitionSchema = z.object({
  action: z.enum(["publish", "retire"]),
  note: z.string().trim().max(2_000).optional(),
}).superRefine((value, context) => {
  if (value.action === "retire" && (!value.note || value.note.length < 8)) context.addIssue({ code: "custom", message: "Retirement requires a reason of at least 8 characters.", path: ["note"] });
});

export const createFormAssignmentSchema = z.object({
  patientId: z.string().trim().min(1).max(160),
  templateId: z.string().trim().min(1).max(160),
  appointmentId: z.string().trim().min(1).max(160).optional(),
  encounterId: z.string().trim().min(1).max(160).optional(),
  completionMode: z.enum(["patient", "staff", "provider"]),
  deliveryMethod: z.enum(["portal", "email_link", "sms_link", "tablet", "paper_import", "staff_assisted"]),
  dueAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
}).superRefine((value, context) => {
  if (value.dueAt && value.expiresAt && value.expiresAt <= value.dueAt) context.addIssue({ code: "custom", message: "Assignment expiration must be after its due date.", path: ["expiresAt"] });
});

export const saveFormSubmissionSchema = z.object({
  assignmentId: z.string().trim().min(1).max(160),
  completionMode: z.enum(["patient", "staff", "provider", "paper_import"]),
  answers: z.record(z.string().max(80), z.unknown()),
});

export const signFormSubmissionSchema = z.object({
  signerType: z.enum(["submitter", "witness", "provider"]),
  signerName: z.string().trim().min(2).max(180),
  signerRelationship: z.string().trim().min(2).max(120).optional(),
  signatureText: z.string().trim().min(2).max(180),
  attestationAccepted: z.literal(true),
});

export const formSubmissionTransitionSchema = z.object({
  action: z.enum(["submit", "approve_staff", "approve_provider", "request_correction", "reject", "lock"]),
  note: z.string().trim().max(2_000).optional(),
  releasePatientCopy: z.boolean().default(false),
}).superRefine((value, context) => {
  if (["approve_staff", "approve_provider", "request_correction", "reject"].includes(value.action) && (!value.note || value.note.length < 8)) {
    context.addIssue({ code: "custom", message: "A human review note of at least 8 characters is required.", path: ["note"] });
  }
});

export const remindFormAssignmentSchema = z.object({
  channel: z.enum(["portal", "email", "sms", "phone", "manual"]),
  note: z.string().trim().min(8).max(500),
});

export type FormDefinition = z.infer<typeof formDefinitionSchema>;
export type FormTransitionAction = z.infer<typeof formSubmissionTransitionSchema>["action"];

function asAnswerRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function conditionMatches(condition: z.infer<typeof formConditionSchema> | undefined, answers: Record<string, unknown>) {
  if (!condition) return true;
  const answer = answers[condition.fieldId];
  if (condition.operator === "truthy") return Boolean(answer);
  if (condition.operator === "falsy") return !answer;
  if (condition.operator === "contains") return Array.isArray(answer) ? answer.includes(condition.value) : String(answer ?? "").includes(String(condition.value ?? ""));
  if (condition.operator === "not_equals") return answer !== condition.value;
  return answer === condition.value;
}

function hasAnswer(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
}

export function evaluateFormAnswers(rawDefinition: unknown, rawAnswers: unknown) {
  const definition = formDefinitionSchema.parse(rawDefinition);
  const answers = asAnswerRecord(rawAnswers);
  const visibleFields = definition.sections.flatMap((section) => conditionMatches(section.condition, answers)
    ? section.fields.filter((field) => conditionMatches(field.condition, answers))
    : []);
  const missingRequired = visibleFields.filter((field) => field.required && !hasAnswer(answers[field.id])).map((field) => field.label);
  const invalidFields = visibleFields.flatMap((field) => {
    const answer = answers[field.id];
    if (!hasAnswer(answer)) return [];
    if (field.type === "email" && (typeof answer !== "string" || !z.string().email().safeParse(answer).success)) return [field.label];
    if (field.type === "number" && typeof answer !== "number") return [field.label];
    if (field.type === "checkbox" || field.type === "yes_no") return typeof answer === "boolean" ? [] : [field.label];
    if (field.type === "multiselect") return Array.isArray(answer) ? [] : [field.label];
    if (["select", "radio"].includes(field.type) && !field.options.some((option) => option.value === answer)) return [field.label];
    return [];
  });
  const answered = visibleFields.filter((field) => hasAnswer(answers[field.id])).length;
  const completionPercent = visibleFields.length ? Math.round((answered / visibleFields.length) * 100) : 100;
  return { definition, answers, visibleFields, missingRequired, invalidFields, completionPercent };
}

export function nextFormSubmissionState(input: {
  status: string;
  staffReviewRequired: boolean;
  providerReviewRequired: boolean;
  requiresProviderSignature: boolean;
  signatures: string[];
}, action: FormTransitionAction) {
  if (input.status === "locked") throw new Error("Locked form submissions are immutable.");
  if (action === "submit") {
    if (!["draft", "needs_correction"].includes(input.status)) throw new Error("Only draft or correction-requested submissions can be submitted.");
    if (input.staffReviewRequired) return { status: "staff_review", currentReviewStage: "staff" };
    if (input.providerReviewRequired || input.requiresProviderSignature) return { status: "provider_review", currentReviewStage: "provider" };
    return { status: "approved", currentReviewStage: null };
  }
  if (action === "approve_staff") {
    if (input.status !== "staff_review") throw new Error("Submission is not awaiting staff review.");
    if (input.providerReviewRequired || input.requiresProviderSignature) return { status: "provider_review", currentReviewStage: "provider" };
    return { status: "approved", currentReviewStage: null };
  }
  if (action === "approve_provider") {
    if (input.status !== "provider_review") throw new Error("Submission is not awaiting provider review.");
    if (input.requiresProviderSignature && !input.signatures.includes("provider")) throw new Error("Provider signature is required before provider approval.");
    return { status: "approved", currentReviewStage: null };
  }
  if (action === "request_correction") {
    if (!["staff_review", "provider_review"].includes(input.status)) throw new Error("Only an active review can request correction.");
    return { status: "needs_correction", currentReviewStage: null };
  }
  if (action === "reject") {
    if (!["staff_review", "provider_review"].includes(input.status)) throw new Error("Only an active review can reject a submission.");
    return { status: "rejected", currentReviewStage: null };
  }
  if (input.status !== "approved") throw new Error("Only an approved form can be locked and attached to the chart.");
  return { status: "locked", currentReviewStage: null };
}

export function missingSignatureRoles(template: { requiresSignature: boolean; requiresWitness: boolean }, signatures: string[]) {
  return [
    ...(template.requiresSignature && !signatures.includes("submitter") ? ["submitter"] : []),
    ...(template.requiresWitness && !signatures.includes("witness") ? ["witness"] : []),
  ];
}
