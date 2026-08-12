import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { connectorReadiness, getConnector } from "@/lib/connectors/catalog";
import {
  deliverOutbound,
  outboundChannelStatus,
  type OutboundEnv,
} from "@/lib/communications/outbound";
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
const PATIENT_MESSAGE_CHANNEL = "email" as const;

export type SweepResult = {
  risksDetected: number;
  actionsExecuted: number;
  actionsAwaitingYou: number;
  actionsBlocked: number;
};

type OperationalActionRow = {
  id: string;
  organizationId: string;
  riskKind: string;
  actionKind: string;
  appointmentId: string;
  patientId: string;
  state: ActionState;
  title: string;
  body: string;
  taskId: string | null;
  approvedByUserId: string | null;
  approvedAt: Date | null;
  decidedByUserId: string | null;
  decidedAt: Date | null;
  deliveryProvider: string | null;
  deliveryReference: string | null;
  deliveredAt: Date | null;
};

export function patientMessageDeliverability(env: OutboundEnv = process.env) {
  const channel = outboundChannelStatus(PATIENT_MESSAGE_CHANNEL, env);
  if (!channel.deliverable) return { deliverable: false as const, reason: channel.reason, detail: channel.detail };

  const connector = getConnector(channel.connectorId);
  const readiness = connector ? connectorReadiness(connector) : null;
  if (!connector || !connector.handlesPhi || !readiness?.phiUsable) {
    return {
      deliverable: false as const,
      reason: "phi_not_approved" as const,
      detail: `${connector?.name ?? channel.provider} is not currently approved to carry protected health information for Klinikos patient messaging.`,
    };
  }

  return { deliverable: true as const, provider: channel.provider, connectorId: channel.connectorId };
}

export function communicationsConnected(env: OutboundEnv = process.env) {
  return patientMessageDeliverability(env).deliverable;
}

export async function runFollowUpSweep(organizationId: string, now = new Date()): Promise<SweepResult> {
  const from = new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000);
  const to = new Date(now.getTime() + LOOKAHEAD_HOURS * 60 * 60 * 1000);

  const appointments = await db.appointment.findMany({
    where: { organizationId, startsAt: { gte: from, lte: to } },
    select: {
      id: true,
      patientId: true,
      startsAt: true,
      status: true,
      formsComplete: true,
      insuranceVerified: true,
    },
    take: 500,
  });

  const snapshots: AppointmentSnapshot[] = appointments.map((appointment) => ({
    ...appointment,
    status: String(appointment.status),
  }));
  const risks = detectRisksAcross(snapshots, now);

  await reconcileResolvedRisks(organizationId, risks);
  await retryApprovedDeliveries(organizationId);

  if (risks.length === 0) {
    return { risksDetected: 0, actionsExecuted: 0, actionsAwaitingYou: 0, actionsBlocked: 0 };
  }

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
      else if (applied === "awaiting_connection" || applied === "awaiting_delivery") result.actionsBlocked += 1;
    }
  }

  return result;
}

async function listOpenActions(organizationId: string) {
  return db.$queryRaw<OperationalActionRow[]>(Prisma.sql`
    SELECT "id", "organizationId", "riskKind", "actionKind", "appointmentId", "patientId", "state",
           "title", "body", "taskId", "approvedByUserId", "approvedAt", "decidedByUserId", "decidedAt",
           "deliveryProvider", "deliveryReference", "deliveredAt"
      FROM "operational_actions"
     WHERE "organizationId" = ${organizationId} AND "decidedAt" IS NULL
     ORDER BY "detectedAt" DESC
     LIMIT 1000
  `);
}

