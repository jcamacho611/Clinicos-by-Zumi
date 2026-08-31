import "server-only";

import {
  Prisma,
  type EducationPlacement,
  type PlacementHourEvent as PlacementHourEventRow,
} from "@prisma/client";
import { db } from "@/lib/db";

export type SchoolSiteApprovalState = "pending" | "approved" | "rejected";
export type ParticipantApprovalState = "pending" | "accepted" | "declined";
export type PersistedPlacementStatus =
  | "matched"
  | "awaiting_approvals"
  | "approved"
  | "active"
  | "completed"
  | "cancelled";
export type PersistedPlacementHourStatus = "reported" | "attested" | "accepted" | "rejected";

export type PlacementApprovalProjection = {
  school: SchoolSiteApprovalState;
  site: SchoolSiteApprovalState;
  preceptor: ParticipantApprovalState;
  learner: ParticipantApprovalState;
};

export type ClinicalPlacementView = {
  id: string;
  learnerPersonId: string;
  learnerRelationshipId: string;
  enrollmentId: string;
  institutionId: string;
  programId: string | null;
  preceptorPersonId: string;
  preceptorRelationshipId: string | null;
  siteOrganizationId: string;
  siteLocationId: string;
  gridDemandId: string | null;
  gridOfferId: string | null;
  gridCompositionId: string | null;
  status: PersistedPlacementStatus;
  approvals: PlacementApprovalProjection;
  requiredMinutes: number;
  plannedStartAt: Date | null;
  plannedEndAt: Date | null;
  matchedAt: Date;
  assignedAt: Date | null;
  assignedByPersonId: string | null;
  actualStartAt: Date | null;
  activatedByPersonId: string | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  grantsProfessionalAuthority: false;
  grantsClinicalAuthority: false;
  grantsLicensure: false;
};

export type PlacementHourEventView = {
  id: string;
  placementId: string;
  serviceDate: Date;
  minutes: number;
  activity: string;
  status: PersistedPlacementHourStatus;
  reportedByPersonId: string;
  reviewedByPersonId: string | null;
  sourceType: string;
  sourceReference: string | null;
  evidenceReference: string | null;
  supersedesEventId: string | null;
  occurredAt: Date;
  createdAt: Date;
};

