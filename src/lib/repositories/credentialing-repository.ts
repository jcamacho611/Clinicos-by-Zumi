import "server-only";

import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { credentialNeedsAttention, facilityPrivilegeTransitionSchema, providerCredentialSchema, providerCredentialTransitionSchema, providerFacilityPrivilegeSchema } from "@/lib/credentialing-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import {
  appendProviderAuthorityEvent,
  credentialAuthoritySnapshot,
  facilityPrivilegeAuthoritySnapshot,
} from "@/lib/repositories/provider-authority-history";

function dateOrNull(value?: string | null) {
  return value ? new Date(value) : null;
}

function canManageCredentialing(session: ClinicSession) {
  return can(session.role, "credentialing", "manage");
}

export async function listCredentialingWorkspace(session: ClinicSession) {
  if (!can(session.role, "credentialing", "read")) throw new NetworkAccessError("Credentialing access is not permitted for this role.", 403);
  const [providers, facilities, tasks, documents] = await Promise.all([
    db.provider.findMany({
      where: { organizationId: session.organizationId, status: "active" },
      include: { credentials: { orderBy: [{ status: "asc" }, { expiresAt: "asc" }] }, facilityPrivileges: { include: { facility: { select: { id: true, name: true, type: true } } }, orderBy: { expiresAt: "asc" } } },
      orderBy: { name: "asc" },
    }),
    db.facility.findMany({ where: { organizationId: session.organizationId, status: { in: ["active", "verified"] } }, select: { id: true, name: true, type: true }, orderBy: { name: "asc" } }),
    db.task.findMany({ where: { organizationId: session.organizationId, category: { in: ["credentialing", "credentialing_verification", "credentialing_renewal"] } }, orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }], take: 100 }),
    db.document.findMany({ where: { organizationId: session.organizationId, tags: { has: "credentialing" }, patientId: null }, select: { id: true, name: true, reviewStatus: true, expiresAt: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const now = new Date();
  const providerViews = providers.map((provider) => ({
    id: provider.id,
    name: provider.name,
    credential: provider.credential,
    specialty: provider.specialty,
    subspecialty: provider.subspecialty,
    taxonomy: provider.taxonomy,
    npi: provider.npi,
    deaNumber: provider.deaNumber,
    deaExpiresAt: provider.deaExpiresAt?.toISOString() ?? null,
    telemedicineEligible: provider.telemedicineEligible,
    prescribingEligible: provider.prescribingEligible,
    credentials: provider.credentials.map((credential) => ({
      id: credential.id,
      type: credential.type,
      number: credential.number,
      state: credential.state,
      expiresAt: credential.expiresAt?.toISOString() ?? null,
      status: credential.status,
      verificationStatus: credential.verificationStatus,
      verificationSource: credential.verificationSource,
      primarySourceVerifiedAt: credential.primarySourceVerifiedAt?.toISOString() ?? null,
      evidenceDocumentId: credential.evidenceDocumentId,
      exceptionReason: credential.exceptionReason,
      needsAttention: credentialNeedsAttention(credential.verificationStatus, credential.expiresAt, now),
    })),
    facilityPrivileges: provider.facilityPrivileges.map((privilege) => ({ id: privilege.id, facilityId: privilege.facilityId, facilityName: privilege.facility.name, facilityType: privilege.facility.type, status: privilege.status, grantedAt: privilege.grantedAt?.toISOString() ?? null, expiresAt: privilege.expiresAt?.toISOString() ?? null, verificationSource: privilege.verificationSource, notes: privilege.notes, needsAttention: privilege.status !== "active" || Boolean(privilege.expiresAt && privilege.expiresAt <= now) })),
  }));
  await db.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "credentialing.workspace_accessed", resourceType: "credentialing_workspace", resourceId: session.organizationId, metadata: { providerCount: providers.length, facilityCount: facilities.length, openTaskCount: tasks.filter((task) => task.status !== "completed").length } } });
  return {
    providers: providerViews,
    facilities,
    tasks: tasks.map((task) => ({ id: task.id, category: task.category, title: task.title, details: task.details, status: task.status, priority: task.priority, dueAt: task.dueAt?.toISOString() ?? null })),
    documents: documents.map((document) => ({ id: document.id, name: document.name, reviewStatus: document.reviewStatus, expiresAt: document.expiresAt?.toISOString() ?? null, createdAt: document.createdAt.toISOString() })),
    attentionCount: providerViews.reduce((total, provider) => total + provider.credentials.filter((credential) => credential.needsAttention).length + provider.facilityPrivileges.filter((privilege) => privilege.needsAttention).length, 0),
    verifiedCredentialCount: providerViews.reduce((total, provider) => total + provider.credentials.filter((credential) => credential.verificationStatus === "verified").length, 0),
  };
}

