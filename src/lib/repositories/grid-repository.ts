import "server-only";

import { Prisma, RiskLevel } from "@prisma/client";
import { hash } from "bcryptjs";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import {
  canTransitionGridProvider,
  canTransitionGridRequest,
  buildZumiGridGuidance,
  gridAvailabilitySchema,
  gridContractorEnrollmentSchema,
  gridContractorPreferencesSchema,
  gridCredentialReviewSchema,
  gridLocationSchema,
  gridMalpracticeReviewSchema,
  gridPayoutTransitionSchema,
  gridProviderProfileSchema,
  gridProviderTransitionSchema,
  gridRequestSchema,
  gridRequestTransitionSchema,
  gridServiceListingSchema,
  providerReadyForGrid,
} from "@/lib/grid-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function requirePermission(session: ClinicSession, resource: "network" | "credentialing" | "grid", action: "read" | "create" | "update" | "manage") {
  if (!can(session.role, resource, action)) throw new NetworkAccessError("Grid access is not permitted for this role.", 403);
}

async function requireSyntheticOrganization(organizationId: string, client: Prisma.TransactionClient | typeof db = db) {
  const organization = await client.organization.findUnique({ where: { id: organizationId }, select: { demoMode: true } });
  if (!organization) throw new NetworkAccessError("Organization not found.", 404);
  if (!organization.demoMode) throw new NetworkAccessError("This Grid workflow requires production review before real patient or provider data can be used.", 409);
}

function dateOrNull(value?: string | null) {
  return value ? new Date(value) : null;
}

function formatAddress(address: Prisma.JsonValue | null, city: string | null, state: string | null, zip: string | null) {
  const record = address && typeof address === "object" && !Array.isArray(address) ? address as Record<string, unknown> : {};
  const line = typeof record.line1 === "string" ? record.line1 : "Address held by listing owner";
  return [line, city ?? record.city, state ?? record.state, zip ?? record.postalCode].filter(Boolean).join(", ");
}

function credentialSummary(credential: { type: string; state: string | null; expiresAt: Date | null; verificationStatus: string }) {
  return {
    type: credential.type,
    state: credential.state,
    expiresAt: credential.expiresAt?.toISOString() ?? null,
    verificationStatus: credential.verificationStatus,
  };
}

