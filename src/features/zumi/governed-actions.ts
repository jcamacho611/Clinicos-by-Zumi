import { z } from "zod";
import { createHash } from "node:crypto";
import { createTaskSchema, type CreateTaskInput } from "@/lib/task-create-rules";

export const governedActionRiskSchema = z.enum(["LOW", "REVIEW", "HIGH", "REGULATED"]);
export type GovernedActionRisk = z.infer<typeof governedActionRiskSchema>;

export const governedActionIdSchema = z.enum(["task.create"]);
export type GovernedActionId = z.infer<typeof governedActionIdSchema>;

export const governedActionContextSchema = z.object({
  userId: z.string().min(1),
  organizationId: z.string().min(1),
  role: z.string().min(1),
});
export type GovernedActionContext = z.infer<typeof governedActionContextSchema>;

const taskPreviewSchema = z.object({
  title: z.string(),
  category: z.string(),
  priority: z.enum(["normal", "high", "urgent"]),
  patientId: z.string().nullable(),
  ownerId: z.string().nullable(),
  dueAt: z.string().nullable(),
  details: z.string().nullable(),
});

export const preparedGovernedActionSchema = z.object({
  version: z.literal(1),
  actionId: governedActionIdSchema,
  risk: governedActionRiskSchema,
  requiresConfirmation: z.boolean(),
  userId: z.string(),
  organizationId: z.string(),
  preparedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  payloadHash: z.string().length(64),
  input: createTaskSchema,
  preview: taskPreviewSchema,
});
export type PreparedGovernedAction = z.infer<typeof preparedGovernedActionSchema>;

export const governedActionRegistry = {
  "task.create": {
    id: "task.create",
    domain: "operations",
    purpose: "Create an internal clinic task through the existing task service.",
    risk: "REVIEW",
    requiresConfirmation: true,
    permission: { resource: "tasks", action: "create" },
    inputSchema: createTaskSchema,
  },
} as const;

function canonicalHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function prepareCreateTaskAction(
  contextInput: GovernedActionContext,
  candidateInput: unknown,
  now = new Date(),
): PreparedGovernedAction {
  const context = governedActionContextSchema.parse(contextInput);
  const input: CreateTaskInput = createTaskSchema.parse(candidateInput);
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
  const binding = {
    actionId: "task.create" as const,
    userId: context.userId,
    organizationId: context.organizationId,
    input,
    preparedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  return preparedGovernedActionSchema.parse({
    version: 1,
    actionId: binding.actionId,
    risk: governedActionRegistry["task.create"].risk,
    requiresConfirmation: governedActionRegistry["task.create"].requiresConfirmation,
    userId: context.userId,
    organizationId: context.organizationId,
    preparedAt: binding.preparedAt,
    expiresAt: binding.expiresAt,
    payloadHash: canonicalHash(binding),
    input,
    preview: {
      title: input.title,
      category: input.category,
      priority: input.priority,
      patientId: input.patientId ?? null,
      ownerId: input.ownerId ?? null,
      dueAt: input.dueAt ?? null,
      details: input.details ?? null,
    },
  });
}

export function verifyPreparedActionBinding(
  preparedInput: unknown,
  contextInput: GovernedActionContext,
  now = new Date(),
) {
  const prepared = preparedGovernedActionSchema.parse(preparedInput);
  const context = governedActionContextSchema.parse(contextInput);
  if (prepared.userId !== context.userId || prepared.organizationId !== context.organizationId) return false;
  if (new Date(prepared.expiresAt).getTime() <= now.getTime()) return false;
  const expected = canonicalHash({
    actionId: prepared.actionId,
    userId: prepared.userId,
    organizationId: prepared.organizationId,
    input: prepared.input,
    preparedAt: prepared.preparedAt,
    expiresAt: prepared.expiresAt,
  });
  return expected === prepared.payloadHash;
}
