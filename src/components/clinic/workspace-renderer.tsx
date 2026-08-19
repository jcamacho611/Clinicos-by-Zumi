import { notFound } from "next/navigation";
import { can, type ClinicRole } from "@/lib/auth/rbac";
import { canAccessWorkspace } from "@/lib/auth/workspace-authorization";
import { FormsWorkspace } from "@/components/clinic/forms-workspace";
import { KnowledgeWorkspace } from "@/components/clinic/knowledge-workspace";
import { RemoteMonitoringWorkspace } from "@/components/clinic/remote-monitoring-workspace";
import { InventoryWorkspace } from "@/components/clinic/inventory-workspace";
import { DocumentsWorkspace } from "@/components/clinic/documents-workspace";
import { ImagingWorkspace } from "@/components/clinic/imaging-workspace";
import { LabsWorkspace } from "@/components/clinic/labs-workspace";
import { MedicationsWorkspace } from "@/components/clinic/medications-workspace";
import { CasesWorkspace } from "@/components/clinic/cases-workspace";
import { EncountersWorkspace, FrontDeskWorkspace, PatientsWorkspace, ProviderWorkspace, ScheduleWorkspace, TelemedicineWorkspace } from "@/components/clinic/workspaces/operations";
import { BillingWorkspace, InsuranceWorkspace } from "@/components/clinic/workspaces/revenue";
import { InsightsWorkspace } from "@/components/clinic/workspaces/insights";
import { getInsightsPicture } from "@/lib/insights/observations";
import { AiAssistantsWorkspace, EscalationsWorkspace, IntegrationsWorkspace, MessagesWorkspace, PatientNavigationWorkspace, PortalWorkspace, ProviderConsultationWorkspace, SettingsWorkspace, TasksWorkspace } from "@/components/clinic/workspaces/system";
import { FeatureRegistryWorkspace } from "@/components/clinic/feature-registry-workspace";
import { AccessControlsWorkspace } from "@/components/clinic/access-controls-workspace";
import { IdentityResolutionWorkspace } from "@/components/clinic/identity-resolution-workspace";
import { ReferralsWorkspace } from "@/components/clinic/referrals-workspace";
import { CapacityExchangeWorkspace, CareTeamsWorkspace, HealthPassportWorkspace, InjuryEpisodesWorkspace, IntakePassportWorkspace, RegistryDomainWorkspace, VoiceAssistantWorkspace } from "@/components/clinic/workspaces/vision";
import { NetworkCommandWorkspace } from "@/components/clinic/network/network-command-workspace";
import { clinicOsDayOneRegistry } from "@/lib/feature-registry-canon";
import { listAppointmentsForOrganization } from "@/lib/repositories/appointment-repository";
import { getConnectedCareOverview } from "@/lib/repositories/connected-care-repository";
import { listEncounterCreationOptions, listEncountersForOrganization } from "@/lib/repositories/encounter-repository";
import { listPriorityZeroRegistry } from "@/lib/repositories/feature-registry-repository";
import { listPatientsForOrganization } from "@/lib/repositories/patient-repository";
import { listNetworkAccessWorkspace } from "@/lib/repositories/network-access-repository";
import { listNetworkCommandWorkspace } from "@/lib/repositories/network-handoff-repository";
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
import { listCRMWorkspace } from "@/lib/repositories/crm-repository";
import { CRMWorkspace } from "@/components/clinic/crm-workspace";
import { listSystemHealthWorkspace } from "@/lib/repositories/system-health-repository";
import { SystemHealthWorkspace } from "@/components/clinic/system-health-workspace";
import { listCareTeamWorkspace } from "@/lib/repositories/care-team-repository";
import { CodingRevenueWorkspace } from "@/components/clinic/coding-revenue-workspace";
import { listCodingWorkspace } from "@/lib/repositories/coding-revenue-repository";
import { LuxeMediWorkspace } from "@/components/clinic/luxe-medi-workspace";
import { listLuxeMediWorkspace } from "@/lib/repositories/luxe-medi-repository";
import { listCaseWorkspace } from "@/lib/repositories/case-repository";
import { listCopilotWorkspace } from "@/lib/repositories/copilot-repository";

export const workspaceSlugs = [
  "front-desk", "provider", "patients", "schedule", "encounters", "telemedicine",
  "labs", "imaging", "medications", "documents", "forms", "knowledge", "remote-monitoring", "inventory", "billing", "claim-readiness", "luxe-medi", "insurance", "cases", "quality", "crm", "system-health",
  "messages", "tasks", "escalations", "ai-assistants", "patient-navigation", "portal-admin", "integrations", "settings",
  "insights", "network", "referrals", "access-controls", "identity-resolution", "care-teams", "capacity-exchange", "provider-network", "health-passport", "intake-passport", "injury-episodes", "voice-assistant", "feature-registry",
] as const;

