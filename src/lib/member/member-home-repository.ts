import "server-only";

import { db } from "@/lib/db";
import type { PersonAccountSession } from "@/lib/auth/account-types";
import type { CanonicalPlaneId } from "@/lib/ecosystem/canonical-ecosystem-graph";
import { buildEffectiveRelationshipWhere } from "@/lib/identity/relationship-repository";
import { PLANE_LANGUAGE } from "@/lib/universe/plane-language";
import type { MemberHomeProjection } from "@/components/living-universe/universe-shell";
import { klinikosPathCatalog } from "@/lib/paths/catalog";
import {
  isAllowedMemberActionHref,
  personEntryHrefForPath,
} from "@/lib/member/member-action-routes";


function lensStatus(id: CanonicalPlaneId, input: { hasClaims: boolean; hasRelationships: boolean }) {
  if (id === "healthcare_universe") return input.hasRelationships ? "context_claimed" : "person_present";
  if (id === "economic_resource") return "discovery_available";
  if (id === "lifecycle") return input.hasClaims ? "claims_present" : "profile_started";
  if (id === "operating_infrastructure") return "account_connected";
  return "not_projected";
}

/**
 * Minimum-necessary person-level Living Home projection.
 *
 * This deliberately does not join Patient, Provider, Organization, clinical, billing,
 * or private Grid records. A free Account authenticates one Person; it does not prove
 * any of those other relationships or authorize their data to cross into this surface.
 */
export async function getMemberHomeProjection(
  session: PersonAccountSession,
  requestedPathId?: string,
): Promise<MemberHomeProjection> {
  const asOf = new Date();
  const effectiveRelationshipWhere = buildEffectiveRelationshipWhere(asOf);
  // The query string is navigation input, never evidence. Resolve it back through the
  // server-owned catalog before projecting a title, a route, or any other context.
  const requestedPath = requestedPathId
    ? klinikosPathCatalog.find((path) => path.id === requestedPathId)
    : undefined;
  const person = await db.person.findUnique({
    where: { id: session.personId },
    select: {
      displayName: true,
      status: true,
      account: {
        select: {
          id: true,
          status: true,
          emailVerifiedAt: true,
        },
      },
      memberships: {
        where: effectiveRelationshipWhere,
        select: { id: true },
        take: 1,
      },
      relationships: {
        where: effectiveRelationshipWhere,
        select: { verificationState: true },
        take: 20,
      },
      careerArtifacts: {
        orderBy: [{ artifactVersion: "desc" }, { createdAt: "desc" }],
        select: { claimState: true, verificationState: true },
        take: 1,
      },
    },
  });

  if (
    !person
    || person.status !== "active"
    || !person.account
    || person.account.id !== session.accountId
    || person.account.status !== "active"
  ) {
    throw new Error("The active person account could not be projected.");
  }

  const careerArtifact = person.careerArtifacts[0];
  const hasRelationships = person.memberships.length > 0 || person.relationships.length > 0;
  const hasClaims = hasRelationships || Boolean(careerArtifact);
  const verifiedRelationship = person.relationships.some(
    (relationship) => relationship.verificationState === "verified",
  );

  // Ordinal, title and description all come from the shared plane language, so
  // the member's rail and the public universe cannot disagree about what a plane
  // is called or where it sits in the order.
  const lenses = PLANE_LANGUAGE.map((plane) => ({
    id: plane.id,
    number: plane.ordinal,
    title: plane.label,
    description: plane.governance,
    status: lensStatus(plane.id, { hasClaims, hasRelationships }),
  }));

  const evidence = [
    "Active person-owned account",
    person.account.emailVerifiedAt
      ? "Email verification evidence is recorded"
      : "Email verification evidence is not recorded",
  ];
  if (careerArtifact) {
    evidence.push(`Career evidence is ${careerArtifact.claimState}; verification is ${careerArtifact.verificationState}.`);
  }
  if (person.relationships.length > 0) {
    evidence.push(verifiedRelationship
      ? "At least one relationship has verification evidence."
      : "Relationship claims are present without verified authority.");
  }
  let pathStartHref: `/${string}` | null = null;
  if (requestedPath) {
    const target = new URL(personEntryHrefForPath(requestedPath), "https://klinikos.local");
    target.searchParams.set("path", requestedPath.id);
    const candidate = `${target.pathname}${target.search}${target.hash}`;
    pathStartHref = isAllowedMemberActionHref(candidate) ? candidate : null;
  }
  const actions: MemberHomeProjection["actions"] = [
    ...(pathStartHref && requestedPath ? [{
      id: "continue-path",
      label: "Continue this path",
      href: pathStartHref,
      description: `Continue ${requestedPath.title} at its person-safe entry. The destination keeps its own authorization boundary.`,
    }] : []),
    { id: "grid", label: "Explore Grid", href: "/grid", description: "Say what you need or what you have and review public-safe discovery." },
    { id: "edu", label: "Explore EDU", href: "/edu", description: "Review learning pathways without treating completion as a license." },
    { id: "home", label: "Keep this context", href: "/member", description: "Return to your person-level Living Home." },
  ];

  return {
    person: { displayName: person.displayName?.trim() || session.displayName },
    activeLens: "lifecycle",
    lenses,
    object: {
      id: "person-profile",
      title: "Your Klinikos identity",
      kind: "Person profile",
      state: hasClaims ? "Claims present" : "Account active",
      summary: hasClaims
        ? "Your person-owned profile can carry claims and evidence while Klinikos keeps verification, eligibility, and authority separate."
        : "Your person-owned identity is active. You can explore Grid, learning, and governed paths without being assigned a role you did not choose.",
      claimStatus: hasClaims ? "claimed" : "unverified",
      authorityNotice: "An active account or self-supplied claim is not a license, organization role, patient relationship, Grid eligibility decision, or payment authority.",
    },
    timeline: {
      before: "You entered Klinikos through one person-owned account.",
      now: hasClaims
        ? "Klinikos is preserving your claims and evidence without presenting them as authority."
        : "Your identity is active without a manufactured patient, professional, learner, or organization role.",
      next: requestedPath
        ? `Continue ${requestedPath.title} from its first available governed step. The selected goal remains navigation context, not eligibility or authority.`
        : "Tell Grid what you need or have, explore learning, or continue building only the context relevant to your goal.",
    },
    inspector: {
      eyebrow: "Evidence and authority",
      title: "What is true now",
      body: "This view comes from your active Person and Account plus bounded claim state. It does not project private organization or patient records.",
      evidence,
      authority: [
        "Account access grants no organization, patient, professional, clinical, billing, or payout authority.",
        "Eligibility is evaluated for each governed opportunity before ranking or action.",
        "Zumi may explain and prepare; deterministic policy and authorized people decide consequential state.",
      ],
    },
    actions,
  };
}
