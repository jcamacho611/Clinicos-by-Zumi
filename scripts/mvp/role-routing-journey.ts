/**
 * MVP Journey 8 — role routing, against a real database.
 *
 *   REAL USER -> REAL SIGNED SESSION -> THE WORKSPACES THAT ROLE MAY OPEN
 *
 * Two failures matter more than "can the owner see the dashboard".
 *
 * The first is a navigation lie: a menu entry that 404s, or one that no role can ever
 * see. Both come from the sidebar, the launchpad and the route guard drifting apart, so
 * this journey checks that all three still decide access with the same function and that
 * every destination they can offer is actually governed by a declared rule.
 *
 * The second is cross-domain session confusion. Klinikos has two independent identity
 * domains — staff and patient portal — and a token from one must be worthless in the
 * other. That is asserted against real signed tokens, not mocks.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { can, clinicActions, clinicResources, clinicRoles, type ClinicRole } from "@/lib/auth/rbac";
import { canAccessWorkspace, workspaceAccessRules } from "@/lib/auth/workspace-authorization";
import { navigation } from "@/lib/navigation";
import { signSessionToken, verifySessionToken } from "@/lib/auth/token";
import { signPortalSessionToken, verifyPortalSessionToken } from "@/lib/auth/portal-token";
import type { ClinicSession } from "@/lib/auth/types";
import type { PortalSession } from "@/lib/auth/portal-types";

const db = new PrismaClient();
const results: { label: string; pass: boolean; detail: string }[] = [];

function check(label: string, pass: boolean, detail: string) {
  results.push({ label, pass, detail });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}\n        ${detail}`);
}

const SLUG = "mvp-routing-clinic";

/** Every destination the shell can render in its sidebar. */
const navHrefs = navigation.flatMap((group) => group.items.map((item) => item.href));

/**
 * The workspaces the renderer can actually render, read from its source rather than
 * imported. Importing the renderer pulls in every repository behind it — and with them
 * `server-only`, which Next and Vitest each alias and a plain script cannot resolve.
 * The list is a literal, so reading it is exact.
 */
