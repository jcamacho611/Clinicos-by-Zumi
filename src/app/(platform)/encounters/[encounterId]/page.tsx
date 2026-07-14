import type { Metadata } from "next";
import { EncounterEditor } from "@/components/clinic/encounter-editor";
import { getEncounter, getPatient } from "@/lib/clinic-data";

export const metadata: Metadata = { title: "Encounter note" };

export default async function EncounterPage({ params }: { params: Promise<{ encounterId: string }> }) {
  const { encounterId } = await params;
  const encounter = getEncounter(encounterId);
  return <EncounterEditor encounter={encounter} patient={getPatient(encounter.patientId)} />;
}
