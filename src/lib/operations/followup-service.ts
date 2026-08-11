import "server-only";

import { Prisma } from "@prisma/client";
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

const LOOKAHEAD_HOURS = 168;
const LOOKBACK_HOURS = 336;

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
  await reconcileResolvedRisks(organizationId, appointments.map((appointment) => appointment.id), risks);

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
    if (!patientName) continue;

    for (const action of prepareActions(risk, patientName, clinicName)) {
      const state = initialActionState(action, canDeliver);
      if (!state) continue;
      const applied = await upsertAction({ organizationId, risk, action, state });
      if (applied === "executed") result.actionsExecuted += 1;
      else if (applied === "awaiting_confirmation" || applied === "prepared") result.actionsAwaitingYou += 1;
      else if (applied === "awaiting_connection") result.actionsBlocked += 1;
    }
  }

  return result;
}

async function reconcileResolvedRisks(organizationId: string, appointmentIds: string[], currentRisks: DetectedRisk[]) {
  if (appointmentIds.length === 0) return;
  const activeKeys = new Set(currentRisks.map((risk) => `${risk.appointmentId}:${risk.kind}`));
  const stale = await db.operationalAction.findMany({
    where: { organizationId, appointmentId: { in: appointmentIds }, decidedAt: null },
    select: { id: true, appointmentId: true, riskKind: true, taskId: true },
  });

  for (const action of stale) {
    if (activeKeys.has(`${action.appointmentId}:${action.riskKind}`)) continue;
    await db.$transaction(async (tx) => {
      await tx.operationalAction.update({
        where: { id: action.id },
        data: { state: "dismissed", decidedAt: new Date() },
      });
      if (action.taskId) {
        await tx.task.updateMany({ where: { id: action.taskId, organizationId, status: "open" }, data: { status: "completed" } });
      }
    });
  }
}

async function upsertAction(input: {
  organizationId: string;
  risk: DetectedRisk;
  action: ReturnType<typeof prepareActions>[number];
  state: ActionState;
}): Promise<ActionState | null> {
  const unique = {
    appointmentId_riskKind_actionKind: {
      appointmentId: input.risk.appointmentId,
      riskKind: input.risk.kind,
      actionKind: input.action.kind,
    },
  };

  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.operationalAction.findUnique({ where: unique, select: { id: true, state: true, decidedAt: true } });
      if (existing?.decidedAt) return null;
      if (existing) {
        if (existing.state === input.state) return null;
        await tx.operationalAction.update({ where: unique, data: { state: input.state, detectedAt: new Date() } });
        return input.state;
      }

      const created = await tx.operationalAction.create({
        data: {
          organizationId: input.organizationId,
          riskKind: input.risk.kind,
          actionKind: input.action.kind,
          appointmentId: input.risk.appointmentId,
          patientId: input.risk.patientId,
          state: input.state,
          title: input.action.title,
          body: input.action.body,
        },
        select: { id: true },
      });

      if (input.state === "executed" && input.action.kind === "internal_task") {
        const task = await tx.task.create({
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
        await tx.operationalAction.update({ where: { id: created.id }, data: { taskId: task.id } });
      }

      return input.state;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return null;
    throw error;
  }
}

export async function decideAction(input: {
  organizationId: string;
  actionId: string;
  userId: string;
  decision: "confirm" | "dismiss";
}) {
  const action = await db.operationalAction.findFirst({
    where: { id: input.actionId, organizationId: input.organizationId },
    select: { id: true, state: true, actionKind: true },
  });
  if (!action) return { ok: false as const, reason: "not_found" as const };

  if (input.decision === "dismiss") {
    await db.operationalAction.update({
      where: { id: action.id },
      data: { state: "dismissed", decidedByUserId: input.userId, decidedAt: new Date() },
    });
    return { ok: true as const, state: "dismissed" as const };
  }

  if (action.actionKind === "patient_message") {
    const nextState: ActionState = communicationsConnected() ? "prepared" : "awaiting_connection";
    await db.operationalAction.update({
      where: { id: action.id },
      data: { state: nextState, decidedByUserId: input.userId, decidedAt: new Date() },
    });
    return { ok: true as const, state: nextState };
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
