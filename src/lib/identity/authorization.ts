import type { KlinikosRoleKey, MembershipGrant } from "@/lib/identity/types";

export type KlinikosDomain =
  | "identity"
  | "clinic"
  | "patient"
  | "provider"
  | "grid"
  | "education"
  | "network"
  | "finance"
  | "intelligence"
  | "communications"
  | "integrations"
  | "security";

export type KlinikosAction = "read" | "create" | "update" | "manage" | "transact" | "approve";

export type AuthorizationRequest = {
  membership: MembershipGrant;
  domain: KlinikosDomain;
  action: KlinikosAction;
  /** Optional relationship/purpose attributes used by higher-risk callers. */
  purpose?: "treatment" | "payment" | "operations" | "education" | "marketplace" | "self_service" | "administration";
  subjectIdentityId?: string;
  actorIdentityId?: string;
  credentialActive?: boolean;
  consentSatisfied?: boolean;
};

export type AuthorizationDecision = {
  allowed: boolean;
  reason: string;
  requiresHumanReview: boolean;
};

const DOMAIN_ROLES: Record<KlinikosDomain, readonly KlinikosRoleKey[]> = {
  identity: ["patient", "client", "student", "educator", "provider", "clinical_staff", "front_desk", "biller", "administrator", "clinic_owner", "network_admin", "contractor", "facility_partner", "service_partner", "viewer"],
  clinic: ["provider", "clinical_staff", "front_desk", "biller", "administrator", "clinic_owner", "viewer"],
  patient: ["patient", "client", "provider", "clinical_staff", "front_desk", "biller", "administrator", "clinic_owner"],
  provider: ["provider", "clinical_staff", "administrator", "clinic_owner", "network_admin", "contractor"],
  grid: ["provider", "contractor", "administrator", "clinic_owner", "network_admin", "facility_partner", "service_partner"],
  education: ["student", "educator", "provider", "administrator", "network_admin", "service_partner"],
  network: ["provider", "administrator", "clinic_owner", "network_admin", "service_partner"],
  finance: ["patient", "client", "provider", "contractor", "biller", "administrator", "clinic_owner", "network_admin", "facility_partner", "service_partner"],
  intelligence: ["patient", "client", "student", "educator", "provider", "clinical_staff", "front_desk", "biller", "administrator", "clinic_owner", "network_admin", "contractor", "facility_partner", "service_partner"],
  communications: ["patient", "client", "student", "educator", "provider", "clinical_staff", "front_desk", "biller", "administrator", "clinic_owner", "network_admin", "contractor", "facility_partner", "service_partner"],
  integrations: ["administrator", "clinic_owner", "network_admin", "service_partner"],
  security: ["administrator", "clinic_owner", "network_admin"],
};

function hasAnyRole(membership: MembershipGrant, allowedRoles: readonly KlinikosRoleKey[]) {
  return membership.roles.some((role) => allowedRoles.includes(role));
}

/**
 * Platform-level authorization gate.
 *
 * This intentionally does not replace record-level clinical authorization. It is the
 * shared first gate for ecosystem access, and callers handling protected or clinical
 * records must add relationship, consent, assignment and purpose checks on top.
 */
export function authorizeKlinikos(request: AuthorizationRequest): AuthorizationDecision {
  if (request.membership.status !== "active") {
    return { allowed: false, reason: "Membership is not active.", requiresHumanReview: false };
  }

  if (!hasAnyRole(request.membership, DOMAIN_ROLES[request.domain])) {
    return { allowed: false, reason: `No active role grants access to the ${request.domain} domain.`, requiresHumanReview: false };
  }

  if (request.domain === "provider" || request.domain === "grid") {
    const clinicalActor = request.membership.roles.some((role) => ["provider", "clinical_staff", "contractor"].includes(role));
    if (clinicalActor && request.credentialActive === false) {
      return { allowed: false, reason: "Professional credential is not active for this action.", requiresHumanReview: true };
    }
  }

  if (request.domain === "patient" && request.subjectIdentityId && request.actorIdentityId && request.subjectIdentityId !== request.actorIdentityId) {
    if (request.consentSatisfied === false) {
      return { allowed: false, reason: "Required patient authorization or treatment relationship is not satisfied.", requiresHumanReview: true };
    }
  }

  if (request.action === "approve" || request.action === "transact") {
    return { allowed: true, reason: "Domain access granted; downstream transaction or approval controls still apply.", requiresHumanReview: true };
  }

  return { allowed: true, reason: "Active membership and role grant domain access.", requiresHumanReview: false };
}
