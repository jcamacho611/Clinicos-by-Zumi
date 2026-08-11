export type KlinikosPath =
  | "clinic"
  | "grid"
  | "edu"
  | "patient"
  | "network"
  | "partner";

export type ProductAvailability = "available" | "invitation-only" | "coming-soon";

export type ApprovalRequirement =
  | "none"
  | "clinic-onboarding"
  | "professional-credentials"
  | "school-enrollment"
  | "network-contract"
  | "partner-approval"
  | "insurance-connection";

export type KlinikosProduct = {
  key: string;
  name: string;
  path: KlinikosPath;
  summary: string;
  landingPath: string;
  availability: ProductAvailability;
  billing: "free" | "one-time" | "monthly" | "annual" | "contract";
  includedCapabilities: string[];
  requiredApprovals: ApprovalRequirement[];
};

export const KLINIKOS_PRODUCTS: KlinikosProduct[] = [
  {
    key: "clinic-essentials",
    name: "Clinic Essentials",
    path: "clinic",
    summary: "Run daily clinic work, scheduling, patient follow-up, and paperwork in one place.",
    landingPath: "/owner",
    availability: "available",
    billing: "monthly",
    includedCapabilities: [
      "clinic-command-center",
      "patient-registry",
      "scheduling",
      "staff-work",
      "follow-up",
      "intake-paperwork",
      "basic-reporting",
    ],
    requiredApprovals: ["clinic-onboarding"],
  },
  {
    key: "clinic-growth",
    name: "Clinic Growth",
    path: "clinic",
    summary: "Add lead management, rebooking, retention, and revenue opportunity tracking.",
    landingPath: "/owner",
    availability: "available",
    billing: "monthly",
    includedCapabilities: [
      "clinic-essentials",
      "lead-management",
      "med-spa-crm",
      "rebooking",
      "reactivation",
      "campaigns",
      "revenue-opportunities",
    ],
    requiredApprovals: ["clinic-onboarding"],
  },
  {
    key: "clinic-revenue",
    name: "Clinic Revenue",
    path: "clinic",
    summary: "Track recoverable revenue, billing readiness, referrals, and unresolved balances.",
    landingPath: "/owner",
    availability: "available",
    billing: "monthly",
    includedCapabilities: [
      "clinic-growth",
      "revenue-desk",
      "billing-readiness",
      "referral-leakage",
      "no-show-recovery",
      "cancellation-recovery",
      "balance-worklists",
    ],
    requiredApprovals: ["clinic-onboarding"],
  },
  {
    key: "grid-provider",
    name: "GRID Provider Profile",
    path: "grid",
    summary: "Create a professional profile, maintain availability, and prepare for approved opportunities.",
    landingPath: "/grid",
    availability: "available",
    billing: "free",
    includedCapabilities: [
      "provider-profile",
      "service-list",
      "availability",
      "credential-upload",
      "opportunity-discovery",
    ],
    requiredApprovals: ["none"],
  },
  {
    key: "grid-professional",
    name: "GRID Professional",
    path: "grid",
    summary: "Receive expanded opportunity access after required professional review is complete.",
    landingPath: "/grid",
    availability: "available",
    billing: "monthly",
    includedCapabilities: [
      "grid-provider",
      "enhanced-opportunities",
      "work-requests",
      "facility-discovery",
      "earnings-history",
    ],
    requiredApprovals: ["professional-credentials"],
  },
  {
    key: "grid-facility",
    name: "GRID Facility",
    path: "grid",
    summary: "List approved rooms, chairs, and available facility capacity for matching.",
    landingPath: "/grid",
    availability: "invitation-only",
    billing: "monthly",
    includedCapabilities: [
      "facility-profile",
      "capacity-listing",
      "room-chair-listing",
      "provider-matching",
    ],
    requiredApprovals: ["partner-approval"],
  },
  {
    key: "edu-student",
    name: "Student Access",
    path: "edu",
    summary: "Use Klinikos learning tools and included Virtual Clinic Lab experiences.",
    landingPath: "/edu",
    availability: "available",
    billing: "monthly",
    includedCapabilities: ["learning-home", "practice-scenarios", "learning-progress"],
    requiredApprovals: ["none"],
  },
  {
    key: "edu-school",
    name: "School / Educator",
    path: "edu",
    summary: "Manage cohorts, assignments, student progress, and Virtual Clinic Lab access.",
    landingPath: "/edu",
    availability: "invitation-only",
    billing: "contract",
    includedCapabilities: [
      "educator-home",
      "cohort-management",
      "assignments",
      "student-progress",
      "virtual-clinic-lab",
    ],
    requiredApprovals: ["school-enrollment"],
  },
  {
    key: "network-multi-location",
    name: "Multi-Location",
    path: "network",
    summary: "Operate and compare multiple participating locations from Network Command.",
    landingPath: "/network",
    availability: "invitation-only",
    billing: "contract",
    includedCapabilities: [
      "network-command",
      "location-comparison",
      "centralized-access",
      "network-revenue",
      "network-capacity",
    ],
    requiredApprovals: ["network-contract"],
  },
];

export function getProduct(productKey: string) {
  return KLINIKOS_PRODUCTS.find((product) => product.key === productKey) ?? null;
}

export function getProductsForPath(path: KlinikosPath) {
  return KLINIKOS_PRODUCTS.filter((product) => product.path === path);
}

export function resolveLandingPath(productKeys: string[]) {
  const products = productKeys.map(getProduct).filter((product): product is KlinikosProduct => Boolean(product));

  if (products.some((product) => product.path === "network")) return "/network";
  if (products.some((product) => product.path === "clinic")) return "/owner";
  if (products.some((product) => product.path === "grid")) return "/grid";
  if (products.some((product) => product.path === "edu")) return "/edu";

  return "/";
}
