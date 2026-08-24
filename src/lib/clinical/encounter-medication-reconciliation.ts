import "server-only";

import type { Prisma } from "@prisma/client";
import type { CurrentVisitMedicationReconciliation } from "@/lib/clinical/current-visit-model";
import { db } from "@/lib/db";

function discrepancyCount(value: Prisma.JsonValue | null): number {
  return Array.isArray(value) ? value.length : 0;
}

export async function findMedicationReconciliationForEncounter(
  encounterId: string,
  patientId: string,
  organizationId: string,
): Promise<CurrentVisitMedicationReconciliation | null> {
  const row = await db.medicationReconciliation.findFirst({
    where: {
      encounterId,
      patientId,
      organizationId,
      status: "completed",
      completedAt: { not: null },
    },
    select: {
      id: true,
      status: true,
      source: true,
      summary: true,
      discrepancies: true,
      medicationIds: true,
      completedAt: true,
    },
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  });

  if (!row || !row.completedAt) return null;

  return {
    id: row.id,
    status: row.status,
    source: row.source,
    summary: row.summary,
    medicationCount: row.medicationIds.length,
    discrepancyCount: discrepancyCount(row.discrepancies),
    completedAt: row.completedAt.toISOString(),
  };
}
