import "server-only";

import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import {
  evaluateGridEligibility,
  gridActivityForCategory,
  gridRequestJurisdiction,
  type GridEligibilityDecision,
} from "@/lib/grid/eligibility";
import { gridPaymentConditionSatisfied, gridRequestSchema } from "@/lib/grid-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function credentialType(type: string, providerCredential: string) {
  const normalized = type.trim().toUpperCase();
  return ["STATE_LICENSE", "LICENSE", "PROFESSIONAL_LICENSE"].includes(normalized)
    ? providerCredential.trim().toUpperCase()
    : normalized;
}

function eligibilityError(decision: GridEligibilityDecision) {
  if (decision.eligible) return null;
  return decision.failures.map((failure) => `${failure.code}: ${failure.detail}`).join(" ");
}

type EligibilitySource = {
  provider: {
    credential: string;
    providerType: string;
    verificationStatus: string;
    malpracticeVerificationStatus: string;
    malpracticeExpiration: Date | null;
    credentials: Array<{
      type: string;
      state: string | null;
      expiresAt: Date | null;
      status: string;
      verificationStatus: string;
    }>;
    facilityPrivileges: Array<{ facilityId: string; status: string; expiresAt: Date | null }>;
  };
  serviceListing: { category: string; serviceName: string; requiresDeposit: boolean };
  location: { id: string; state: string | null; facilities: Array<{ id: string }> } | null;
  requestedStartAt: Date;
  requestedEndAt: Date | null;
};

function evaluateSource(source: EligibilitySource, explicitJurisdiction?: string | null) {
  const activity = gridActivityForCategory(source.serviceListing.category, source.serviceListing.serviceName);
  if (!activity) {
    throw new NetworkAccessError(
      "This service has no declared Grid activity rule. Regulated work cannot proceed until its activity is mapped for eligibility review.",
      409,
    );
  }

  const jurisdiction = gridRequestJurisdiction({
    // A persisted location is authoritative for the legacy booking path. The explicit
    // value is useful while a request is first being submitted, but a later confirmation
    // must still be reproducible from stored state, so location wins whenever present.
    serviceJurisdiction: source.location?.state ? null : explicitJurisdiction,
    location: source.location,
  });

  const facilityIds = new Set(source.location?.facilities.map((facility) => facility.id) ?? []);
  const matchingPrivilege = source.provider.facilityPrivileges.find((privilege) => facilityIds.has(privilege.facilityId));
  const facilityId = matchingPrivilege?.facilityId ?? source.location?.facilities[0]?.id ?? null;

  const decision = evaluateGridEligibility({
    participant: {
      verificationStatus: source.provider.verificationStatus,
      providerType: source.provider.providerType,
      malpracticeVerificationStatus: source.provider.malpracticeVerificationStatus,
      malpracticeExpiration: source.provider.malpracticeExpiration,
    },
    credentials: source.provider.credentials.map((credential) => ({
      type: credentialType(credential.type, source.provider.credential),
      state: credential.state,
      expiresAt: credential.expiresAt,
      status: credential.status,
      verificationStatus: credential.verificationStatus,
    })),
    privileges: source.provider.facilityPrivileges,
    activity,
    jurisdiction,
    facilityId,
    at: source.requestedStartAt,
    through: source.requestedEndAt ?? new Date(source.requestedStartAt.getTime() + 60 * 60 * 1000),
  });

  const detail = eligibilityError(decision);
  if (detail) throw new NetworkAccessError(`Grid eligibility failed. ${detail}`, 409);
  return decision;
}

/**
 * Admission check before a clinician/service request is created.
 *
 * This is intentionally server-side and re-reads provider, credential, privilege,
 * listing and location state. A browser or model cannot submit an `eligible` flag.
 */
export async function assertGridEligibilityForNewRequest(session: ClinicSession, rawInput: unknown) {
  const input = gridRequestSchema.parse(rawInput);
  const service = await db.gridServiceListing.findFirst({
    where: { id: input.serviceListingId, providerId: input.providerId, status: "active" },
    include: {
      provider: { include: { credentials: true, facilityPrivileges: true } },
    },
  });
  if (!service) throw new NetworkAccessError("The selected Grid provider/service is unavailable.", 409);

  const location = input.locationId
    ? await db.location.findFirst({
        where: {
          id: input.locationId,
          status: "active",
          OR: [{ organizationId: session.organizationId }, { marketplaceVisible: true }],
        },
        include: { facilities: { select: { id: true } } },
      })
    : null;
  if (input.locationId && !location) throw new NetworkAccessError("The selected Grid location is unavailable.", 404);

  return evaluateSource({
    provider: service.provider,
    serviceListing: service,
    location,
    requestedStartAt: new Date(input.requestedStartAt),
    requestedEndAt: input.requestedEndAt ? new Date(input.requestedEndAt) : null,
  }, input.serviceJurisdiction);
}

/**
 * Re-evaluate current eligibility before a request reaches a consequential state.
 * Eligibility at discovery time is never treated as permanent authorization.
 */
export async function assertGridEligibilityForExistingRequest(session: ClinicSession, requestId: string) {
  const request = await db.gridRequest.findFirst({
    where: {
      id: requestId,
      OR: [{ organizationId: session.organizationId }, { destinationOrganizationId: session.organizationId }],
    },
    include: {
      provider: { include: { credentials: true, facilityPrivileges: true } },
      serviceListing: true,
      location: { include: { facilities: { select: { id: true } } } },
    },
  });
  if (!request) throw new NetworkAccessError("Grid request not found for this organization.", 404);
  return evaluateSource(request);
}

/**
 * The legacy clinician marketplace records deposits manually. It does not have a
 * processor-backed payment transition, so confirmation uses the truth it actually has:
 * no deposit required, or a human-reviewed deposit record/waiver. It never fabricates a
 * processor authorization from a payment link or checkout attempt.
 */
export async function assertLegacyGridPaymentCondition(
  session: ClinicSession,
  requestId: string,
  nextDepositStatus?: string,
) {
  const request = await db.gridRequest.findFirst({
    where: {
      id: requestId,
      OR: [{ organizationId: session.organizationId }, { destinationOrganizationId: session.organizationId }],
    },
    select: {
      paymentStatus: true,
      depositStatus: true,
      serviceListing: { select: { requiresDeposit: true } },
    },
  });
  if (!request) throw new NetworkAccessError("Grid request not found for this organization.", 404);

  const depositStatus = nextDepositStatus ?? request.depositStatus;
  const truthfulPaymentStatus = request.serviceListing.requiresDeposit
    ? (["recorded", "waived"].includes(depositStatus) ? depositStatus : request.paymentStatus)
    : "not_required";

  const condition = gridPaymentConditionSatisfied({
    listing: request.serviceListing,
    paymentStatus: truthfulPaymentStatus,
    depositStatus,
  });
  if (!condition.ok) throw new NetworkAccessError(condition.reason, 409);
}
