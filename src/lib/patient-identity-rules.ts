import { z } from "zod";
import { networkPurposeSchema, shareableCategorySchema, type NetworkPurpose, type ShareableCategory } from "@/lib/network-access-rules";

export interface IdentityProfile {
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  formerNames?: string[];
  aliases?: string[];
  dateOfBirth: Date;
  sexAtBirth?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface IdentityScore {
  score: number;
  classification: "likely_match" | "possible_match" | "unlikely_match";
  matchedFields: string[];
  conflictingFields: string[];
}

function normalizeText(value?: string | null) {
  return value?.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

function normalizePhone(value?: string | null) {
  return value?.replace(/\D/g, "").slice(-10) ?? "";
}

function sameDate(left: Date, right: Date) {
  return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);
}

function allNames(profile: IdentityProfile) {
  return [profile.firstName, profile.lastName, profile.preferredName, ...(profile.formerNames ?? []), ...(profile.aliases ?? [])]
    .map(normalizeText)
    .filter(Boolean);
}

export function scorePatientIdentity(source: IdentityProfile, candidate: IdentityProfile): IdentityScore {
  let score = 0;
  const matchedFields: string[] = [];
  const conflictingFields: string[] = [];

  const sourceFirstNames = new Set(allNames({ ...source, lastName: "" }));
  const candidateFirstNames = allNames({ ...candidate, lastName: "" });
  if (candidateFirstNames.some((name) => sourceFirstNames.has(name))) {
    score += 0.15;
    matchedFields.push("first_name");
  } else conflictingFields.push("first_name");

  if (normalizeText(source.lastName) === normalizeText(candidate.lastName)) {
    score += 0.15;
    matchedFields.push("last_name");
  } else conflictingFields.push("last_name");

  if (sameDate(source.dateOfBirth, candidate.dateOfBirth)) {
    score += 0.3;
    matchedFields.push("date_of_birth");
  } else conflictingFields.push("date_of_birth");

  const sourceEmail = normalizeText(source.email);
  const candidateEmail = normalizeText(candidate.email);
  if (sourceEmail && candidateEmail && sourceEmail === candidateEmail) {
    score += 0.15;
    matchedFields.push("email");
  } else if (sourceEmail && candidateEmail) conflictingFields.push("email");

  const sourcePhone = normalizePhone(source.phone);
  const candidatePhone = normalizePhone(candidate.phone);
  if (sourcePhone && candidatePhone && sourcePhone === candidatePhone) {
    score += 0.15;
    matchedFields.push("phone");
  } else if (sourcePhone && candidatePhone) conflictingFields.push("phone");

  if (source.sexAtBirth && candidate.sexAtBirth && normalizeText(source.sexAtBirth) === normalizeText(candidate.sexAtBirth)) {
    score += 0.1;
    matchedFields.push("sex_at_birth");
  } else if (source.sexAtBirth && candidate.sexAtBirth) conflictingFields.push("sex_at_birth");

  const roundedScore = Math.round(score * 100) / 100;
  return {
    score: roundedScore,
    classification: roundedScore >= 0.85 ? "likely_match" : roundedScore >= 0.6 ? "possible_match" : "unlikely_match",
    matchedFields,
    conflictingFields,
  };
}

const resolutionChoiceSchema = z.enum(["source", "candidate"]);

export const reviewPatientMatchSchema = z.object({
  action: z.enum(["confirm_match", "not_match"]),
  reason: z.string().trim().min(12).max(500),
  fieldResolutions: z.object({
    firstName: resolutionChoiceSchema.optional(),
    lastName: resolutionChoiceSchema.optional(),
    preferredName: resolutionChoiceSchema.optional(),
    phone: resolutionChoiceSchema.optional(),
    email: resolutionChoiceSchema.optional(),
    pronouns: resolutionChoiceSchema.optional(),
  }).default({}),
});

export const createConsentSchema = z.object({
  patientId: z.string().min(1),
  type: z.string().trim().min(3).max(100),
  purposeOfUse: networkPurposeSchema,
  dataCategories: z.array(shareableCategorySchema).min(1).max(10).refine((values) => new Set(values).size === values.length, "Consent categories must be unique."),
  grantedToOrganizationId: z.string().min(1),
  signerName: z.string().trim().min(2).max(120),
  signerRelationship: z.string().trim().min(2).max(80).default("self"),
  expiresInDays: z.number().int().min(1).max(365),
  sensitiveRestrictions: z.record(z.string(), z.boolean()).default({}),
});

export const withdrawConsentSchema = z.object({
  reason: z.string().trim().min(12).max(500),
});

export interface ConsentAccessInput {
  organizationId: string;
  patientId: string;
  purposeOfUse?: string | null;
  dataCategories: string[];
  grantedToOrganizationId?: string | null;
  grantedToUserId?: string | null;
  sensitiveRestrictions?: unknown;
  status: string;
  effectiveAt?: Date | null;
  expiresAt?: Date | null;
  withdrawnAt?: Date | null;
}

export function getConsentState(consent: Pick<ConsentAccessInput, "status" | "effectiveAt" | "expiresAt" | "withdrawnAt">, now = new Date()) {
  if (consent.withdrawnAt || consent.status === "withdrawn") return "withdrawn" as const;
  if (consent.status !== "active") return "inactive" as const;
  if (consent.effectiveAt && consent.effectiveAt > now) return "not_started" as const;
  if (consent.expiresAt && consent.expiresAt <= now) return "expired" as const;
  return "active" as const;
}

export function consentAllowsAccess(consent: ConsentAccessInput, input: {
  sourceOrganizationId: string;
  patientId: string;
  requestingOrganizationId: string;
  requestingUserId?: string;
  purposeOfUse: NetworkPurpose;
  categories: readonly ShareableCategory[];
  now?: Date;
}) {
  const granteeMatches = consent.grantedToOrganizationId === input.requestingOrganizationId ||
    (!!input.requestingUserId && consent.grantedToUserId === input.requestingUserId);
  const restrictions = consent.sensitiveRestrictions && typeof consent.sensitiveRestrictions === "object" && !Array.isArray(consent.sensitiveRestrictions)
    ? consent.sensitiveRestrictions as Record<string, unknown>
    : {};
  return getConsentState(consent, input.now) === "active" &&
    consent.organizationId === input.sourceOrganizationId &&
    consent.patientId === input.patientId &&
    consent.purposeOfUse === input.purposeOfUse &&
    granteeMatches &&
    input.categories.every((category) => restrictions[category] !== true) &&
    input.categories.every((category) => consent.dataCategories.includes(category));
}