export async function listGridWorkspace(session: ClinicSession) {
  if (!can(session.role, "grid", "read") && !can(session.role, "network", "read") && !can(session.role, "credentialing", "read")) {
    throw new NetworkAccessError("Grid access is not permitted for this role.", 403);
  }

  const now = new Date();
  const currentOrganization = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { demoMode: true, status: true },
  });
  if (!currentOrganization || currentOrganization.status !== "active") {
    throw new NetworkAccessError("Current organization not found.", 404);
  }
  const contractorProvider = session.role === "contractor"
    ? await db.provider.findFirst({ where: { organizationId: session.organizationId, userId: session.userId, engagementType: "independent_contractor" }, select: { id: true } })
    : null;
  if (session.role === "contractor" && !contractorProvider) throw new NetworkAccessError("Contractor GRID profile not found.", 404);

  const [providers, services, locations, requests, handoffs, capacities, patients, payouts] = await Promise.all([
    db.provider.findMany({
      where: contractorProvider ? { id: contractorProvider.id } : {
        OR: [
          { organizationId: session.organizationId },
          { status: "active", verificationStatus: "verified" },
        ],
      },
      include: {
        organization: { select: { id: true, name: true, clinicType: true, demoMode: true } },
        credentials: { orderBy: { expiresAt: "asc" } },
        gridServiceListings: { orderBy: { serviceName: "asc" } },
        availability: { include: { location: { select: { id: true, name: true } } }, orderBy: [{ weekday: "asc" }, { startsAt: "asc" }] },
      },
      orderBy: [{ verificationStatus: "asc" }, { displayName: "asc" }],
    }),
    db.gridServiceListing.findMany({
      where: contractorProvider
        ? { providerId: contractorProvider.id }
        : { OR: [{ organizationId: session.organizationId }, { status: "active", provider: { status: "active", verificationStatus: "verified" } }] },
      include: { provider: { include: { organization: { select: { id: true, name: true } }, credentials: true } } },
      orderBy: [{ status: "asc" }, { category: "asc" }, { serviceName: "asc" }],
    }),
    db.location.findMany({
      where: { OR: [{ organizationId: session.organizationId }, { marketplaceVisible: true, status: "active" }] },
      include: { organization: { select: { id: true, name: true, clinicType: true } } },
      orderBy: [{ marketplaceVisible: "desc" }, { name: "asc" }],
    }),
    db.gridRequest.findMany({
      where: contractorProvider
        ? { providerId: contractorProvider.id }
        : { OR: [{ organizationId: session.organizationId }, { destinationOrganizationId: session.organizationId }] },
      include: {
        organization: { select: { id: true, name: true } },
        destinationOrganization: { select: { id: true, name: true } },
        serviceListing: { select: { id: true, serviceName: true, category: true, requiresMedicalReview: true, requiresConsent: true, requiresDeposit: true } },
        provider: { select: { id: true, displayName: true, providerType: true, verificationStatus: true } },
        location: { select: { id: true, name: true, locationType: true } },
        events: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    contractorProvider ? Promise.resolve([]) : db.careHandoff.findMany({
      where: { organizationId: session.organizationId },
      include: { destinationOrganization: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    contractorProvider ? Promise.resolve([]) : db.capacityListing.findMany({
      where: { status: { in: ["open", "open_demo"] } },
      include: { organization: { select: { id: true, name: true } }, location: { select: { id: true, name: true } }, facility: { select: { id: true, name: true, type: true } } },
      orderBy: { startsAt: "asc" },
      take: 100,
    }),
    currentOrganization.demoMode && !contractorProvider
      ? db.patient.findMany({ where: { organizationId: session.organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }], take: 100 })
      : Promise.resolve([]),
    db.gridPayout.findMany({
      where: contractorProvider ? { providerId: contractorProvider.id } : { organizationId: session.organizationId },
      include: { provider: { select: { displayName: true } }, gridRequest: { include: { serviceListing: { select: { serviceName: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const canSeeSensitive = can(session.role, "credentialing", "read") || can(session.role, "grid", "read");
  const providerViews = providers.map((provider) => {
    const selfManaged = provider.userId === session.userId;
    const owned = contractorProvider ? selfManaged : provider.organizationId === session.organizationId;
    const readiness = providerReadyForGrid(provider, now);
    return {
      id: provider.id,
      organizationId: provider.organizationId,
      organizationName: provider.organization.name,
      organizationType: provider.organization.clinicType,
      displayName: provider.displayName,
      engagementType: provider.engagementType,
      selfManaged,
      legalName: owned && canSeeSensitive ? provider.legalName : null,
      credential: provider.credential,
      providerType: provider.providerType,
      specialty: provider.specialty,
      subspecialty: provider.subspecialty,
      npi: owned && canSeeSensitive ? provider.npi : null,
      malpracticeCarrier: owned && canSeeSensitive ? provider.malpracticeCarrier : null,
      malpracticePolicyNumber: owned && canSeeSensitive ? provider.malpracticePolicyNumber : null,
      malpracticeExpiration: provider.malpracticeExpiration?.toISOString() ?? null,
      malpracticeCurrent: provider.malpracticeVerificationStatus === "verified" && Boolean(provider.malpracticeExpiration && provider.malpracticeExpiration > now),
      malpracticeVerificationStatus: provider.malpracticeVerificationStatus,
      malpracticeCoverageAmountCents: owned && canSeeSensitive ? provider.malpracticeCoverageAmountCents : null,
      malpracticeEvidenceReference: owned && canSeeSensitive ? provider.malpracticeEvidenceReference : null,
      malpracticeReviewNotes: owned && canSeeSensitive ? provider.malpracticeReviewNotes : null,
      certifications: provider.certifications,
      servicesOffered: provider.servicesOffered,
      experienceLevel: provider.experienceLevel,
      bio: provider.bio,
      profilePhoto: provider.profilePhoto,
      serviceLocations: provider.serviceLocations,
      mobileServiceAllowed: provider.mobileServiceAllowed,
      chairRentalAllowed: provider.chairRentalAllowed,
      partnerLocationAllowed: provider.serviceLocations.includes("Partner locations"),
      atHomeAllowed: provider.atHomeAllowed,
      travelRadiusMiles: provider.travelRadiusMiles,
      onCallNow: provider.onCallNow,
      status: provider.status,
      verificationStatus: provider.verificationStatus,
      approvedAt: provider.approvedAt?.toISOString() ?? null,
      renewalDueAt: provider.renewalDueAt?.toISOString() ?? null,
      readyForGrid: readiness,
      owned,
      credentialSummary: provider.credentials.map(credentialSummary),
      credentialDetails: owned && canSeeSensitive ? provider.credentials.map((credential) => ({
        ...credentialSummary(credential),
        id: credential.id,
        number: credential.number,
        verificationSource: credential.verificationSource,
        evidenceReference: credential.evidenceReference,
        reviewNotes: credential.reviewNotes,
      })) : [],
      services: provider.gridServiceListings.map((service) => ({ id: service.id, serviceName: service.serviceName, category: service.category, status: service.status })),
      availability: provider.availability.map((slot) => ({
        id: slot.id,
        dayOfWeek: slot.weekday,
        startTime: slot.startsAt,
        endTime: slot.endsAt,
        locationType: slot.locationType,
        location: slot.location?.name ?? null,
        mobileRadius: slot.mobileRadius,
        onCall: slot.onCall,
        status: slot.status,
      })),
    };
  });

  const serviceViews = services.map((service) => ({
    id: service.id,
    organizationId: service.organizationId,
    providerId: service.providerId,
    providerName: service.provider.displayName,
    providerType: service.provider.providerType,
    organizationName: service.provider.organization.name,
    serviceName: service.serviceName,
    category: service.category,
    description: service.description,
    priceLowCents: service.priceLowCents,
    priceHighCents: service.priceHighCents,
    requiresMedicalReview: service.requiresMedicalReview,
    requiresConsent: service.requiresConsent,
    requiresDeposit: service.requiresDeposit,
    mobileAllowed: service.mobileAllowed,
    clinicLocationAllowed: service.clinicLocationAllowed,
    chairRentalAllowed: service.chairRentalAllowed,
    status: service.status,
    providerReady: providerReadyForGrid(service.provider, now),
    owned: service.organizationId === session.organizationId,
  }));

  const locationViews = locations.map((location) => ({
    id: location.id,
    organizationId: location.organizationId,
    organizationName: location.organization.name,
    organizationType: location.organization.clinicType,
    locationName: location.name,
    locationType: location.locationType,
    address: formatAddress(location.address, location.city, location.state, location.zip),
    city: location.city,
    state: location.state,
    zip: location.zip,
    roomTypes: location.roomTypes,
    chairRentalAvailable: location.chairRentalAvailable,
    hourlyRateCents: location.hourlyRateCents,
    dailyRateCents: location.dailyRateCents,
    servicesAllowed: location.servicesAllowed,
    credentialRequirements: location.credentialRequirements,
    insuranceRequirements: location.insuranceRequirements,
    marketplaceVisible: location.marketplaceVisible,
    status: location.status,
    owned: location.organizationId === session.organizationId,
  }));

  const requestViews = requests.map((request) => ({
    id: request.id,
    contractorDecision: session.role === "contractor",
    direction: request.organizationId === session.organizationId ? "outbound" : "inbound",
    originOrganization: request.organization.name,
    destinationOrganization: request.destinationOrganization.name,
    syntheticClientLabel: request.syntheticClientLabel,
    syntheticClientReference: request.syntheticClientReference,
    serviceName: request.serviceListing.serviceName,
    serviceCategory: request.serviceListing.category,
    providerName: request.provider.displayName,
    providerType: request.provider.providerType,
    providerVerificationStatus: request.provider.verificationStatus,
    locationName: request.location?.name ?? "Location review pending",
    locationType: request.locationType,
    requestedStartAt: request.requestedStartAt.toISOString(),
    requestedEndAt: request.requestedEndAt?.toISOString() ?? null,
    counterStartAt: request.counterStartAt?.toISOString() ?? null,
    safetyFlags: request.safetyFlags,
    requiredDocuments: request.requiredDocuments,
    requiredConsent: request.requiredConsent,
    consentStatus: request.consentStatus,
    depositStatus: request.depositStatus,
    paymentStatus: request.paymentStatus,
    status: request.status,
    notes: request.notes,
    requiresMedicalReview: request.serviceListing.requiresMedicalReview,
    updatedAt: request.updatedAt.toISOString(),
    events: request.events.map((event) => ({
      id: event.id,
      action: event.action,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      note: event.note,
      createdAt: event.createdAt.toISOString(),
    })),
  }));

  const payoutViews = payouts.map((payout) => ({
    id: payout.id,
    providerName: payout.provider.displayName,
    requestId: payout.gridRequestId,
    serviceName: payout.gridRequest.serviceListing.serviceName,
    grossAmountCents: payout.grossAmountCents,
    platformFeeCents: payout.platformFeeCents,
    netAmountCents: payout.netAmountCents,
    status: payout.status,
    approvedAt: payout.approvedAt?.toISOString() ?? null,
    paidAt: payout.paidAt?.toISOString() ?? null,
    externalReference: payout.externalReference,
    notes: payout.notes,
    createdAt: payout.createdAt.toISOString(),
  }));

  const expiringCredentials = providerViews.filter((provider) => provider.owned && (provider.renewalDueAt ? new Date(provider.renewalDueAt) <= new Date(now.getTime() + 90 * 86_400_000) : !provider.malpracticeCurrent));
  const openStatuses = new Set(["draft", "requested", "accepted", "countered", "provider_review", "location_review", "credential_check", "pending_deposit", "escalated"]);
  const availableRooms = locationViews.filter((location) => location.chairRentalAvailable && location.status === "active");
  const contractorProfile = contractorProvider ? providerViews[0] : null;
  const estimatedPayoutCents = payoutViews.filter((payout) => ["estimated", "approved"].includes(payout.status)).reduce((sum, payout) => sum + payout.netAmountCents, 0);
  const guidance = contractorProfile ? buildZumiGridGuidance({
    verificationStatus: contractorProfile.verificationStatus,
    malpracticeVerificationStatus: contractorProfile.malpracticeVerificationStatus,
    currentCredentials: contractorProfile.credentialSummary.filter((credential) => credential.verificationStatus === "verified").length,
    availabilitySlots: contractorProfile.availability.length,
    openRequests: requestViews.filter((request) => openStatuses.has(request.status)).length,
    estimatedPayoutCents,
  }) : null;

  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: "grid.workspace_accessed",
      resourceType: "grid_workspace",
      resourceId: session.organizationId,
      metadata: { providerCount: providerViews.length, requestCount: requestViews.length, crossOrganizationDirectory: !contractorProvider, contractorView: Boolean(contractorProvider), chartDataShared: false },
    },
  });

  return {
    generatedAt: now.toISOString(),
    mode: currentOrganization.demoMode ? "synthetic_demo" as const : "requires_production_review" as const,
    providers: providerViews,
    services: serviceViews,
    locations: locationViews,
    requests: requestViews,
    payouts: payoutViews,
    guidance,
    viewer: { role: session.role, isContractor: session.role === "contractor" },
    patients: patients.map((patient) => ({ id: patient.id, name: `${patient.firstName} ${patient.lastName}`, mrn: patient.mrn, synthetic: true })),
    handoffs: handoffs.map((handoff) => ({
      id: handoff.id,
      type: handoff.type,
      category: handoff.category,
      destinationOrganizationName: handoff.destinationOrganization?.name ?? "Internal care team",
      requestedAction: handoff.requestedAction,
      priority: handoff.priority,
      status: handoff.status,
      deliveryMethod: handoff.deliveryMethod,
      humanReviewRequired: handoff.humanReviewRequired,
      dueAt: handoff.dueAt?.toISOString() ?? null,
      updatedAt: handoff.updatedAt.toISOString(),
    })),
    capacities: capacities.map((capacity) => ({ id: capacity.id, organizationName: capacity.organization.name, locationName: capacity.location?.name ?? "Network location", facilityName: capacity.facility?.name ?? "Facility pending", type: capacity.type, service: capacity.service, startsAt: capacity.startsAt.toISOString(), endsAt: capacity.endsAt.toISOString(), acceptedPayers: capacity.acceptedPayers, urgencyLevels: capacity.urgencyLevels, status: capacity.status })),
    metrics: {
      providersPendingVerification: providerViews.filter((provider) => provider.owned && provider.verificationStatus !== "verified").length,
      openServiceRequests: requestViews.filter((request) => openStatuses.has(request.status)).length,
      availableRooms: availableRooms.length,
      handoffsAwaitingResponse: handoffs.filter((handoff) => !["resolved", "completed", "cancelled"].includes(handoff.status)).length,
      capacityListings: capacities.length,
      expiringCredentials: expiringCredentials.length,
      revenueOpportunitiesCents: serviceViews.filter((service) => service.status === "active").reduce((sum, service) => sum + service.priceLowCents, 0),
      estimatedPayoutCents,
    },
    permissions: {
      canCreateNetworkRequest: can(session.role, "network", "create"),
      canUpdateNetworkRequest: can(session.role, "network", "update") || can(session.role, "grid", "update"),
      canManageNetwork: can(session.role, "network", "manage"),
      canCreateCredentialing: can(session.role, "credentialing", "create"),
      canManageCredentialing: can(session.role, "credentialing", "manage"),
      canUpdateCredentialing: can(session.role, "credentialing", "update"),
      canManageOwnGrid: can(session.role, "grid", "update"),
    },
  };
}

export type GridWorkspace = Awaited<ReturnType<typeof listGridWorkspace>>;

async function restrictContractorAccess(tx: Prisma.TransactionClient, provider: { id: string; userId: string | null }) {
  await Promise.all([
    tx.provider.update({ where: { id: provider.id }, data: { onCallNow: false, status: "pending_approval" } }),
    tx.providerAvailability.updateMany({ where: { providerId: provider.id }, data: { onCall: false, status: "paused" } }),
    tx.gridServiceListing.updateMany({ where: { providerId: provider.id, status: "active" }, data: { status: "paused" } }),
    provider.userId ? tx.user.update({ where: { id: provider.userId }, data: { status: "pending_approval" } }) : Promise.resolve(),
    provider.userId ? tx.authSession.updateMany({ where: { userId: provider.userId, revokedAt: null }, data: { revokedAt: new Date() } }) : Promise.resolve(),
  ]);
}

export async function createGridContractorEnrollment(rawInput: unknown) {
  const input = gridContractorEnrollmentSchema.parse(rawInput);
  const passwordHash = await hash(input.password, 12);
  return db.$transaction(async (tx) => {
    const organization = await tx.organization.findUnique({ where: { slug: input.organizationSlug }, select: { id: true, demoMode: true, status: true } });
    if (!organization || organization.status !== "active") throw new NetworkAccessError("The selected GRID organization is unavailable.", 404);
    if (!organization.demoMode) throw new NetworkAccessError("Public contractor enrollment requires production compliance review before real information can be accepted.", 409);
    const existing = await tx.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (existing) throw new NetworkAccessError("An account already exists for this email address.", 409);

    const user = await tx.user.create({
      data: {
        organizationId: organization.id,
        email: input.email,
        name: input.fullName,
        roleKey: "contractor",
        status: "pending_approval",
        authCredential: { create: { passwordHash } },
      },
    });
    const provider = await tx.provider.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        name: input.fullName,
        displayName: input.fullName,
        legalName: input.fullName,
        engagementType: "independent_contractor",
        contactEmail: input.email,
        contactPhone: input.phone,
        credential: input.credential,
        providerType: input.providerType,
        specialty: input.specialty,
        malpracticeCarrier: input.malpracticeCarrier,
        malpracticePolicyNumber: input.malpracticePolicyNumber,
        malpracticeExpiration: new Date(input.malpracticeExpiration),
        malpracticeCoverageAmountCents: input.malpracticeCoverageAmountCents,
        malpracticeEvidenceReference: input.malpracticeEvidenceReference,
        malpracticeVerificationStatus: "pending",
        certifications: input.certifications,
        services: input.servicesOffered,
        servicesOffered: input.servicesOffered,
        experienceLevel: input.experienceLevel,
        bio: input.bio,
        serviceLocations: [input.serviceArea, ...(input.partnerLocationAllowed ? ["Partner locations"] : [])],
        mobileServiceAllowed: input.mobileServiceAllowed,
        chairRentalAllowed: input.chairRentalAllowed,
        atHomeAllowed: input.atHomeAllowed,
        travelRadiusMiles: input.travelRadiusMiles,
        onCallNow: false,
        verificationStatus: "submitted",
        applicationSubmittedAt: new Date(),
        status: "pending_approval",
        credentials: {
          create: {
            organizationId: organization.id,
            type: input.licenseType,
            number: input.licenseNumber,
            state: input.licenseState,
            expiresAt: new Date(input.licenseExpiration),
            status: "active",
            verificationStatus: "pending",
            verificationSource: "GRID human primary-source review queue",
            evidenceReference: input.licenseEvidenceReference,
          },
        },
        availability: {
          create: input.availability.map((slot) => ({
            organizationId: organization.id,
            weekday: slot.dayOfWeek,
            startsAt: slot.startTime,
            endsAt: slot.endTime,
            locationType: slot.locationType,
            mobileRadius: input.travelRadiusMiles,
            onCall: false,
            status: "draft",
          })),
        },
      },
    });
    await Promise.all([
      tx.task.create({ data: { organizationId: organization.id, category: "grid_contractor_review", title: `Review contractor application: ${provider.displayName}`, details: "Verify license evidence, malpractice policy, services, scope, work settings, and availability before activating account access.", priority: "high", riskLevel: RiskLevel.NEEDS_STAFF, status: "open", ownerId: "credentialing", createdBy: user.id } }),
      tx.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, actorType: "contractor_applicant", action: "grid.contractor_enrolled", resourceType: "provider", resourceId: provider.id, metadata: { syntheticDemo: true, humanApprovalRequired: true, accountStatus: "pending_approval", requestedOnCall: input.onCallNow } } }),
    ]);
    return { providerId: provider.id, status: provider.verificationStatus, accountStatus: user.status };
  });
}

export async function updateGridContractorPreferences(session: ClinicSession, rawInput: unknown) {
  requirePermission(session, "grid", "update");
  const input = gridContractorPreferencesSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const provider = await tx.provider.findFirst({ where: { organizationId: session.organizationId, userId: session.userId, engagementType: "independent_contractor" }, include: { credentials: true } });
    if (!provider) throw new NetworkAccessError("Contractor GRID profile not found.", 404);
    const onCallNow = input.onCallNow && providerReadyForGrid(provider);
    const updated = await tx.provider.update({
      where: { id: provider.id },
      data: {
        serviceLocations: [input.serviceArea, ...(input.partnerLocationAllowed ? ["Partner locations"] : [])],
        travelRadiusMiles: input.travelRadiusMiles,
        mobileServiceAllowed: input.mobileServiceAllowed,
        chairRentalAllowed: input.chairRentalAllowed,
        atHomeAllowed: input.atHomeAllowed,
        onCallNow,
      },
    });
    await tx.providerAvailability.updateMany({ where: { providerId: provider.id, status: "active" }, data: { onCall: onCallNow } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "contractor", action: "grid.contractor_preferences_updated", resourceType: "provider", resourceId: provider.id, metadata: { onCallNow, requestedOnCall: input.onCallNow, travelRadiusMiles: input.travelRadiusMiles } } });
    return updated;
  });
}

export async function reviewGridCredential(session: ClinicSession, providerId: string, credentialId: string, rawInput: unknown) {
  requirePermission(session, "credentialing", "manage");
  const input = gridCredentialReviewSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const credential = await tx.providerCredential.findFirst({ where: { id: credentialId, providerId, organizationId: session.organizationId }, include: { provider: true } });
    if (!credential) throw new NetworkAccessError("Credential record not found.", 404);
    const updated = await tx.providerCredential.update({ where: { id: credential.id }, data: { verificationStatus: input.decision, verificationSource: input.verificationSource, primarySourceVerifiedAt: input.decision === "verified" ? new Date() : null, verifiedBy: session.userId, reviewNotes: input.note } });
    if (input.decision === "rejected") {
      await tx.provider.update({ where: { id: providerId }, data: { verificationStatus: "needs_review" } });
      if (credential.provider.engagementType === "independent_contractor") await restrictContractorAccess(tx, credential.provider);
    }
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `grid.credential_${input.decision}`, resourceType: "provider_credential", resourceId: credential.id, metadata: { providerId, note: input.note, verificationSource: input.verificationSource, humanDecision: true } } });
    return updated;
  });
}

