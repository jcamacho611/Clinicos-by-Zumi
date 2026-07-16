import "server-only";

import { RiskLevel } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { createProviderConsultationSchema, consultationRisk, transitionProviderConsultationSchema } from "@/lib/provider-consultation-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function riskLevel(priority: string) {
  const value = consultationRisk(priority);
  return value === "URGENT" ? RiskLevel.URGENT : value === "NEEDS_PROVIDER" ? RiskLevel.NEEDS_PROVIDER : RiskLevel.NORMAL;
}
export async function listProviderConsultationWorkspace(organizationId: string) {
  const [organizations, connections] = await Promise.all([
    db.organization.findMany({ where: { status: "active" }, select: { id: true, name: true, clinicType: true }, orderBy: { name: "asc" } }),
    db.networkConnection.findMany({ where: { OR: [{ sourceOrganizationId: organizationId }, { targetOrganizationId: organizationId }], status: "active" }, select: { sourceOrganizationId: true, targetOrganizationId: true, trustLevel: true } }),
  ]);
  const allowedOrganizationIds = new Set([organizationId]);
  for (const connection of connections) allowedOrganizationIds.add(connection.sourceOrganizationId === organizationId ? connection.targetOrganizationId : connection.sourceOrganizationId);
  const allowedIds = [...allowedOrganizationIds];
  const [providers, credentials, patients, consultations] = await Promise.all([
    db.provider.findMany({ where: { organizationId: { in: allowedIds }, status: "active" }, select: { id: true, organizationId: true, userId: true, name: true, credential: true, specialty: true, npi: true }, orderBy: { name: "asc" } }),
    db.providerCredential.findMany({ where: { organizationId: { in: allowedIds }, status: "active" }, select: { providerId: true, type: true, state: true, expiresAt: true, status: true }, orderBy: { expiresAt: "asc" } }),
    db.patient.findMany({ where: { organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.providerConsultation.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" }, take: 50 }),
  ]);
  const organizationNames = new Map(organizations.map((organization) => [organization.id, organization.name]));
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const patientById = new Map(patients.map((patient) => [patient.id, patient]));
  const credentialsByProvider = new Map<string, typeof credentials>();
  for (const credential of credentials) credentialsByProvider.set(credential.providerId, [...(credentialsByProvider.get(credential.providerId) ?? []), credential]);
  const now = new Date();
  return {
    patients,
    providers: providers.map((provider) => {
      const credential = credentialsByProvider.get(provider.id)?.[0];
      const verified = Boolean(credential?.status === "active" && (!credential.expiresAt || credential.expiresAt > now));
      return { id: provider.id, organizationId: provider.organizationId, organizationName: organizationNames.get(provider.organizationId) ?? "Unknown organization", name: provider.name, credential: provider.credential, specialty: provider.specialty, npi: provider.npi, verified, sameOrganization: provider.organizationId === organizationId, credentialType: credential?.type ?? null, credentialState: credential?.state ?? null, credentialExpiresAt: credential?.expiresAt?.toISOString() ?? null };
    }),
    connections: connections.map((connection) => ({ organizationId: connection.sourceOrganizationId === organizationId ? connection.targetOrganizationId : connection.sourceOrganizationId, organizationName: organizationNames.get(connection.sourceOrganizationId === organizationId ? connection.targetOrganizationId : connection.sourceOrganizationId) ?? "Unknown organization", trustLevel: connection.trustLevel })),
    consultations: consultations.map((consultation) => ({ id: consultation.id, patientName: consultation.patientId ? `${patientById.get(consultation.patientId)?.firstName ?? "Unknown"} ${patientById.get(consultation.patientId)?.lastName ?? "patient"}` : "Organization consultation", mrn: consultation.patientId ? patientById.get(consultation.patientId)?.mrn ?? "Unknown MRN" : null, requestingProvider: providerById.get(consultation.requestingProviderId)?.name ?? "Requesting provider", consultantProvider: consultation.consultantProviderId ? providerById.get(consultation.consultantProviderId)?.name ?? "External consultant" : "Open directory request", specialty: consultation.specialty, clinicalQuestion: consultation.clinicalQuestion, priority: consultation.priority, status: consultation.status, scheduledAt: consultation.scheduledAt?.toISOString() ?? null, createdAt: consultation.createdAt.toISOString(), updatedAt: consultation.updatedAt.toISOString() })),
  };
}

export type ProviderConsultationWorkspace = Awaited<ReturnType<typeof listProviderConsultationWorkspace>>;

export async function createProviderConsultation(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "tasks", "create")) throw new NetworkAccessError("Provider consultation permission is required.", 403);
  const input = createProviderConsultationSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const requestingProvider = await tx.provider.findFirst({ where: { organizationId: session.organizationId, userId: session.userId, status: "active" }, select: { id: true, name: true } });
    if (!requestingProvider) throw new NetworkAccessError("The signed-in user must have an active provider profile to request a consultation.", 403);
    const consultant = input.consultantProviderId ? await tx.provider.findFirst({ where: { id: input.consultantProviderId, status: "active" }, select: { id: true, organizationId: true, userId: true, name: true } }) : null;
    if (input.consultantProviderId && !consultant) throw new NetworkAccessError("Consultant provider not found in the connected directory.", 404);
    if (consultant && consultant.organizationId !== session.organizationId) {
      const connection = await tx.networkConnection.findFirst({ where: { OR: [{ sourceOrganizationId: session.organizationId, targetOrganizationId: consultant.organizationId }, { sourceOrganizationId: consultant.organizationId, targetOrganizationId: session.organizationId }], status: "active" } });
      if (!connection) throw new NetworkAccessError("An active clinic connection is required before requesting an external consultation.", 403);
    }
    if (input.consultantProviderId) {
      const credential = await tx.providerCredential.findFirst({ where: { providerId: input.consultantProviderId, status: "active", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, select: { id: true } });
      if (!credential) throw new NetworkAccessError("The consultant must have a current active credential before a request can be created.", 400);
    }
    let patientId: string | undefined;
    if (input.patientId) {
      const patient = await tx.patient.findFirst({ where: { id: input.patientId, organizationId: session.organizationId, status: "active" }, select: { id: true } });
      if (!patient) throw new NetworkAccessError("Patient not found for this organization.", 404);
      patientId = patient.id;
    }
    const consultation = await tx.providerConsultation.create({ data: { organizationId: session.organizationId, patientId, requestingProviderId: requestingProvider.id, consultantProviderId: consultant?.id, specialty: input.specialty, clinicalQuestion: input.clinicalQuestion, priority: input.priority, status: "requested" } });
    const task = await tx.task.create({ data: { organizationId: session.organizationId, patientId, category: "provider_consultation", title: `Review ${input.specialty} provider consultation`, details: `consultation:${consultation.id} ${input.clinicalQuestion}`, ownerId: consultant?.userId ?? undefined, priority: input.priority === "urgent" ? "urgent" : input.priority === "high" ? "high" : "normal", riskLevel: riskLevel(input.priority), dueAt: new Date(), status: "open", createdBy: session.userId } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "provider_consultation.requested", resourceType: "provider_consultation", resourceId: consultation.id, patientId, metadata: { requestingProviderId: requestingProvider.id, consultantProviderId: consultant?.id ?? null, taskId: task.id, manualFallback: true } } });
    return consultation;
  });
}

