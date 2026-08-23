export interface PatientVital {
  id: string;
  measuredAt: string;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  heartRate: number | null;
  temperatureF: number | null;
  oxygenPercent: number | null;
  weightLbs: number | null;
  heightInches: number | null;
  bmi: number | null;
}

export function vitalHasMeasurement(vital: PatientVital) {
  return [
    vital.bloodPressureSystolic,
    vital.bloodPressureDiastolic,
    vital.heartRate,
    vital.temperatureF,
    vital.oxygenPercent,
    vital.weightLbs,
    vital.heightInches,
    vital.bmi,
  ].some((value) => value !== null);
}
