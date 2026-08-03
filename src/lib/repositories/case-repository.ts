import "server-only";

import { Prisma, type NoFaultCase, type WorkersCompCase } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import {
  assertCasePacketTransition,
  buildCaseChecklist,
  caseContactSchema,
  casePacketReadiness,
  casePacketTransitionSchema,
  caseTaskTransitionSchema,
  caseTypeSchema,
  createCasePacketSchema,
  createCaseSchema,
  createCaseTaskSchema,
  nextCaseTaskStatus,
  parseCaseChecklist,
  updateCaseSchema,
  type CaseContact,
  type CaseType,
} from "@/lib/case-rules";
import { db } from "@/lib/db";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type Transaction = Prisma.TransactionClient;

function iso(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateOrNull(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

function contact(value: Prisma.JsonValue | null): CaseContact | null {
  return caseContactSchema.safeParse(value).data ?? null;
}

function caseResource(caseType: CaseType) {
  return caseType === "nofault" ? "nofault_case" : "workers_comp_case";
}

function caseLabel(caseType: CaseType) {
  return caseType === "nofault" ? "No-fault" : "Workers compensation";
}

async function requirePatient(tx: Transaction, organizationId: string, patientId: string) {
  const patient = await tx.patient.findFirst({
    where: { id: patientId, organizationId, status: "active" },
    select: { id: true, firstName: true, lastName: true, mrn: true },
  });
  if (!patient) throw new NetworkAccessError("Patient not found for this organization.", 404);
  return patient;
}

async function requireCase(tx: Transaction, organizationId: string, caseType: CaseType, caseId: string) {
  if (caseType === "nofault") {
    const record = await tx.noFaultCase.findFirst({ where: { id: caseId, organizationId } });
    if (!record) throw new NetworkAccessError("No-fault case not found for this organization.", 404);
    return { caseType, record } as const;
  }
  const record = await tx.workersCompCase.findFirst({ where: { id: caseId, organizationId } });
  if (!record) throw new NetworkAccessError("Workers compensation case not found for this organization.", 404);
  return { caseType, record } as const;
}

function noFaultView(record: NoFaultCase, patient: { firstName: string; lastName: string; mrn: string }, counts: { openTasks: number; documents: number; packets: Array<{ readiness: number }> }) {
  return {
    id: record.id,
    caseType: "nofault" as const,
    caseLabel: "No-fault",
    patientId: record.patientId,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientMrn: patient.mrn,
    accidentDate: record.accidentDate.toISOString(),
    claimNumber: record.claimNumber,
    carrier: record.carrier,
    policyNumber: record.policyNumber,
    adjuster: contact(record.adjuster),
    attorney: contact(record.attorney),
    employer: null,
    injuredBodyParts: record.injuredBodyParts,
    diagnosisCodes: record.diagnosisCodes,
    treatmentPlan: record.treatmentPlan,
    workStatus: null,
    returnToWorkStatus: null,
    assignmentBenefitsStatus: record.assignmentBenefitsStatus,
    formStatus: { nf2: record.nf2Status, nf3: record.nf3Status, c4: null },
    authorizationStatus: record.priorAuthStatus,
    imeStatus: record.imeStatus,
    denialStatus: record.denialStatus,
    appealStatus: record.appealStatus,
    narrativeDueAt: iso(record.narrativeDueAt),
    packetStatus: record.packetStatus,
    status: record.status,
    openTaskCount: counts.openTasks,
    documentCount: counts.documents,
    packetCount: counts.packets.length,
    packetReadiness: counts.packets.length ? Math.max(...counts.packets.map((packet) => packet.readiness)) : 0,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function workersCompView(record: WorkersCompCase, patient: { firstName: string; lastName: string; mrn: string }, counts: { openTasks: number; documents: number; packets: Array<{ readiness: number }> }) {
  return {
    id: record.id,
    caseType: "workers_comp" as const,
    caseLabel: "Workers compensation",
    patientId: record.patientId,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientMrn: patient.mrn,
    accidentDate: record.accidentDate.toISOString(),
    claimNumber: record.claimNumber,
    carrier: record.carrier,
    policyNumber: null,
    adjuster: contact(record.adjuster),
    attorney: contact(record.attorney),
    employer: contact(record.employer),
    injuredBodyParts: record.injuredBodyParts,
    diagnosisCodes: record.diagnosisCodes,
    treatmentPlan: record.treatmentPlan,
    workStatus: record.workStatus,
    returnToWorkStatus: record.returnToWorkStatus,
    assignmentBenefitsStatus: null,
    formStatus: { nf2: null, nf3: null, c4: record.c4Status },
    authorizationStatus: record.authorizationStatus,
    imeStatus: record.imeStatus,
    denialStatus: record.denialStatus,
    appealStatus: record.appealStatus,
    narrativeDueAt: iso(record.narrativeDueAt),
    packetStatus: record.packetStatus,
    status: record.status,
    openTaskCount: counts.openTasks,
    documentCount: counts.documents,
    packetCount: counts.packets.length,
    packetReadiness: counts.packets.length ? Math.max(...counts.packets.map((packet) => packet.readiness)) : 0,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listCaseWorkspace(session: ClinicSession) {
  if (!can(session.role, "cases", "read")) throw new NetworkAccessError("Case access is not permitted for this role.", 403);
  const [noFaultCases, workersCompCases, patients, users, tasks, packets, documents] = await Promise.all([
    db.noFaultCase.findMany({ where: { organizationId: session.organizationId }, orderBy: [{ status: "asc" }, { narrativeDueAt: "asc" }, { updatedAt: "desc" }] }),
    db.workersCompCase.findMany({ where: { organizationId: session.organizationId }, orderBy: [{ status: "asc" }, { narrativeDueAt: "asc" }, { updatedAt: "desc" }] }),
    db.patient.findMany({ where: { organizationId: session.organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.user.findMany({ where: { organizationId: session.organizationId, status: "active" }, select: { id: true, name: true, roleKey: true }, orderBy: { name: "asc" } }),
    db.caseTask.findMany({ where: { organizationId: session.organizationId }, select: { caseType: true, caseId: true, status: true } }),
    db.casePacket.findMany({ where: { organizationId: session.organizationId }, select: { caseType: true, caseId: true, checklist: true } }),
    db.document.findMany({ where: { organizationId: session.organizationId, caseId: { not: null }, status: { not: "archived" } }, select: { caseType: true, caseId: true } }),
  ]);

  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  function counts(caseType: CaseType, caseId: string) {
    return {
      openTasks: tasks.filter((task) => task.caseType === caseType && task.caseId === caseId && task.status === "open").length,
      documents: documents.filter((document) => document.caseType === caseType && document.caseId === caseId).length,
      packets: packets.filter((packet) => packet.caseType === caseType && packet.caseId === caseId).map((packet) => ({ readiness: casePacketReadiness(parseCaseChecklist(packet.checklist)) })),
    };
  }
  const caseViews = [
    ...noFaultCases.flatMap((record) => {
      const patient = patientMap.get(record.patientId);
      return patient ? [noFaultView(record, patient, counts("nofault", record.id))] : [];
    }),
    ...workersCompCases.flatMap((record) => {
      const patient = patientMap.get(record.patientId);
      return patient ? [workersCompView(record, patient, counts("workers_comp", record.id))] : [];
    }),
  ].sort((a, b) => a.status.localeCompare(b.status) || (a.narrativeDueAt ?? "9999").localeCompare(b.narrativeDueAt ?? "9999"));
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 86_400_000);

  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: "cases.workspace_accessed",
      resourceType: "case_workspace",
      resourceId: session.organizationId,
      metadata: { caseCount: caseViews.length, manualFallback: true },
    },
  });

  return {
    cases: caseViews,
    patients: patients.map((patient) => ({ id: patient.id, name: `${patient.firstName} ${patient.lastName}`, mrn: patient.mrn })),
    users,
    metrics: {
      activeCases: caseViews.filter((item) => item.status === "active").length,
      narrativesDue: caseViews.filter((item) => item.narrativeDueAt && new Date(item.narrativeDueAt) <= inSevenDays && item.status !== "closed").length,
      disputedCases: caseViews.filter((item) => item.status === "disputed" || item.denialStatus === "denied").length,
      openTasks: caseViews.reduce((total, item) => total + item.openTaskCount, 0),
    },
    connection: { status: "Pending Connection", mode: "manual_fallback" as const, electronicSubmissionEnabled: false },
  };
}

export type CaseWorkspace = Awaited<ReturnType<typeof listCaseWorkspace>>;
export type CaseSummary = CaseWorkspace["cases"][number];

export async function getCaseRoom(session: ClinicSession, rawCaseType: string, caseId: string) {
  if (!can(session.role, "cases", "read")) throw new NetworkAccessError("Case access is not permitted for this role.", 403);
  const caseType = caseTypeSchema.parse(rawCaseType);
  const raw = caseType === "nofault"
    ? await db.noFaultCase.findFirst({ where: { id: caseId, organizationId: session.organizationId } })
    : await db.workersCompCase.findFirst({ where: { id: caseId, organizationId: session.organizationId } });
  if (!raw) throw new NetworkAccessError(`${caseLabel(caseType)} case not found for this organization.`, 404);

  const [patient, tasks, packets, documents, caseDocuments, claims, balances, payments, audits, users] = await Promise.all([
    db.patient.findFirst({ where: { id: raw.patientId, organizationId: session.organizationId }, select: { id: true, firstName: true, lastName: true, preferredName: true, mrn: true, dateOfBirth: true, phone: true, email: true, riskLevel: true } }),
    db.caseTask.findMany({ where: { organizationId: session.organizationId, caseType, caseId }, orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }] }),
    db.casePacket.findMany({ where: { organizationId: session.organizationId, caseType, caseId }, orderBy: { createdAt: "desc" } }),
    db.document.findMany({ where: { organizationId: session.organizationId, caseType, caseId }, select: { id: true, name: true, originalFileName: true, mimeType: true, sizeBytes: true, reviewStatus: true, releaseStatus: true, status: true, lockedAt: true, createdAt: true, updatedAt: true }, orderBy: { createdAt: "desc" } }),
    db.caseDocument.findMany({ where: { organizationId: session.organizationId, caseType, caseId } }),
    db.claimDraft.findMany({ where: { organizationId: session.organizationId, patientId: raw.patientId }, orderBy: { createdAt: "desc" } }),
    db.patientBalance.findMany({ where: { organizationId: session.organizationId, patientId: raw.patientId }, orderBy: { asOf: "desc" }, take: 1 }),
    db.payment.findMany({ where: { organizationId: session.organizationId, patientId: raw.patientId }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.auditLog.findMany({ where: { organizationId: session.organizationId, resourceType: caseResource(caseType), resourceId: caseId }, orderBy: { createdAt: "desc" }, take: 150 }),
    db.user.findMany({ where: { organizationId: session.organizationId }, select: { id: true, name: true, roleKey: true } }),
  ]);
  if (!patient) throw new NetworkAccessError("The patient linked to this case is not available in this organization.", 409);
  const userMap = new Map(users.map((user) => [user.id, user]));
  const linkMap = new Map(caseDocuments.map((item) => [item.documentId, item]));
  const counts = { openTasks: tasks.filter((task) => task.status === "open").length, documents: documents.length, packets: packets.map((packet) => ({ readiness: casePacketReadiness(parseCaseChecklist(packet.checklist)) })) };
  const summary = caseType === "nofault" ? noFaultView(raw as NoFaultCase, patient, counts) : workersCompView(raw as WorkersCompCase, patient, counts);

  await db.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "case.room_accessed", resourceType: caseResource(caseType), resourceId: caseId, patientId: raw.patientId, metadata: { caseType, minimumNecessary: true } } });

  return {
    case: summary,
    patient: { ...patient, dateOfBirth: patient.dateOfBirth.toISOString() },
    users,
    tasks: tasks.map((task) => ({ ...task, ownerName: task.ownerId ? userMap.get(task.ownerId)?.name ?? "Unassigned" : "Unassigned", dueAt: iso(task.dueAt), completedAt: iso(task.completedAt), createdAt: task.createdAt.toISOString(), updatedAt: task.updatedAt.toISOString() })),
    packets: packets.map((packet) => { const checklist = parseCaseChecklist(packet.checklist); return { ...packet, checklist, readiness: casePacketReadiness(checklist), generatedAt: iso(packet.generatedAt), approvedAt: iso(packet.approvedAt), createdAt: packet.createdAt.toISOString(), updatedAt: packet.updatedAt.toISOString() }; }),
    documents: documents.map((document) => ({ ...document, requirementKey: linkMap.get(document.id)?.requirementKey ?? null, linkStatus: linkMap.get(document.id)?.status ?? "linked", lockedAt: iso(document.lockedAt), createdAt: document.createdAt.toISOString(), updatedAt: document.updatedAt.toISOString() })),
    financial: {
      scope: "patient_level_not_case_attributed" as const,
      notice: "These claims, payments, and balances are linked to the patient, not attributed to a legal case. Case profitability requires reviewed case-level allocation.",
      claims: claims.map((claim) => ({ ...claim, submittedAt: iso(claim.submittedAt), createdAt: claim.createdAt.toISOString(), updatedAt: claim.updatedAt.toISOString() })),
      payments: payments.map((payment) => ({ ...payment, postedAt: iso(payment.postedAt), createdAt: payment.createdAt.toISOString(), updatedAt: payment.updatedAt.toISOString() })),
      balanceCents: balances[0]?.balanceCents ?? 0,
    },
    timeline: audits.map((audit) => ({ id: audit.id, action: audit.action, actorId: audit.actorId, changes: audit.changes, metadata: audit.metadata, createdAt: audit.createdAt.toISOString() })),
    connection: { status: "Pending Connection", mode: "manual_fallback" as const, externalTransmission: false },
  };
}

export type CaseRoom = Awaited<ReturnType<typeof getCaseRoom>>;

export async function createCase(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "cases", "create")) throw new NetworkAccessError("Case creation is not permitted for this role.", 403);
  const input = createCaseSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const patient = await requirePatient(tx, session.organizationId, input.patientId);
    const duplicate = input.caseType === "nofault"
      ? await tx.noFaultCase.findFirst({ where: { organizationId: session.organizationId, claimNumber: input.claimNumber }, select: { id: true } })
      : await tx.workersCompCase.findFirst({ where: { organizationId: session.organizationId, claimNumber: input.claimNumber }, select: { id: true } });
    if (duplicate) throw new NetworkAccessError("That claim number is already in use for this organization and case type.", 409);
    const shared = {
      organizationId: session.organizationId,
      patientId: input.patientId,
      accidentDate: dateOnly(input.accidentDate),
      claimNumber: input.claimNumber,
      carrier: input.carrier,
      adjuster: input.adjuster ?? undefined,
      attorney: input.attorney ?? undefined,
      injuredBodyParts: input.injuredBodyParts,
      diagnosisCodes: input.diagnosisCodes,
      treatmentPlan: input.treatmentPlan ?? null,
      imeStatus: input.imeStatus ?? null,
      denialStatus: input.denialStatus ?? null,
      appealStatus: input.appealStatus ?? null,
      narrativeDueAt: dateOrNull(input.narrativeDueAt),
    };
    const record = input.caseType === "nofault"
      ? await tx.noFaultCase.create({ data: { ...shared, policyNumber: input.policyNumber ?? null, assignmentBenefitsStatus: input.assignmentBenefitsStatus ?? null, nf2Status: input.nf2Status ?? null, nf3Status: input.nf3Status ?? null, priorAuthStatus: input.priorAuthStatus ?? null } })
      : await tx.workersCompCase.create({ data: { ...shared, employer: input.employer ?? undefined, workStatus: input.workStatus ?? null, returnToWorkStatus: input.returnToWorkStatus ?? null, authorizationStatus: input.authorizationStatus ?? null, c4Status: input.c4Status ?? null } });
    const checklist = buildCaseChecklist(input.caseType, "carrier_submission");
    const packet = await tx.casePacket.create({ data: { organizationId: session.organizationId, caseType: input.caseType, caseId: record.id, type: "carrier_submission", checklist: checklist as unknown as Prisma.InputJsonValue, status: "draft" } });
    const task = await tx.caseTask.create({ data: { organizationId: session.organizationId, caseType: input.caseType, caseId: record.id, title: "Complete initial case document checklist", details: "Review the carrier submission checklist and attach available evidence. Use manual fallback notes for unavailable vendor forms.", ownerId: session.userId, priority: "high", dueAt: input.narrativeDueAt ? dateOrNull(input.narrativeDueAt) : new Date(Date.now() + 3 * 86_400_000), status: "open", createdBy: session.userId } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "case.created", resourceType: caseResource(input.caseType), resourceId: record.id, patientId: input.patientId, metadata: { caseType: input.caseType, claimNumber: input.claimNumber, packetId: packet.id, taskId: task.id, manualFallback: true, patientName: `${patient.firstName} ${patient.lastName}` } } });
    return { id: record.id, caseType: input.caseType, packetId: packet.id, taskId: task.id };
  });
}