export async function reviewGridMalpractice(session: ClinicSession, providerId: string, rawInput: unknown) {
  requirePermission(session, "credentialing", "manage");
  const input = gridMalpracticeReviewSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const provider = await tx.provider.findFirst({ where: { id: providerId, organizationId: session.organizationId } });
    if (!provider) throw new NetworkAccessError("Provider profile not found.", 404);
    const updated = await tx.provider.update({ where: { id: provider.id }, data: { malpracticeVerificationStatus: input.decision, malpracticeVerifiedAt: input.decision === "verified" ? new Date() : null, malpracticeVerifiedBy: session.userId, malpracticeReviewNotes: input.note, ...(input.decision === "rejected" ? { verificationStatus: "needs_review" } : {}) } });
    if (input.decision === "rejected" && provider.engagementType === "independent_contractor") await restrictContractorAccess(tx, provider);
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `grid.malpractice_${input.decision}`, resourceType: "provider", resourceId: provider.id, metadata: { note: input.note, humanDecision: true } } });
    return updated;
  });
}

export async function createGridProvider(session: ClinicSession, rawInput: unknown) {
  requirePermission(session, "credentialing", "create");
  const input = gridProviderProfileSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    await requireSyntheticOrganization(session.organizationId, tx);
    const provider = await tx.provider.create({
      data: {
        organizationId: session.organizationId,
        name: input.displayName,
        displayName: input.displayName,
        legalName: input.legalName,
        credential: input.credential,
        providerType: input.providerType,
        specialty: input.specialty || null,
        subspecialty: input.subspecialty || null,
        npi: input.npi || null,
        deaNumber: input.dea || null,
        malpracticeCarrier: input.malpracticeCarrier,
        malpracticePolicyNumber: input.malpracticePolicyNumber,
        malpracticeExpiration: new Date(input.malpracticeExpiration),
        certifications: input.certifications,
        services: input.servicesOffered,
        servicesOffered: input.servicesOffered,
        experienceLevel: input.experienceLevel,
        bio: input.bio,
        profilePhoto: input.profilePhoto || null,
        serviceLocations: input.serviceLocations,
        mobileServiceAllowed: input.mobileServiceAllowed,
        chairRentalAllowed: input.chairRentalAllowed,
        atHomeAllowed: input.atHomeAllowed,
        travelRadiusMiles: input.travelRadiusMiles,
        verificationStatus: "draft",
        status: "active",
        credentials: {
          create: {
            organizationId: session.organizationId,
            type: input.licenseType,
            number: input.licenseNumber,
            state: input.licenseState,
            expiresAt: dateOrNull(input.licenseExpiration),
            status: "active",
            verificationStatus: "pending",
            verificationSource: "Grid manual primary-source review queue",
          },
        },
      },
      include: { credentials: true },
    });
    await tx.task.create({ data: { organizationId: session.organizationId, category: "credentialing_verification", title: `Review Grid profile for ${provider.displayName}`, details: "Verify license, malpractice coverage, service scope, location privileges, and public profile before activation.", priority: "high", riskLevel: RiskLevel.NEEDS_STAFF, status: "open", ownerId: "credentialing", createdBy: session.userId } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "grid.provider_profile_created", resourceType: "provider", resourceId: provider.id, metadata: { verificationStatus: "draft", syntheticDemo: true, humanApprovalRequired: true } } });
    return provider;
  });
}