export type CredentialingWorkspace = Awaited<ReturnType<typeof listCredentialingWorkspace>>;

export async function createProviderCredential(session: ClinicSession, rawInput: unknown) {
  if (!canManageCredentialing(session) || !can(session.role, "credentialing", "create")) throw new NetworkAccessError("Credential creation requires an authorized credentialing administrator.", 403);
  const input = providerCredentialSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const provider = await tx.provider.findFirst({ where: { id: input.providerId, organizationId: session.organizationId, status: "active" }, select: { id: true, name: true, userId: true } });
    if (!provider) throw new NetworkAccessError("Provider not found for this organization.", 404);
    const credential = await tx.providerCredential.create({ data: { organizationId: session.organizationId, providerId: provider.id, type: input.type, number: input.number, state: input.state ?? null, expiresAt: dateOrNull(input.expiresAt), status: "pending", verificationStatus: "pending", verificationSource: input.verificationSource ?? null, evidenceDocumentId: input.evidenceDocumentId ?? null } });
    const task = await tx.task.create({ data: { organizationId: session.organizationId, category: "credentialing_verification", title: `Verify ${input.type} for ${provider.name}`, details: `credential:${credential.id} Primary-source or manual evidence review required.`, ownerId: provider.userId, priority: "high", riskLevel: "NEEDS_STAFF", dueAt: new Date(), status: "open", createdBy: session.userId } });
    await appendProviderAuthorityEvent(tx, {
      organizationId: session.organizationId,
      providerId: provider.id,
      authorityKind: "credential",
      authorityRecordId: credential.id,
      authorityVersion: credential.authorityVersion,
      action: "credentialing.credential_created",
      actorId: session.userId,
      actorType: "user",
      beforeState: null,
      afterState: credentialAuthoritySnapshot(credential),
      evidenceDocumentId: credential.evidenceDocumentId,
      evidenceReference: credential.evidenceReference,
      provenanceSource: credential.verificationSource,
      metadata: { retention: "evidence_reference_only" },
    });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "credentialing.credential_created", resourceType: "provider_credential", resourceId: credential.id, metadata: { providerId: provider.id, taskId: task.id, manualFallback: true } } });
    return { credential, taskId: task.id };
  });
}

