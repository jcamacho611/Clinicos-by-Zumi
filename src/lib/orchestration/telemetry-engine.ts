export type OutcomeEventType = "intent_captured" | "path_started" | "path_resumed" | "node_completed" | "node_blocked" | "path_completed" | "grid_matched" | "staffing_filled" | "referral_closed" | "edu_milestone" | "payment_completed" | "claim_resolved" | "care_booked";

export type OutcomeEvent = {
  id: string;
  type: OutcomeEventType;
  actorId?: string | null;
  organizationId?: string | null;
  pathInstanceId?: string | null;
  sourceId?: string | null;
  occurredAt: Date;
  metadata: Record<string, unknown>;
};

export type TimeToOutcomeResult = {
  actorId?: string | null;
  pathInstanceId?: string | null;
  startEventId: string;
  endEventId: string;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
};

export function timeToOutcome(input: {
  events: readonly OutcomeEvent[];
  actorId?: string | null;
  pathInstanceId?: string | null;
  outcomeTypes: readonly OutcomeEventType[];
}) {
  const scoped = input.events
    .filter((event) => (input.actorId == null || event.actorId === input.actorId) && (input.pathInstanceId == null || event.pathInstanceId === input.pathInstanceId))
    .slice()
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  const start = scoped.find((event) => event.type === "intent_captured" || event.type === "path_started");
  const end = scoped.find((event) => input.outcomeTypes.includes(event.type) && (!start || event.occurredAt >= start.occurredAt));
  if (!start || !end) return null;

  const result: TimeToOutcomeResult = {
    actorId: input.actorId ?? start.actorId ?? null,
    pathInstanceId: input.pathInstanceId ?? start.pathInstanceId ?? null,
    startEventId: start.id,
    endEventId: end.id,
    startedAt: start.occurredAt,
    completedAt: end.occurredAt,
    durationMs: Math.max(0, end.occurredAt.getTime() - start.occurredAt.getTime()),
  };
  return result;
}

export function outcomeCounts(events: readonly OutcomeEvent[]) {
  const counts: Record<string, number> = {};
  for (const event of events) counts[event.type] = (counts[event.type] ?? 0) + 1;
  return counts;
}

export function pathConversionRate(events: readonly OutcomeEvent[]) {
  const started = new Set(events.filter((event) => event.type === "path_started" && event.pathInstanceId).map((event) => event.pathInstanceId!));
  const completed = new Set(events.filter((event) => event.type === "path_completed" && event.pathInstanceId).map((event) => event.pathInstanceId!));
  if (started.size === 0) return 0;
  return Array.from(completed).filter((id) => started.has(id)).length / started.size;
}