export async function transitionGridProvider(session: ClinicSession, providerId: string, rawInput: unknown) {
  const input = gridProviderTransitionSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const provider = await tx.provider.findFirst({ where: { id: providerId, organizationId: session.organizationId }, include: { credentials: true } });
    if (!provider) throw new NetworkAccessError("Provider profile not found for this organization.", 404);
    const selfManaged = provider.userId === session.userId && input.targetStatus === "submitted";
    if (!selfManaged && !can(session.role, "credentialing", "manage")) throw new NetworkAccessError("Human credentialing administrator approval is required.", 403);
    if (!canTransitionGridProvider(provider.verificationStatus, input.targetStatus)) throw new NetworkAccessError(`Provider profile cannot move from ${provider.verificationStatus} to ${input.targetStatus}.`, 409);
    if (input.targetStatus === "verified" && !providerReadyForGrid({ ...provider, verificationStatus: "verified" })) {
      throw new NetworkAccessError("A current human-verified credential and current malpractice coverage are required before Grid verification.", 409);
    }
    const renewalDates = [...provider.credentials.map((credential) => credential.expiresAt).filter((value): value is Date => Boolean(value)), provider.malpracticeExpiration].filter((value): value is Date => Boolean(value));
    const renewalDueAt = renewalDates.length ? new Date(Math.min(...renewalDates.map((value) => value.getTime()))) : null;
    const update = await tx.provider.update({
      where: { id: provider.id },
      data: {
        verificationStatus: input.targetStatus,
        status: input.targetStatus === "verified" ? "active" : provider.status,
        approvedBy: input.targetStatus === "verified" ? session.userId : provider.approvedBy,
        approvedAt: input.targetStatus === "verified" ? new Date() : provider.approvedAt,
        renewalDueAt: input.targetStatus === "verified" ? renewalDueAt : provider.renewalDueAt,
      },
    });
    if (input.targetStatus === "verified" && provider.engagementType === "independent_contractor") {
      await Promise.all([
        provider.userId ? tx.user.update({ where: { id: provider.userId }, data: { status: "active" } }) : Promise.resolve(),
        tx.providerAvailability.updateMany({ where: { providerId: provider.id, status: { in: ["draft", "paused"] } }, data: { status: "active" } }),
      ]);
    }
    if (["suspended", "expired", "rejected"].includes(input.targetStatus)) {
      await Promise.all([
        tx.gridServiceListing.updateMany({ where: { providerId: provider.id, status: "active" }, data: { status: "paused" } }),
        tx.providerAvailability.updateMany({ where: { providerId: provider.id, status: "active" }, data: { status: "paused" } }),
      ]);
      if (provider.engagementType === "independent_contractor") await restrictContractorAccess(tx, provider);
    }
    await tx.task.create({ data: { organizationId: session.organizationId, category: "credentialing", title: `${provider.displayName}: ${input.targetStatus.replaceAll("_", " ")}`, details: input.note, priority: input.targetStatus === "verified" ? "normal" : "high", riskLevel: input.targetStatus === "verified" ? RiskLevel.NORMAL : RiskLevel.NEEDS_STAFF, status: input.targetStatus === "verified" ? "completed" : "open", ownerId: "credentialing", createdBy: session.userId, completedAt: input.targetStatus === "verified" ? new Date() : null } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "grid.provider_status_changed", resourceType: "provider", resourceId: provider.id, changes: { verificationStatus: { from: provider.verificationStatus, to: input.targetStatus } }, metadata: { note: input.note, humanDecision: true } } });
    return update;
  });
}

