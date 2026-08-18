import { canAccessWorkspace } from "@/lib/auth/workspace-authorization";
import type { ClinicRole } from "@/lib/auth/rbac";

/**
 * The permanent navigation rail, derived from the role rather than from the product's
 * own table of contents.
 *
 * The rail this replaces listed every workspace Klinikos owns — eleven groups, roughly
 * sixty links — so the first thing a clinic owner met was the org chart of the software.
 * A person does not arrive wanting "Claim readiness"; they arrive wanting to know what
 * needs them today and where the money is stuck. So each entry below is named for an
 * outcome and points at the surface that actually answers it.
 *
 * Two rules hold this honest, and `tests/role-navigation.test.ts` enforces both:
 *
 *  1. Between four and seven destinations. Fewer and the rail hides the product; more
 *     and it is the old catalog again wearing better labels.
 *  2. Every destination is a real, authorized workspace. `workspaceSlug` is checked
 *     against `canAccessWorkspace`, so a rail entry can never advertise a surface the
 *     role will be 404'd from — the failure mode of a rail assembled by hand.
 *
 * Everything else still exists and stays reachable through Explore Klinikos. Nothing is
 * deleted here; it stops being permanent furniture.
 */

/**
 * Icon names the shell's icon map must carry. Naming the union here rather than typing
 * `icon: string` means adding a destination with an icon the shell cannot render is a
 * compile error instead of a blank square in the rail.
 */
export type RoleDestinationIcon =
  | "LayoutDashboard"
  | "CalendarClock"
  | "CalendarCheck"
  | "Users"
  | "ClipboardPlus"
  | "FlaskConical"
  | "CircleDollarSign"
  | "Calculator"
  | "TrendingUp"
  | "Orbit"
  | "Radar"
  | "ListChecks"
  | "Waypoints"
  | "ShieldCheck"
  | "Network"
  | "BriefcaseMedical";

export interface RoleDestination {
  /** Outcome wording, in the words a person would use. Never a module name. */
  readonly label: string;
  readonly href: string;
  /** The workspace whose authorization rule governs this destination. */
  readonly workspaceSlug: string;
  readonly icon: RoleDestinationIcon;
  /** Why a person goes here — used by Explore Klinikos and by assistive technology. */
  readonly purpose: string;
}

const home: RoleDestination = {
  label: "Home",
  href: "/dashboard",
  workspaceSlug: "dashboard",
  icon: "LayoutDashboard",
  purpose: "What needs you, what is already handled, and what should happen next.",
};

const today: RoleDestination = {
  label: "Today",
  href: "/front-desk",
  workspaceSlug: "front-desk",
  icon: "CalendarClock",
  purpose: "Run the day: who is coming, who is ready, and who is not.",
};

const clinicalToday: RoleDestination = {
  label: "Today",
  href: "/provider",
  workspaceSlug: "provider",
  icon: "CalendarClock",
  purpose: "Your visits today and the ones that need something before they start.",
};

const patients: RoleDestination = {
  label: "Patients",
  href: "/patients",
  workspaceSlug: "patients",
  icon: "Users",
  purpose: "Find a person and see where they are in their care.",
};

const care: RoleDestination = {
  label: "Care",
  href: "/encounters",
  workspaceSlug: "encounters",
  icon: "ClipboardPlus",
  purpose: "Documentation and review work that is still open.",
};

const results: RoleDestination = {
  label: "Results",
  href: "/labs",
  workspaceSlug: "labs",
  icon: "FlaskConical",
  purpose: "Results waiting on review and release.",
};

const money: RoleDestination = {
  label: "Money",
  href: "/billing",
  workspaceSlug: "billing",
  icon: "CircleDollarSign",
  purpose: "Money that needs action before it can move.",
};

const claims: RoleDestination = {
  label: "Claims",
  href: "/claim-readiness",
  workspaceSlug: "claim-readiness",
  icon: "Calculator",
  purpose: "What is blocking a claim from going out.",
};