function schoolSiteState(value: string): SchoolSiteApprovalState {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

function participantState(value: string): ParticipantApprovalState {
  if (value === "accepted" || value === "declined") return value;
  return "pending";
}

function placementStatus(value: string): PersistedPlacementStatus {
  if (
    value === "matched" ||
    value === "awaiting_approvals" ||
    value === "approved" ||
    value === "active" ||
    value === "completed" ||
    value === "cancelled"
  ) {
    return value;
  }
  throw new Error(`Unknown clinical placement status: ${value}`);
}

function hourStatus(value: string): PersistedPlacementHourStatus {
  if (value === "reported" || value === "attested" || value === "accepted" || value === "rejected") {
    return value;
  }
  throw new Error(`Unknown placement hour status: ${value}`);
}

function approvals(row: EducationPlacement): PlacementApprovalProjection {
  return {
    school: schoolSiteState(row.schoolApprovalState),
    site: schoolSiteState(row.siteApprovalState),
    preceptor: participantState(row.preceptorApprovalState),
    learner: participantState(row.learnerApprovalState),
  };
}

function approvalsComplete(row: EducationPlacement) {
  const state = approvals(row);
  return (
    state.school === "approved" &&
    state.site === "approved" &&
    state.preceptor === "accepted" &&
    state.learner === "accepted"
  );
}

function toPlacementView(row: EducationPlacement): ClinicalPlacementView {
  return {
    id: row.id,
    learnerPersonId: row.learnerPersonId,
    learnerRelationshipId: row.learnerRelationshipId,
    enrollmentId: row.enrollmentId,
    institutionId: row.institutionId,
    programId: row.programId,
    preceptorPersonId: row.preceptorPersonId,
    preceptorRelationshipId: row.preceptorRelationshipId,
    siteOrganizationId: row.siteOrganizationId,
    siteLocationId: row.siteLocationId,
    gridDemandId: row.gridDemandId,
    gridOfferId: row.gridOfferId,
    gridCompositionId: row.gridCompositionId,
    status: placementStatus(row.status),
    approvals: approvals(row),
    requiredMinutes: row.requiredMinutes,
    plannedStartAt: row.plannedStartAt,
    plannedEndAt: row.plannedEndAt,
    matchedAt: row.matchedAt,
    assignedAt: row.assignedAt,
    assignedByPersonId: row.assignedByPersonId,
    actualStartAt: row.actualStartAt,
    activatedByPersonId: row.activatedByPersonId,
    completedAt: row.completedAt,
    cancelledAt: row.cancelledAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    grantsProfessionalAuthority: false,
    grantsClinicalAuthority: false,
    grantsLicensure: false,
  };
}

function toHourEventView(row: PlacementHourEventRow): PlacementHourEventView {
  return {
    id: row.id,
    placementId: row.placementId,
    serviceDate: row.serviceDate,
    minutes: row.minutes,
    activity: row.activity,
    status: hourStatus(row.status),
    reportedByPersonId: row.reportedByPersonId,
    reviewedByPersonId: row.reviewedByPersonId,
    sourceType: row.sourceType,
    sourceReference: row.sourceReference,
    evidenceReference: row.evidenceReference,
    supersedesEventId: row.supersedesEventId,
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
  };
}

function requireNonEmpty(value: string, label: string) {
  if (!value.trim()) throw new Error(`${label} is required.`);
}

function requirePositiveMinutes(value: number, label = "Placement minutes") {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
}

async function requirePerson(tx: Prisma.TransactionClient, personId: string, label: string) {
  const person = await tx.person.findUnique({ where: { id: personId }, select: { id: true } });
  if (!person) throw new Error(`${label} Person was not found.`);
}

export async function createClinicalPlacementRecord(input: {
  learnerPersonId: string;
  learnerRelationshipId: string;
  enrollmentId: string;
  institutionId: string;
  programId?: string | null;
  preceptorPersonId: string;
  preceptorRelationshipId?: string | null;
  siteOrganizationId: string;
  siteLocationId: string;
  gridDemandId?: string | null;
  gridOfferId?: string | null;
  gridCompositionId?: string | null;
  requiredMinutes: number;
  plannedStartAt?: Date | null;
  plannedEndAt?: Date | null;
  matchedAt: Date;
}): Promise<ClinicalPlacementView> {
  requirePositiveMinutes(input.requiredMinutes, "Clinical placement requiredMinutes");
  if (input.plannedStartAt && input.plannedEndAt && input.plannedStartAt > input.plannedEndAt) {
    throw new Error("Clinical placement plannedStartAt must not be after plannedEndAt.");
  }

  return db.$transaction(async (tx) => {
    const [
      learner,
      learnerRelationship,
      enrollment,
      institution,
      program,
      preceptor,
      preceptorRelationship,
      siteOrganization,
      siteLocation,
      existingOpenPlacement,
    ] = await Promise.all([
      tx.person.findUnique({ where: { id: input.learnerPersonId }, select: { id: true } }),
      tx.personRelationship.findUnique({ where: { id: input.learnerRelationshipId } }),
      tx.educationEnrollment.findUnique({ where: { id: input.enrollmentId } }),
      tx.educationInstitution.findUnique({ where: { id: input.institutionId } }),
      input.programId
        ? tx.educationProgram.findUnique({ where: { id: input.programId } })
        : Promise.resolve(null),
      tx.person.findUnique({ where: { id: input.preceptorPersonId }, select: { id: true } }),
      input.preceptorRelationshipId
        ? tx.personRelationship.findUnique({ where: { id: input.preceptorRelationshipId } })
        : Promise.resolve(null),
      tx.organization.findUnique({ where: { id: input.siteOrganizationId }, select: { id: true, status: true } }),
      tx.location.findUnique({ where: { id: input.siteLocationId }, select: { id: true, organizationId: true, status: true } }),
      tx.educationPlacement.findFirst({
        where: {
          enrollmentId: input.enrollmentId,
          status: { in: ["matched", "awaiting_approvals", "approved", "active"] },
        },
        select: { id: true },
      }),
    ]);

    if (!learner) throw new Error("Clinical placement learner Person was not found.");
    if (
      !learnerRelationship ||
      learnerRelationship.personId !== input.learnerPersonId ||
      learnerRelationship.relationshipType !== "learner" ||
      learnerRelationship.domainKind !== "education_enrollment" ||
      learnerRelationship.domainRecordId !== input.enrollmentId ||
      learnerRelationship.status !== "active"
    ) {
      throw new Error("Clinical placement learner relationship does not match the existing EDU enrollment.");
    }
    if (!enrollment || enrollment.institutionId !== input.institutionId || enrollment.status !== "active") {
      throw new Error("Clinical placement requires an active existing EDU enrollment for the institution.");
    }
    if (!institution || institution.status !== "active") {
      throw new Error("Clinical placement education institution was not found or is inactive.");
    }
    if (input.programId && (!program || program.institutionId !== input.institutionId)) {
      throw new Error("Clinical placement program does not belong to the education institution.");
    }
    if (!preceptor) throw new Error("Clinical placement preceptor Person was not found.");
    if (
      input.preceptorRelationshipId &&
      (!preceptorRelationship ||
        preceptorRelationship.personId !== input.preceptorPersonId ||
        preceptorRelationship.relationshipType !== "professional" ||
        preceptorRelationship.organizationId !== input.siteOrganizationId ||
        preceptorRelationship.status !== "active")
    ) {
      throw new Error("Clinical placement preceptor relationship trace does not match the site context.");
    }
    if (!siteOrganization || siteOrganization.status !== "active") {
      throw new Error("Clinical placement site organization was not found or is inactive.");
    }
    if (
      !siteLocation ||
      siteLocation.organizationId !== input.siteOrganizationId ||
      siteLocation.status !== "active"
    ) {
      throw new Error("Clinical placement site location does not belong to the active site organization.");
    }
    if (existingOpenPlacement) {
      throw new Error("Clinical placement enrollment already has an open placement.");
    }

    const row = await tx.educationPlacement.create({
      data: {
        learnerPersonId: input.learnerPersonId,
        learnerRelationshipId: input.learnerRelationshipId,
        enrollmentId: input.enrollmentId,
        institutionId: input.institutionId,
        programId: input.programId ?? null,
        preceptorPersonId: input.preceptorPersonId,
        preceptorRelationshipId: input.preceptorRelationshipId ?? null,
        siteOrganizationId: input.siteOrganizationId,
        siteLocationId: input.siteLocationId,
        gridDemandId: input.gridDemandId ?? null,
        gridOfferId: input.gridOfferId ?? null,
        gridCompositionId: input.gridCompositionId ?? null,
        status: "matched",
        schoolApprovalState: "pending",
        siteApprovalState: "pending",
        preceptorApprovalState: "pending",
        learnerApprovalState: "pending",
        requiredMinutes: input.requiredMinutes,
        plannedStartAt: input.plannedStartAt ?? null,
        plannedEndAt: input.plannedEndAt ?? null,
        matchedAt: input.matchedAt,
      },
    });

    return toPlacementView(row);
  });
}

export async function decidePlacementApproval(input: {
  placementId: string;
  approvalType: "school" | "site" | "preceptor" | "learner";
  decision: SchoolSiteApprovalState | ParticipantApprovalState;
  decidedByPersonId: string;
  evidenceReference: string;
  decidedAt: Date;
}): Promise<ClinicalPlacementView> {
  requireNonEmpty(input.evidenceReference, "Placement approval evidenceReference");

  return db.$transaction(async (tx) => {
    await requirePerson(tx, input.decidedByPersonId, "Placement approval actor");
    const existing = await tx.educationPlacement.findUnique({ where: { id: input.placementId } });
    if (!existing) throw new Error("Clinical placement was not found.");
    if (existing.status === "active" || existing.status === "completed" || existing.status === "cancelled") {
      throw new Error("Placement approvals cannot be changed after activation or terminal state.");
    }

    let updated: EducationPlacement;
    switch (input.approvalType) {
      case "school":
        if (input.decision !== "approved" && input.decision !== "rejected") {
          throw new Error("School approval decision must be approved or rejected.");
        }
        updated = await tx.educationPlacement.update({
          where: { id: input.placementId },
          data: {
            schoolApprovalState: input.decision,
            schoolDecidedByPersonId: input.decidedByPersonId,
            schoolEvidenceReference: input.evidenceReference,
            schoolDecidedAt: input.decidedAt,
          },
        });
        break;
      case "site":
        if (input.decision !== "approved" && input.decision !== "rejected") {
          throw new Error("Site approval decision must be approved or rejected.");
        }
        updated = await tx.educationPlacement.update({
          where: { id: input.placementId },
          data: {
            siteApprovalState: input.decision,
            siteDecidedByPersonId: input.decidedByPersonId,
            siteEvidenceReference: input.evidenceReference,
            siteDecidedAt: input.decidedAt,
          },
        });
        break;
      case "preceptor":
        if (input.decision !== "accepted" && input.decision !== "declined") {
          throw new Error("Preceptor approval decision must be accepted or declined.");
        }
        if (input.decidedByPersonId !== existing.preceptorPersonId) {
          throw new Error("Preceptor acceptance must be decided by the matched preceptor Person.");
        }
        updated = await tx.educationPlacement.update({
          where: { id: input.placementId },
          data: {
            preceptorApprovalState: input.decision,
            preceptorDecidedByPersonId: input.decidedByPersonId,
            preceptorEvidenceReference: input.evidenceReference,
            preceptorDecidedAt: input.decidedAt,
          },
        });
        break;
      case "learner":
        if (input.decision !== "accepted" && input.decision !== "declined") {
          throw new Error("Learner approval decision must be accepted or declined.");
        }
        if (input.decidedByPersonId !== existing.learnerPersonId) {
          throw new Error("Learner acceptance must be decided by the placement learner Person.");
        }
        updated = await tx.educationPlacement.update({
          where: { id: input.placementId },
          data: {
            learnerApprovalState: input.decision,
            learnerDecidedByPersonId: input.decidedByPersonId,
            learnerEvidenceReference: input.evidenceReference,
            learnerDecidedAt: input.decidedAt,
          },
        });
        break;
    }

    const targetStatus = approvalsComplete(updated) ? "approved" : "awaiting_approvals";
    if (updated.status !== targetStatus) {
      updated = await tx.educationPlacement.update({
        where: { id: updated.id },
        data: { status: targetStatus },
      });
    }
    return toPlacementView(updated);
  });
}

export async function assignClinicalPlacement(input: {
  placementId: string;
  assignedByPersonId: string;
  assignedAt: Date;
}): Promise<ClinicalPlacementView> {
  return db.$transaction(async (tx) => {
    await requirePerson(tx, input.assignedByPersonId, "Placement assignment actor");
    const row = await tx.educationPlacement.findUnique({ where: { id: input.placementId } });
    if (!row) throw new Error("Clinical placement was not found.");
    if (!approvalsComplete(row)) {
      throw new Error("School, site, preceptor, and learner approvals are required before placement assignment.");
    }
    if (row.status === "active" || row.status === "completed" || row.status === "cancelled") {
      throw new Error("Clinical placement cannot be assigned from its current lifecycle state.");
    }

    const updated = await tx.educationPlacement.update({
      where: { id: row.id },
      data: {
        status: "approved",
        assignedAt: input.assignedAt,
        assignedByPersonId: input.assignedByPersonId,
      },
    });
    return toPlacementView(updated);
  });
}

export async function activateClinicalPlacement(input: {
  placementId: string;
  activatedByPersonId: string;
  startedAt: Date;
}): Promise<ClinicalPlacementView> {
  return db.$transaction(async (tx) => {
    await requirePerson(tx, input.activatedByPersonId, "Placement activation actor");
    const row = await tx.educationPlacement.findUnique({ where: { id: input.placementId } });
    if (!row) throw new Error("Clinical placement was not found.");
    if (row.status !== "approved" || !row.assignedAt || !approvalsComplete(row)) {
      throw new Error("Clinical placement must be assigned with all approvals before activation.");
    }

    const updated = await tx.educationPlacement.update({
      where: { id: row.id },
      data: {
        status: "active",
        actualStartAt: input.startedAt,
        activatedByPersonId: input.activatedByPersonId,
      },
    });
    return toPlacementView(updated);
  });
}

export async function submitPlacementHours(input: {
  placementId: string;
  learnerPersonId: string;
  serviceDate: Date;
  minutes: number;
  activity: string;
  sourceType: string;
  sourceReference?: string | null;
  occurredAt: Date;
}): Promise<PlacementHourEventView> {
  requirePositiveMinutes(input.minutes);
  requireNonEmpty(input.activity, "Placement hour activity");
  requireNonEmpty(input.sourceType, "Placement hour sourceType");

  return db.$transaction(async (tx) => {
    const placement = await tx.educationPlacement.findUnique({ where: { id: input.placementId } });
    if (!placement) throw new Error("Clinical placement was not found.");
    if (placement.status !== "active") {
      throw new Error("Placement must be active before hours can be submitted.");
    }
    if (placement.learnerPersonId !== input.learnerPersonId) {
      throw new Error("Placement hours must be reported for the placement learner Person.");
    }
    if (placement.actualStartAt && input.occurredAt < placement.actualStartAt) {
      throw new Error("Placement hour report cannot occur before placement activation.");
    }

    const event = await tx.placementHourEvent.create({
      data: {
        placementId: placement.id,
        serviceDate: input.serviceDate,
        minutes: input.minutes,
        activity: input.activity,
        status: "reported",
        reportedByPersonId: input.learnerPersonId,
        reviewedByPersonId: null,
        sourceType: input.sourceType,
        sourceReference: input.sourceReference ?? null,
        evidenceReference: null,
        supersedesEventId: null,
        occurredAt: input.occurredAt,
      },
    });
    return toHourEventView(event);
  });
}

async function requireCurrentHourEvent(tx: Prisma.TransactionClient, eventId: string) {
  const event = await tx.placementHourEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Placement hour event was not found.");
  const superseding = await tx.placementHourEvent.findFirst({
    where: { placementId: event.placementId, supersedesEventId: event.id },
    select: { id: true },
  });
  if (superseding) throw new Error("Placement hour event has already been superseded.");
  return event;
}

export async function attestPlacementHours(input: {
  eventId: string;
  preceptorPersonId: string;
  evidenceReference: string;
  occurredAt: Date;
}): Promise<PlacementHourEventView> {
  requireNonEmpty(input.evidenceReference, "Preceptor attestation evidenceReference");

  return db.$transaction(async (tx) => {
    const event = await requireCurrentHourEvent(tx, input.eventId);
    if (event.status !== "reported") {
      throw new Error("Only a current reported placement hour event can be attested.");
    }
    const placement = await tx.educationPlacement.findUnique({ where: { id: event.placementId } });
    if (!placement || placement.status !== "active") {
      throw new Error("Placement must remain active for preceptor hour attestation.");
    }
    if (placement.preceptorPersonId !== input.preceptorPersonId) {
      throw new Error("Placement hour attestation must come from the matched preceptor Person.");
    }
    if (input.occurredAt < event.occurredAt) {
      throw new Error("Placement hour attestation cannot precede the report it supersedes.");
    }

    const next = await tx.placementHourEvent.create({
      data: {
        placementId: event.placementId,
        serviceDate: event.serviceDate,
        minutes: event.minutes,
        activity: event.activity,
        status: "attested",
        reportedByPersonId: event.reportedByPersonId,
        reviewedByPersonId: input.preceptorPersonId,
        sourceType: "preceptor_attestation",
        sourceReference: event.sourceReference,
        evidenceReference: input.evidenceReference,
        supersedesEventId: event.id,
        occurredAt: input.occurredAt,
      },
    });
    return toHourEventView(next);
  });
}

export async function acceptPlacementHours(input: {
  eventId: string;
  acceptedByPersonId: string;
  evidenceReference: string;
  occurredAt: Date;
}): Promise<PlacementHourEventView> {
  requireNonEmpty(input.evidenceReference, "Institution hour acceptance evidenceReference");

  return db.$transaction(async (tx) => {
    await requirePerson(tx, input.acceptedByPersonId, "Placement hour acceptance actor");
    const event = await requireCurrentHourEvent(tx, input.eventId);
    if (event.status !== "attested") {
      throw new Error("Only a current preceptor-attested placement hour event can be accepted.");
    }
    const placement = await tx.educationPlacement.findUnique({ where: { id: event.placementId } });
    if (!placement || placement.status !== "active") {
      throw new Error("Placement must remain active for institution hour acceptance.");
    }
    if (input.occurredAt < event.occurredAt) {
      throw new Error("Placement hour acceptance cannot precede the attestation it supersedes.");
    }

    const next = await tx.placementHourEvent.create({
      data: {
        placementId: event.placementId,
        serviceDate: event.serviceDate,
        minutes: event.minutes,
        activity: event.activity,
        status: "accepted",
        reportedByPersonId: event.reportedByPersonId,
        reviewedByPersonId: input.acceptedByPersonId,
        sourceType: "institution_acceptance",
        sourceReference: event.sourceReference,
        evidenceReference: input.evidenceReference,
        supersedesEventId: event.id,
        occurredAt: input.occurredAt,
      },
    });
    return toHourEventView(next);
  });
}

export type ClinicalPlacementProgress = {
  placement: ClinicalPlacementView;
  approvals: PlacementApprovalProjection;
  canAssign: boolean;
  canActivate: boolean;
  submittedMinutes: number;
  attestedMinutes: number;
  acceptedMinutes: number;
  remainingMinutes: number;
  hoursComplete: boolean;
  hourEvents: PlacementHourEventView[];
  grantsProfessionalAuthority: false;
  grantsClinicalAuthority: false;
  grantsLicensure: false;
};

export async function getClinicalPlacementProgress(input: {
  placementId?: string;
  learnerPersonId?: string;
}): Promise<ClinicalPlacementProgress> {
  if (!input.placementId && !input.learnerPersonId) {
    throw new Error("Placement progress requires placementId or learnerPersonId.");
  }

  const row = input.placementId
    ? await db.educationPlacement.findUnique({ where: { id: input.placementId } })
    : await db.educationPlacement.findFirst({
        where: { learnerPersonId: input.learnerPersonId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      });
  if (!row) throw new Error("Clinical placement was not found.");

  const rows = await db.placementHourEvent.findMany({
    where: { placementId: row.id },
    orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });
  const supersededIds = new Set(
    rows.map((event) => event.supersedesEventId).filter((id): id is string => Boolean(id)),
  );
  const current = rows.filter((event) => !supersededIds.has(event.id));
  const submittedMinutes = current
    .filter((event) => event.status === "reported" || event.status === "attested" || event.status === "accepted")
    .reduce((total, event) => total + event.minutes, 0);
  const attestedMinutes = current
    .filter((event) => event.status === "attested" || event.status === "accepted")
    .reduce((total, event) => total + event.minutes, 0);
  const acceptedMinutes = current
    .filter((event) => event.status === "accepted")
    .reduce((total, event) => total + event.minutes, 0);
  const remainingMinutes = Math.max(0, row.requiredMinutes - acceptedMinutes);
  const canAssign = approvalsComplete(row) && !["active", "completed", "cancelled"].includes(row.status);
  const canActivate = approvalsComplete(row) && Boolean(row.assignedAt) && row.status === "approved";

  return {
    placement: toPlacementView(row),
    approvals: approvals(row),
    canAssign,
    canActivate,
    submittedMinutes,
    attestedMinutes,
    acceptedMinutes,
    remainingMinutes,
    hoursComplete: acceptedMinutes >= row.requiredMinutes,
    hourEvents: rows.map(toHourEventView),
    grantsProfessionalAuthority: false,
    grantsClinicalAuthority: false,
    grantsLicensure: false,
  };
}
