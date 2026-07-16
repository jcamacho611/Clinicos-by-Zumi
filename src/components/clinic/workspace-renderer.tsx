import { notFound } from "next/navigation";
import { can, type ClinicRole } from "@/lib/auth/rbac";
import { FormsWorkspace } from "@/components/clinic/forms-workspace";
import { KnowledgeWorkspace } from "@/components/clinic/knowledge-workspace";
import { RemoteMonitoringWorkspace } from "@/components/clinic/remote-monitoring-workspace";
import { InventoryWorkspace } from "@/components/clinic/inventory-workspace";
import { DocumentsWorkspace } from "@/components/clinic/documents-workspace";
import { ImagingWorkspace } from "@/components/clinic/imaging-workspace";
import { LabsWorkspace } from "@/components/clinic/labs-workspace";
import { MedicationsWorkspace } from "@/components/clinic/medications-workspace";
import { EncountersWorkspace, FrontDeskWorkspace, PatientsWorkspace, ProviderWorkspace, ScheduleWorkspace, TelemedicineWorkspace } from "@/components/clinic/workspaces/operations";
import { BillingWorkspace, CasesWorkspace, InsuranceWorkspace, QualityWorkspace } from "@/components/clinic/workspaces/revenue";
import { AiAssistantsWorkspace, EscalationsWorkspace, IntegrationsWorkspace, MessagesWorkspace, PatientNavigationWorkspace, PortalWorkspace, ProviderConsultationWorkspace, SettingsWorkspace, TasksWorkspace } from "@/components/clinic/workspaces/system";
import { FeatureRegistryWorkspace } from "@/components/clinic/feature-registry-workspace";
import { AccessControlsWorkspace } from "@/components/clinic/access-controls-workspace";
import { IdentityResolutionWorkspace } from "@/components/clinic/identity-resolution-workspace";
import { ReferralsWorkspace } from "@/components/clinic/referrals-workspace";
import { CapacityExchangeWorkspace, CareTeamsWorkspace, HealthPassportWorkspace, InjuryEpisodesWorkspace, IntakePassportWorkspace, NetworkWorkspace, RegistryDomainWorkspace, VoiceAssistantWorkspace } from "@/components/clinic/workspaces/vision";
import { clinicOsDayOneRegistry } from "@/lib/feature-registry-canon";
import { listAppointmentsForOrganization } from "@/lib/repositories/appointment-repository";
import { getConnectedCareOverview } from "@/lib/repositories/connected-care-repository";
import { listEncountersForOrganization } from "@/lib/repositories/encounter-repository";
import { listPriorityZeroRegistry } from "@/lib/repositories/feature-registry-repository";
import { listPatientsForOrganization } from "@/lib/repositories/patient-repository";
import { listNetworkAccessWorkspace } from "@/lib/repositories/network-access-repository";
import { listNetworkDirectory } from "@/lib/repositories/network-directory-repository";
import { listIdentityWorkspace } from "@/lib/repositories/patient-identity-repository";
import { listReferralWorkspace } from "@/lib/repositories/referral-repository";
import { listLabWorkspace } from "@/lib/repositories/lab-repository";
import { listImagingWorkspace } from "@/lib/repositories/imaging-repository";
import { listMedicationWorkspace } from "@/lib/repositories/medication-repository";
import { listDocumentWorkspace } from "@/lib/repositories/document-repository";
import { listFormWorkspace } from "@/lib/repositories/form-repository";
import { listPaymentWorkspace } from "@/lib/repositories/payment-repository";
import { listPassportWorkspace } from "@/lib/repositories/passport-repository";
import { listCareCoordinationWorkspace } from "@/lib/repositories/care-coordination-repository";
import { listCapacityWorkspace } from "@/lib/repositories/capacity-repository";
import { listPatientNavigationWorkspace } from "@/lib/repositories/patient-navigation-repository";
import { listProviderConsultationWorkspace } from "@/lib/repositories/provider-consultation-repository";
import { listKnowledgeWorkspace } from "@/lib/repositories/knowledge-repository";
import { listRemoteMonitoringWorkspace } from "@/lib/repositories/remote-monitoring-repository";
import { listInventoryWorkspace } from "@/lib/repositories/inventory-repository";
import { listCredentialingWorkspace } from "@/lib/repositories/credentialing-repository";