export async function createGridServiceListing(session: ClinicSession, rawInput: unknown) {
  // A marketplace listing is a GRID act, not a clinical-network one. Gating it on
  // `network` meant a paid contractor cleared the route guard and was then refused
  // here, one layer down, by a permission their pass does not and should not include.
  requirePermission(session, "grid", "create");
  const input = gridServiceListingSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    await requireSyntheticOrganization(session.organizationId, tx);
    const provider = await tx.provider.findFirst({ where: { id: input.providerId, organizationId: session.organizationId, status: "active" }, include: { credentials: true } });
    if (!provider) throw new NetworkAccessError("Provider not found for this organization.", 404);
    // Activation stays administrative — a contractor may list, not approve. `grid:manage`
    // is held by owners and administrators and deliberately not by `contractor`.
    const canActivate = can(session.role, "grid", "manage") && providerReadyForGrid(provider);
    if (input.status === "active" && !canActivate) throw new NetworkAccessError("Only a network administrator can activate a service after provider verification.", 409);
    const listing = await tx.gridServiceListing.create({ data: { ...input, organizationId: session.organizationId, status: input.status, createdBy: session.userId, approvedBy: input.status === "active" ? session.userId : null, approvedAt: input.status === "active" ? new Date() : null } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "grid.service_listing_created", resourceType: "grid_service_listing", resourceId: listing.id, metadata: { providerId: provider.id, status: listing.status, humanReviewRequired: listing.status !== "active" } } });
    return listing;
  });
}

