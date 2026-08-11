export type KlinikosRoleKey =
  | "patient"
  | "client"
  | "student"
  | "educator"
  | "provider"
  | "clinical_staff"
  | "front_desk"
  | "biller"
  | "administrator"
  | "clinic_owner"
  | "network_admin"
  | "contractor"
  | "facility_partner"
  | "service_partner"
  | "viewer";

export type KlinikosOrganizationType =
  | "clinic"
  | "medical_spa"
  | "healthcare_network"
  | "educational_institution"
  | "facility_partner"
  | "service_partner"
  | "platform";

export type MembershipStatus = "invited" | "active" | "suspended" | "revoked";

export interface IdentityContext {
  identityId: string;
  email: string;
  activeMembershipId?: string;
  activeOrganizationId?: string;
  activeRoles: KlinikosRoleKey[];
}

export interface MembershipGrant {
  membershipId: string;
  identityId: string;
  organizationId: string;
  organizationType: KlinikosOrganizationType;
  roles: KlinikosRoleKey[];
  status: MembershipStatus;
}
