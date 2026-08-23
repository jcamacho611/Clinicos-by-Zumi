import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { PatientVital } from "@/lib/clinical/vital-types";

const vitalSelect = {
  id: true,
  measuredAt: true,
  bloodPressureSystolic: true,
  bloodPressureDiastolic: true,
  heartRate: true,
  temperatureF: true,
  oxygenPercent: true,
  weightLbs: true,
  heightInches: true,
  bmi: true,
} as const satisfies Prisma.VitalSelect;

type VitalRow = Prisma.VitalGetPayload<{ select: typeof vitalSelect }>;

function decimalNumber(value: { toString(): string } | number | null) {
  return value === null ? null : Number(value.toString());
}

function mapVital(row: VitalRow): PatientVital {
  return {
    id: row.id,
    measuredAt: row.measuredAt.toISOString(),
    bloodPressureSystolic: row.bloodPressureSystolic,
    bloodPressureDiastolic: row.bloodPressureDiastolic,
    heartRate: row.heartRate,
    temperatureF: decimalNumber(row.temperatureF),
    oxygenPercent: row.oxygenPercent,
    weightLbs: decimalNumber(row.weightLbs),
    heightInches: decimalNumber(row.heightInches),
    bmi: decimalNumber(row.bmi),
  };
}

export async function findLatestVitalForEncounter(encounterId: string, patientId: string, organizationId: string): Promise<PatientVital | null> {
  const rows = await db.vital.findMany({
    where: { organizationId, patientId, encounterId },
    select: vitalSelect,
    orderBy: { measuredAt: "desc" },
    take: 1,
  });
  const row = rows[0];
  return row ? mapVital(row) : null;
}

export async function listVitalsForPatient(patientId: string, organizationId: string, limit = 100): Promise<PatientVital[]> {
  const rows = await db.vital.findMany({
    where: { organizationId, patientId },
    select: vitalSelect,
    orderBy: { measuredAt: "desc" },
    take: Math.max(1, Math.min(limit, 100)),
  });
  return rows.map(mapVital);
}
