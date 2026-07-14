import { notFound } from "next/navigation";
import { DocumentsWorkspace, FormsWorkspace, ImagingWorkspace, LabsWorkspace } from "@/components/clinic/workspaces/clinical";
import { EncountersWorkspace, FrontDeskWorkspace, PatientsWorkspace, ProviderWorkspace, ScheduleWorkspace, TelemedicineWorkspace } from "@/components/clinic/workspaces/operations";
import { BillingWorkspace, CasesWorkspace, InsuranceWorkspace, QualityWorkspace } from "@/components/clinic/workspaces/revenue";
import { AiAssistantsWorkspace, EscalationsWorkspace, IntegrationsWorkspace, MessagesWorkspace, PortalWorkspace, SettingsWorkspace, TasksWorkspace } from "@/components/clinic/workspaces/system";
import { listAppointmentsForOrganization } from "@/lib/repositories/appointment-repository";
import { listEncountersForOrganization } from "@/lib/repositories/encounter-repository";
import { listPatientsForOrganization } from "@/lib/repositories/patient-repository";

export const workspaceSlugs = [
  "front-desk", "provider", "patients", "schedule", "encounters", "telemedicine",
  "labs", "imaging", "documents", "forms", "billing", "insurance", "cases", "quality",
  "messages", "tasks", "escalations", "ai-assistants", "portal", "integrations", "settings",
] as const;

export async function WorkspaceRenderer({ organizationId, workspace }: { organizationId: string; workspace: string }) {
  switch (workspace) {
    case "front-desk": return <FrontDeskWorkspace appointments={await listAppointmentsForOrganization(organizationId)} />;
    case "provider": {
      const [appointments, encounters] = await Promise.all([
        listAppointmentsForOrganization(organizationId),
        listEncountersForOrganization(organizationId),
      ]);
      return <ProviderWorkspace appointments={appointments} encounters={encounters} />;
    }
    case "patients": return <PatientsWorkspace patients={await listPatientsForOrganization(organizationId)} />;
    case "schedule": return <ScheduleWorkspace appointments={await listAppointmentsForOrganization(organizationId)} />;
    case "encounters": return <EncountersWorkspace encounters={await listEncountersForOrganization(organizationId)} />;
    case "telemedicine": return <TelemedicineWorkspace />;
    case "labs": return <LabsWorkspace />;
    case "imaging": return <ImagingWorkspace />;
    case "documents": return <DocumentsWorkspace />;
    case "forms": return <FormsWorkspace />;
    case "billing": return <BillingWorkspace />;
    case "insurance": return <InsuranceWorkspace />;
    case "cases": return <CasesWorkspace />;
    case "quality": return <QualityWorkspace />;
    case "messages": return <MessagesWorkspace />;
    case "tasks": return <TasksWorkspace />;
    case "escalations": return <EscalationsWorkspace />;
    case "ai-assistants": return <AiAssistantsWorkspace />;
    case "portal": return <PortalWorkspace />;
    case "integrations": return <IntegrationsWorkspace />;
    case "settings": return <SettingsWorkspace />;
    default: return notFound();
  }
}