export async function createGridAvailability(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "grid", "create") && !can(session.role, "grid", "update")) throw new NetworkAccessError("Grid availability access is not permitted for this role.", 403);
  const input = gridAvailabilitySchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    await requireSyntheticOrganization(session.organizationId, tx);
    const provider = await tx.provider.findFirst({ where: { id: input.providerId, organizationId: session.organizationId, status: "active" }, include: { credentials: true } });
    if (!provider) throw new NetworkAccessError("Provider not found for this organization.", 404);
    // Anyone without organization-wide GRID administration may only publish for
    // themselves. This is the rule that keeps a marketplace participant from listing
    // availability on another provider's behalf.
    if (!can(session.role, "grid", "manage") && provider.userId !== session.userId) throw new NetworkAccessError("Contractors may only publish their own availability.", 403);
    if (provider.userId && session.role === "provider" && provider.userId !== session.userId) throw new NetworkAccessError("Providers may only publish their own availability.", 403);
    if (input.locationId) {
      const location = await tx.location.findFirst({ where: { id: input.locationId, status: "active", OR: [{ organizationId: session.organizationId }, { marketplaceVisible: true }] }, select: { id: true } });
      if (!location) throw new NetworkAccessError("The selected Grid location is unavailable.", 404);
    }
    const status = providerReadyForGrid(provider) ? "active" : "draft";
    const availability = await tx.providerAvailability.create({ data: { organizationId: session.organizationId, providerId: provider.id, locationId: input.locationId || null, weekday: input.dayOfWeek, startsAt: input.startTime, endsAt: input.endTime, locationType: input.locationType, mobileRadius: input.mobileRadius, onCall: input.onCall, status } });
    if (provider.userId === session.userId && status === "active") await tx.provider.update({ where: { id: provider.id }, data: { onCallNow: input.onCall } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "grid.availability_created", resourceType: "provider_availability", resourceId: availability.id, metadata: { providerId: provider.id, status, credentialGateApplied: true } } });
    return availability;
  });
}

