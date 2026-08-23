import type { PatientVital } from "@/lib/clinical/vital-types";

export interface EncounterMedicationReconciliationSummary {
  id: string;
  status: string;
  source: string;
  summary: string | null;
  discrepancyCount: number;
  medicationCount: number;
  completedAt: string | null;
  updatedAt: string;
}

export interface EncounterFormHandoffItem {
  id: string;
  templateName: string;
  category: string;
  status: string;
  completionPercent: number;
  reviewStage: string | null;
  updatedAt: string;
}

export interface EncounterTaskHandoffItem {
  id: string;
  title: string;
  category: string;
  status: string;
  riskLevel: string;
  ownerAssigned: boolean;
  dueAt: string | null;
  completedAt: string | null;
}

export interface EncounterStaffHandoffProjection {
  vital: PatientVital | null;
  medicationReconciliation: EncounterMedicationReconciliationSummary | null;
  forms: EncounterFormHandoffItem[];
  tasks: EncounterTaskHandoffItem[];
}
