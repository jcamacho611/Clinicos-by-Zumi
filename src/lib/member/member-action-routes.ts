import type { KlinikosPathDefinition } from "@/lib/paths/catalog";

/**
 * Person-level Living Home may explain any catalog Path, but it may only surface
 * deliberately reviewed continuation families. This is navigation policy—not an
 * authorization grant. Every destination still enforces its own session and role.
 */
const EXACT_MEMBER_ACTION_PATHS = new Set([
  "/member",
  "/portal/login",
  "/grid",
  "/grid/browse",
  "/edu",
  "/founding-clinic",
  "/operational-audit",
  "/sales",
]);

const GRID_WORK_PATHS = new Set(["find-extra-work", "grid-higher-value-opportunity"]);
const EDU_PATHS = new Set([
  "become-grid-ready",
  "student-clinical-placement",
  "organization-education-partner",
  "school-placement-network",
  "educator-preceptor-opportunity",
]);
const OPERATING_AUDIT_PATHS = new Set([
  "clinic-operational-optimization",
  "clinic-improve-revenue",
  "fix-referral-leakage",
]);

/**
 * A free Person account is not a clinic, provider, patient-portal, or EDU session. Path
 * continuity therefore resumes at a public/person-safe entry surface, never at a deep
 * workspace whose different authentication boundary would bounce the person back home.
 */
export function personEntryHrefForPath(path: KlinikosPathDefinition): `/${string}` {
  if (path.audience === "patient") return "/portal/login";
  if (GRID_WORK_PATHS.has(path.id)) return "/grid/browse?intent=work";
  if (path.id === "find-healthcare-resource") return "/grid/browse";
  if (path.id === "fill-staffing-need") return "/grid/browse?intent=provider";
  if (path.id === "clinic-monetize-capacity") return "/grid";
  if (EDU_PATHS.has(path.id) || path.group === "education") return "/edu";
  if (OPERATING_AUDIT_PATHS.has(path.id)) return "/operational-audit";
  if (path.id === "prepare-procurement-response") return "/sales";
  return "/founding-clinic";
}

export function isAllowedMemberActionHref(href: string): href is `/${string}` {
  if (!href.startsWith("/") || href.startsWith("//") || href.length > 500 || /[\r\n\\]/.test(href)) return false;
  try {
    const target = new URL(href, "https://klinikos.local");
    if (target.origin !== "https://klinikos.local" || target.pathname.startsWith("/api")) return false;
    return EXACT_MEMBER_ACTION_PATHS.has(target.pathname);
  } catch {
    return false;
  }
}