export async function updateCase(session: ClinicSession, rawCaseType: string, caseId: string, rawInput: unknown) {
  if (!can(session.role, "cases", "update")) throw new NetworkAccessError("Case updates are not permitted for this role.", 403);
  const caseType = caseTypeSchema.parse(rawCaseType);
  const input = updateCaseSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const current = await requireCase(tx, session.organizationId, caseType, caseId);
    const common = {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.carrier !== undefined ? { carrier: input.carrier } : {}),
      ...(input.injuredBodyParts !== undefined ? { injuredBodyParts: input.injuredBodyParts } : {}),
      ...(input.diagnosisCodes !== undefined ? { diagnosisCodes: input.diagnosisCodes } : {}),
      ...(input.treatmentPlan !== undefined ? { treatmentPlan: input.treatmentPlan } : {}),
      ...(input.imeStatus !== undefined ? { imeStatus: input.imeStatus } : {}),
      ...(input.denialStatus !== undefined ? { denialStatus: input.denialStatus } : {}),
      ...(input.appealStatus !== undefined ? { appealStatus: input.appealStatus } : {}),
      ...(input.narrativeDueAt !== undefined ? { narrativeDueAt: dateOrNull(input.narrativeDueAt) } : {}),
      ...(input.adjuster !== undefined ? { adjuster: input.adjuster === null ? Prisma.DbNull : input.adjuster } : {}),
      ...(input.attorney !== undefined ? { attorney: input.attorney === null ? Prisma.DbNull : input.attorney } : {}),
    };
    const updated = caseType === "nofault"
      ? await tx.noFaultCase.update({ where: { id: current.record.id }, data: { ...common, ...(input.policyNumber !== undefined ? { policyNumber: input.policyNumber } : {}), ...(input.assignmentBenefitsStatus !== undefined ? { assignmentBenefitsStatus: input.assignmentBenefitsStatus } : {}), ...(input.nf2Status !== undefined ? { nf2Status: input.nf2Status } : {}), ...(input.nf3Status !== undefined ? { nf3Status: input.nf3Status } : {}), ...(input.priorAuthStatus !== undefined ? { priorAuthStatus: input.priorAuthStatus } : {}) } })
      : await tx.workersCompCase.update({ where: { id: current.record.id }, data: { ...common, ...(input.employer !== undefined ? { employer: input.employer === null ? Prisma.DbNull : input.employer } : {}), ...(input.workStatus !== undefined ? { workStatus: input.workStatus } : {}), ...(input.returnToWorkStatus !== undefined ? { returnToWorkStatus: input.returnToWorkStatus } : {}), ...(input.authorizationStatus !== undefined ? { authorizationStatus: input.authorizationStatus } : {}), ...(input.c4Status !== undefined ? { c4Status: input.c4Status } : {}) } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "case.updated", resourceType: caseResource(caseType), resourceId: caseId, patientId: current.record.patientId, changes: { status: input.status ? { from: current.record.status, to: input.status } : undefined }, metadata: { caseType, note: input.note, changedFields: Object.keys(input).filter((key) => key !== "note") } } });
    return { id: updated.id, status: updated.status, updatedAt: updated.updatedAt.toISOString() };
  });
}

