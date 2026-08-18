import type { ClinicRole } from "@/lib/auth/rbac";
import { canAccessWorkspace } from "@/lib/auth/workspace-authorization";
import { navigation } from "@/lib/navigation";

export type PrimaryNavigationItem = {
  href: string;
  label: string;
  icon: string;
};

const rolePrimaryNavigation: Record<ClinicRole, readonly PrimaryNavigationItem[]> = {
  clinic_owner: [
    { href: "/dashboard", label: "Home", icon: "LayoutDashboard" },
    { href: "/front-desk", label: "Today", icon: "CalendarDays" },
    { href: "/billing", label: "Money", icon: "CircleDollarSign" },
    { href: "/grid", label: "Grid", icon: "Orbit" },
    { href: "/tasks", label: "Team", icon: "Users" },
  ],
  administrator: [
    { href: "/dashboard", label: "Home", icon: "LayoutDashboard" },
    { href: "/front-desk", label: "Today", icon: "CalendarDays" },
    { href: "/patients", label: "Patients", icon: "Users" },
    { href: "/grid", label: "Grid", icon: "Orbit" },
    { href: "/tasks", label: "Team", icon: "ListChecks" },
  ],
  provider: [
    { href: "/dashboard", label: "Home", icon: "LayoutDashboard" },
    { href: "/provider", label: "Today", icon: "Stethoscope" },
    { href: "/patients", label: "Patients", icon: "Users" },
    { href: "/encounters", label: "Care", icon: "ClipboardPlus" },
    { href: "/labs", label: "Results", icon: "FlaskConical" },
  ],
  clinical_staff: [
    { href: "/dashboard", label: "Home", icon: "LayoutDashboard" },
    { href: "/front-desk", label: "Today", icon: "CalendarDays" },
    { href: "/patients", label: "Patients", icon: "Users" },
    { href: "/tasks", label: "Tasks", icon: "ListChecks" },
    { href: "/referrals", label: "Care", icon: "Waypoints" },
  ],
  front_desk: [
    { href: "/dashboard", label: "Home", icon: "LayoutDashboard" },
    { href: "/front-desk", label: "Today", icon: "CalendarDays" },
    { href: "/patients", label: "Patients", icon: "Users" },
    { href: "/crm", label: "Follow-up", icon: "CircleDollarSign" },
    { href: "/tasks", label: "Tasks", icon: "ListChecks" },
  ],
  biller: [
    { href: "/dashboard", label: "Home", icon: "LayoutDashboard" },
    { href: "/billing", label: "Money", icon: "CircleDollarSign" },
    { href: "/claim-readiness", label: "Readiness", icon: "Calculator" },
    { href: "/crm", label: "Follow-up", icon: "ReceiptText" },
    { href: "/tasks", label: "Tasks", icon: "ListChecks" },
  ],
  quality: [
    { href: "/dashboard", label: "Home", icon: "LayoutDashboard" },
    { href: "/quality", label: "Quality", icon: "ChartNoAxesCombined" },
    { href: "/patients", label: "Patients", icon: "Users" },
    { href: "/tasks", label: "Review", icon: "ListChecks" },
    { href: "/referrals", label: "Referrals", icon: "Waypoints" },
  ],
  case_manager: [
    { href: "/dashboard", label: "Home", icon: "LayoutDashboard" },
    { href: "/patients", label: "Patients", icon: "Users" },
    { href: "/referrals", label: "Referrals", icon: "Waypoints" },
    { href: "/cases", label: "Cases", icon: "BriefcaseMedical" },
    { href: "/tasks", label: "Tasks", icon: "ListChecks" },
  ],
  contractor: [
    { href: "/grid", label: "Grid", icon: "Orbit" },
  ],
  viewer: [
    { href: "/dashboard", label: "Home", icon: "LayoutDashboard" },
    { href: "/patients", label: "Patients", icon: "Users" },
    { href: "/schedule", label: "Schedule", icon: "CalendarDays" },
    { href: "/billing", label: "Money", icon: "ReceiptText" },
    { href: "/tasks", label: "Tasks", icon: "ListChecks" },
  ],
};

function canOpen(role: ClinicRole, href: string) {
  if (href === "/edu") return true;
  return canAccessWorkspace(role, href.slice(1));
}

export function primaryNavigationForRole(role: ClinicRole) {
  return rolePrimaryNavigation[role].filter((item) => canOpen(role, item.href)).slice(0, 5);
}

const exploreLabels: Record<string, string> = {
  Home: "Work",
  "Patients & care": "Care",
  "Connected care": "Network",
  Grid: "Grid",
  "Revenue & quality": "Money & quality",
  Work: "Work",
  Learning: "Learning",
  Organization: "Administration",
};

export function exploreNavigationForRole(role: ClinicRole, primaryHrefs: ReadonlySet<string> = new Set()) {
  return navigation
    .map((group) => ({
      label: exploreLabels[group.label] ?? group.label,
      items: group.items.filter(
        (item) => item.href !== "/dashboard" && !primaryHrefs.has(item.href) && canOpen(role, item.href),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

const promptByWorkspace: Record<string, string> = {
  dashboard: "What needs to happen?",
  "front-desk": "Ask about today's work…",
  provider: "Ask about today's care…",
  patients: "Ask about these patients…",
  billing: "Ask about money that needs attention…",
  crm: "Ask about follow-up and recovery…",
  grid: "What do you need or have?",
  quality: "Ask what needs review…",
  referrals: "Ask what referral needs attention…",
  tasks: "Ask what needs to be done…",
  edu: "What should I work on next?",
};

export function klinikosPromptForWorkspace(workspace: string) {
  return promptByWorkspace[workspace] ?? "Ask Klinikos about this work…";
}
