import "server-only";

import { db } from "@/lib/db";
import { connectorReadiness, connectorsByGateway } from "@/lib/connectors/catalog";
import {
  detectRisksAcross,
  initialActionState,
  prepareActions,
  type ActionState,
  type AppointmentSnapshot,
  type DetectedRisk,
} from "@/lib/operations/followup-rules";

/**
 * The follow-up loop.
 *
 * Detects appointments heading for trouble, prepares the work each one calls for,
 * performs what is safe to perform, and records the rest for a person. Every write is
 * scoped to one organization.
 *
 * Re-running is safe. Actions are keyed on (appointment, risk, action kind), so a
 * sweep that runs twice updates rather than duplicating, and an action a person has
 * already decided on is never resurrected.
 */

/** How far ahead to sweep. Wider than any individual risk window. */
const LOOKAHEAD_HOURS = 168;
const LOOKBACK_HOURS = 336;

/**
 * Whether this clinic can actually deliver a message.
 *
 * Read from the connector readiness gates rather than from a feature flag, so
 * "connected" means the same thing here as everywhere else in Klinikos.
 */
export function communicationsConnected() {
  return connectorsByGateway("communication").some((connector) => connectorReadiness(connector).productionUsable);
}

export type SweepResult = {
  risksDetected: number;
  actionsExecuted: number;
  actionsAwaitingYou: number;
  actionsBlocked: number;
};

export async function runFollowUpSweep(organizationId: string, now = new Date()): Promise<SweepResult> {
  const from = new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000);
  const to = new Date(now.getTime() + LOOKAHEAD_HOURS * 60 * 60 * 1000);

  const appointments = await db.appointment.findMany({
    where: { organizationId, startsAt: { gte: from, lte: to } },
    select: { id: true, patientId: true, startsAt: true, status: true, formsComplete: true, insuranceVerified: true },
    take: 500,
  });

  const snapshots: AppointmentSnapshot[] = appointments.map((appointment) => ({
    ...appointment,
    status: String(appointment.status),
  }));

  const risks = detectRisksAcross(snapshots, now);
  if (risks.length === 0) return { risksDetected: 0, actionsExecuted: 0, actionsAwaitingYou: 0, actionsBlocked: 0 };

  const [organization, patients] = await Promise.all([
    db.organization.findUnique({ where: { id: organizationId }, select: { name: true } }),
    db.patient.findMany({
      where: { organizationId, id: { in: [...new Set(risks.map((risk) => risk.patientId))] } },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  const patientNames = new Map(patients.map((patient) => [patient.id, `${patient.firstName} ${patient.lastName}`.trim()]));
  const clinicName = organization?.name ?? "your clinic";
  const canDeliver = communicationsConnected();

  const result: SweepResult = { risksDetected: risks.length, actionsExecuted: 0, actionsAwaitingYou: 0, actionsBlocked: 0 };

  for (const risk of risks) {
    const patientName = patientNames.get(risk.patientId);
    // A risk whose patient we cannot name is a data problem, not a follow-up. Naming
    // them "the patient" in a message that might reach them is worse than skipping.
    if (!patientName) continue;

    for (const action of prepareActions(risk, patientName, clinicName)) {
      const state = initialActionState(action, canDeliver);
      // A policy that blocks this action kind outright. Nothing records it, so the
      // owner is not shown work Klinikos has been told not to do.
      if (!state) continue;
      const applied = await upsertAction({ organizationId, risk, action, state });
      if (applied === "executed") result.actionsExecuted += 1;
      else if (applied === "awaiting_confirmation" || applied === "prepared") result.actionsAwaitingYou += 1;
      else if (applied === "awaiting_connection") result.actionsBlocked += 1;
    }
  }

  return result;
}

async function upsertAction(input: {
  organizationId: string;
  risk: DetectedRisk;
  action: ReturnType<typeof prepareActions>[number];
  state: ActionState;
}): Promise<ActionState | null> {
  const key = {
    appointmentId_riskKind_actionKind: {
      appointmentId: input.risk.appointmentId,
      riskKind: input.risk.kind,
      actionKind: input.action.kind,
    },
  };

  const existing = await db.operationalAction.findUnique({ where: key, select: { id: true, state: true, decidedAt: true } });

  // A person has already ruled on this. Re-detecting the same risk must not undo
  // their decision or put the item back in their queue.
  if (existing?.decidedAt) return null;

  if (existing) {
    if (existing.state === input.state) return null;
    await db.operationalAction.update({ where: key, data: { state: input.state, detectedAt: new Date() } });
    return input.state;
  }

  // Internal tasks are created for real when the action executes. This is the whole
  // difference between "Klinikos handled it" and "Klinikos wrote about handling it".
  let taskId: string | null = null;
  if (input.state === "executed" && input.action.kind === "internal_task") {
    const task = await db.task.create({
      data: {
        organizationId: input.organizationId,
        patientId: input.risk.patientId,
        category: "appointment_follow_up",
        title: input.action.title,
        details: input.action.body,
        priority: input.risk.urgency >= 85 ? "high" : "normal",
        dueAt: input.risk.startsAt,
        status: "open",
        createdBy: "zumi",
      },
      select: { id: true },
    });
    taskId = task.id;
  }

  await db.operationalAction.create({
    data: {
      organizationId: input.organizationId,
      riskKind: input.risk.kind,
      actionKind: input.action.kind,
      appointmentId: input.risk.appointmentId,
      patientId: input.risk.patientId,
      state: input.state,
      title: input.action.title,
      body: input.action.body,
      taskId,
    },
  });

  return input.state;
}

/**
 * Record a person's decision on a prepared action.
 *
 * `decidedByUserId` comes from the session. There is no path by which automation
 * fills it in, which is what makes "a human confirmed this" a fact rather than a
 * claim.
 */
export async function decideAction(input: {
  organizationId: string;
  actionId: string;
  userId: string;
  decision: "confirm" | "dismiss";
}) {
  const action = await db.operationalAction.findFirst({
    where: { id: input.actionId, organizationId: input.organizationId },
    select: { id: true, state: true, actionKind: true, title: true, body: true, patientId: true },
  });
  if (!action) return { ok: false as const, reason: "not_found" as const };

  if (input.decision === "dismiss") {
    await db.operationalAction.update({
      where: { id: action.id },
      data: { state: "dismissed", decidedByUserId: input.userId, decidedAt: new Date() },
    });
    return { ok: true as const, state: "dismissed" as const };
  }

  // Confirming a message does not send it. Delivery needs a connected channel, and
  // saying "Sent" without one would be the exact lie this loop exists to avoid.
  if (action.actionKind === "patient_message" && !communicationsConnected()) {
    await db.operationalAction.update({
      where: { id: action.id },
      data: { state: "awaiting_connection", decidedByUserId: input.userId, decidedAt: new Date() },
    });
    return { ok: true as const, state: "awaiting_connection" as const };
  }

  await db.operationalAction.update({
    where: { id: action.id },
    data: { state: "executed", decidedByUserId: input.userId, decidedAt: new Date() },
  });
  return { ok: true as const, state: "executed" as const };
}

export async function listActions(organizationId: string, limit = 60) {
  return db.operationalAction.findMany({
    where: { organizationId },
    orderBy: [{ decidedAt: "asc" }, { detectedAt: "desc" }],
    take: limit,
    select: {
      id: true, riskKind: true, actionKind: true, state: true, title: true, body: true,
      appointmentId: true, patientId: true, detectedAt: true, decidedAt: true, taskId: true,
    },
  });
}