export async function createCaseTask(session: ClinicSession, rawCaseType: string, caseId: string, rawInput: unknown) {
  if (!can(session.role, "cases", "update")) throw new NetworkAccessError("Case task creation is not permitted for this role.", 403);
  const caseType = caseTypeSchema.parse(rawCaseType);
  const input = createCaseTaskSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const current = await requireCase(tx, session.organizationId, caseType, caseId);
    if (input.ownerId) {
      const owner = await tx.user.findFirst({ where: { id: input.ownerId, organizationId: session.organizationId, status: "active" }, select: { id: true } });
      if (!owner) throw new NetworkAccessError("Case task owner not found for this organization.", 404);
    }
    const task = await tx.caseTask.create({ data: { organizationId: session.organizationId, caseType, caseId, title: input.title, details: input.note, ownerId: input.ownerId ?? null, priority: input.priority, dueAt: dateOrNull(input.dueAt), status: "open", createdBy: session.userId } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "case.task_created", resourceType: caseResource(caseType), resourceId: caseId, patientId: current.record.patientId, metadata: { caseType, taskId: task.id, title: task.title, priority: task.priority, dueAt: iso(task.dueAt), note: input.note } } });
    return { ...task, dueAt: iso(task.dueAt), completedAt: iso(task.completedAt), createdAt: task.createdAt.toISOString(), updatedAt: task.updatedAt.toISOString() };
  });
}