export async function transitionProviderConsultation(session: ClinicSession, consultationId: string, rawInput: unknown) {
  if (!can(session.role, "tasks", "update")) throw new NetworkAccessError("Provider consultation review permission is required.", 403);
  const input = transitionProviderConsultationSchema.parse(rawInput);
  const consultation = await db.providerConsultation.findFirst({ where: { id: consultationId, organizationId: session.organizationId } });
  if (!consultation) throw new NetworkAccessError("Provider consultation not found for this organization.", 404);
  const status = input.action === "accept" ? "accepted" : input.action === "decline" ? "declined" : input.action === "schedule" ? "scheduled" : "closed";
  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : undefined;
  return db.$transaction(async (tx) => {
    const updated = await tx.providerConsultation.update({ where: { id: consultation.id }, data: { status, scheduledAt, closedAt: input.action === "close" ? new Date() : undefined } });
    if (["decline", "close"].includes(input.action)) await tx.task.updateMany({ where: { organizationId: session.organizationId, category: "provider_consultation", details: { contains: `consultation:${consultation.id}` } }, data: { status: "completed", completedAt: new Date() } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `provider_consultation.${input.action}`, resourceType: "provider_consultation", resourceId: consultation.id, patientId: consultation.patientId, changes: { status: { from: consultation.status, to: status }, scheduledAt }, metadata: { note: input.note, manualFallback: true } } });
    return updated;
  });
}