export async function WorkspaceRenderer({ organizationId, role, userId, workspace }: { organizationId: string; role: ClinicRole; userId: string; workspace: string }) {
  if (!canAccessWorkspace(role, workspace)) return notFound();
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
    case "encounters": {
      if (!can(role, "encounters", "read")) return notFound();
      const [encounters, options] = await Promise.all([listEncountersForOrganization(organizationId), listEncounterCreationOptions(organizationId)]);
      return <EncountersWorkspace canCreate={can(role, "encounters", "create")} encounters={encounters} options={options} />;
    }
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
    case "crm": {
      if (!can(role, "crm", "read")) return notFound();
      const session = { organizationId, role, userId } as Parameters<typeof listCRMWorkspace>[0];
      const workspace = await listCRMWorkspace(session);
      return <CRMWorkspace canCreate={can(role, "crm", "create")} canUpdate={can(role, "crm", "update")} workspace={workspace} />;
    }
    case "system-health": {
      if (!can(role, "reliability", "read")) return notFound();
      const session = { organizationId, role, userId } as Parameters<typeof listSystemHealthWorkspace>[0];
      return <SystemHealthWorkspace canCreate={can(role, "reliability", "create")} canUpdate={can(role, "reliability", "update")} workspace={await listSystemHealthWorkspace(session)} />;
    }
    case "billing": {
      if (!can(role, "billing", "read")) return notFound();
      return <BillingWorkspace paymentWorkspace={await listPaymentWorkspace(organizationId)} />;
    }
    case "claim-readiness": {
      if (!can(role, "coding", "read")) return notFound();
      return <CodingRevenueWorkspace canWrite={can(role, "coding", "update")} workspace={await listCodingWorkspace({ organizationId, role })} />;
    }
    case "luxe-medi": {
      if (!can(role, "luxe_medi", "read")) return notFound();
      const session = { organizationId, role, userId } as Parameters<typeof listLuxeMediWorkspace>[0];
      return <LuxeMediWorkspace canCreate={can(role, "luxe_medi", "create")} canManage={can(role, "luxe_medi", "manage")} canUpdate={can(role, "luxe_medi", "update")} workspace={await listLuxeMediWorkspace(session)} />;
    }
    case "insurance": return <InsuranceWorkspace />;
    case "cases": {
      if (!can(role, "cases", "read")) return notFound();
      const session = { organizationId, role, userId } as Parameters<typeof listCaseWorkspace>[0];
      return <CasesWorkspace canCreate={can(role, "cases", "create")} workspace={await listCaseWorkspace(session)} />;
    }
    case "insights": return <InsightsWorkspace picture={await getInsightsPicture({ organizationId, role })} />;
    case "messages": return <MessagesWorkspace />;
    case "tasks": {
      if (!can(role, "tasks", "read")) return notFound();
      return <TasksWorkspace workspace={await listCareCoordinationWorkspace(organizationId, userId)} />;
    }
    case "escalations": {
      if (!can(role, "escalations", "read")) return notFound();
      return <EscalationsWorkspace workspace={await listCareCoordinationWorkspace(organizationId, userId)} />;
    }
    case "ai-assistants": {
      if (!can(role, "ai", "read")) return notFound();
      const session = { organizationId, role, userId } as Parameters<typeof listCopilotWorkspace>[0];
      return <AiAssistantsWorkspace canCreate={can(role, "ai", "create")} canReview={can(role, "ai", "update")} canUseVoice={can(role, "voice", "create")} workspace={await listCopilotWorkspace(session)} />;
    }
    case "patient-navigation": {
      if (!can(role, "tasks", "read")) return notFound();
      return <PatientNavigationWorkspace canCreate={can(role, "tasks", "create")} canReview={can(role, "tasks", "update")} workspace={await listPatientNavigationWorkspace(organizationId)} />;
    }
    case "network": {
      if (!can(role, "network", "read")) return notFound();
      const session = { organizationId, role, userId } as Parameters<typeof listNetworkCommandWorkspace>[0];
      return <NetworkCommandWorkspace view="overview" workspace={await listNetworkCommandWorkspace(session)} />;
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
      if (!can(role, "care_teams", "read")) return notFound();
      const session = { organizationId, role, userId } as Parameters<typeof listCareTeamWorkspace>[0];
      const [overview, collaboration, careTeam] = await Promise.all([getConnectedCareOverview(organizationId), listCareCoordinationWorkspace(organizationId, userId), listCareTeamWorkspace(session)]);
      return <CareTeamsWorkspace canCreate={can(role, "care_teams", "create")} canManage={can(role, "care_teams", "manage")} careTeam={careTeam} collaboration={collaboration} overview={overview} />;
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
    case "voice-assistant": {
      if (!can(role, "voice", "read") || !can(role, "ai", "read")) return notFound();
      const session = { organizationId, role, userId } as Parameters<typeof listCopilotWorkspace>[0];
      return <VoiceAssistantWorkspace canCreate={can(role, "ai", "create")} canReview={can(role, "ai", "update")} canUseVoice={can(role, "voice", "create")} workspace={await listCopilotWorkspace(session)} />;
    }
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
    case "portal-admin": return <PortalWorkspace />;
    case "integrations": return <IntegrationsWorkspace />;
    case "settings": return <SettingsWorkspace />;
    default: {
      const registrySection = clinicOsDayOneRegistry.find((section) => section.interfaceRoute === `/${workspace}`);
      if (registrySection) return <RegistryDomainWorkspace section={registrySection} />;
      return notFound();
    }
  }
}