export async function transitionCaseTask(session: ClinicSession, rawCaseType: string, caseId: string, taskId: string, rawInput: unknown) {
  if (!can(session.role, "cases", "update")) throw new NetworkAccessError("Case task updates are not permitted for this role.", 403);
  const caseType = caseTypeSchema.parse(rawCaseType);
  const input = caseTaskTransitionSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const currentCase = await requireCase(tx, session.organizationId, caseType, caseId);
    const task = await tx.caseTask.findFirst({ where: { id: taskId, organizationId: session.organizationId, caseType, caseId } });
    if (!task) throw new NetworkAccessError("Case task not found for this organization and case.", 404);
    let next: string;
    try { next = nextCaseTaskStatus(task.status, input.action); }
    catch (error) { throw new NetworkAccessError(error instanceof Error ? error.message : "Invalid task transition.", 409); }
    const updated = await tx.caseTask.update({ where: { id: task.id }, data: { status: next, completedAt: next === "completed" ? new Date() : null, details: task.details ? `${task.details}\n\n${input.note}` : input.note } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `case.task_${input.action}`, resourceType: caseResource(caseType), resourceId: caseId, patientId: currentCase.record.patientId, changes: { taskStatus: { from: task.status, to: updated.status } }, metadata: { caseType, taskId, note: input.note } } });
    return { id: updated.id, status: updated.status, completedAt: iso(updated.completedAt), updatedAt: updated.updatedAt.toISOString() };
  });
}