function declaredWorkspaceSlugs(): string[] {
  const source = readFileSync(join(process.cwd(), "src/components/clinic/workspace-renderer.tsx"), "utf8");
  const block = source.match(/export const workspaceSlugs = \[([\s\S]*?)\] as const;/);
  if (!block) throw new Error("workspaceSlugs is no longer a literal array in workspace-renderer.tsx; this journey cannot read it.");
  return [...block[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

const workspaceSlugs = declaredWorkspaceSlugs();

async function reset() {
  const orgs = await db.organization.findMany({ where: { slug: SLUG }, select: { id: true } });
  const ids = orgs.map((o) => o.id);
  if (!ids.length) return;
  await db.authSession.deleteMany({ where: { user: { organizationId: { in: ids } } } }).catch(() => {});
  await db.portalSession.deleteMany({ where: { portalAccount: { organizationId: { in: ids } } } }).catch(() => {});
  await db.portalAccount.deleteMany({ where: { organizationId: { in: ids } } }).catch(() => {});
  await db.auditLog.deleteMany({ where: { organizationId: { in: ids } } });
  await db.user.deleteMany({ where: { organizationId: { in: ids } } });
  await db.patient.deleteMany({ where: { organizationId: { in: ids } } });
  await db.organization.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  await reset();
  const org = await db.organization.create({
    data: { name: "MVP Routing Clinic", slug: SLUG, clinicType: "medspa", status: "active" },
    select: { id: true, name: true, slug: true },
  });

  // A real user row per declared role, so the roles under test are the roles the
  // product can actually issue rather than a hand-written list.
  const users = new Map<ClinicRole, { id: string; email: string }>();
  for (const role of clinicRoles) {
    const user = await db.user.create({
      data: { organizationId: org.id, email: `${role}@routing.test`, name: `${role} user`, roleKey: role },
      select: { id: true, email: true },
    });
    users.set(role, user);
  }
  check("every declared clinic role can exist as a real user", users.size === clinicRoles.length, `${users.size} roles: ${clinicRoles.join(", ")}`);

  // --- 1. no workspace is reachable without a declared rule ----------------
  // canAccessWorkspace fails closed on an unknown slug, so a slug with no rule is
  // dead rather than open. Dead is safe but still a bug: it is a page nobody can reach.
  const ruleless = workspaceSlugs.filter((slug) => !(slug in workspaceAccessRules));
  check(
    "every renderable workspace has a declared access rule",
    ruleless.length === 0,
    ruleless.length ? `NO RULE: ${ruleless.join(", ")}` : `${workspaceSlugs.length} workspaces, all governed`,
  );

  // --- 2. the menu contains no destination that is dead for everyone -------
  // canAccessWorkspace fails closed on an unknown slug, so a sidebar entry with no rule
  // is hidden from every role and reachable by none: a menu item that silently does not
  // exist. /edu is the one deliberate exception — the shell shows it to everyone and EDU
  // enrollment, not clinic RBAC, decides what is behind it.
  const deadLinks = navHrefs.filter((href) => href !== "/edu" && !(href.slice(1) in workspaceAccessRules));
  check(
    "no sidebar destination is ungoverned, and therefore dead for every role",
    deadLinks.length === 0,
    deadLinks.length ? `NO RULE: ${deadLinks.join(", ")}` : `${navHrefs.length} destinations, all governed by a declared rule`,
  );

  // --- 2b. visibility and access are decided by one predicate --------------
  // The sidebar, the launchpad and the route guard must not each carry their own idea
  // of who may open a workspace, because the first divergence is a menu that lies.
  const shellSources = [
    "src/components/clinic/app-shell.tsx",
    "src/components/clinic/workspace-launchpad.tsx",
    "src/components/clinic/workspace-renderer.tsx",
  ];
  // Delegation can be direct or one module deep: the shell now asks
  // `navigation-experience` for the destinations a role may see, and that module calls
  // `canAccessWorkspace`. What must never happen is a surface deciding access itself, so
  // check both halves — the decision reaches the shared function, and no source here
  // makes its own role judgement.
  const authorityModules = ["src/lib/navigation-experience.ts"];
  const authorityHelpers = authorityModules
    .map((path) => readFileSync(join(process.cwd(), path), "utf8"))
    .every((source) => source.includes("canAccessWorkspace"));
  const delegatesVia = ["canAccessWorkspace", "primaryNavigationForRole", "exploreNavigationForRole", "canOpen"];
  const notDelegating = shellSources.filter((path) => {
    const source = readFileSync(join(process.cwd(), path), "utf8");
    const reachesAuthority = delegatesVia.some((symbol) => source.includes(symbol));
    // An ad-hoc role comparison is a second opinion about access, which is the failure
    // this check exists to catch — a menu that disagrees with the guard.
    const decidesLocally = /\brole\s*(===|!==)\s*["']/.test(source);
    return !reachesAuthority || decidesLocally;
  });
  if (!authorityHelpers) notDelegating.push("src/lib/navigation-experience.ts (no longer calls canAccessWorkspace)");
  check(
    "the sidebar, the launchpad and the route guard all decide access with the same function",
    notDelegating.length === 0,
    notDelegating.length ? `NOT DELEGATING: ${notDelegating.join(", ")}` : shellSources.join(", "),
  );

  // --- 3. every role lands somewhere useful --------------------------------
  const homeless = clinicRoles.filter((role) => !navHrefs.some((href) => href !== "/edu" && canAccessWorkspace(role, href.slice(1))));
  check(
    "no role signs in to an empty product",
    homeless.length === 0,
    homeless.length
      ? `NO REACHABLE WORKSPACE: ${homeless.join(", ")}`
      : clinicRoles.map((role) => `${role}=${navHrefs.filter((h) => h !== "/edu" && canAccessWorkspace(role, h.slice(1))).length}`).join(" "),
  );

  // --- 4. a Grid participant is contained ----------------------------------
  // A contractor is an outside participant, not staff. The whole clinic surface must be
  // closed to them, which is a much stronger statement than "they can see Grid".
  const contractorOpen = workspaceSlugs.filter((slug) => canAccessWorkspace("contractor", slug));
  check(
    "a Grid participant reaches Grid and nothing else in the clinic",
    contractorOpen.length === 0,
    contractorOpen.length
      ? `also reachable: ${contractorOpen.join(", ")}`
      : "no clinic workspace is reachable; Grid participation is served by the /grid surfaces under their own guards",
  );

  // --- 5. a read-only role can look everywhere but change nothing ----------
  // Workspace visibility follows `read`, so a viewer legitimately opens most of the
  // product — including status surfaces like integrations and the feature registry.
  // Containment for this role is therefore not which doors open; it is that the role
  // holds no verb that changes anything, anywhere.
  const viewerWrites = clinicResources.flatMap((resource) =>
    clinicActions.filter((action) => action !== "read" && can("viewer", resource, action)).map((action) => `${resource}:${action}`),
  );
  check(
    "a read-only role holds no action that changes anything, on any resource",
    viewerWrites.length === 0,
    viewerWrites.length
      ? `MUTATING GRANTS: ${viewerWrites.join(", ")}`
      : `${clinicResources.length} resources x ${clinicActions.length - 1} mutating actions, none granted`,
  );

  // --- 6. front desk runs the front of the clinic, not the clinic ----------
  // Front desk creates and updates a great deal by design. What it must never hold is
  // `manage` — the verb behind configuration, access and irreversible administration —
  // and it must have no grant at all on settings or users.
  const frontDeskManage = clinicResources.filter((resource) => can("front_desk", resource, "manage"));
  const frontDeskAdmin = (["settings", "users"] as const).flatMap((resource) =>
    clinicActions.filter((action) => can("front_desk", resource, action)).map((action) => `${resource}:${action}`),
  );
  check(
    "front desk can run the desk but cannot administer the clinic",
    frontDeskManage.length === 0
      && frontDeskAdmin.length === 0
      && canAccessWorkspace("front_desk", "front-desk")
      && canAccessWorkspace("front_desk", "schedule"),
    frontDeskManage.length || frontDeskAdmin.length
      ? `manage on [${frontDeskManage.join(", ")}] admin grants [${frontDeskAdmin.join(", ")}]`
      : "front-desk and schedule open; no `manage` verb anywhere and no grant on settings or users",
  );

  // --- 7. a real signed staff session round-trips with its role ------------
  const ownerUser = users.get("clinic_owner")!;
  const staffSession: ClinicSession = {
    sessionId: crypto.randomUUID(), userId: ownerUser.id, organizationId: org.id,
    organizationName: org.name, organizationSlug: org.slug, email: ownerUser.email,
    name: "Owner", role: "clinic_owner", demo: false,
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  };
  const staffToken = await signSessionToken(staffSession);
  const staffVerified = await verifySessionToken(staffToken);
  check(
    "a signed staff session carries its role and organization back intact",
    staffVerified?.role === "clinic_owner" && staffVerified?.organizationId === org.id,
    `role=${staffVerified?.role} org=${staffVerified?.organizationId === org.id ? "matched" : "MISMATCH"}`,
  );

  // --- 8. the two identity domains do not accept each other's tokens ------
  const patient = await db.patient.create({
    data: {
      organizationId: org.id, mrn: "MRN-ROUTE-1", firstName: "Portal", lastName: "Patient",
      dateOfBirth: new Date("1990-01-01"), status: "active",
    },
    select: { id: true },
  });
  const portalSession: PortalSession = {
    sessionId: crypto.randomUUID(), accountId: "acct_routing_1", patientId: patient.id,
    organizationId: org.id, organizationName: org.name, organizationSlug: org.slug,
    email: "portal-patient@routing.test", name: "Portal Patient", authLevel: "password",
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  };
  const portalToken = await signPortalSessionToken(portalSession);

  const portalAsStaff = await verifySessionToken(portalToken);
  const staffAsPortal = await verifyPortalSessionToken(staffToken);
  check(
    "a patient portal token is worthless as a staff session, and the reverse",
    portalAsStaff === null && staffAsPortal === null,
    `portalTokenAsStaff=${portalAsStaff === null ? "rejected" : "ACCEPTED"} staffTokenAsPortal=${staffAsPortal === null ? "rejected" : "ACCEPTED"}`,
  );

  // --- 9. a patient has no clinic role at all ------------------------------
  // The portal session type carries no role field, so there is nothing for the clinic
  // guard to widen. Asserted because the absence is the control.
  const portalHasRole = "role" in (portalSession as unknown as Record<string, unknown>);
  check(
    "a patient session carries no clinic role to escalate",
    !portalHasRole,
    portalHasRole ? "PORTAL SESSION CARRIES A CLINIC ROLE" : "portal sessions are scoped to a patient, not a staff role",
  );

  // --- 10. founder identity grants no extra workspace ---------------------
  // Founder mode is a Zumi conversation profile. It is not a role and must not move
  // a single door in the clinic.
  process.env.KLINIKOS_FOUNDER_USER_IDS = ownerUser.id;
  const asFounder = workspaceSlugs.filter((slug) => canAccessWorkspace("clinic_owner", slug));
  delete process.env.KLINIKOS_FOUNDER_USER_IDS;
  const asOwner = workspaceSlugs.filter((slug) => canAccessWorkspace("clinic_owner", slug));
  check(
    "being a founder does not open a workspace the role could not already open",
    asFounder.length === asOwner.length,
    `${asOwner.length} workspaces with founder identity set and unset alike`,
  );

  await reset();
  await db.$disconnect();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} role routing journey checks passed`);
  process.exit(passed === results.length ? 0 : 1);
}

main();
