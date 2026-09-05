import "server-only";

import { db } from "@/lib/db";
import { klinikosPathCatalog } from "@/lib/paths/catalog";
import type { PublicGrowthEvent } from "@/lib/distribution/public-growth-events";

export type RecordPublicGrowthEventInput = {
  eventType: PublicGrowthEvent;
  pathId?: string | null;
  at?: Date;
};

function utcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function canonicalPathDimension(pathId: string | null | undefined): string {
  if (!pathId) return "";
  return klinikosPathCatalog.some((path) => path.id === pathId) ? pathId : "";
}

export async function recordPublicGrowthEvent(
  input: RecordPublicGrowthEventInput,
): Promise<void> {
  const day = utcDay(input.at ?? new Date());
  const pathId = canonicalPathDimension(input.pathId);

  await db.publicGrowthDailyCounter.upsert({
    where: {
      day_eventType_pathId: {
        day,
        eventType: input.eventType,
        pathId,
      },
    },
    create: {
      day,
      eventType: input.eventType,
      pathId,
      count: 1,
    },
    update: {
      count: { increment: 1 },
    },
  });
}

export async function recordPublicGrowthEventBestEffort(
  input: RecordPublicGrowthEventInput,
): Promise<boolean> {
  try {
    await recordPublicGrowthEvent(input);
    return true;
  } catch {
    return false;
  }
}
