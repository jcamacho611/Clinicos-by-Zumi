import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { connectorReadiness, connectorsByGateway } from "@/lib/connectors/catalog";
import {
  deliverOutbound,
  outboundChannelStatus,
  type OutboundChannel,
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

/**
 * The channel a patient message goes out on.
 *
 * Email, because it is the one channel with a sending implementation. SMS is the more
 * natural fit and appears in the connector catalog, but no Klinikos code sends one, so
 * routing patient messages there would guarantee they never arrive.
 */
const PATIENT_MESSAGE_CHANNEL: OutboundChannel = "email";

/**
 * Whether Klinikos could actually deliver a patient message right now.
 *
 * Asked of the outbound port, not of the connector catalog. Catalog readiness answers
 * "are credentials present", which is a different and weaker question than "is there
 * code that sends" — treating the two as the same is what let an approved message be
 * recorded as done while the patient received nothing.
 */
export function communicationsConnected(env: OutboundEnv = process.env) {
  return outboundChannelStatus(PATIENT_MESSAGE_CHANNEL, env).deliverable;
}

/**
 * Whether any communications connector is configured at all.
 *
 * Kept separate from deliverability so the owner can be told which of the two is
 * missing: a clinic with no provider needs to connect one, while a clinic with a
 * provider Klinikos cannot yet send through needs to hear that instead.
 */
export function communicationsConfigured() {
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
  await reconcileResolvedRisks(organizationId, risks);
  // Held messages go out here, not only when a new risk appears — a clinic that just
  // connected a provider has approved work waiting and no new risk to trigger it.
  await retryApprovedDeliveries(organizationId);

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

/**
 * Close out work whose reason has gone away.
 *
 * Detection alone is only half a loop. When an appointment is confirmed, its paperwork
 * arrives, or its coverage is checked, the action Klinikos raised is no longer work —
 * and an owner who keeps seeing it learns to ignore the queue.
 *
 * Deliberately driven from the **actions**, not from the appointments in this sweep's
 * window. An appointment that has aged past the lookback is not in the query at all,
 * so a window-driven reconciliation could never close its actions and a stale no-show
 * recovery would inflate the at-risk count forever.
 *
 * Two things are never touched: an action a person already decided (their judgement is
 * not automation's to revoke) and the audit history (rows are resolved, never deleted).
 */
async function reconcileResolvedRisks(organizationId: string, currentRisks: DetectedRisk[]) {
  const activeKeys = new Set(currentRisks.map((risk) => `${risk.appointmentId}:${risk.kind}`));

  const open = await db.operationalAction.findMany({
    where: { organizationId, decidedAt: null },
    select: { id: true, appointmentId: true, riskKind: true, taskId: true },
    take: 1_000,
  });
  if (open.length === 0) return;

  const stale = open.filter((action) => !activeKeys.has(`${action.appointmentId}:${action.riskKind}`));
  if (stale.length === 0) return;

  for (const action of stale) {
    await db.$transaction(async (tx) => {
      // Guarded on `decidedAt: null` inside the transaction as well: a person may have
      // confirmed this between the read above and now, and their decision wins.
      const closed = await tx.operationalAction.updateMany({
        where: { id: action.id, decidedAt: null },
        data: { state: "resolved_by_source", decidedAt: new Date() },
      });
      if (closed.count === 0) return;
      if (action.taskId) {
        await tx.task.updateMany({
          where: { id: action.taskId, organizationId, status: "open" },
          data: { status: "completed" },
        });
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

/**
 * States a patient message may still be sent from.
 *
 * `sending` is absent on purpose: an in-flight attempt must not be claimed twice.
 */
const SENDABLE_STATES = ["prepared", "awaiting_confirmation", "awaiting_connection", "awaiting_delivery", "failed"] as const;

export async function decideAction(input: {
  organizationId: string;
  actionId: string;
  userId: string;
  decision: "confirm" | "dismiss";
}) {
  const action = await db.operationalAction.findFirst({
    where: { id: input.actionId, organizationId: input.organizationId },
    select: { id: true, state: true, actionKind: true, title: true, body: true, patientId: true, deliveredAt: true },
  });
  if (!action) return { ok: false as const, reason: "not_found" as const };

  const now = new Date();

  if (input.decision === "dismiss") {
    await db.operationalAction.update({
      where: { id: action.id },
      data: { state: "dismissed", decidedByUserId: input.userId, decidedAt: now },
    });
    return { ok: true as const, state: "dismissed" as const };
  }

  // Internal work is performed by Klinikos itself, so confirming it is the operation.
  if (action.actionKind !== "patient_message") {
    await db.operationalAction.update({
      where: { id: action.id },
      data: { state: "executed", approvedByUserId: input.userId, approvedAt: now, decidedByUserId: input.userId, decidedAt: now },
    });
    return { ok: true as const, state: "executed" as const };
  }

  // Already sent. A retried confirmation — a lost response, a double click — must not
  // put a second copy of the same message in front of a patient.
  if (action.deliveredAt) return { ok: true as const, state: "executed" as const, alreadySent: true };

  return sendApprovedMessage({ ...input, action, approvedAt: now });
}

/**
 * Claim an approved message and attempt to deliver it.
 *
 * The claim is a conditional `updateMany`: it succeeds only for a row still in a
 * sendable state, so two concurrent confirmations produce one send and the loser reads
 * the stored result. Nothing external happens before the claim wins.
 */
async function sendApprovedMessage(input: {
  organizationId: string;
  userId: string;
  approvedAt: Date;
  action: { id: string; title: string; body: string; patientId: string };
}) {
  const claim = await db.operationalAction.updateMany({
    where: {
      id: input.action.id,
      organizationId: input.organizationId,
      deliveredAt: null,
      state: { in: [...SENDABLE_STATES] },
    },
    data: { state: "sending", approvedByUserId: input.userId, approvedAt: input.approvedAt },
  });

  if (claim.count === 0) {
    const current = await db.operationalAction.findUnique({ where: { id: input.action.id }, select: { state: true } });
    return { ok: true as const, state: (current?.state ?? "sending") as ActionState, alreadyClaimed: true };
  }

  const recipient = await patientRecipient(input.organizationId, input.action.patientId);
  if (!recipient) {
    // A missing address is not a transient failure. Retrying cannot fix it, so this is
    // terminal and a person has to supply the address.
    await db.operationalAction.update({
      where: { id: input.action.id },
      data: {
        state: "failed",
        decidedByUserId: input.userId,
        decidedAt: new Date(),
        deliveryFailure: "No contact address is on file for this patient.",
      },
    });
    return { ok: true as const, state: "failed" as const, detail: "No contact address is on file for this patient." };
  }

  const outcome = await deliverOutbound({
    channel: PATIENT_MESSAGE_CHANNEL,
    to: recipient,
    subject: input.action.title,
    body: input.action.body,
  });

  if (outcome.ok) {
    await db.operationalAction.update({
      where: { id: input.action.id },
      data: {
        state: "executed",
        decidedByUserId: input.userId,
        decidedAt: new Date(),
        deliveryProvider: outcome.provider,
        deliveryReference: outcome.providerReference,
        deliveredAt: new Date(),
        deliveryFailure: null,
      },
    });
    return { ok: true as const, state: "executed" as const };
  }

  // The approval survives; the completion does not. `decidedAt` stays null so the retry
  // sweep picks this up when the provider recovers — which is what the owner was
  // promised when they were told it would send as soon as a channel connected.
  const state = deliveryFailureState(outcome.reason);
  const terminal = outcome.reason === "invalid_recipient";
  await db.operationalAction.update({
    where: { id: input.action.id },
    data: {
      state,
      decidedByUserId: terminal ? input.userId : null,
      decidedAt: terminal ? new Date() : null,
      deliveryFailure: outcome.detail,
      deliveryProvider: null,
      deliveryReference: null,
      deliveredAt: null,
    },
  });
  return { ok: true as const, state, detail: outcome.detail };
}

/**
 * Re-attempt messages a person already approved that have not yet been delivered.
 *
 * Run as part of the sweep, so a clinic that connects a provider sees its held messages
 * go out on the next dashboard load without anyone re-approving anything. Bounded, and
 * it only ever touches rows carrying an approval — automation never sends a message no
 * person said yes to.
 */
async function retryApprovedDeliveries(organizationId: string) {
  const pending = await db.operationalAction.findMany({
    where: {
      organizationId,
      actionKind: "patient_message",
      approvedAt: { not: null },
      deliveredAt: null,
      decidedAt: null,
      state: { in: ["awaiting_connection", "awaiting_delivery", "failed"] },
    },
    select: { id: true, title: true, body: true, patientId: true, approvedByUserId: true },
    take: 100,
  });
  if (pending.length === 0) return 0;

  // Ask once rather than per message: if nothing can deliver, none of them can.
  if (!communicationsConnected()) return 0;

  let sent = 0;
  for (const action of pending) {
    const result = await sendApprovedMessage({
      organizationId,
      userId: action.approvedByUserId ?? "",
      approvedAt: new Date(),
      action,
    });
    if (result.state === "executed") sent += 1;
  }
  return sent;
}

/**
 * Which honest state a failed delivery lands in.
 *
 * `failed` is reserved for an attempt that actually reached a provider, because that is
 * the only one worth retrying against the same provider. The other two are
 * configuration facts, and telling an owner to "retry" them would be advice they cannot
 * act on.
 */
function deliveryFailureState(reason: "no_connector" | "no_sender" | "provider_error" | "invalid_recipient"): ActionState {
  if (reason === "no_connector") return "awaiting_connection";
  if (reason === "no_sender") return "awaiting_delivery";
  return "failed";
}

/** The address a patient message would go to, scoped to the tenant that owns them. */
async function patientRecipient(organizationId: string, patientId: string) {
  const patient = await db.patient.findFirst({
    where: { id: patientId, organizationId },
    select: { email: true },
  });
  return patient?.email?.trim() || null;
}

export async function listActions(organizationId: string, limit = 60) {
  return db.operationalAction.findMany({
    where: { organizationId },
    orderBy: [{ decidedAt: "asc" }, { detectedAt: "desc" }],
    take: limit,
    select: {
      id: true, riskKind: true, actionKind: true, state: true, title: true, body: true,
      appointmentId: true, patientId: true, detectedAt: true, decidedAt: true, approvedAt: true, taskId: true,
    },
  });
}