const recovery: RoleDestination = {
  label: "Recovery",
  href: "/crm",
  workspaceSlug: "crm",
  icon: "TrendingUp",
  purpose: "Revenue that was missed and can still be followed up.",
};

const opportunities: RoleDestination = {
  label: "Opportunities",
  href: "/grid/opportunities",
  workspaceSlug: "grid",
  icon: "Radar",
  purpose: "Work you are eligible for, and the offers waiting on your answer.",
};

const availability: RoleDestination = {
  label: "Availability",
  href: "/grid/availability",
  workspaceSlug: "grid",
  icon: "CalendarCheck",
  purpose: "When you are open for work, and what you are open for.",
};

const grid: RoleDestination = {
  label: "Grid",
  href: "/grid/workspace",
  workspaceSlug: "grid",
  icon: "Orbit",
  purpose: "What you need, what you have, and the offers waiting on you.",
};

const team: RoleDestination = {
  label: "Team",
  href: "/tasks",
  workspaceSlug: "tasks",
  icon: "ListChecks",
  purpose: "Who owns what, and what has been waiting too long.",
};

const followUp: RoleDestination = {
  label: "Follow-up",
  href: "/referrals",
  workspaceSlug: "referrals",
  icon: "Waypoints",
  purpose: "Referrals and loops that have not closed yet.",
};

const quality: RoleDestination = {
  label: "Quality",
  href: "/quality",
  workspaceSlug: "quality",
  icon: "ShieldCheck",
  purpose: "What may fall through the cracks, and what needs review.",
};

const network: RoleDestination = {
  label: "Network",
  href: "/network",
  workspaceSlug: "network",
  icon: "Network",
  purpose: "The organizations you actually work with, and the gaps.",
};

const cases: RoleDestination = {
  label: "Cases",
  href: "/cases",
  workspaceSlug: "cases",
  icon: "BriefcaseMedical",
  purpose: "Injury and workers' comp episodes and their next steps.",
};

const insurance: RoleDestination = {
  label: "Coverage",
  href: "/insurance",
  workspaceSlug: "insurance",
  icon: "ShieldCheck",
  purpose: "Eligibility and authorization work in progress.",
};

/**
 * Ordered most-used first. These are candidates, not guarantees: `roleNavigation`
 * filters each against the role's real workspace authorization before returning it, so
 * a role that loses a permission loses the rail entry with it rather than keeping a
 * link into a 404.
 */
const railByRole: Record<ClinicRole, readonly RoleDestination[]> = {
  clinic_owner: [home, today, money, grid, team, quality],
  administrator: [home, today, money, team, quality, network],
  provider: [home, clinicalToday, patients, care, results],
  clinical_staff: [home, clinicalToday, patients, care, team],
  front_desk: [home, today, patients, followUp, team],
  biller: [home, money, claims, insurance, recovery],
  quality: [home, quality, patients, care, followUp],
  case_manager: [home, patients, cases, followUp, team],
  contractor: [opportunities, availability, grid],
  viewer: [home],
};

export const minimumRailSize = 2;
export const maximumRailSize = 7;

/**
 * The permanent destinations for one role, in order.
 *
 * `contractor` and `viewer` intentionally return fewer than four. A contractor is an
 * external Grid participant: they hold no clinic-data permission, cannot open
 * `/dashboard` at all, and are landed on Grid at sign-in — so their rail starts there
 * rather than offering a Home that would 404. A viewer can only read. Padding either
 * rail to hit a number would mean advertising surfaces they cannot open.
 */
export function roleNavigation(role: ClinicRole): readonly RoleDestination[] {
  return (railByRole[role] ?? [home]).filter((destination) => canAccessWorkspace(role, destination.workspaceSlug));
}

/** Is this href one of the role's permanent destinations? */
export function isPrimaryDestination(role: ClinicRole, href: string): boolean {
  return roleNavigation(role).some((destination) => destination.href === href);
}

export const allRoleDestinations = railByRole;
