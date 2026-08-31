import "server-only";

import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { resolveInteroperabilityLifecycle } from "@/lib/integrations/interoperability-lifecycle";
import { integrationRetrySchema, reliabilityEventSchema, reliabilityEventTransitionSchema } from "@/lib/system-health-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function requireHealthAccess(session: ClinicSession, action: "read" | "create" | "update") {
  if (!can(session.role, "reliability", action)) throw new NetworkAccessError("System health access is not permitted for this role.", 403);
}

export async function listSystemHealthWorkspace(session: ClinicSession) {
  requireHealthAccess(session, "read");
  const startedAt = Date.now();
  const [organization, integrations, integrationEvents, tasks, escalations, recentAudits, recentActivity, events] = await Promise.all([
    db.organization.findFirst({ where: { id: session.organizationId }, select: { id: true, name: true, demoMode: true } }),
    db.integration.findMany({ where: { organizationId: session.organizationId }, orderBy: { updatedAt: "desc" }, take: 100 }),
    db.integrationEvent.findMany({ where: { organizationId: session.organizationId }, include: { integration: { select: { vendor: true, type: true } } }, orderBy: { occurredAt: "desc" }, take: 100 }),
    db.task.findMany({ where: { organizationId: session.organizationId, status: { not: "completed" } }, orderBy: [{ priority: "desc" }, { dueAt: "asc" }], take: 100 }),
    db.escalation.findMany({ where: { organizationId: session.organizationId, status: { not: "resolved" } }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.auditLog.findMany({ where: { organizationId: session.organizationId }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.activityLog.findMany({ where: { organizationId: session.organizationId }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.reliabilityEvent.findMany({ where: { organizationId: session.organizationId }, orderBy: { createdAt: "desc" }, take: 40 }),
  ]);
  if (!organization) throw new NetworkAccessError("Organization was not found.", 404);
  const failedEvents = integrationEvents.filter((event) => ["failed", "error", "dead_letter"].includes(event.status));
  const retryableEvents = integrationEvents.filter((event) => ["failed", "error", "queued", "retrying"].includes(event.status));
  const urgentEvents = events.filter((event) => event.severity === "urgent" && event.status !== "resolved");
  const openIncidents = events.filter((event) => event.category === "incident" && event.status !== "resolved");
  const databaseLatencyMs = Date.now() - startedAt;
  await db.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "system_health.workspace_accessed", resourceType: "system_health", resourceId: session.organizationId, metadata: { databaseLatencyMs, failedIntegrationEvents: failedEvents.length } } });
  return {
    organization,
    checkedAt: new Date().toISOString(),
    checks: [
      { key: "api", label: "API service", status: "healthy", detail: "Authenticated application route is responding." },
      { key: "database", label: "Database", status: databaseLatencyMs < 1000 ? "healthy" : "needs_attention", detail: `Tenant query completed in ${databaseLatencyMs}ms.` },
      { key: "integrations", label: "Integration health", status: failedEvents.length ? "needs_attention" : "healthy", detail: `${integrations.length} configured or roadmap connections; ${failedEvents.length} failed events.` },
      { key: "queue", label: "Work queues", status: urgentEvents.length || escalations.length ? "needs_attention" : "healthy", detail: `${tasks.length} open tasks, ${escalations.length} open escalations.` },
      { key: "fallback", label: "Manual fallback", status: "available", detail: "Failed interfaces remain retryable or manually documentable." },
    ],
    integrations: integrations.map((integration) => {
      // Legacy Integration records currently carry status/phase but no durable field that
      // proves controlled production verification. We therefore pass no evidence ref here:
      // even a raw `active`/`connected` row remains CONNECTED rather than VERIFIED LIVE.
      const lifecycle = resolveInteroperabilityLifecycle({ status: integration.status, phase: integration.phase });
      return {
        id: integration.id,
        type: integration.type,
        vendor: integration.vendor,
        status: integration.status,
        riskLevel: integration.riskLevel,
        phase: integration.phase,
        lastSyncAt: integration.lastSyncAt?.toISOString() ?? null,
        lifecycle: lifecycle.lifecycle,
        productionVerified: lifecycle.productionVerified,
        productionClaimAllowed: lifecycle.productionClaimAllowed,
        lifecycleReason: lifecycle.reason,
      };
    }),
    failedIntegrationEvents: retryableEvents.slice(0, 30).map((event) => ({ id: event.id, vendor: event.integration?.vendor ?? "Unassigned adapter", type: event.integration?.type ?? event.resourceType, eventType: event.eventType, status: event.status, errorCode: event.errorCode, errorMessage: event.errorMessage, retryCount: event.retryCount, nextRetryAt: event.nextRetryAt?.toISOString() ?? null, occurredAt: event.occurredAt.toISOString() })),
    events: events.map((event) => ({ id: event.id, category: event.category, severity: event.severity, status: event.status, title: event.title, summary: event.summary, source: event.source, acknowledgedAt: event.acknowledgedAt?.toISOString() ?? null, resolvedAt: event.resolvedAt?.toISOString() ?? null, createdAt: event.createdAt.toISOString() })),
    recentAudits: recentAudits.map((audit) => ({ id: audit.id, action: audit.action, resourceType: audit.resourceType, createdAt: audit.createdAt.toISOString() })),
    recentActivity: recentActivity.map((activity) => ({ id: activity.id, type: activity.type, description: activity.description, createdAt: activity.createdAt.toISOString() })),
    metrics: { openIncidents: openIncidents.length, urgentEvents: urgentEvents.length, failedIntegrationEvents: failedEvents.length, retryableEvents: retryableEvents.length, openTasks: tasks.length, openEscalations: escalations.length, auditEvents: recentAudits.length, activityEvents: recentActivity.length },
  };
}

export type SystemHealthWorkspace = Awaited<ReturnType<typeof listSystemHealthWorkspace>>;

export async function createReliabilityEvent(session: ClinicSession, rawInput: unknown) {
  requireHealthAccess(session, "create");
  const input = reliabilityEventSchema.parse(rawInput);
  const event = await db.$transaction(async (tx) => {
    const created = await tx.reliabilityEvent.create({ data: { organizationId: session.organizationId, category: input.category, severity: input.severity, title: input.title, summary: input.summary ?? null, source: input.source, externalRef: input.externalRef ?? null } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "system_health.event_created", resourceType: "reliability_event", resourceId: created.id, metadata: { category: created.category, severity: created.severity } } });
    return created;
  });
  return event;
}

export async function transitionReliabilityEvent(session: ClinicSession, eventId: string, rawInput: unknown) {
  requireHealthAccess(session, "update");
  const input = reliabilityEventTransitionSchema.parse(rawInput);
  const existing = await db.reliabilityEvent.findFirst({ where: { id: eventId, organizationId: session.organizationId } });
  if (!existing) throw new NetworkAccessError("Reliability event not found for this organization.", 404);
  const now = new Date();
  const status = input.action === "resolve" ? "resolved" : input.action === "reopen" ? "open" : "acknowledged";
  return db.$transaction(async (tx) => {
    const updated = await tx.reliabilityEvent.update({ where: { id: existing.id }, data: { status, acknowledgedBy: input.action === "acknowledge" ? session.userId : existing.acknowledgedBy, acknowledgedAt: input.action === "acknowledge" ? now : existing.acknowledgedAt, resolvedBy: input.action === "resolve" ? session.userId : input.action === "reopen" ? null : existing.resolvedBy, resolvedAt: input.action === "resolve" ? now : input.action === "reopen" ? null : existing.resolvedAt, metadata: { ...(typeof existing.metadata === "object" && existing.metadata && !Array.isArray(existing.metadata) ? existing.metadata : {}), lastNote: input.note, lastAction: input.action, lastActorId: session.userId } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `system_health.event_${input.action}`, resourceType: "reliability_event", resourceId: existing.id, changes: { status: { from: existing.status, to: updated.status } }, metadata: { note: input.note } } });
    return updated;
  });
}

export async function retryIntegrationEvent(session: ClinicSession, eventId: string, rawInput: unknown) {
  requireHealthAccess(session, "update");
  const input = integrationRetrySchema.parse(rawInput);
  const event = await db.integrationEvent.findFirst({ where: { id: eventId, organizationId: session.organizationId } });
  if (!event) throw new NetworkAccessError("Integration event not found for this organization.", 404);
  if (!["failed", "error", "dead_letter", "queued", "retrying"].includes(event.status)) throw new NetworkAccessError("Only queued or failed integration events can be retried.", 409);
  return db.$transaction(async (tx) => {
    const updated = await tx.integrationEvent.update({ where: { id: event.id }, data: { status: "queued", retryCount: { increment: 1 }, nextRetryAt: null, errorCode: null, errorMessage: null, metadata: { ...(typeof event.metadata === "object" && event.metadata && !Array.isArray(event.metadata) ? event.metadata : {}), lastRetryNote: input.note, lastRetriedBy: session.userId } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "system_health.integration_retry_queued", resourceType: "integration_event", resourceId: event.id, metadata: { note: input.note, retryCount: updated.retryCount } } });
    return updated;
  });
}