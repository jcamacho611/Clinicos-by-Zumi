import "server-only";

import type { Prisma } from "@prisma/client";
import type { CurrentVisitMedicationReconciliation } from "@/lib/clinical/current-visit-model";
import { db } from "@/lib/db";

function discrepancyCount(value: Prisma.JsonValue | null): number {
  if (Array.isArray(value)) return value.length;
  return value === null ? 0 : 1;
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
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  if (!row) return null;

  return {
    id: row.id,
    status: row.status,
    source: row.source,
    summary: row.summary,
    medicationCount: row.medicationIds.length,
    discrepancyCount: discrepancyCount(row.discrepancies),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}