export async function createCasePacket(session: ClinicSession, rawCaseType: string, caseId: string, rawInput: unknown) {
  if (!can(session.role, "cases", "update")) throw new NetworkAccessError("Case packet creation is not permitted for this role.", 403);
  const caseType = caseTypeSchema.parse(rawCaseType);
  const input = createCasePacketSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const currentCase = await requireCase(tx, session.organizationId, caseType, caseId);
    const open = await tx.casePacket.findFirst({ where: { organizationId: session.organizationId, caseType, caseId, type: input.type, status: { in: ["draft", "needs_attention", "ready", "generated_manual"] } } });
    if (open) throw new NetworkAccessError("An active packet of this type already exists for the case.", 409);
    const checklist = buildCaseChecklist(caseType, input.type);
    const packet = await tx.casePacket.create({ data: { organizationId: session.organizationId, caseType, caseId, type: input.type, checklist: checklist as unknown as Prisma.InputJsonValue, status: "draft" } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "case.packet_created", resourceType: caseResource(caseType), resourceId: caseId, patientId: currentCase.record.patientId, metadata: { caseType, packetId: packet.id, packetType: input.type, note: input.note, manualFallback: true } } });
    return { id: packet.id, type: packet.type, status: packet.status, readiness: 0 };
  });
}

