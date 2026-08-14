import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCommercialProduct } from "@/lib/commercial/product-catalog";

type SubscriptionRow = {
  planKey: string;
  status: string;
  paymentConfirmedAt: Date | null;
  currentPeriodEndsAt: Date | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" ? record[key] as string : null;
}

function stringList(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function getClinicLaunchBriefing(organizationId: string) {
  const now = new Date();
  const [settings, location, pendingConnections, subscriptions] = await Promise.all([
    db.setting.findMany({
      where: { organizationId, key: { in: ["onboarding.profile", "compliance.phi_mode"] } },
      select: { key: true, value: true },
    }),
    db.location.findFirst({
      where: { organizationId },
      select: { id: true, name: true, timezone: true },
    }),
    db.integration.count({ where: { organizationId, status: "pending_connection" } }),
    db.$queryRaw<SubscriptionRow[]>(Prisma.sql`
      SELECT "planKey", "status", "paymentConfirmedAt", "currentPeriodEndsAt"
      FROM "subscriptions"
      WHERE "organizationId" = ${organizationId}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `),
  ]);

  const settingByKey = new Map(settings.map((setting) => [setting.key, asRecord(setting.value)]));
  const onboarding = settingByKey.get("onboarding.profile") ?? {};
  const phiMode = settingByKey.get("compliance.phi_mode") ?? {};
  const completedSteps = stringList(onboarding, "completedSteps");
  const subscription = subscriptions[0] ?? null;
  const paidAccess = Boolean(
    subscription
    && subscription.status === "active"
    && subscription.paymentConfirmedAt
    && (!subscription.currentPeriodEndsAt || subscription.currentPeriodEndsAt > now),
  );
  const paidWorkspaceCompleted = onboarding.mode === "paid_activation"
    && ["commercial_access", "organization", "owner", "location", "workspace"].every((step) => completedSteps.includes(step));

  return {
    verifiedFirstLogin: paidAccess && paidWorkspaceCompleted,
    paidAccess,
    planKey: subscription?.planKey ?? null,
    planLabel: subscription ? getCommercialProduct(subscription.planKey)?.label ?? subscription.planKey : null,
    currentPeriodEndsAt: subscription?.currentPeriodEndsAt?.toISOString() ?? null,
    primaryGoal: stringValue(onboarding, "primaryGoal"),
    teamSize: stringValue(onboarding, "teamSize"),
    migrationExpectation: stringValue(onboarding, "migrationExpectation"),
    communicationsState: stringValue(onboarding, "communicationsState"),
    productionPatientDataEnabled: phiMode.enabled === true,
    productionPatientDataReason: stringValue(phiMode, "reason"),
    pendingConnections,
    location: location ? { id: location.id, name: location.name, timezone: location.timezone } : null,
  };
}

export type ClinicLaunchBriefing = Awaited<ReturnType<typeof getClinicLaunchBriefing>>;
