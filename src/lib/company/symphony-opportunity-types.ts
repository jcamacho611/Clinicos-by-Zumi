import {
  companyTruthClasses,
  type CompanyTruthClass,
} from "@/lib/company/company-truth";

export { companyTruthClasses as symphonyTruthClasses };

export type SymphonyTruthClass = CompanyTruthClass;

export const symphonyOpportunityClasses = [
  "CUSTOMER_REVENUE",
  "GRANT_NON_DILUTIVE",
  "GOVERNMENT_CONTRACT",
  "WORKFORCE_INSTITUTIONAL",
  "ACCELERATOR_PROGRAM",
  "INVESTOR",
  "PARTNERSHIP",
  "CREDIT_INCENTIVE",
  "LENDER_CDFI",
  "OTHER_REVIEW_REQUIRED",
] as const;

export type SymphonyOpportunityClass = (typeof symphonyOpportunityClasses)[number];

export const symphonyTargetClasses = [
  "BUYER",
  "FUNDER",
  "GOVERNMENT_PROGRAM",
  "LENDER",
  "INVESTOR",
  "PARTNER",
  "ACCELERATOR",
  "RESOURCE_PARTNER",
  "COMPETITOR",
  "UNKNOWN",
] as const;

export type SymphonyTargetClass = (typeof symphonyTargetClasses)[number];

export const symphonyMessageFamilies = [
  "FUNDING_PROGRAM_ROUTING",
  "GOVERNMENT_PROCUREMENT",
  "WORKFORCE_INSTITUTIONAL",
  "CUSTOMER_PILOT",
  "ACCELERATOR_FIT",
  "INVESTOR_THESIS_FIT",
  "LENDER_PRESCREEN",
  "PARTNERSHIP_TEAMING",
  "REFERRAL_FOLLOW_UP",
  "RESPONSE_REQUESTED_INFORMATION",
] as const;

export type SymphonyMessageFamily = (typeof symphonyMessageFamilies)[number];

export const symphonyExecutionStates = [
  "DISCOVERED",
  "FIT_REVIEWED",
  "NOT_A_FIT",
  "EMAIL_PREPARED",
  "APPROVAL_REQUIRED",
  "READY_TO_SEND_CONNECTION_REQUIRED",
  "SEND_BLOCKED_POLICY",
  "PROVIDER_ACCEPTED",
  "DELIVERY_CONFIRMED",
  "DELIVERY_FAILED",
  "AUDIT_RECONCILIATION_REQUIRED",
  "AWAITING_RESPONSE",
  "RESPONSE_RECEIVED",
  "REFERRED",
  "MEETING_REQUESTED",
  "DOCUMENTS_REQUESTED",
  "APPLICATION_INVITED",
  "PROPOSAL_REQUESTED",
  "DILIGENCE",
  "USER_ACTION_REQUIRED",
  "APPLICATION_SUBMITTED",
  "CLOSED",
  "AWARDED_OR_CONTRACTED",
  "CASH_RECEIVED",
] as const;

export type SymphonyExecutionState = (typeof symphonyExecutionStates)[number];

export const symphonyUserGates = [
  "NONE",
  "IDENTITY_VERIFICATION",
  "SSN_OR_SENSITIVE_IDENTITY",
  "MFA_DEVICE_CONFIRMATION",
  "PERSONAL_BANK_LOGIN",
  "PERSONAL_FINANCIAL_ATTESTATION",
  "HARD_CREDIT_PULL",
  "PERSONAL_GUARANTEE",
  "COLLATERAL_PLEDGE",
  "BINDING_LEGAL_CERTIFICATION",
  "CONTRACT_SIGNATURE",
  "FINAL_LOAN_ACCEPTANCE",
  "BINDING_COMMERCIAL_TERMS",
  "EQUITY_ISSUANCE",
  "SAFE_NOTE_WARRANT_OPTION_ACCEPTANCE",
  "VALUATION_OR_INVESTOR_RIGHTS",
  "IRREVERSIBLE_EXTERNAL_COMMITMENT",
] as const;

export type SymphonyUserGate = (typeof symphonyUserGates)[number];
export type SymphonyOfficialContactPolicy = "EMAIL_ALLOWED" | "PORTAL_ONLY" | "CONTACT_PROHIBITED" | "UNKNOWN";

export type SymphonyPriorTouch = {
  recipientEmail: string;
  organizationDomain: string;
  purpose: string;
  sentAt: Date;
  substantiveThread: boolean;
};

export type SymphonyContactHistory = {
  priorTouches: SymphonyPriorTouch[];
  hardBouncedEmails: string[];
  suppressedEmails: string[];
  activeSubstantiveThread: boolean;
  nextFollowUpAt: Date | null;
  followUpCount: number;
};

export type SymphonyOpportunity = {
  id: string;
  /** Owning Klinikos tenant context; target organization fields below describe the external recipient. */
  tenantId: string;
  title: string;
  opportunityClass: SymphonyOpportunityClass;
  targetClass: SymphonyTargetClass;
  organizationName: string;
  organizationDomain: string;
  recipientEmail: string;
  recipientName?: string | null;
  purpose: string;
  ask: string;
  messageFamily: SymphonyMessageFamily;
  fitVerified: boolean;
  officialContactPolicy: SymphonyOfficialContactPolicy;
  personalNetworkRestricted: boolean;
  strategicPartnershipApproved: boolean;
  deadline: Date | null;
  userGate?: SymphonyUserGate;
  sourceUrl?: string | null;
  referralSource?: string | null;
  truthClass?: SymphonyTruthClass;
};

export const symphonyRegisterMap: Record<SymphonyOpportunityClass, readonly string[]> = {
  CUSTOMER_REVENUE: ["customer-prospect", "offer-pricing", "contract", "customer-value-evidence"],
  GRANT_NON_DILUTIVE: ["capital-opportunity"],
  GOVERNMENT_CONTRACT: ["capital-opportunity", "customer-prospect", "partnership"],
  WORKFORCE_INSTITUTIONAL: ["edu-institutional-pipeline"],
  ACCELERATOR_PROGRAM: ["capital-opportunity", "partnership"],
  INVESTOR: ["capital-opportunity", "investor-evidence"],
  PARTNERSHIP: ["partnership"],
  CREDIT_INCENTIVE: ["capital-opportunity"],
  LENDER_CDFI: ["capital-opportunity", "lender-readiness"],
  OTHER_REVIEW_REQUIRED: ["decision"],
};
