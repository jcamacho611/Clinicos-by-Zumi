import "server-only";

import { db } from "@/lib/db";

export async function getConnectedCareOverview(organizationId: string) {
  const [connections, careTeams, capacity, passports, episodes] = await Promise.all([
    db.networkConnection.findMany({
      where: { OR: [{ sourceOrganizationId: organizationId }, { targetOrganizationId: organizationId }] },
      include: { sourceOrganization: { select: { name: true } }, targetOrganization: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.careTeamRoom.findMany({
      where: { organizationId },
      include: { patient: { select: { firstName: true, lastName: true, mrn: true } }, members: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.capacityListing.findMany({
      where: { organizationId },
      include: { facility: { select: { name: true, specialty: true } }, location: { select: { name: true } } },
      orderBy: { startsAt: "asc" },
    }),
    db.healthPassport.findMany({
      where: { organizationId },
      include: { patient: { select: { firstName: true, lastName: true, mrn: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.episodeRoom.findMany({
      where: { organizationId },
      include: { patient: { select: { firstName: true, lastName: true, mrn: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    connections: connections.map((connection) => ({
      id: connection.id,
      source: connection.sourceOrganization.name,
      target: connection.targetOrganization.name,
      status: connection.status,
      trustLevel: connection.trustLevel,
      allowedPurposes: connection.allowedPurposes,
    })),
    careTeams: careTeams.map((room) => ({
      id: room.id,
      name: room.name,
      patientName: `${room.patient.firstName} ${room.patient.lastName}`,
      mrn: room.patient.mrn,
      memberCount: room.members.length,
      activeMemberCount: room.members.filter((member) => member.status === "active").length,
      status: room.status,
      sharedPlan: room.sharedPlan,
    })),
    capacity: capacity.map((listing) => ({
      id: listing.id,
      service: listing.service,
      facility: listing.facility?.name ?? "Facility pending",
      specialty: listing.facility?.specialty ?? listing.type,
      location: listing.location?.name ?? "Network location",
      startsAt: listing.startsAt.toISOString(),
      endsAt: listing.endsAt.toISOString(),
      acceptedPayers: listing.acceptedPayers,
      urgencyLevels: listing.urgencyLevels,
      status: listing.status,
    })),
    passports: passports.map((passport) => ({
      id: passport.id,
      patientName: `${passport.patient.firstName} ${passport.patient.lastName}`,
      mrn: passport.patient.mrn,
      status: passport.status,
      lastConfirmedAt: passport.lastConfirmedAt?.toISOString() ?? null,
      summary: passport.summary,
    })),
    episodes: episodes.map((episode) => ({
      id: episode.id,
      title: episode.title,
      type: episode.type,
      patientName: `${episode.patient.firstName} ${episode.patient.lastName}`,
      mrn: episode.patient.mrn,
      status: episode.status,
      readinessScore: episode.readinessScore,
      nextAction: episode.nextAction,
      responsibleRole: episode.responsibleRole,
      riskLevel: episode.riskLevel,
    })),
  };
}

export type ConnectedCareOverview = Awaited<ReturnType<typeof getConnectedCareOverview>>;