export async function createGridLocation(session: ClinicSession, rawInput: unknown) {
  // A location partner's pass buys exactly this. `grid:create`, not `network:manage`,
  // which is clinical-network administration a marketplace participant never holds.
  requirePermission(session, "grid", "create");
  const input = gridLocationSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    await requireSyntheticOrganization(session.organizationId, tx);
    const location = await tx.location.create({ data: { organizationId: session.organizationId, name: input.locationName, locationType: input.locationType, address: { line1: input.address, city: input.city, state: input.state, postalCode: input.zip, syntheticDemo: true }, city: input.city, state: input.state, zip: input.zip, roomTypes: input.roomTypes, chairRentalAvailable: input.chairRentalAvailable, hourlyRateCents: input.hourlyRateCents ?? null, dailyRateCents: input.dailyRateCents ?? null, servicesAllowed: input.servicesAllowed, credentialRequirements: input.credentialRequirements, insuranceRequirements: input.insuranceRequirements, marketplaceVisible: input.marketplaceVisible, status: "active" } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "grid.location_listed", resourceType: "location", resourceId: location.id, metadata: { marketplaceVisible: location.marketplaceVisible, syntheticDemo: true, credentialRequirements: location.credentialRequirements } } });
    return location;
  });
}

export async function createGridRequest(session: ClinicSession, rawInput: unknown) {
  requirePermission(session, "network", "create");
  const input = gridRequestSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    await requireSyntheticOrganization(session.organizationId, tx);
    const service = await tx.gridServiceListing.findFirst({ where: { id: input.serviceListingId, status: "active", providerId: input.providerId }, include: { provider: { include: { credentials: true } } } });
    if (!service || !providerReadyForGrid(service.provider)) throw new NetworkAccessError("The selected provider/service is not currently eligible for Grid requests.", 409);
    if (input.patientId) {
      const patient = await tx.patient.findFirst({ where: { id: input.patientId, organizationId: session.organizationId, status: "active" }, select: { id: true } });
      if (!patient) throw new NetworkAccessError("Synthetic demo patient not found for this organization.", 404);
    }
    if (input.locationId) {
      const location = await tx.location.findFirst({ where: { id: input.locationId, status: "active", OR: [{ organizationId: session.organizationId }, { marketplaceVisible: true }] }, select: { id: true } });
      if (!location) throw new NetworkAccessError("The selected Grid location is unavailable.", 404);
    }
    const requiredConsent = service.requiresConsent;
    const consentStatus = requiredConsent ? input.consentStatus : "not_required";
    const depositStatus = service.requiresDeposit ? "manual_link_required" : "not_required";
    const safetyFlags = Array.from(new Set([
      ...input.safetyFlags,
      "Human review required",
      ...(service.requiresMedicalReview ? ["Licensed medical review required"] : []),
    ]));
    const request = await tx.gridRequest.create({
      data: {
        organizationId: session.organizationId,
        destinationOrganizationId: service.provider.organizationId,
        requesterId: session.userId,
        patientId: input.patientId || null,
        syntheticClientLabel: input.syntheticClientLabel,
        syntheticClientReference: input.syntheticClientReference,
        serviceListingId: service.id,
        providerId: service.providerId,
        locationId: input.locationId || null,
        requestedStartAt: new Date(input.requestedStartAt),
        requestedEndAt: dateOrNull(input.requestedEndAt),
        locationType: input.locationType,
        safetyFlags,
        requiredDocuments: input.requiredDocuments,
        requiredConsent,
        consentStatus,
        depositStatus,
        paymentStatus: "not_started",
        status: "requested",
        notes: input.notes,
        events: { create: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "request_created", fromStatus: "draft", toStatus: "requested", note: input.notes, metadata: { syntheticDemo: true, noChartShared: true, humanReviewRequired: true } } },
      },
    });
    await Promise.all([
      tx.task.create({ data: { organizationId: service.provider.organizationId, category: "grid_request", title: `Review Grid request: ${service.serviceName}`, details: `Synthetic request ${request.syntheticClientReference}. No chart was shared. Confirm credentials, consent, location, and scope before scheduling.`, priority: "high", riskLevel: RiskLevel.NEEDS_STAFF, status: "open", ownerId: "grid_intake", createdBy: session.userId } }),
      tx.gridPayout.create({ data: { organizationId: service.provider.organizationId, providerId: service.providerId, gridRequestId: request.id, grossAmountCents: service.priceLowCents, platformFeeCents: 0, netAmountCents: service.priceLowCents, status: "estimated", notes: "Synthetic estimate only. No processor transfer or payment guarantee." } }),
      tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "grid.request_created", resourceType: "grid_request", resourceId: request.id, patientId: input.patientId || null, metadata: { destinationOrganizationId: service.provider.organizationId, serviceListingId: service.id, syntheticDemo: true, chartDataShared: false } } }),
      tx.auditLog.create({ data: { organizationId: service.provider.organizationId, actorId: session.userId, actorType: "network_user", action: "grid.request_received", resourceType: "grid_request", resourceId: request.id, metadata: { originOrganizationId: session.organizationId, syntheticDemo: true, chartDataShared: false } } }),
    ]);
    return request;
  });
}

