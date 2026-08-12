export type WorkflowJobState = "queued" | "running" | "waiting" | "succeeded" | "failed" | "dead_letter" | "cancelled";

export type WorkflowJob = {
  id: string;
  type: string;
  organizationId?: string | null;
  actorId?: string | null;
  sourceId?: string | null;
  payload: Record<string, unknown>;
  state: WorkflowJobState;
  attempt: number;
  maxAttempts: number;
  runAfter: Date;
  lastError?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function createWorkflowJob(input: Omit<WorkflowJob, "state" | "attempt" | "createdAt" | "updatedAt"> & { now?: Date }) {
  const now = input.now ?? new Date();
  return {
    id: input.id,
    type: input.type,
    organizationId: input.organizationId ?? null,
    actorId: input.actorId ?? null,
    sourceId: input.sourceId ?? null,
    payload: input.payload,
    state: "queued" as const,
    attempt: 0,
    maxAttempts: Math.max(1, input.maxAttempts),
    runAfter: input.runAfter,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function startWorkflowJob(job: WorkflowJob, now = new Date()) {
  if (!["queued", "waiting", "failed"].includes(job.state)) throw new Error(`Cannot start workflow job from ${job.state}.`);
  if (job.runAfter > now) return { ...job, state: "waiting" as const, updatedAt: now };
  return { ...job, state: "running" as const, attempt: job.attempt + 1, updatedAt: now };
}

export function failWorkflowJob(input: {
  job: WorkflowJob;
  error: string;
  now?: Date;
  baseDelayMs?: number;
}) {
  const now = input.now ?? new Date();
  const exhausted = input.job.attempt >= input.job.maxAttempts;
  if (exhausted) return { ...input.job, state: "dead_letter" as const, lastError: input.error, updatedAt: now };
  const delay = Math.max(1_000, input.baseDelayMs ?? 30_000) * Math.pow(2, Math.max(0, input.job.attempt - 1));
  return {
    ...input.job,
    state: "waiting" as const,
    runAfter: new Date(now.getTime() + delay),
    lastError: input.error,
    updatedAt: now,
  };
}

export function succeedWorkflowJob(job: WorkflowJob, now = new Date()) {
  if (job.state !== "running") throw new Error("Only a running workflow job can succeed.");
  return { ...job, state: "succeeded" as const, lastError: null, updatedAt: now };
}

export function runnableJobs(jobs: readonly WorkflowJob[], now = new Date()) {
  return jobs
    .filter((job) => ["queued", "waiting", "failed"].includes(job.state) && job.runAfter <= now)
    .slice()
    .sort((a, b) => a.runAfter.getTime() - b.runAfter.getTime());
}