export const workspaceSlugs = [
  "front-desk", "provider", "patients", "schedule", "encounters", "telemedicine",
  "labs", "imaging", "medications", "documents", "forms", "knowledge", "remote-monitoring", "inventory", "billing", "insurance", "cases", "quality",
  "messages", "tasks", "escalations", "ai-assistants", "patient-navigation", "portal", "integrations", "settings",
  "network", "referrals", "access-controls", "identity-resolution", "care-teams", "capacity-exchange", "provider-network", "health-passport", "intake-passport", "injury-episodes", "voice-assistant", "feature-registry",
] as const;

export async function WorkspaceRenderer({ organizationId, role, userId, workspace }: { organizationId: string; role: ClinicRole; userId: string; workspace: string }) {
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
    case "labs": {
      if (!can(role, "labs", "read")) return notFound();
      return <LabsWorkspace canCreate={can(role, "labs", "create")} canSign={can(role, "labs", "sign")} canUpdate={can(role, "labs", "update")} workspace={await listLabWorkspace(organizationId)} />;
    }
    case "imaging": {
      if (!can(role, "imaging", "read")) return notFound();
      return <ImagingWorkspace canCreate={can(role, "imaging", "create")} canSign={can(role, "imaging", "sign")} canUpdate={can(role, "imaging", "update")} workspace={await listImagingWorkspace(organizationId)} />;
    }
    case "medications": {
      if (!can(role, "medications", "read")) return notFound();
      return <MedicationsWorkspace canCreate={can(role, "medications", "create")} canSign={can(role, "medications", "sign")} canUpdate={can(role, "medications", "update")} workspace={await listMedicationWorkspace(organizationId)} />;
    }
    case "documents": {
      if (!can(role, "documents", "read")) return notFound();
      return <DocumentsWorkspace canCreate={can(role, "documents", "create")} canManage={can(role, "documents", "manage")} canSign={can(role, "documents", "sign")} canUpdate={can(role, "documents", "update")} workspace={await listDocumentWorkspace(organizationId)} />;
    }
    case "forms": {
      if (!can(role, "forms", "read")) return notFound();
      return <FormsWorkspace canCreate={can(role, "forms", "create")} canManage={can(role, "forms", "manage")} canSign={can(role, "forms", "sign")} canUpdate={can(role, "forms", "update")} workspace={await listFormWorkspace(organizationId)} />;
    }
    case "knowledge": {
      if (!can(role, "knowledge", "read")) return notFound();
      const session = { organizationId, role, userId };
      return <KnowledgeWorkspace canCorrect={can(role, "knowledge", "update")} canCreate={can(role, "knowledge", "create")} canReview={can(role, "knowledge", "manage")} workspace={await listKnowledgeWorkspace(session)} />;
    }
    case "remote-monitoring": {
      if (!can(role, "remote_monitoring", "read")) return notFound();
      const session = { organizationId, role, userId } as Parameters<typeof listRemoteMonitoringWorkspace>[0];
      return <RemoteMonitoringWorkspace canCreate={can(role, "remote_monitoring", "create")} canReview={can(role, "remote_monitoring", "update")} workspace={await listRemoteMonitoringWorkspace(session)} />;
    }
    case "inventory": {
      if (!can(role, "inventory", "read")) return notFound();
      const session = { organizationId, role, userId } as Parameters<typeof listInventoryWorkspace>[0];
      return <InventoryWorkspace canCreate={can(role, "inventory", "create")} canUpdate={can(role, "inventory", "update")} workspace={await listInventoryWorkspace(session)} />;
    }
    case "billing": {
      if (!can(role, "billing", "read")) return notFound();
      return <BillingWorkspace paymentWorkspace={await listPaymentWorkspace(organizationId)} />;
    }
    case "insurance": return <InsuranceWorkspace />;
    case "cases": return <CasesWorkspace />;
    case "quality": return <QualityWorkspace />;
    case "messages": return <MessagesWorkspace />;
    case "tasks": {
      if (!can(role, "tasks", "read")) return notFound();
      return <TasksWorkspace workspace={await listCareCoordinationWorkspace(organizationId, userId)} />;
    }
    case "escalations": {
      if (!can(role, "escalations", "read")) return notFound();
      return <EscalationsWorkspace workspace={await listCareCoordinationWorkspace(organizationId, userId)} />;
    }
    case "ai-assistants": return <AiAssistantsWorkspace />;
    case "patient-navigation": {
      if (!can(role, "tasks", "read")) return notFound();
      return <PatientNavigationWorkspace canCreate={can(role, "tasks", "create")} canReview={can(role, "tasks", "update")} workspace={await listPatientNavigationWorkspace(organizationId)} />;
    }
    case "network": {
      if (!can(role, "network", "read")) return notFound();
      const [overview, directory] = await Promise.all([getConnectedCareOverview(organizationId), listNetworkDirectory(organizationId)]);
      return <NetworkWorkspace canCreate={can(role, "network", "create")} canManage={can(role, "network", "manage")} directory={directory} overview={overview} />;
    }
    case "referrals": {
      if (!can(role, "referrals", "read")) return notFound();
      return <ReferralsWorkspace canCreate={can(role, "referrals", "create")} canUpdate={can(role, "referrals", "update")} workspace={await listReferralWorkspace(organizationId, userId)} />;
    }
    case "access-controls": {
      if (!can(role, "network", "read")) return notFound();
      return <AccessControlsWorkspace organizationId={organizationId} workspace={await listNetworkAccessWorkspace(organizationId)} />;
    }
    case "identity-resolution": {
      if (!can(role, "identity", "read")) return notFound();
      return <IdentityResolutionWorkspace role={role} workspace={await listIdentityWorkspace(organizationId)} />;
    }
    case "care-teams": {
      if (!can(role, "tasks", "read")) return notFound();
      const [overview, collaboration] = await Promise.all([getConnectedCareOverview(organizationId), listCareCoordinationWorkspace(organizationId, userId)]);
      return <CareTeamsWorkspace collaboration={collaboration} overview={overview} />;
    }
    case "capacity-exchange": {
      if (!can(role, "appointments", "read")) return notFound();
      return <CapacityExchangeWorkspace workspace={await listCapacityWorkspace(organizationId)} />;
    }
    case "provider-network": {
      if (!can(role, "tasks", "read") && !can(role, "credentialing", "read")) return notFound();
      const [consultations, credentialing] = await Promise.all([listProviderConsultationWorkspace(organizationId), listCredentialingWorkspace({ organizationId, role, userId } as Parameters<typeof listCredentialingWorkspace>[0])]);
      return <ProviderConsultationWorkspace canCreate={can(role, "tasks", "create")} canCredentialingCreate={can(role, "credentialing", "create")} canCredentialingManage={can(role, "credentialing", "manage")} canReview={can(role, "tasks", "update")} credentialing={credentialing} workspace={consultations} />;
    }
    case "health-passport": {
      if (!can(role, "identity", "read")) return notFound();
      return <HealthPassportWorkspace workspace={await listPassportWorkspace(organizationId)} />;
    }
    case "intake-passport": {
      if (!can(role, "consents", "read")) return notFound();
      return <IntakePassportWorkspace workspace={await listPassportWorkspace(organizationId)} />;
    }
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
