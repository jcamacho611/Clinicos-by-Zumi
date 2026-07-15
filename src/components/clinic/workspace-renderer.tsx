import { notFound } from "next/navigation";
import { can, type ClinicRole } from "@/lib/auth/rbac";
import { DocumentsWorkspace, FormsWorkspace, ImagingWorkspace, LabsWorkspace } from "@/components/clinic/workspaces/clinical";
import { EncountersWorkspace, FrontDeskWorkspace, PatientsWorkspace, ProviderWorkspace, ScheduleWorkspace, TelemedicineWorkspace } from "@/components/clinic/workspaces/operations";
import { BillingWorkspace, CasesWorkspace, InsuranceWorkspace, QualityWorkspace } from "@/components/clinic/workspaces/revenue";
import { AiAssistantsWorkspace, EscalationsWorkspace, IntegrationsWorkspace, MessagesWorkspace, PortalWorkspace, SettingsWorkspace, TasksWorkspace } from "@/components/clinic/workspaces/system";
import { FeatureRegistryWorkspace } from "@/components/clinic/feature-registry-workspace";
import { AccessControlsWorkspace } from "@/components/clinic/access-controls-workspace";
import { IdentityResolutionWorkspace } from "@/components/clinic/identity-resolution-workspace";
import { CapacityExchangeWorkspace, CareTeamsWorkspace, HealthPassportWorkspace, InjuryEpisodesWorkspace, NetworkWorkspace, RegistryDomainWorkspace, VoiceAssistantWorkspace } from "@/components/clinic/workspaces/vision";
import { clinicOsDayOneRegistry } from "@/lib/feature-registry-canon";
import { listAppointmentsForOrganization } from "@/lib/repositories/appointment-repository";
import { getConnectedCareOverview } from "@/lib/repositories/connected-care-repository";
import { listEncountersForOrganization } from "@/lib/repositories/encounter-repository";
import { listPriorityZeroRegistry } from "@/lib/repositories/feature-registry-repository";
import { listPatientsForOrganization } from "@/lib/repositories/patient-repository";
import { listNetworkAccessWorkspace } from "@/lib/repositories/network-access-repository";
import { listIdentityWorkspace } from "@/lib/repositories/patient-identity-repository";

export const workspaceSlugs = [
  "front-desk", "provider", "patients", "schedule", "encounters", "telemedicine",
  "labs", "imaging", "documents", "forms", "billing", "insurance", "cases", "quality",
  "messages", "tasks", "escalations", "ai-assistants", "portal", "integrations", "settings",
  "network", "access-controls", "identity-resolution", "care-teams", "capacity-exchange", "health-passport", "injury-episodes", "voice-assistant", "feature-registry",
] as const;

export async function WorkspaceRenderer({ organizationId, role, workspace }: { organizationId: string; role: ClinicRole; workspace: string }) {
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
    case "network": return <NetworkWorkspace overview={await getConnectedCareOverview(organizationId)} />;
    case "access-controls": {
      if (!can(role, "network", "read")) return notFound();
      return <AccessControlsWorkspace organizationId={organizationId} workspace={await listNetworkAccessWorkspace(organizationId)} />;
    }
    case "identity-resolution": {
      if (!can(role, "identity", "read")) return notFound();
      return <IdentityResolutionWorkspace role={role} workspace={await listIdentityWorkspace(organizationId)} />;
    }
    case "care-teams": return <CareTeamsWorkspace overview={await getConnectedCareOverview(organizationId)} />;
    case "capacity-exchange": return <CapacityExchangeWorkspace overview={await getConnectedCareOverview(organizationId)} />;
    case "health-passport": return <HealthPassportWorkspace overview={await getConnectedCareOverview(organizationId)} />;
    case "injury-episodes": return <InjuryEpisodesWorkspace overview={await getConnectedCareOverview(organizationId)} />;
    case "voice-assistant": return <VoiceAssistantWorkspace />;
    case "feature-registry": {
      const sections = await listPriorityZeroRegistry();
      return <FeatureRegistryWorkspace sections={sections.map((section) => ({
        id: section.id,
        number: section.number,
        slug: section.slug,
        title: section.title,
        mandate: section.mandate,
        priority: section.priority,
        deliveryStatus: section.deliveryStatus,
        deliveryMode: section.deliveryMode,
        interfaceRoute: section.interfaceRoute,
        ownerRoles: section.ownerRoles,
        databaseObjects: section.databaseObjects,
        featureCount: section.featureCount,
        canonVersion: section.canonVersion,
        capabilities: section.capabilities,
      }))} />;
    }
    case "portal": return <PortalWorkspace />;
    case "integrations": return <IntegrationsWorkspace />;
    case "settings": return <SettingsWorkspace />;
    default: {
      const registrySection = clinicOsDayOneRegistry.find((section) => section.interfaceRoute === `/${workspace}`);
      if (registrySection) return <RegistryDomainWorkspace section={registrySection} />;
      return notFound();
    }
  }
}