export async function transitionGridRequest(session: ClinicSession, requestId: string, rawInput: unknown) {
  if (!can(session.role, "network", "update") && !can(session.role, "grid", "update")) throw new NetworkAccessError("Grid request access is not permitted for this role.", 403);
  const input = gridRequestTransitionSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const request = await tx.gridRequest.findFirst({
      where: { id: requestId, OR: [{ organizationId: session.organizationId }, { destinationOrganizationId: session.organizationId }] },
      include: { provider: { include: { credentials: true } }, serviceListing: true },
    });
    if (!request) throw new NetworkAccessError("Grid request not found for this organization.", 404);
    const origin = request.organizationId === session.organizationId;
    const destination = request.destinationOrganizationId === session.organizationId;
    const contractorDecision = can(session.role, "grid", "update") && !can(session.role, "network", "update");
    if (contractorDecision && request.provider.userId !== session.userId) throw new NetworkAccessError("Contractors may only respond to their own requests.", 403);
    if (contractorDecision && !["accepted", "countered", "declined"].includes(input.targetStatus)) throw new NetworkAccessError("Contractors may accept, counter, or decline a request. Clinic administrators complete later review steps.", 403);
    if (input.targetStatus === "cancelled" && !origin && !can(session.role, "network", "manage")) throw new NetworkAccessError("Only the requester or a network administrator can cancel this request.", 403);
    if (!["cancelled", "escalated"].includes(input.targetStatus) && !destination) throw new NetworkAccessError("Only the receiving organization can complete this review step.", 403);
    if (!canTransitionGridRequest(request.status, input.targetStatus)) throw new NetworkAccessError(`Grid request cannot move from ${request.status} to ${input.targetStatus}.`, 409);
    if (input.targetStatus === "countered" && !input.counterStartAt) throw new NetworkAccessError("A counter-proposed start time is required.", 400);

    const nextConsentStatus = input.consentStatus ?? request.consentStatus;
    const nextDepositStatus = input.depositStatus ?? request.depositStatus;
    if (input.targetStatus === "credential_check" && !providerReadyForGrid(request.provider)) {
      throw new NetworkAccessError("Credential review cannot clear while provider credentials or malpractice coverage are not current.", 409);
    }
    if (input.targetStatus === "confirmed") {
      if (!providerReadyForGrid(request.provider)) throw new NetworkAccessError("Provider credentials must remain current before confirmation.", 409);
      if (request.requiredConsent && nextConsentStatus !== "confirmed") throw new NetworkAccessError("Required consent must be confirmed before scheduling.", 409);
      if (request.serviceListing.requiresDeposit && !["recorded", "waived"].includes(nextDepositStatus)) throw new NetworkAccessError("A reviewed deposit record or waiver is required before confirmation.", 409);
    }

    const now = new Date();
    const updated = await tx.gridRequest.update({
      where: { id: request.id },
      data: {
        status: input.targetStatus,
        consentStatus: nextConsentStatus,
        depositStatus: nextDepositStatus,
        counterStartAt: input.targetStatus === "countered" ? dateOrNull(input.counterStartAt) : request.counterStartAt,
        reviewedBy: destination ? session.userId : request.reviewedBy,
        reviewedAt: destination ? now : request.reviewedAt,
        confirmedAt: input.targetStatus === "confirmed" ? now : request.confirmedAt,
        completedAt: input.targetStatus === "completed" ? now : request.completedAt,
        cancelledAt: input.targetStatus === "cancelled" ? now : request.cancelledAt,
        events: { create: { organizationId: request.organizationId, actorId: session.userId, actorType: "user", action: "status_changed", fromStatus: request.status, toStatus: input.targetStatus, note: input.note, metadata: { consentStatus: nextConsentStatus, depositStatus: nextDepositStatus, humanDecision: true } } },
      },
    });
    if (["cancelled", "declined"].includes(input.targetStatus)) {
      await tx.gridPayout.updateMany({ where: { gridRequestId: request.id, status: { in: ["estimated", "approved", "hold"] } }, data: { status: "void", notes: `Estimate voided because request was ${input.targetStatus}.` } });
    }
    if (input.targetStatus === "escalated") {
      await tx.escalation.create({ data: { organizationId: destination ? request.destinationOrganizationId : request.organizationId, patientId: request.patientId, sourceType: "grid_request", sourceId: request.id, category: "grid_human_review", riskLevel: RiskLevel.NEEDS_STAFF, requiresHumanReview: true, assignedTeam: "grid_operations", status: "open" } });
    }
    await Promise.all([
      tx.auditLog.create({ data: { organizationId: request.organizationId, actorId: session.userId, actorType: "user", action: "grid.request_status_changed", resourceType: "grid_request", resourceId: request.id, patientId: request.patientId, changes: { status: { from: request.status, to: input.targetStatus } }, metadata: { note: input.note, humanDecision: true, actingOrganizationId: session.organizationId } } }),
      request.destinationOrganizationId === request.organizationId ? Promise.resolve() : tx.auditLog.create({ data: { organizationId: request.destinationOrganizationId, actorId: session.userId, actorType: "network_user", action: "grid.request_status_changed", resourceType: "grid_request", resourceId: request.id, changes: { status: { from: request.status, to: input.targetStatus } }, metadata: { note: input.note, humanDecision: true, actingOrganizationId: session.organizationId } } }),
    ]);
    return updated;
  });
}

export async function transitionGridPayout(session: ClinicSession, payoutId: string, rawInput: unknown) {
  requirePermission(session, "grid", "manage");
  const input = gridPayoutTransitionSchema.parse(rawInput);
  const transitions: Record<string, string[]> = {
    estimated: ["approved", "hold", "void"],
    approved: ["paid", "hold", "void"],
    hold: ["approved", "void"],
    paid: [],
    void: [],
  };
  return db.$transaction(async (tx) => {
    const payout = await tx.gridPayout.findFirst({ where: { id: payoutId, organizationId: session.organizationId } });
    if (!payout) throw new NetworkAccessError("GRID payout record not found.", 404);
    if (!(transitions[payout.status] ?? []).includes(input.targetStatus)) throw new NetworkAccessError(`Payout cannot move from ${payout.status} to ${input.targetStatus}.`, 409);
    if (input.targetStatus === "paid" && !input.externalReference) throw new NetworkAccessError("A manual payment reference is required before marking a payout paid.", 400);
    const now = new Date();
    const updated = await tx.gridPayout.update({
      where: { id: payout.id },
      data: {
        status: input.targetStatus,
        approvedAt: input.targetStatus === "approved" ? now : payout.approvedAt,
        paidAt: input.targetStatus === "paid" ? now : payout.paidAt,
        externalReference: input.externalReference ?? payout.externalReference,
        notes: input.note,
      },
    });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "grid.payout_status_changed", resourceType: "grid_payout", resourceId: payout.id, changes: { status: { from: payout.status, to: input.targetStatus } }, metadata: { note: input.note, externalReference: input.externalReference ?? null, manualRecordOnly: true } } });
    return updated;
  });
}