export async function transitionProviderCredential(session: ClinicSession, credentialId: string, rawInput: unknown) {
  const input = providerCredentialTransitionSchema.parse(rawInput);
  const credential = await db.providerCredential.findFirst({ where: { id: credentialId, organizationId: session.organizationId }, include: { provider: { select: { id: true, name: true, userId: true } } } });
  if (!credential) throw new NetworkAccessError("Credential not found for this organization.", 404);
  const ownProvider = credential.provider.userId === session.userId;
  if (input.action !== "request_verification" && !canManageCredentialing(session)) throw new NetworkAccessError("Credential approval requires an authorized credentialing administrator.", 403);
  if (input.action === "request_verification" && !canManageCredentialing(session) && !(can(session.role, "credentialing", "update") && ownProvider)) throw new NetworkAccessError("Only the provider or credentialing team can request verification.", 403);
  const status = input.action === "verify" ? "active" : input.action === "reject" ? "rejected" : input.action === "exception" ? "exception" : "pending";
  const verificationStatus = input.action === "verify" ? "verified" : input.action === "reject" ? "rejected" : input.action === "exception" ? "exception" : "pending";
  const now = new Date();
  return db.$transaction(async (tx) => {
    const changed = await tx.providerCredential.updateMany({
      where: { id: credential.id, organizationId: session.organizationId, authorityVersion: credential.authorityVersion },
      data: {
        status,
        verificationStatus,
        verificationSource: input.verificationSource ?? credential.verificationSource,
        primarySourceVerifiedAt: input.action === "verify" ? now : credential.primarySourceVerifiedAt,
        expiresAt: input.action === "renew" ? dateOrNull(input.expiresAt) : credential.expiresAt,
        exceptionReason: input.action === "exception" ? input.exceptionReason : input.action === "verify" ? null : credential.exceptionReason,
        verifiedBy: ["verify", "reject", "exception"].includes(input.action) ? session.userId : credential.verifiedBy,
        reviewNotes: input.note,
        authorityVersion: { increment: 1 },
      },
    });
    if (changed.count !== 1) throw new NetworkAccessError("Credential authority changed during review. Refresh and retry.", 409);
    const updated = await tx.providerCredential.findUnique({ where: { id: credential.id } });
    if (!updated) throw new NetworkAccessError("Credential authority could not be reloaded after review.", 409);
    const taskStatus = input.action === "verify" ? "completed" : "open";
    await tx.task.updateMany({ where: { organizationId: session.organizationId, category: { in: ["credentialing", "credentialing_verification", "credentialing_renewal"] }, details: { contains: `credential:${credential.id}` }, status: { not: "completed" } }, data: { status: taskStatus, completedAt: taskStatus === "completed" ? now : null } });
    if (taskStatus === "open" && ["request_verification", "renew", "exception", "reject"].includes(input.action)) await tx.task.create({ data: { organizationId: session.organizationId, category: input.action === "renew" ? "credentialing_renewal" : "credentialing_verification", title: `${input.action === "renew" ? "Review renewal" : "Review credential"}: ${credential.provider.name}`, details: `credential:${credential.id} ${input.note}`, ownerId: credential.provider.userId, priority: input.action === "exception" || input.action === "reject" ? "urgent" : "high", riskLevel: input.action === "exception" || input.action === "reject" ? "URGENT" : "NEEDS_STAFF", dueAt: new Date(), status: "open", createdBy: session.userId } });
    await appendProviderAuthorityEvent(tx, {
      organizationId: session.organizationId,
      providerId: credential.provider.id,
      authorityKind: "credential",
      authorityRecordId: credential.id,
      authorityVersion: updated.authorityVersion,
      action: `credentialing.credential_${input.action}`,
      actorId: session.userId,
      actorType: "user",
      beforeState: credentialAuthoritySnapshot(credential),
      afterState: credentialAuthoritySnapshot(updated),
      evidenceDocumentId: updated.evidenceDocumentId,
      evidenceReference: updated.evidenceReference,
      provenanceSource: updated.verificationSource,
      note: input.note,
      metadata: { retention: "evidence_reference_only" },
    });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `credentialing.credential_${input.action}`, resourceType: "provider_credential", resourceId: credential.id, changes: { status: { from: credential.status, to: updated.status }, verificationStatus: { from: credential.verificationStatus, to: updated.verificationStatus }, expiresAt: { from: credential.expiresAt, to: updated.expiresAt } }, metadata: { providerId: credential.provider.id, note: input.note, verificationSource: input.verificationSource, manualFallback: true } } });
    return updated;
  });
}