async function reconcileResolvedRisks(organizationId: string, currentRisks: DetectedRisk[]) {
  const activeKeys = new Set(currentRisks.map((risk) => `${risk.appointmentId}:${risk.kind}`));
  const open = await listOpenActions(organizationId);
  const stale = open.filter((action) => !activeKeys.has(`${action.appointmentId}:${action.riskKind}`));

  for (const action of stale) {
    await db.$transaction(async (tx) => {
      const changed = await tx.$executeRaw(Prisma.sql`
        UPDATE "operational_actions"
           SET "state" = 'resolved_by_source', "decidedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ${action.id} AND "organizationId" = ${organizationId} AND "decidedAt" IS NULL
      `);
      if (!changed || !action.taskId) return;
      await tx.task.updateMany({
        where: { id: action.taskId, organizationId, status: "open" },
        data: { status: "completed", completedAt: new Date() },
      });
    });
  }
}

async function upsertAction(input: {
  organizationId: string;
  risk: DetectedRisk;
  action: ReturnType<typeof prepareActions>[number];
  state: ActionState;
}): Promise<ActionState | null> {
  return db.$transaction(async (tx) => {
    const existing = await tx.$queryRaw<OperationalActionRow[]>(Prisma.sql`
      SELECT "id", "organizationId", "riskKind", "actionKind", "appointmentId", "patientId", "state",
             "title", "body", "taskId", "approvedByUserId", "approvedAt", "decidedByUserId", "decidedAt",
             "deliveryProvider", "deliveryReference", "deliveredAt"
        FROM "operational_actions"
       WHERE "appointmentId" = ${input.risk.appointmentId}
         AND "riskKind" = ${input.risk.kind}
         AND "actionKind" = ${input.action.kind}
       LIMIT 1
       FOR UPDATE
    `);
    const row = existing[0];
    if (row?.decidedAt) return null;
    if (row) {
      if (row.state === input.state) return null;
      await tx.$executeRaw(Prisma.sql`
        UPDATE "operational_actions"
           SET "state" = ${input.state}, "detectedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ${row.id}
      `);
      return input.state;
    }

    const id = randomUUID();
    const inserted = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      INSERT INTO "operational_actions" (
        "id", "organizationId", "riskKind", "actionKind", "appointmentId", "patientId", "state", "title", "body", "updatedAt"
      ) VALUES (
        ${id}, ${input.organizationId}, ${input.risk.kind}, ${input.action.kind}, ${input.risk.appointmentId},
        ${input.risk.patientId}, ${input.state}, ${input.action.title}, ${input.action.body}, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("appointmentId", "riskKind", "actionKind") DO NOTHING
      RETURNING "id"
    `);
    if (!inserted[0]) return null;

    if (input.state === "executed" && input.action.kind === "internal_task") {
      const task = await tx.task.create({
        data: {
          organizationId: input.organizationId,
          patientId: input.risk.patientId,
          category: "appointment_follow_up",
          title: input.action.title,
          details: input.action.body,
          priority: input.risk.urgency >= 85 ? "high" : "normal",
          riskLevel: input.risk.urgency >= 90 ? "NEEDS_STAFF" : "NORMAL",
          dueAt: input.risk.startsAt,
          status: "open",
          createdBy: "zumi",
        },
        select: { id: true },
      });
      await tx.$executeRaw(Prisma.sql`
        UPDATE "operational_actions" SET "taskId" = ${task.id}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${id}
      `);
    }

    // The loop creates staff work and prepares patient-facing messages without anyone
    // asking it to. Article 8 requires a sensitive action to be attributable, and until
    // this existed the entire automation left no trace: a clinic could find a task
    // addressed to a patient with no record of what produced it or on what basis.
    //
    // Written inside the same transaction as the action, so an action cannot exist
    // without the record explaining it. `actorType: "system"` marks it as machine-
    // originated, which keeps it distinguishable from a decision a person made — the
    // distinction the constitution insists on.
    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: null,
        actorType: "system",
        action: `operations.action_${input.state}`,
        resourceType: "operational_action",
        resourceId: id,
        patientId: input.risk.patientId,
        metadata: {
          riskKind: input.risk.kind,
          actionKind: input.action.kind,
          appointmentId: input.risk.appointmentId,
          state: input.state,
          urgency: input.risk.urgency,
          humanDecision: false,
          // Why this state and not another: with no approved rail a patient message is
          // held rather than sent, and recording that here is what lets a reviewer see
          // the difference between "we chose not to" and "we could not".
          deliverable: input.action.kind === "patient_message" ? communicationsConnected() : null,
        },
      },
    });

    return input.state;
  });
}

export async function decideAction(input: {
  organizationId: string;
  actionId: string;
  userId: string;
  decision: "confirm" | "dismiss";
}) {
  const rows = await db.$queryRaw<OperationalActionRow[]>(Prisma.sql`
    SELECT "id", "organizationId", "riskKind", "actionKind", "appointmentId", "patientId", "state",
           "title", "body", "taskId", "approvedByUserId", "approvedAt", "decidedByUserId", "decidedAt",
           "deliveryProvider", "deliveryReference", "deliveredAt"
      FROM "operational_actions"
     WHERE "id" = ${input.actionId} AND "organizationId" = ${input.organizationId}
     LIMIT 1
  `);
  const action = rows[0];
  if (!action) return { ok: false as const, reason: "not_found" as const };

  if (input.decision === "dismiss") {
    await db.$executeRaw(Prisma.sql`
      UPDATE "operational_actions"
         SET "state" = 'dismissed', "decidedByUserId" = ${input.userId}, "decidedAt" = CURRENT_TIMESTAMP,
             "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = ${action.id} AND "organizationId" = ${input.organizationId}
    `);
    return { ok: true as const, state: "dismissed" as const };
  }

  if (action.actionKind !== "patient_message") {
    await db.$executeRaw(Prisma.sql`
      UPDATE "operational_actions"
         SET "state" = 'executed', "approvedByUserId" = ${input.userId}, "approvedAt" = CURRENT_TIMESTAMP,
             "decidedByUserId" = ${input.userId}, "decidedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = ${action.id} AND "organizationId" = ${input.organizationId}
    `);
    return { ok: true as const, state: "executed" as const };
  }

  if (action.deliveredAt) return { ok: true as const, state: "executed" as const, alreadySent: true };

  const deliverability = patientMessageDeliverability();
  if (!deliverability.deliverable) {
    await db.$executeRaw(Prisma.sql`
      UPDATE "operational_actions"
         SET "state" = 'awaiting_connection', "approvedByUserId" = COALESCE("approvedByUserId", ${input.userId}),
             "approvedAt" = COALESCE("approvedAt", CURRENT_TIMESTAMP), "deliveryFailure" = ${deliverability.detail},
             "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = ${action.id} AND "organizationId" = ${input.organizationId} AND "deliveredAt" IS NULL
    `);
    return { ok: true as const, state: "awaiting_connection" as const, detail: deliverability.detail };
  }

  return sendApprovedMessage({ organizationId: input.organizationId, userId: input.userId, action });
}

const SENDABLE_STATES: ActionState[] = ["prepared", "awaiting_confirmation", "awaiting_connection", "awaiting_delivery", "failed"];

async function sendApprovedMessage(input: { organizationId: string; userId: string; action: OperationalActionRow }) {
  const claimed = await db.$executeRaw(Prisma.sql`
    UPDATE "operational_actions"
       SET "state" = 'sending', "approvedByUserId" = COALESCE("approvedByUserId", ${input.userId}),
           "approvedAt" = COALESCE("approvedAt", CURRENT_TIMESTAMP), "updatedAt" = CURRENT_TIMESTAMP
     WHERE "id" = ${input.action.id}
       AND "organizationId" = ${input.organizationId}
       AND "deliveredAt" IS NULL
       AND "state" IN ('prepared', 'awaiting_confirmation', 'awaiting_connection', 'awaiting_delivery', 'failed')
  `);
  if (!claimed) {
    const current = await db.$queryRaw<Array<{ state: ActionState }>>(Prisma.sql`
      SELECT "state" FROM "operational_actions" WHERE "id" = ${input.action.id} AND "organizationId" = ${input.organizationId}
    `);
    return { ok: true as const, state: current[0]?.state ?? "sending" as ActionState, alreadyClaimed: true };
  }

  const patient = await db.patient.findFirst({
    where: { id: input.action.patientId, organizationId: input.organizationId },
    select: { email: true },
  });
  const recipient = patient?.email?.trim();
  if (!recipient) {
    await db.$executeRaw(Prisma.sql`
      UPDATE "operational_actions"
         SET "state" = 'failed', "deliveryFailure" = 'No email address is on file for this patient.',
             "decidedByUserId" = ${input.userId}, "decidedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = ${input.action.id}
    `);
    return { ok: true as const, state: "failed" as const, detail: "No email address is on file for this patient." };
  }

  const gate = patientMessageDeliverability();
  if (!gate.deliverable) {
    await db.$executeRaw(Prisma.sql`
      UPDATE "operational_actions"
         SET "state" = 'awaiting_connection', "deliveryFailure" = ${gate.detail}, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = ${input.action.id}
    `);
    return { ok: true as const, state: "awaiting_connection" as const, detail: gate.detail };
  }

  const outcome = await deliverOutbound({
    channel: PATIENT_MESSAGE_CHANNEL,
    to: recipient,
    subject: input.action.title,
    body: input.action.body,
  });

  if (outcome.ok) {
    await db.$executeRaw(Prisma.sql`
      UPDATE "operational_actions"
         SET "state" = 'executed', "deliveryProvider" = ${outcome.provider}, "deliveryReference" = ${outcome.providerReference},
             "deliveredAt" = CURRENT_TIMESTAMP, "deliveryFailure" = NULL, "decidedByUserId" = ${input.userId},
             "decidedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = ${input.action.id} AND "organizationId" = ${input.organizationId}
    `);
    return { ok: true as const, state: "executed" as const, providerReference: outcome.providerReference };
  }

  const terminal = outcome.reason === "invalid_recipient";
  await db.$executeRaw(Prisma.sql`
    UPDATE "operational_actions"
       SET "state" = ${terminal ? "failed" : "awaiting_delivery"}, "deliveryFailure" = ${outcome.detail},
           "decidedByUserId" = ${terminal ? input.userId : null}, "decidedAt" = ${terminal ? new Date() : null},
           "updatedAt" = CURRENT_TIMESTAMP
     WHERE "id" = ${input.action.id} AND "organizationId" = ${input.organizationId}
  `);
  return { ok: true as const, state: terminal ? "failed" as const : "awaiting_delivery" as const, detail: outcome.detail };
}

async function retryApprovedDeliveries(organizationId: string) {
  const approved = await db.$queryRaw<OperationalActionRow[]>(Prisma.sql`
    SELECT "id", "organizationId", "riskKind", "actionKind", "appointmentId", "patientId", "state",
           "title", "body", "taskId", "approvedByUserId", "approvedAt", "decidedByUserId", "decidedAt",
           "deliveryProvider", "deliveryReference", "deliveredAt"
      FROM "operational_actions"
     WHERE "organizationId" = ${organizationId}
       AND "actionKind" = 'patient_message'
       AND "approvedAt" IS NOT NULL
       AND "deliveredAt" IS NULL
       AND "decidedAt" IS NULL
       AND "state" IN ('awaiting_connection', 'awaiting_delivery', 'failed', 'prepared', 'awaiting_confirmation')
     ORDER BY "approvedAt" ASC
     LIMIT 100
  `);

  if (!communicationsConnected()) return;
  for (const action of approved) {
    if (!SENDABLE_STATES.includes(action.state)) continue;
    await sendApprovedMessage({ organizationId, userId: action.approvedByUserId ?? "system", action });
  }
}

export async function listOperationalActions(organizationId: string) {
  return db.$queryRaw<OperationalActionRow[]>(Prisma.sql`
    SELECT "id", "organizationId", "riskKind", "actionKind", "appointmentId", "patientId", "state",
           "title", "body", "taskId", "approvedByUserId", "approvedAt", "decidedByUserId", "decidedAt",
           "deliveryProvider", "deliveryReference", "deliveredAt"
      FROM "operational_actions"
     WHERE "organizationId" = ${organizationId}
     ORDER BY "detectedAt" DESC
     LIMIT 500
  `);
}