async function updateCasePacketStatus(tx: Transaction, organizationId: string, caseType: CaseType, caseId: string, status: string) {
  if (caseType === "nofault") await tx.noFaultCase.updateMany({ where: { id: caseId, organizationId }, data: { packetStatus: status } });
  else await tx.workersCompCase.updateMany({ where: { id: caseId, organizationId }, data: { packetStatus: status } });
}

export async function transitionCasePacket(session: ClinicSession, rawCaseType: string, caseId: string, packetId: string, rawInput: unknown) {
  if (!can(session.role, "cases", "update")) throw new NetworkAccessError("Case packet updates are not permitted for this role.", 403);
  const caseType = caseTypeSchema.parse(rawCaseType);
  const input = casePacketTransitionSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const currentCase = await requireCase(tx, session.organizationId, caseType, caseId);
    const packet = await tx.casePacket.findFirst({ where: { id: packetId, organizationId: session.organizationId, caseType, caseId } });
    if (!packet) throw new NetworkAccessError("Case packet not found for this organization and case.", 404);
    let checklist = parseCaseChecklist(packet.checklist);
    try { assertCasePacketTransition(packet.status, input.action, checklist); }
    catch (error) { throw new NetworkAccessError(error instanceof Error ? error.message : "Invalid packet transition.", 409); }
    if (input.action === "mark_item") {
      const found = checklist.some((item) => item.key === input.itemKey);
      if (!found) throw new NetworkAccessError("Packet checklist item was not found.", 404);
      checklist = checklist.map((item) => item.key === input.itemKey ? { ...item, complete: Boolean(input.complete), completedAt: input.complete ? new Date().toISOString() : null, completedBy: input.complete ? session.userId : null, note: input.note } : item);
    }
    const nextStatus = input.action === "mark_ready" ? "ready" : input.action === "generate_manual" ? "generated_manual" : input.action === "approve" ? "approved" : input.action === "reopen" ? "draft" : packet.status;
    const now = new Date();
    const updated = await tx.casePacket.update({
      where: { id: packet.id },
      data: {
        checklist: checklist as unknown as Prisma.InputJsonValue,
        status: nextStatus,
        ...(input.action === "generate_manual" ? { generatedAt: now, generatedBy: session.userId } : {}),
        ...(input.action === "approve" ? { approvedAt: now, approvedBy: session.userId } : {}),
        ...(input.action === "reopen" ? { generatedAt: null, generatedBy: null, approvedAt: null, approvedBy: null } : {}),
      },
    });
    await updateCasePacketStatus(tx, session.organizationId, caseType, caseId, nextStatus);
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `case.packet_${input.action}`, resourceType: caseResource(caseType), resourceId: caseId, patientId: currentCase.record.patientId, changes: { packetStatus: { from: packet.status, to: nextStatus } }, metadata: { caseType, packetId, packetType: packet.type, itemKey: input.itemKey ?? null, complete: input.complete ?? null, readiness: casePacketReadiness(checklist), note: input.note, manualFallback: input.action === "generate_manual", externalTransmission: false } } });
    return { id: updated.id, status: updated.status, checklist, readiness: casePacketReadiness(checklist), generatedAt: iso(updated.generatedAt), approvedAt: iso(updated.approvedAt) };
  });
}

export async function recordCasePacketExport(session: ClinicSession, rawCaseType: string, caseId: string, packetId: string) {
  if (!can(session.role, "cases", "update")) throw new NetworkAccessError("Case packet export is not permitted for this role.", 403);
  const caseType = caseTypeSchema.parse(rawCaseType);
  const room = await getCaseRoom(session, caseType, caseId);
  const packet = room.packets.find((item) => item.id === packetId);
  if (!packet) throw new NetworkAccessError("Case packet not found for this organization and case.", 404);
  if (!["generated_manual", "approved"].includes(packet.status)) throw new NetworkAccessError("Generate the reviewed manual packet before export.", 409);
  await db.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "case.packet_exported", resourceType: caseResource(caseType), resourceId: caseId, patientId: room.case.patientId, metadata: { caseType, packetId, packetType: packet.type, manualFallback: true, externalTransmission: false } } });
  return { room, packet };
}
