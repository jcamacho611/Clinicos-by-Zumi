import type { ClinicSession } from "@/lib/auth/types";

export const zumiAudienceProfiles = [
  "founder",
  "clinic_owner",
  "clinic_operator",
  "clinical_professional",
  "business_operator",
  "limited_viewer",
  "grid_participant",
  "patient_or_client",
  "public_prospect",
] as const;

export type ZumiAudienceProfile = (typeof zumiAudienceProfiles)[number];

export type ZumiConversationPolicy = {
  profile: ZumiAudienceProfile;
  internalStrategyAllowed: boolean;
  productArchitectureAllowed: boolean;
  commercialStrategyAllowed: boolean;
  publicResearchAllowed: boolean;
  organizationDataAllowed: boolean;
  patientDataAllowed: boolean;
  mayUseWriteTools: boolean;
  explanation: string;
};

function configuredFounderUserIds(env: NodeJS.ProcessEnv = process.env) {
  return new Set(
    (env.KLINIKOS_FOUNDER_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

/**
 * Founder mode is identity-bound and never inferred from a name, email string in a
 * prompt, or a claimed title. It changes conversational breadth, not authorization.
 * RBAC, tenant scoping, clinical policy, and tool-specific approval still govern all
 * reads and writes.
 */
export function resolveAuthenticatedConversationPolicy(
  session: ClinicSession,
  env: NodeJS.ProcessEnv = process.env,
): ZumiConversationPolicy {
  const founderIds = configuredFounderUserIds(env);
  if (session.userId && founderIds.has(session.userId)) {
    return {
      profile: "founder",
      internalStrategyAllowed: true,
      productArchitectureAllowed: true,
      commercialStrategyAllowed: true,
      publicResearchAllowed: true,
      organizationDataAllowed: true,
      patientDataAllowed: true,
      mayUseWriteTools: true,
      explanation: "Authenticated founder profile. Broad internal discussion is allowed, but data/tool access remains subject to normal authorization and safety controls.",
    };
  }

  switch (session.role) {
    case "clinic_owner":
      return {
        profile: "clinic_owner",
        internalStrategyAllowed: false,
        productArchitectureAllowed: false,
        commercialStrategyAllowed: false,
        publicResearchAllowed: true,
        organizationDataAllowed: true,
        patientDataAllowed: true,
        mayUseWriteTools: true,
        explanation: "Clinic owner profile for the authenticated organization.",
      };
    case "administrator":
    case "front_desk":
    case "case_manager":
      return {
        profile: "clinic_operator",
        internalStrategyAllowed: false,
        productArchitectureAllowed: false,
        commercialStrategyAllowed: false,
        publicResearchAllowed: true,
        organizationDataAllowed: true,
        patientDataAllowed: true,
        mayUseWriteTools: true,
        explanation: "Operational clinic profile. Only role-authorized organization and patient data may be used.",
      };
    case "provider":
    case "clinical_staff":
      return {
        profile: "clinical_professional",
        internalStrategyAllowed: false,
        productArchitectureAllowed: false,
        commercialStrategyAllowed: false,
        publicResearchAllowed: true,
        organizationDataAllowed: true,
        patientDataAllowed: true,
        mayUseWriteTools: true,
        explanation: "Clinical professional profile. Clinical actions remain human-authorized and scope-limited.",
      };
    case "biller":
    case "quality":
      return {
        profile: "business_operator",
        internalStrategyAllowed: false,
        productArchitectureAllowed: false,
        commercialStrategyAllowed: false,
        publicResearchAllowed: true,
        organizationDataAllowed: true,
        patientDataAllowed: true,
        mayUseWriteTools: session.role === "biller",
        explanation: "Specialized business/quality profile under role-based access controls.",
      };
    case "contractor":
      return {
        profile: "grid_participant",
        internalStrategyAllowed: false,
        productArchitectureAllowed: false,
        commercialStrategyAllowed: false,
        publicResearchAllowed: true,
        organizationDataAllowed: false,
        patientDataAllowed: false,
        mayUseWriteTools: false,
        explanation: "Grid participant profile. No clinic-wide or patient-data access is implied.",
      };
    default:
      return {
        profile: "limited_viewer",
        internalStrategyAllowed: false,
        productArchitectureAllowed: false,
        commercialStrategyAllowed: false,
        publicResearchAllowed: true,
        organizationDataAllowed: true,
        patientDataAllowed: true,
        mayUseWriteTools: false,
        explanation: "Read-oriented authenticated profile. Tool writes are not enabled by conversation policy.",
      };
  }
}

export function publicConversationPolicy(): ZumiConversationPolicy {
  return {
    profile: "public_prospect",
    internalStrategyAllowed: false,
    productArchitectureAllowed: false,
    commercialStrategyAllowed: false,
    publicResearchAllowed: true,
    organizationDataAllowed: false,
    patientDataAllowed: false,
    mayUseWriteTools: false,
    explanation: "Public conversation profile. Public product information and general public research only; no internal, tenant, patient, credential, or private commercial data.",
  };
}
