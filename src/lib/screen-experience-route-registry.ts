import {
  KLINIKOS_SCREEN_EXPERIENCE_CONTRACTS,
  type ScreenExperienceContract,
} from "@/lib/screen-experience-contracts";

export type ScreenSourceBinding = {
  id: string;
  sourcePattern: RegExp;
  contractId: string;
  rationale: string;
};

/**
 * Release-time source bindings for every user-facing Next.js page.
 *
 * These are deliberately source-path aware. Route groups such as `(platform)`
 * and `(clinic)` carry authorization/data-boundary meaning that disappears
 * from the browser pathname. The runtime Active Experience Envelope remains
 * the final authority for the current actor and context; this registry is the
 * mechanical release gate that prevents a page from shipping without an
 * explicit visibility/Zumi/AI-processing contract.
 *
 * Rules:
 * - bindings must be mutually exclusive;
 * - a broad `.*` catch-all is prohibited;
 * - a new page that does not fit an existing family must fail tests until a
 *   deliberate contract decision is made;
 * - mapping a page to a family never widens authority or data access.
 */
export const SCREEN_SOURCE_BINDINGS: readonly ScreenSourceBinding[] = [
  {
    id: "identity-access",
    sourcePattern: /^src\/app\/(?:login|access|activate)(?:\/.*)?\/page\.tsx$/,
    contractId: "auth-signup",
    rationale: "Authentication, access and activation surfaces establish identity/session state, not professional authority.",
  },
  {
    id: "patient-portal-login",
    sourcePattern: /^src\/app\/portal\/login\/page\.tsx$/,
    contractId: "auth-signup",
    rationale: "Portal authentication is an identity boundary before patient-authorized data can be projected.",
  },
  {
    id: "legal-acceptance",
    sourcePattern: /^src\/app\/legal\/accept\/page\.tsx$/,
    contractId: "auth-signup",
    rationale: "Agreement acceptance is part of governed identity/session establishment and records exact agreement versions.",
  },
  {
    id: "public-legal",
    sourcePattern: /^src\/app\/legal\/(?!(?:accept)(?:\/|$))(?:.*\/)?page\.tsx$/,
    contractId: "public-discovery",
    rationale: "Public legal and privacy material is public-safe and cannot expose private account, organization or clinical state.",
  },
  {
    id: "patient-portal",
    sourcePattern: /^src\/app\/portal\/(?!(?:login)(?:\/|$))(?:.*\/)?page\.tsx$|^src\/app\/portal\/page\.tsx$/,
    contractId: "patient-home",
    rationale: "Patient portal surfaces are patient-authorized, minimum-necessary healthcare experiences.",
  },
  {
    id: "edu-public",
    sourcePattern: /^src\/app\/edu\/page\.tsx$/,
    contractId: "public-discovery",
    rationale: "The EDU front door may provide public-safe value before persistence or institutional authority is required.",
  },
  {
    id: "edu-instructor",
    sourcePattern: /^src\/app\/edu\/\(lab\)\/(?:grading|cohorts|reports|sessions|programs|scenarios|dashboard|settings|demo-kit)(?:\/.*)?\/page\.tsx$/,
    contractId: "edu-instructor",
    rationale: "Instructor/program administration surfaces expose only authorized cohort, assessment and program evidence.",
  },
  {
    id: "edu-learner",
    sourcePattern: /^src\/app\/edu\/\(lab\)\/(?!(?:grading|cohorts|reports|sessions|programs|scenarios|dashboard|settings|demo-kit)(?:\/|$))(?:.*\/)?page\.tsx$/,
    contractId: "edu-learner",
    rationale: "Learner surfaces expose the learner's authorized curriculum, evidence and next learning action without creating professional authority.",
  },
  {
    id: "edu-other-public",
    sourcePattern: /^src\/app\/edu\/(?!\(lab\)(?:\/|$))(?:.*\/)?page\.tsx$/,
    contractId: "public-discovery",
    rationale: "Non-lab EDU routes are treated as public-safe discovery unless deliberately moved behind a governed experience.",
  },
  {
    id: "grid-enrollment",
    sourcePattern: /^src\/app\/grid\/join(?:\/.*)?\/page\.tsx$/,
    contractId: "auth-signup",
    rationale: "Grid enrollment captures claims and agreements but cannot convert self-report into verified eligibility or authority.",
  },
  {
    id: "grid-public",
    sourcePattern: /^src\/app\/grid\/(?!(?:join)(?:\/|$))(?:.*\/)?page\.tsx$|^src\/app\/grid\/page\.tsx$/,
    contractId: "public-discovery",
    rationale: "Public Grid discovery may expose reviewed public-safe supply/demand only; private eligibility and organization data stay hidden.",
  },
  {
    id: "luxe-public",
    sourcePattern: /^src\/app\/luxe(?:\/.*)?\/page\.tsx$/,
    contractId: "public-discovery",
    rationale: "Public acquisition/consultation entry remains public-safe and may not silently inherit clinic or patient context.",
  },
  {
    id: "clinic-routes",
    sourcePattern: /^src\/app\/\(clinic\)\/(?:.*\/)?page\.tsx$/,
    contractId: "clinical-handoff",
    rationale: "Clinic route-group pages participate in governed staff handoffs and minimum-necessary clinical/operational projection.",
  },
  {
    id: "platform-admin",
    sourcePattern: /^src\/app\/\(platform\)\/admin(?:\/.*)?\/page\.tsx$/,
    contractId: "enterprise-admin",
    rationale: "Administrative surfaces expose organization/system controls only to explicit server-authorized administrative context.",
  },
  {
    id: "platform-provider",
    sourcePattern: /^src\/app\/\(platform\)\/provider(?:\/.*)?\/page\.tsx$/,
    contractId: "provider-home",
    rationale: "Provider surfaces project only provider-authorized clinical and operational priorities.",
  },
  {
    id: "platform-billing",
    sourcePattern: /^src\/app\/\(platform\)\/billing(?:\/.*)?\/page\.tsx$/,
    contractId: "biller-money-readiness",
    rationale: "Billing surfaces receive minimum-necessary financial/clinical evidence and preserve payment truth as deterministic state.",
  },
  {
    id: "platform-front-desk",
    sourcePattern: /^src\/app\/\(platform\)\/front-desk(?:\/.*)?\/page\.tsx$/,
    contractId: "clinical-handoff",
    rationale: "Front-desk surfaces expose operational readiness and handoff state, not unrestricted clinical authority.",
  },
  {
    id: "platform-patients",
    sourcePattern: /^src\/app\/\(platform\)\/patients(?:\/.*)?\/page\.tsx$/,
    contractId: "clinical-handoff",
    rationale: "Staff patient surfaces are assignment/context governed and must minimize PHI to the active task.",
  },
  {
    id: "platform-encounters",
    sourcePattern: /^src\/app\/\(platform\)\/encounters(?:\/.*)?\/page\.tsx$/,
    contractId: "current-visit",
    rationale: "Encounter pages inherit Current Visit clinical evidence, signature, provenance and Zumi non-authority rules.",
  },
  {
    id: "platform-owner",
    sourcePattern: /^src\/app\/\(platform\)\/owner(?:\/.*)?\/page\.tsx$/,
    contractId: "clinic-owner-operations",
    rationale: "Owner surfaces prioritize operations/revenue while never treating ownership as unrestricted chart authority.",
  },
  {
    id: "platform-network",
    sourcePattern: /^src\/app\/\(platform\)\/network(?:\/.*)?\/page\.tsx$/,
    contractId: "grid-organization",
    rationale: "Network relationships and handoffs require verified organization context and minimum-necessary external disclosure.",
  },
  {
    id: "platform-grid",
    sourcePattern: /^src\/app\/\(platform\)\/grid(?:\/.*)?\/page\.tsx$/,
    contractId: "grid-professional",
    rationale: "Authenticated Grid surfaces expose only relevant opportunity/capacity data after deterministic eligibility gates.",
  },
  {
    id: "platform-luxe-medi",
    sourcePattern: /^src\/app\/\(platform\)\/luxe-medi(?:\/.*)?\/page\.tsx$/,
    contractId: "clinic-owner-operations",
    rationale: "Luxe Medi operational surfaces inherit clinic operating boundaries rather than becoming a parallel authority model.",
  },
  {
    id: "platform-settings",
    sourcePattern: /^src\/app\/\(platform\)\/(?:settings|design-system)(?:\/.*)?\/page\.tsx$/,
    contractId: "enterprise-admin",
    rationale: "Configuration/internal design surfaces are controlled administrative contexts with no implicit cross-tenant authority.",
  },
  {
    id: "platform-paths",
    sourcePattern: /^src\/app\/\(platform\)\/paths(?:\/.*)?\/page\.tsx$/,
    contractId: "grid-professional",
    rationale: "Authenticated path discovery can recommend opportunities and next steps but deterministic systems retain eligibility authority.",
  },
  {
    id: "platform-zumi",
    sourcePattern: /^src\/app\/\(platform\)\/zumi(?:\/.*)?\/page\.tsx$/,
    contractId: "clinic-owner-operations",
    rationale: "Authenticated Zumi is an ambient operating interface bounded by the active experience envelope, not a superuser surface.",
  },
  {
    id: "platform-workspace",
    sourcePattern: /^src\/app\/\(platform\)\/(?!(?:admin|provider|billing|front-desk|patients|encounters|owner|network|grid|luxe-medi|settings|design-system|paths|zumi)(?:\/|$))(?:.*\/)?page\.tsx$/,
    contractId: "clinic-owner-operations",
    rationale: "Remaining authenticated workspaces inherit operational visibility and authority boundaries until a more specific family is deliberately registered.",
  },
  {
    id: "public-general",
    sourcePattern: /^src\/app\/(?!(?:\(clinic\)|\(platform\)|api|edu|grid|portal|legal|luxe|login|access|activate)(?:\/|$))(?:[^/]+\/)*page\.tsx$/,
    contractId: "public-discovery",
    rationale: "All remaining non-route-group product, commercial and informational pages are public-safe discovery surfaces by default.",
  },
] as const;

export const ALL_SCREEN_EXPERIENCE_CONTRACTS = KLINIKOS_SCREEN_EXPERIENCE_CONTRACTS;

const CONTRACT_BY_ID = new Map<string, ScreenExperienceContract>(
  ALL_SCREEN_EXPERIENCE_CONTRACTS.map((contract) => [contract.id, contract]),
);

export function resolveSourceExperienceContracts(sourcePath: string): ScreenExperienceContract[] {
  const normalized = sourcePath.replaceAll("\\", "/");
  return SCREEN_SOURCE_BINDINGS
    .filter((binding) => binding.sourcePattern.test(normalized))
    .map((binding) => CONTRACT_BY_ID.get(binding.contractId))
    .filter((contract): contract is ScreenExperienceContract => Boolean(contract));
}

export function resolveSourceExperienceContract(sourcePath: string): ScreenExperienceContract {
  const matches = resolveSourceExperienceContracts(sourcePath);
  if (matches.length !== 1) {
    const ids = matches.map((contract) => contract.id).join(", ") || "none";
    throw new Error(`Expected exactly one Screen Experience Contract for ${sourcePath}; resolved: ${ids}`);
  }
  return matches[0];
}
