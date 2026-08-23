import { isEduInstructorRole, type EduPlatformRole } from "@/lib/edu/edu-roles";

/**
 * Klinikos EDU route architecture.
 *
 * Navigation is derived from the platform role so a student is never shown a
 * grading destination and an observer is never shown one they cannot open. The
 * server still enforces access on every route; this only keeps the interface from
 * offering something the server would refuse.
 */

export type EduNavItem = {
  href: string;
  label: string;
  icon: string;
  /** Roles allowed to see and open this destination. */
  roles: readonly EduPlatformRole[];
};

export type EduNavGroup = {
  label: string;
  items: readonly EduNavItem[];
};

const ALL_ROLES: readonly EduPlatformRole[] = ["edu_admin", "edu_instructor", "edu_assistant", "edu_student", "edu_observer"];
const STAFF: readonly EduPlatformRole[] = ["edu_admin", "edu_instructor", "edu_assistant"];
const FEEDBACK_ROLES: readonly EduPlatformRole[] = ["edu_admin", "edu_instructor", "edu_assistant", "edu_student"];
const TEACHING: readonly EduPlatformRole[] = ["edu_admin", "edu_instructor"];
const PROGRAM_REVIEW: readonly EduPlatformRole[] = ["edu_admin", "edu_instructor", "edu_observer"];
const DELIVERY_REVIEW: readonly EduPlatformRole[] = ["edu_admin", "edu_instructor", "edu_assistant", "edu_observer"];
const CERTIFICATE_ROLES: readonly EduPlatformRole[] = ["edu_admin", "edu_instructor", "edu_student"];

export const eduNavigation: readonly EduNavGroup[] = [
  {
    label: "Lab",
    items: [
      { href: "/edu/dashboard", label: "Dashboard", icon: "LayoutDashboard", roles: ALL_ROLES },
      { href: "/edu/programs", label: "Programs", icon: "Building2", roles: PROGRAM_REVIEW },
      { href: "/edu/courses", label: "Courses", icon: "BookOpen", roles: ALL_ROLES },
      { href: "/edu/cohorts", label: "Cohorts", icon: "Users", roles: [...STAFF, "edu_observer"] },
      { href: "/edu/sessions", label: "Sessions", icon: "CalendarDays", roles: DELIVERY_REVIEW },
      { href: "/edu/feedback", label: "Feedback", icon: "MessageSquareText", roles: FEEDBACK_ROLES },
      { href: "/edu/reports", label: "Reports", icon: "BarChart3", roles: PROGRAM_REVIEW },
    ],
  },
  {
    label: "Simulation",
    items: [
      { href: "/edu/zumi-practice", label: "Zumi practice", icon: "Sparkles", roles: ALL_ROLES },
      { href: "/edu/scenarios", label: "Scenario library", icon: "FlaskConical", roles: ALL_ROLES },
      { href: "/edu/grading", label: "Grading", icon: "ClipboardCheck", roles: STAFF },
      { href: "/edu/competencies", label: "Competencies", icon: "Target", roles: ALL_ROLES },
      { href: "/edu/certificates", label: "Certificates", icon: "Award", roles: CERTIFICATE_ROLES },
    ],
  },
  {
    label: "Proposal",
    items: [
      { href: "/edu/demo-kit", label: "Demo kit", icon: "Presentation", roles: PROGRAM_REVIEW },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/edu/settings", label: "Settings", icon: "Settings", roles: TEACHING },
    ],
  },
];

export function eduNavigationForRole(role: EduPlatformRole): EduNavGroup[] {
  return eduNavigation
    .map((group) => ({ label: group.label, items: group.items.filter((item) => item.roles.includes(role)) }))
    .filter((group) => group.items.length > 0);
}

/** Route access contract. Every authenticated EDU route declares its allowed roles. */
export const eduRouteAccess: Record<string, readonly EduPlatformRole[]> = {
  "/edu/dashboard": ALL_ROLES,
  "/edu/programs": PROGRAM_REVIEW,
  "/edu/courses": ALL_ROLES,
  "/edu/cohorts": [...STAFF, "edu_observer"],
  "/edu/sessions": DELIVERY_REVIEW,
  "/edu/feedback": FEEDBACK_ROLES,
  "/edu/reports": PROGRAM_REVIEW,
  "/edu/demo-kit": PROGRAM_REVIEW,
  "/edu/zumi-practice": ALL_ROLES,
  "/edu/scenarios": ALL_ROLES,
  "/edu/lab": ["edu_student", "edu_instructor", "edu_admin", "edu_assistant"],
  "/edu/grading": STAFF,
  "/edu/competencies": ALL_ROLES,
  "/edu/certificates": CERTIFICATE_ROLES,
  "/edu/settings": TEACHING,
};

export function canAccessEduRoute(role: EduPlatformRole, route: string) {
  const entry = Object.entries(eduRouteAccess)
    .filter(([prefix]) => route === prefix || route.startsWith(`${prefix}/`))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return entry ? entry[1].includes(role) : false;
}

/** Where a role lands after entering the EDU app. */
export function eduLandingRoute(role: EduPlatformRole) {
  return isEduInstructorRole(role) ? "/edu/dashboard" : "/edu/dashboard";
}
