import "server-only";
import { db } from "@/lib/db";
import { can } from "@/lib/auth/rbac";
import type { ClinicRole } from "@/lib/auth/rbac";

/**
 * What is actually waiting on you, what is waiting on somebody else, and what just got
 * done.
 *
 * The directive is explicit that this must not become another inbox, and the difference
 * is ownership. An inbox shows everything that happened; this shows only work that has
 * not reached its owner's hands yet, split by whose hands those are. "Waiting on others"
 * exists so a person can stop carrying work that is not theirs — which is the whole
 * value of the surface and the reason it is worth more than a notification bell.
 *
 * Two rules it must not break.
 *
 * No item ever names a patient. Escalations carry `patientId`, and an action centre is a
 * glanceable summary that ends up on shared screens and in screenshots, so items are
 * described by category, risk and team. What is never read cannot leak, so the patient
 * relation is not selected at all.
 *
 * Counts are counted, not paged. The list shows what a person can read at a glance; the
 * count is the real total from the database, and the surface says "showing 6 of 40" when
 * those differ. A bucket a role cannot see is absent rather than zero.
 * Reporting "0 escalations" to somebody with no escalation permission tells them the
 * clinic is calm when they simply are not allowed to know.
 */

export type ActionUrgency = "overdue" | "due_soon" | "open";

export interface ActionItem {
  readonly id: string;
  /** Plain language, and never a patient's name. */
  readonly title: string;
  readonly detail: string;
  readonly urgency: ActionUrgency;
  readonly href: string;
  readonly dueAt: string | null;
  /**
   * The record this item stands for, so an action can name its target. Null for items
   * that carry no inline action.
   */
  readonly taskId: string | null;
  /**
   * What this viewer may actually do to this item, decided here and never in the
   * browser. A control the server did not authorise is a control that does not render;
   * the API re-checks the same permission regardless, so this only governs what is
   * offered, never what is allowed.
   */
  readonly canClaim: boolean;
  readonly canComplete: boolean;
}

export interface ActionBucket {
  readonly key: "needs_you" | "waiting_on_others" | "completed_recently";
  readonly label: string;
  readonly count: number;
  readonly items: readonly ActionItem[];
}

export interface ActionCenter {
  /** Null when the role can see none of the underlying work at all. */
  readonly buckets: readonly ActionBucket[] | null;
  /** Total needing this person. Null rather than 0, so no badge is drawn when quiet. */
  readonly needsYouBadge: number | null;
  readonly everythingHandled: boolean;
}

const DUE_SOON_MS = 48 * 60 * 60 * 1000;
const RECENTLY_MS = 7 * 24 * 60 * 60 * 1000;
const PER_BUCKET = 6;

function urgencyOf(dueAt: Date | null, now: Date): ActionUrgency {
  if (!dueAt) return "open";
  if (dueAt < now) return "overdue";
  return dueAt.getTime() - now.getTime() <= DUE_SOON_MS ? "due_soon" : "open";
}

function taskItem(
  task: { id: string; title: string; dueAt: Date | null },
  now: Date,
  ownerNote: string,
  actions: { canClaim: boolean; canComplete: boolean },
): ActionItem {
  const urgency = urgencyOf(task.dueAt, now);
  return {
    id: `task-${task.id}`,
    title: task.title,
    detail: ownerNote,
    urgency,
    href: "/tasks",
    dueAt: task.dueAt?.toISOString() ?? null,
    taskId: task.id,
    ...actions,
  };
}

/** Only the identity this needs: whose work it is, and what they may see. */
export interface ActionCenterViewer {
  readonly organizationId: string;
  readonly userId: string;
  readonly role: ClinicRole;
}

