import { z } from "zod";

export const networkPurposeSchema = z.enum(["treatment", "payment", "operations"]);
export type NetworkPurpose = z.infer<typeof networkPurposeSchema>;

export const shareableCategorySchema = z.enum([
  "demographics",
  "allergies",
  "medications",
  "problems",
  "approved_visit_summary",
  "labs",
  "imaging",
  "referrals",
  "care_plans",
  "immunizations",
]);
export type ShareableCategory = z.infer<typeof shareableCategorySchema>;

const uniqueCategories = z.array(shareableCategorySchema).min(1).max(10).refine(
  (categories) => new Set(categories).size === categories.length,
  "Data categories must be unique.",
);

export const createRecordRequestSchema = z.object({
  sourceOrganizationId: z.string().min(1),
  patientId: z.string().min(1),
  purposeOfUse: networkPurposeSchema,
  dataCategories: uniqueCategories,
});

export const reviewRecordRequestSchema = z.object({
  decision: z.enum(["approve", "deny"]),
  reason: z.string().trim().min(8).max(500),
  expiresInDays: z.number().int().min(1).max(90).default(30),
});

export const breakGlassRequestSchema = z.object({
  sourceOrganizationId: z.string().min(1),
  patientId: z.string().min(1),
  reason: z.string().trim().min(20).max(500),
  dataCategories: uniqueCategories.default(["demographics", "allergies", "medications", "problems"]),
});

export interface NetworkRelationshipInput {
  sourceOrganizationId: string;
  targetOrganizationId: string;
  status: string;
  allowedPurposes: string[];
  activatedAt?: Date | null;
  suspendedAt?: Date | null;
}

export interface SharingAgreementInput {
  sourceOrganizationId: string;
  targetOrganizationId: string;
  status: string;
  allowedPurposes: string[];
  dataCategories: string[];
  effectiveAt?: Date | null;
  expiresAt?: Date | null;
}

export interface AccessGrantInput {
  organizationId: string;
  patientId: string;
  granteeOrganizationId?: string | null;
  granteeUserId?: string | null;
  purposeOfUse: string;
  dataCategories: string[];
  accessLevel: string;
  startsAt: Date;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
}

export type AccessGrantState = "active" | "not_started" | "expired" | "revoked";

export function getAccessGrantState(grant: Pick<AccessGrantInput, "startsAt" | "expiresAt" | "revokedAt">, now = new Date()): AccessGrantState {
  if (grant.revokedAt) return "revoked";
  if (grant.startsAt > now) return "not_started";
  if (grant.expiresAt && grant.expiresAt <= now) return "expired";
  return "active";
}

export function isActiveNetworkRelationship(
  connection: NetworkRelationshipInput,
  sourceOrganizationId: string,
  requestingOrganizationId: string,
  purpose: NetworkPurpose,
) {
  const joinsOrganizations =
    (connection.sourceOrganizationId === sourceOrganizationId && connection.targetOrganizationId === requestingOrganizationId) ||
    (connection.targetOrganizationId === sourceOrganizationId && connection.sourceOrganizationId === requestingOrganizationId);

  return joinsOrganizations && connection.status === "active" && !connection.suspendedAt && connection.allowedPurposes.includes(purpose);
}

export function isActiveSharingAgreement(
  agreement: SharingAgreementInput,
  sourceOrganizationId: string,
  requestingOrganizationId: string,
  purpose: NetworkPurpose,
  requestedCategories: readonly ShareableCategory[],
  now = new Date(),
) {
  return agreement.sourceOrganizationId === sourceOrganizationId &&
    agreement.targetOrganizationId === requestingOrganizationId &&
    agreement.status.startsWith("active") &&
    (!agreement.effectiveAt || agreement.effectiveAt <= now) &&
    (!agreement.expiresAt || agreement.expiresAt > now) &&
    agreement.allowedPurposes.includes(purpose) &&
    requestedCategories.every((category) => agreement.dataCategories.includes(category));
}

export function grantAllowsAccess(
  grant: AccessGrantInput,
  input: {
    sourceOrganizationId: string;
    requestingOrganizationId: string;
    requestingUserId: string;
    patientId: string;
    purpose: NetworkPurpose;
    categories: readonly ShareableCategory[];
    now?: Date;
  },
) {
  const granteeMatches = grant.granteeOrganizationId === input.requestingOrganizationId || grant.granteeUserId === input.requestingUserId;
  return getAccessGrantState(grant, input.now) === "active" &&
    grant.organizationId === input.sourceOrganizationId &&
    grant.patientId === input.patientId &&
    granteeMatches &&
    grant.purposeOfUse === input.purpose &&
    input.categories.every((category) => grant.dataCategories.includes(category));
}

export function canReviewRecordRequests(role: string) {
  return ["clinic_owner", "administrator", "provider", "case_manager"].includes(role);
}

export function canUseBreakGlass(role: string) {
  return ["clinic_owner", "administrator", "provider"].includes(role);
}

export function roleAllowsSharedCategories(
  role: string,
  purpose: NetworkPurpose,
  categories: readonly ShareableCategory[],
) {
  if (["clinic_owner", "administrator", "provider", "clinical_staff", "case_manager"].includes(role)) return true;
  if (role === "quality" && purpose === "operations") {
    return categories.every((category) => ["demographics", "problems", "labs", "immunizations"].includes(category));
  }
  if (role === "front_desk" && purpose === "treatment") return categories.every((category) => category === "demographics");
  if (role === "biller" && purpose === "payment") return categories.every((category) => category === "demographics");
  return false;
}

export function isValidRecordRequestTransition(currentStatus: string, decision: "approve" | "deny") {
  return currentStatus === "requested" && (decision === "approve" || decision === "deny");
}

export const BREAK_GLASS_TTL_MINUTES = 30;
