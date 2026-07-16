import "server-only";

import { AppointmentStatus } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { requestCapacitySchema } from "@/lib/capacity-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

export async function listCapacityWorkspace(organizationId: string) {
  const [listings, patients, requests] = await Promise.all([
    db.capacityListing.findMany({ where: { organizationId, status: { in: ["open", "open_demo"] } }, include: { facility: { select: { name: true, specialty: true } }, location: { select: { name: true } } }, orderBy: { startsAt: "asc" } }),
    db.patient.findMany({ where: { organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.appointment.findMany({ where: { organizationId, notes: { contains: "capacityListing:" } }, include: { patient: { select: { firstName: true, lastName: true, mrn: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  return {
    listings: listings.map((listing) => ({ id: listing.id, service: listing.service, facility: listing.facility?.name ?? "Facility pending", specialty: listing.facility?.specialty ?? listing.type, location: listing.location?.name ?? "Network location", startsAt: listing.startsAt.toISOString(), endsAt: listing.endsAt.toISOString(), acceptedPayers: listing.acceptedPayers, urgencyLevels: listing.urgencyLevels, status: listing.status })),
    patients: patients.map((patient) => ({ ...patient, name: `${patient.firstName} ${patient.lastName}` })),
    requests: requests.map((request) => ({ id: request.id, patientName: `${request.patient.firstName} ${request.patient.lastName}`, mrn: request.patient.mrn, status: request.status, startsAt: request.startsAt.toISOString(), notes: request.notes, createdAt: request.createdAt.toISOString() })),
  };
}

export type CapacityWorkspace = Awaited<ReturnType<typeof listCapacityWorkspace>>;

export async function requestCapacity(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "appointments", "create")) throw new NetworkAccessError("Capacity request permission is required.", 403);
  const input = requestCapacitySchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const [listing, patient] = await Promise.all([
      tx.capacityListing.findFirst({ where: { id: input.listingId, organizationId: session.organizationId, status: { in: ["open", "open_demo"] } } }),
      tx.patient.findFirst({ where: { id: input.patientId, organizationId: session.organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true } }),
    ]);
    if (!listing) throw new NetworkAccessError("Capacity listing is no longer open for this organization.", 404);
    if (!patient) throw new NetworkAccessError("Patient not found for this organization.", 404);
    const appointment = await tx.appointment.create({ data: { organizationId: session.organizationId, locationId: listing.locationId, patientId: patient.id, startsAt: listing.startsAt, endsAt: listing.endsAt, status: AppointmentStatus.REQUESTED, notes: `capacityListing:${listing.id} ${input.note}`, createdBy: session.userId } });
    const task = await tx.task.create({ data: { organizationId: session.organizationId, patientId: patient.id, category: "capacity_request", title: `Confirm ${listing.service} capacity request`, details: `appointment:${appointment.id} listing:${listing.id} ${input.note}`, priority: "high", riskLevel: "NEEDS_STAFF", dueAt: new Date(), status: "open", createdBy: session.userId } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "capacity.requested", resourceType: "appointment", resourceId: appointment.id, patientId: patient.id, metadata: { listingId: listing.id, taskId: task.id, manualConfirmationRequired: true } } });
    return appointment;
  });
}
