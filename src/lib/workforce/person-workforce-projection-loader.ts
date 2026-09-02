import "server-only";

import type { PersonAccountSession } from "@/lib/auth/account-types";
import {
  listCareerArtifactVersions,
  type CareerArtifactView,
} from "@/lib/career/career-artifact-repository";
import { db } from "@/lib/db";
import { getClinicalPlacementProgress } from "@/lib/edu/clinical-placement-repository";
import { buildEffectiveRelationshipWhere } from "@/lib/identity/relationship-repository";
import {
  buildPersonWorkforceProjection,
  type PersonWorkforceProjection,
  type WorkforcePlacementInput,
  type WorkforceRelationshipInput,
} from "@/lib/workforce/person-workforce-projection";

export type PersonWorkforcePersistedAccount = {
  id: string;
  personId: string;
  status: string;
  emailVerifiedAt: Date | null;
};

/**
 * Small injectable boundary used to prove the workforce projection is assembled from
 * persisted server truth. The browser never supplies Person identity, Account
 * verification state, relationships, placement state, or professional authority state.
 */
export type PersonWorkforceProjectionDataSource = {
  findAccount(accountId: string): Promise<PersonWorkforcePersistedAccount | null>;
  findLatestCareerArtifact(personId: string): Promise<CareerArtifactView | null>;
  listRelationships(personId: string): Promise<WorkforceRelationshipInput[]>;
  findPlacementProgress(personId: string): Promise<WorkforcePlacementInput | null>;
};

export async function loadPersonWorkforceProjectionWith(
  source: PersonWorkforceProjectionDataSource,
  session: PersonAccountSession,
): Promise<PersonWorkforceProjection> {
  const account = await source.findAccount(session.accountId);
  if (!account || account.status !== "active") {
    throw new Error("Active Person Account context was not found.");
  }
  if (account.personId !== session.personId) {
    throw new Error("Person Account context does not match the authenticated Person.");
  }

  const [careerArtifact, relationships, placement] = await Promise.all([
    source.findLatestCareerArtifact(session.personId),
    source.listRelationships(session.personId),
    source.findPlacementProgress(session.personId),
  ]);

  return buildPersonWorkforceProjection({
    careerArtifact,
    relationships,
    accountEmailVerified: Boolean(account.emailVerifiedAt),
    placement,
  });
}

const persistedWorkforceSource: PersonWorkforceProjectionDataSource = {
  async findAccount(accountId) {
    return db.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        personId: true,
        status: true,
        emailVerifiedAt: true,
      },
    });
  },

  async findLatestCareerArtifact(personId) {
    const artifacts = await listCareerArtifactVersions(personId);
    return artifacts[0] ?? null;
  },

  async listRelationships(personId) {
    const rows = await db.personRelationship.findMany({
      where: {
        personId,
        ...buildEffectiveRelationshipWhere(new Date()),
      },
      select: {
        id: true,
        relationshipType: true,
        status: true,
        verificationState: true,
        domainKind: true,
        domainRecordId: true,
      },
      orderBy: [{ effectiveFrom: "asc" }, { id: "asc" }],
    });

    return rows.map((row) => ({
      id: row.id,
      relationshipType: row.relationshipType,
      status: row.status,
      verificationState: row.verificationState,
      domainKind: row.domainKind,
      domainRecordId: row.domainRecordId,
    }));
  },

  async findPlacementProgress(personId) {
    const placement = await db.educationPlacement.findFirst({
      where: { learnerPersonId: personId },
      select: { id: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    if (!placement) return null;

    const progress = await getClinicalPlacementProgress({ placementId: placement.id });
    return {
      status: progress.placement.status,
      approvals: { ...progress.approvals },
      requiredMinutes: progress.placement.requiredMinutes,
      acceptedMinutes: progress.acceptedMinutes,
      remainingMinutes: progress.remainingMinutes,
      hoursComplete: progress.hoursComplete,
    };
  },
};

/**
 * Production loader for a currently authenticated Person Account.
 *
 * The session contributes only the authenticated Account/Person identifiers. All
 * workforce facts are re-read from persistence before a browser-safe projection is
 * produced, so stale or browser-authored claims cannot become workforce authority.
 */
export async function loadPersonWorkforceProjection(
  session: PersonAccountSession,
): Promise<PersonWorkforceProjection> {
  return loadPersonWorkforceProjectionWith(persistedWorkforceSource, session);
}