export async function createFacilityPrivilege(session: ClinicSession, rawInput: unknown) {
  if (!canManageCredentialing(session)) throw new NetworkAccessError("Facility privilege changes require an authorized credentialing administrator.", 403);
  const input = providerFacilityPrivilegeSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const [provider, facility] = await Promise.all([
      tx.provider.findFirst({ where: { id: input.providerId, organizationId: session.organizationId, status: "active" }, select: { id: true, name: true } }),
      tx.facility.findFirst({ where: { id: input.facilityId, organizationId: session.organizationId, status: { in: ["active", "verified"] } }, select: { id: true, name: true } }),
    ]);
    if (!provider || !facility) throw new NetworkAccessError("Provider and facility must belong to this organization.", 404);
    const privilege = await tx.providerFacilityPrivilege.create({ data: { organizationId: session.organizationId, providerId: provider.id, facilityId: facility.id, status: "pending", expiresAt: dateOrNull(input.expiresAt), notes: input.notes ?? null } });
    await tx.task.create({ data: { organizationId: session.organizationId, category: "credentialing", title: `Review facility privilege for ${provider.name}`, details: `privilege:${privilege.id} ${facility.name}`, priority: "high", riskLevel: "NEEDS_STAFF", dueAt: new Date(), status: "open", createdBy: session.userId } });
    await appendProviderAuthorityEvent(tx, {
      organizationId: session.organizationId,
      providerId: provider.id,
      authorityKind: "facility_privilege",
      authorityRecordId: privilege.id,
      authorityVersion: privilege.authorityVersion,
      action: "credentialing.facility_privilege_created",
      actorId: session.userId,
      actorType: "user",
      beforeState: null,
      afterState: facilityPrivilegeAuthoritySnapshot(privilege),
      note: input.notes ?? null,
      metadata: { facilityId: facility.id, retention: "authority_decision_only" },
    });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "credentialing.facility_privilege_created", resourceType: "provider_facility_privilege", resourceId: privilege.id, metadata: { providerId: provider.id, facilityId: facility.id, manualFallback: true } } });
    return privilege;
  });
}

export async function transitionFacilityPrivilege(session: ClinicSession, privilegeId: string, rawInput: unknown) {
  if (!canManageCredentialing(session)) throw new NetworkAccessError("Facility privilege changes require an authorized credentialing administrator.", 403);
  const input = facilityPrivilegeTransitionSchema.parse(rawInput);
  const privilege = await db.providerFacilityPrivilege.findFirst({ where: { id: privilegeId, organizationId: session.organizationId } });
  if (!privilege) throw new NetworkAccessError("Facility privilege not found for this organization.", 404);
  const status = input.action === "grant" ? "active" : input.action === "suspend" ? "suspended" : "expired";
  return db.$transaction(async (tx) => {
    const now = new Date();
    const changed = await tx.providerFacilityPrivilege.updateMany({
      where: { id: privilege.id, organizationId: session.organizationId, authorityVersion: privilege.authorityVersion },
      data: {
        status,
        grantedAt: input.action === "grant" ? now : privilege.grantedAt,
        verificationSource: input.verificationSource ?? privilege.verificationSource,
        notes: input.note,
        authorityVersion: { increment: 1 },
      },
    });
    if (changed.count !== 1) throw new NetworkAccessError("Facility privilege authority changed during review. Refresh and retry.", 409);
    const updated = await tx.providerFacilityPrivilege.findUnique({ where: { id: privilege.id } });
    if (!updated) throw new NetworkAccessError("Facility privilege authority could not be reloaded after review.", 409);
    await tx.task.updateMany({ where: { organizationId: session.organizationId, category: "credentialing", details: { contains: `privilege:${privilege.id}` }, status: { not: "completed" } }, data: { status: input.action === "grant" ? "completed" : "open", completedAt: input.action === "grant" ? new Date() : null } });
    await appendProviderAuthorityEvent(tx, {
      organizationId: session.organizationId,
      providerId: privilege.providerId,
      authorityKind: "facility_privilege",
      authorityRecordId: privilege.id,
      authorityVersion: updated.authorityVersion,
      action: `credentialing.facility_privilege_${input.action}`,
      actorId: session.userId,
      actorType: "user",
      beforeState: facilityPrivilegeAuthoritySnapshot(privilege),
      afterState: facilityPrivilegeAuthoritySnapshot(updated),
      provenanceSource: updated.verificationSource,
      note: input.note,
      metadata: { facilityId: privilege.facilityId, retention: "authority_decision_only" },
    });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `credentialing.facility_privilege_${input.action}`, resourceType: "provider_facility_privilege", resourceId: privilege.id, changes: { status: { from: privilege.status, to: updated.status } }, metadata: { note: input.note, verificationSource: input.verificationSource, manualFallback: true } } });
    return updated;
  });
}