export async function getActionCenter(session: ActionCenterViewer, now: Date = new Date()): Promise<ActionCenter> {
  const canReadTasks = can(session.role, "tasks", "read");
  const canReadEscalations = can(session.role, "escalations", "read");

  if (!canReadTasks && !canReadEscalations) {
    return { buckets: null, needsYouBadge: null, everythingHandled: false };
  }

  const taskWhereMine = { organizationId: session.organizationId, status: "open", ownerId: session.userId } as const;
  // Not `as const`: that would freeze `OR` into a readonly tuple, and Prisma's
  // `TaskWhereInput` takes a mutable array.
  const taskWhereOthers = {
    organizationId: session.organizationId,
    status: "open",
    OR: [{ ownerId: null }, { ownerId: { not: session.userId } }],
  };
  const taskWhereDone = {
    organizationId: session.organizationId,
    status: "completed",
    completedAt: { gte: new Date(now.getTime() - RECENTLY_MS) },
  } as const;
  const escalationWhere = {
    organizationId: session.organizationId,
    status: "open",
    requiresHumanReview: true,
  } as const;

  // Counts are counted, never inferred from the page. `take: PER_BUCKET` decides how many
  // rows a person reads at a glance; it must not decide what the clinic is told is true.
  // A clinic with forty open tasks that is shown "6" has been lied to by a pagination
  // limit, and the badge is the number a person acts on.
  const [mine, others, done, escalations, mineTotal, othersTotal, doneTotal, escalationsTotal] = await Promise.all([
    canReadTasks
      ? db.task.findMany({
          where: taskWhereMine,
          select: { id: true, title: true, dueAt: true },
          orderBy: [{ dueAt: "asc" }],
          take: PER_BUCKET,
        })
      : Promise.resolve([]),
    canReadTasks
      ? db.task.findMany({
          where: taskWhereOthers,
          select: { id: true, title: true, dueAt: true, ownerId: true },
          orderBy: [{ dueAt: "asc" }],
          take: PER_BUCKET,
        })
      : Promise.resolve([]),
    canReadTasks
      ? db.task.findMany({
          where: taskWhereDone,
          select: { id: true, title: true, completedAt: true },
          orderBy: [{ completedAt: "desc" }],
          take: PER_BUCKET,
        })
      : Promise.resolve([]),
    canReadEscalations
      ? db.escalation.findMany({
          where: escalationWhere,
          // `patientId` is deliberately not selected. An action centre is glanceable and
          // ends up on shared screens; what is never read cannot leak.
          select: { id: true, category: true, riskLevel: true, assignedTeam: true, createdAt: true },
          orderBy: [{ createdAt: "asc" }],
          take: PER_BUCKET,
        })
      : Promise.resolve([]),
    canReadTasks ? db.task.count({ where: taskWhereMine }) : Promise.resolve(0),
    canReadTasks ? db.task.count({ where: taskWhereOthers }) : Promise.resolve(0),
    canReadTasks ? db.task.count({ where: taskWhereDone }) : Promise.resolve(0),
    canReadEscalations ? db.escalation.count({ where: escalationWhere }) : Promise.resolve(0),
  ]);

  const needsYouTotal = mineTotal + escalationsTotal;

  // Ownership decides the verb. A task already yours can be finished; a task nobody
  // owns can be claimed. Both require the same tasks:update permission the API enforces.
  const canWriteTasks = can(session.role, "tasks", "update");

  const needsYou: ActionItem[] = [
    ...mine.map((task) => taskItem(task, now, "Assigned to you", { canClaim: false, canComplete: canWriteTasks })),
    ...escalations.map((escalation) => ({
      id: `escalation-${escalation.id}`,
      // Category and team, never the person it concerns.
      title: `${escalation.category.replaceAll("_", " ")} needs review`,
      detail: `${escalation.riskLevel.toLowerCase()} risk · ${escalation.assignedTeam.replaceAll("_", " ")}`,
      urgency: "open" as const,
      // Carry the record through. Landing a reviewer on the list and making them find
      // the row again is where the handoff was being dropped — they arrived at the
      // right surface with no idea which item sent them.
      href: `/escalations#escalation-${escalation.id}`,
      dueAt: null,
      // Escalations carry no inline action on purpose. They exist because something
      // needed a human to look at it, and a one-tap resolve on a glanceable list is
      // exactly how that stops happening. The link goes to the surface built to review
      // them, where the reviewer and their note are recorded.
      taskId: null,
      canClaim: false,
      canComplete: false,
    })),
  ];

  const waiting: ActionItem[] = others.map((task) => taskItem(
    task,
    now,
    task.ownerId ? "Owned by someone else" : "No owner yet",
    // Unfinished work stays visible until it has an owner: an unowned task is the one
    // thing on this surface a passer-by can genuinely resolve, so it is the one that
    // gets a control. Someone else's task is theirs to finish.
    { canClaim: canWriteTasks && !task.ownerId, canComplete: false },
  ));

  const completed: ActionItem[] = done.map((task) => ({
    id: `done-${task.id}`,
    title: task.title,
    detail: "Completed",
    urgency: "open" as const,
    href: "/tasks",
    dueAt: task.completedAt?.toISOString() ?? null,
    taskId: task.id,
    canClaim: false,
    canComplete: false,
  }));

  const buckets: ActionBucket[] = [];
  // A bucket the role cannot populate is omitted, not shown empty — an empty bucket
  // reads as "nothing here", which is a claim the viewer is not entitled to.
  if (canReadTasks || canReadEscalations) {
    buckets.push({ key: "needs_you", label: "Needs you", count: needsYouTotal, items: needsYou.slice(0, PER_BUCKET) });
  }
  if (canReadTasks) {
    buckets.push({ key: "waiting_on_others", label: "Waiting on others", count: othersTotal, items: waiting });
    buckets.push({ key: "completed_recently", label: "Completed recently", count: doneTotal, items: completed });
  }

  return {
    buckets,
    // No badge is drawn for zero. A badge that is always present stops being read.
    needsYouBadge: needsYouTotal > 0 ? needsYouTotal : null,
    everythingHandled: needsYouTotal === 0 && othersTotal === 0,
  };
}
