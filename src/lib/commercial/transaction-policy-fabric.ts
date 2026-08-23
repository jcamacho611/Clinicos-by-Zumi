import "server-only";

import {
  gridFeePolicyFor,
  gridPolicyHasCounselClearance,
  type GridFeePolicyDeclaration,
} from "@/lib/commercial/grid-economics";

export const TRANSACTION_POLICY_CLASSES = [
  "SPACE_RENTAL",
  "BUSINESS_SERVICE",
  "EDUCATION",
  "PRODUCT",
  "WORKFORCE",
  "PROFESSIONAL_SERVICE",
  "CARE_DISCOVERY",
  "REFERRAL",
  "DIAGNOSTIC_CAPACITY",
  "OTHER_ALLOWED_CLASS",
] as const;

export type TransactionPolicyClass = (typeof TRANSACTION_POLICY_CLASSES)[number];

export type TransactionPolicyActivationState =
  | "NO_ACTIVE_ECONOMIC_SOURCE"
  | "NO_PLATFORM_FEE_CURRENT_POLICY"
  | "REVIEW_REQUIRED"
  | "COUNSEL_EVIDENCE_PRESENT_REQUIRES_PERSISTED_ACTIVATION";

export interface TransactionPolicyProjection {
  readonly transactionClass: TransactionPolicyClass;
  readonly currentGridResourceClass: string | null;
  readonly economicSource: GridFeePolicyDeclaration | null;
  readonly requiresCounselBeforeFeeActivation: boolean;
  readonly activationState: TransactionPolicyActivationState;
}

const currentGridResourceByTransactionClass: Readonly<Partial<Record<TransactionPolicyClass, string>>> = {
  SPACE_RENTAL: "space",
  BUSINESS_SERVICE: "nonclinical_service",
  EDUCATION: "education",
  PRODUCT: "product",
  WORKFORCE: "provider",
  PROFESSIONAL_SERVICE: "regulated_clinical_service",
  REFERRAL: "referral",
  OTHER_ALLOWED_CLASS: "equipment",
};

const transactionClassByCurrentGridResource: Readonly<Record<string, TransactionPolicyClass>> = Object.fromEntries(
  Object.entries(currentGridResourceByTransactionClass).map(([transactionClass, resourceClass]) => [resourceClass, transactionClass]),
) as Readonly<Record<string, TransactionPolicyClass>>;

function activationStateFor(source: GridFeePolicyDeclaration | null): TransactionPolicyActivationState {
  if (!source) return "NO_ACTIVE_ECONOMIC_SOURCE";
  if (source.feeModel === "none") return "NO_PLATFORM_FEE_CURRENT_POLICY";
  if (!gridPolicyHasCounselClearance(source)) return "REVIEW_REQUIRED";
  return "COUNSEL_EVIDENCE_PRESENT_REQUIRES_PERSISTED_ACTIVATION";
}

function projectTransactionPolicy(
  transactionClass: TransactionPolicyClass,
  resourceClass: string | null,
): TransactionPolicyProjection {
  const economicSource = resourceClass ? gridFeePolicyFor(resourceClass) : null;
  return {
    transactionClass,
    currentGridResourceClass: resourceClass,
    economicSource,
    requiresCounselBeforeFeeActivation: economicSource
      ? !gridPolicyHasCounselClearance(economicSource)
      : true,
    activationState: activationStateFor(economicSource),
  };
}

export function transactionPolicyForClass(transactionClass: TransactionPolicyClass): TransactionPolicyProjection {
  return projectTransactionPolicy(transactionClass, currentGridResourceByTransactionClass[transactionClass] ?? null);
}

export function transactionPolicyForGridResourceClass(resourceClass: string): TransactionPolicyProjection | null {
  const transactionClass = transactionClassByCurrentGridResource[resourceClass];
  if (!transactionClass) return null;
  return projectTransactionPolicy(transactionClass, resourceClass);
}

export function listTransactionPolicyFabric(): readonly TransactionPolicyProjection[] {
  return TRANSACTION_POLICY_CLASSES.map(transactionPolicyForClass);
}