import type { DomainEvent, KlinikosSignal, NextAction } from "@/lib/orchestration/contracts";

export type EventHandler = (event: DomainEvent) => Promise<void> | void;

export class DomainEventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();

  subscribe(eventType: string, handler: EventHandler) {
    const set = this.handlers.get(eventType) ?? new Set<EventHandler>();
    set.add(handler);
    this.handlers.set(eventType, set);
    return () => set.delete(handler);
  }

  async publish(event: DomainEvent) {
    const direct = Array.from(this.handlers.get(event.type) ?? []);
    const wildcard = Array.from(this.handlers.get("*") ?? []);
    for (const handler of [...direct, ...wildcard]) await handler(event);
  }
}

export function signalFromEvent(event: DomainEvent): KlinikosSignal {
  const label = typeof event.payload.label === "string" ? event.payload.label : event.type.replaceAll("_", " ");
  const detail = typeof event.payload.detail === "string" ? event.payload.detail : "Klinikos recorded a workflow change.";
  const value = typeof event.payload.value === "number" || typeof event.payload.value === "string" ? event.payload.value : 1;
  const href = typeof event.payload.href === "string" ? event.payload.href : null;

  return {
    id: `signal:${event.id}`,
    label,
    value,
    detail,
    sourceType: inferSourceType(event.sourceType),
    sourceId: event.sourceId ?? null,
    severity: event.severity,
    href,
    observedAt: event.occurredAt,
  };
}

function inferSourceType(sourceType: string): NextAction["sourceType"] {
  const known: NextAction["sourceType"][] = ["path", "task", "referral", "credential", "edu", "grid", "transaction", "result", "claim", "schedule", "system"];
  return known.includes(sourceType as NextAction["sourceType"]) ? sourceType as NextAction["sourceType"] : "system";
}

export function collapseSignals(signals: readonly KlinikosSignal[]) {
  const grouped = new Map<string, KlinikosSignal>();
  for (const signal of signals) {
    const key = `${signal.sourceType}:${signal.label}:${signal.href ?? ""}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, signal);
      continue;
    }
    const numeric = typeof existing.value === "number" && typeof signal.value === "number";
    grouped.set(key, {
      ...existing,
      value: numeric ? Number(existing.value) + Number(signal.value) : signal.value,
      observedAt: signal.observedAt > existing.observedAt ? signal.observedAt : existing.observedAt,
      severity: severityRank(signal.severity) > severityRank(existing.severity) ? signal.severity : existing.severity,
    });
  }
  return Array.from(grouped.values()).sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());
}

function severityRank(value: KlinikosSignal["severity"]) {
  return { info: 0, attention: 1, warning: 2, critical: 3 }[value];
}
