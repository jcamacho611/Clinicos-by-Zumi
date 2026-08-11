import "server-only";

import { db } from "@/lib/db";
import { listActions, communicationsConnected } from "@/lib/operations/followup-service";
import { riskExplanations, riskLabels, streamForState, type ActionState, type ActionStream, type RiskKind } from "@/lib/operations/followup-rules";
import { zumiGatewayStatus } from "@/features/zumi/providers";

/**
 * The owner command centre.
 *
 * Answers the six questions an owner actually opens software to ask: what happened,
 * what matters, what Klinikos already handled, what is blocked, what needs them, and
 * what should happen next.
 *
 * **Every number here is counted from this organization's own records.** Nothing is
 * hard-coded, and nothing is estimated. When a clinic has no data the brief says so
 * rather than showing a plausible-looking figure — an owner who catches one invented
 * number stops believing all of them.
 */

export type CommandBriefLine = { text: string; emphasis?: boolean };

export type CommandCenterData = {
  clinicName: string;
  /** Natural-language brief, assembled from counted facts. */
  brief: CommandBriefLine[];
  counts: {
    appointmentsToday: number;
    appointmentsAtRisk: number;
    openTasks: number;
    overdueTasks: number;
    patients: number;
    handled: number;
    awaitingYou: number;
    blocked: number;
  };
  streams: Record<ActionStream, ActionItem[]>;
  /** Whether this organization is still flagged as demonstration data. */
  demoMode: boolean;
  zumi: { available: boolean; detail: string };
  communicationsConnected: boolean;
  hasAnyData: boolean;
};

export type ActionItem = {
  id: string;
  title: string;
  body: string;
  riskKind: RiskKind;
  riskLabel: string;
  riskExplanation: string;
  actionKind: string;
  state: ActionState;
  detectedAt: Date;
  /** Whether this item offers the owner a decision. */
  decidable: boolean;
};

export async function loadCommandCenter(organizationId: string, now = new Date()): Promise<CommandCenterData> {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const [organization, appointmentsToday, openTasks, overdueTasks, patientCount, actions] = await Promise.all([
    db.organization.findUnique({ where: { id: organizationId }, select: { name: true, demoMode: true } }),
    db.appointment.count({ where: { organizationId, startsAt: { gte: startOfDay, lt: endOfDay } } }),
    db.task.count({ where: { organizationId, status: "open" } }),
    db.task.count({ where: { organizationId, status: "open", dueAt: { lt: now } } }),
    db.patient.count({ where: { organizationId } }),
    listActions(organizationId),
  ]);

  const streams: Record<ActionStream, ActionItem[]> = { handled: [], awaiting_you: [], blocked: [], completed: [] };

  for (const action of actions) {
    const state = action.state as ActionState;
    const item: ActionItem = {
      id: action.id,
      title: action.title,
      body: action.body,
      riskKind: action.riskKind as RiskKind,
      riskLabel: riskLabels[action.riskKind as RiskKind] ?? action.riskKind,
      riskExplanation: riskExplanations[action.riskKind as RiskKind] ?? "",
      actionKind: action.actionKind,
      state,
      detectedAt: action.detectedAt,
      // An action the owner has already approved is not decidable again, even though it
      // is not finished — Klinikos owes them a send, not another decision.
      decidable: !action.decidedAt && !action.approvedAt && (state === "awaiting_confirmation" || state === "prepared" || state === "awaiting_connection"),
    };
    streams[streamForState(state)].push(item);
  }

  const atRisk = new Set(actions.filter((action) => !action.decidedAt).map((action) => action.appointmentId)).size;

  const counts = {
    appointmentsToday,
    appointmentsAtRisk: atRisk,
    openTasks,
    overdueTasks,
    patients: patientCount,
    handled: streams.handled.length,
    awaitingYou: streams.awaiting_you.length,
    blocked: streams.blocked.length,
  };

  const zumi = zumiGatewayStatus();
  const hasAnyData = patientCount > 0 || appointmentsToday > 0 || openTasks > 0;

  return {
    clinicName: organization?.name ?? "Your clinic",
    brief: buildBrief(counts, hasAnyData),
    counts,
    streams,
    demoMode: organization?.demoMode ?? false,
    zumi: { available: zumi.available, detail: zumi.detail },
    communicationsConnected: communicationsConnected(),
    hasAnyData,
  };
}

/**
 * The brief.
 *
 * Assembled from counted facts rather than generated, which is deliberate: this is the
 * first thing an owner reads every morning, it must be correct before it is eloquent,
 * and it must work with no model provider connected.
 *
 * When Zumi's provider is connected, this becomes the grounded context Zumi is handed
 * rather than something Zumi replaces — the numbers stay counted either way.
 */
function buildBrief(counts: CommandCenterData["counts"], hasAnyData: boolean): CommandBriefLine[] {
  if (!hasAnyData) {
    return [
      { text: "Your clinic is set up and Klinikos is watching, but there is nothing in it yet.", emphasis: true },
      { text: "Add a patient and book an appointment. From there Klinikos starts noticing what needs attention on its own." },
    ];
  }

  const lines: CommandBriefLine[] = [];

  const needsAttention = counts.awaitingYou + counts.blocked;
  lines.push({
    text: needsAttention === 0
      ? "Nothing is waiting on you right now."
      : `${needsAttention} ${needsAttention === 1 ? "item needs" : "items need"} attention.`,
    emphasis: true,
  });

  if (counts.appointmentsToday > 0) {
    lines.push({ text: `${counts.appointmentsToday} ${counts.appointmentsToday === 1 ? "appointment" : "appointments"} today.` });
  }
  if (counts.appointmentsAtRisk > 0) {
    lines.push({ text: `${counts.appointmentsAtRisk} upcoming ${counts.appointmentsAtRisk === 1 ? "appointment is" : "appointments are"} at risk — unconfirmed, missing paperwork, or unverified coverage.` });
  }
  if (counts.overdueTasks > 0) {
    lines.push({ text: `${counts.overdueTasks} ${counts.overdueTasks === 1 ? "task is" : "tasks are"} past due.` });
  }
  if (counts.handled > 0) {
    lines.push({ text: `Klinikos handled ${counts.handled} ${counts.handled === 1 ? "item" : "items"} without you.` });
  }
  if (counts.blocked > 0) {
    lines.push({ text: `${counts.blocked} ${counts.blocked === 1 ? "message is" : "messages are"} written and waiting on a messaging connection.` });
  }

  return lines;
}
