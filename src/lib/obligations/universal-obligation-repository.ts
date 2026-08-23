import "server-only";

import { db } from "@/lib/db";
import {
  projectReferralObligation,
  projectTaskObligation,
  type UniversalObligationProjection,
} from "@/lib/obligations/universal-obligation";

const SOURCE_LIMIT = 100;

function iso(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function obligationOrder(left: UniversalObligationProjection, right: UniversalObligationProjection) {
  if (left.open !== right.open) return left.open ? -1 : 1;
  if (left.overdue !== right.overdue) return left.overdue ? -1 : 1;
  if (left.state === "BLOCKED" && right.state !== "BLOCKED") return -1;
  if (right.state === "BLOCKED" && left.state !== "BLOCKED") return 1;
  if (left.dueAt && right.dueAt) return left.dueAt.localeCompare(right.dueAt);
  if (left.dueAt) return -1;
  if (right.dueAt) return 1;
  return right.updatedAt.localeCompare(left.updatedAt);
}

export async function listUniversalObligations(organizationId: string, now = new Date()) {
  const [taskRows, referralRows] = await Promise.all([
    db.task.findMany({
      where: { organizationId },
      select: {
        id: true,
        organizationId: true,
        patientId: true,
        title: true,
        status: true,
        ownerId: true,
        priority: true,
        riskLevel: true,
        dueAt: true,
        completedAt: true,
        updatedAt: true,
      },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }, { updatedAt: "desc" }],
      take: SOURCE_LIMIT + 1,
    }),
    // Source-owned referrals only. Inbound referral visibility has its own
    // network/agreement/consent authority and is intentionally not reimplemented here.
    db.referral.findMany({
      where: { organizationId },
      select: {
        id: true,
        organizationId: true,
        patientId: true,
        specialty: true,
        destination: true,
        status: true,
        deliveryStatus: true,
        followUpDueAt: true,
        closedLoopAt: true,
        updatedAt: true,
      },
      orderBy: [{ status: "asc" }, { followUpDueAt: "asc" }, { updatedAt: "desc" }],
      take: SOURCE_LIMIT + 1,
    }),
  ]);

  const sourceWindowComplete = taskRows.length <= SOURCE_LIMIT && referralRows.length <= SOURCE_LIMIT;
  const tasks = taskRows.slice(0, SOURCE_LIMIT).map((task) => projectTaskObligation({
    ...task,
    riskLevel: String(task.riskLevel),
    dueAt: iso(task.dueAt),
    completedAt: iso(task.completedAt),
    updatedAt: task.updatedAt.toISOString(),
  }, now));
  const referrals = referralRows.slice(0, SOURCE_LIMIT).map((referral) => projectReferralObligation({
    ...referral,
    followUpDueAt: iso(referral.followUpDueAt),
    closedLoopAt: iso(referral.closedLoopAt),
    updatedAt: referral.updatedAt.toISOString(),
  }, now));
  const obligations = [...tasks, ...referrals].sort(obligationOrder);
  const open = obligations.filter((obligation) => obligation.open);

  return {
    sourceWindowComplete,
    obligations,
    metrics: {
      open: open.length,
      overdue: open.filter((obligation) => obligation.overdue).length,
      blocked: open.filter((obligation) => obligation.state === "BLOCKED").length,
      taskOpen: open.filter((obligation) => obligation.sourceType === "task").length,
      referralOpen: open.filter((obligation) => obligation.sourceType === "referral").length,
    },
  };
}

export type UniversalObligationWorkspace = Awaited<ReturnType<typeof listUniversalObligations>>;
