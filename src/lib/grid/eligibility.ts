import { z } from "zod";

/**
 * Grid eligibility.
 *
 * Answers one question, and only this question:
 *
 *   May this participant perform THIS activity, in THIS jurisdiction, at THIS
 *   facility, over THIS window of time?
 *
 * Grid already had an eligibility check. It was `providerReadyForGrid`, it returned a
 * boolean, and it asked none of those things — verified, malpractice current, and at
 * least one unexpired credential of any type in any state. That is the assumption the
 * constitution forbids in as many words: a valid licence is not eligibility for
 * everything. A nurse licensed in New York was equally "ready" for work in Texas, and
 * an aesthetic injector was as ready to precept a student as to inject.
 *
 * Three properties this module exists to hold:
 *
 *   **Deterministic.** There is no override parameter, no score, no confidence, and no
 *   input a model could supply. Intelligence may rank eligible candidates and explain a
 *   refusal; it may never produce one. If a future caller wants to relax a rule, it has
 *   to change an activity definition in source, where review can see it.
 *
 *   **Contextual.** The same person is eligible for one activity and not another, in
 *   one state and not the next, this month and not after their licence lapses. A single
 *   boolean cannot express that, which is why the old one was wrong rather than merely
 *   incomplete.
 *
 *   **Fail closed, and say everything.** Missing information is a refusal, never a
 *   pass — an unknown jurisdiction is not a matching one. Every failing condition is
 *   returned together, so a contractor learns the whole list once instead of fixing one
 *   thing per rejection.
 *
 * Pure module. No database, no network, no clock of its own — `at` is supplied.
 */

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

/**
 * What someone is being asked to do.
 *
 * An activity is the unit eligibility is decided against, deliberately finer than a
 * job title. `SUPERVISE_INJECTION` and `PERFORM_INJECTION` have different requirements
 * and different people satisfy them.
 */
export const gridActivityKeys = [
  "perform_aesthetic_injection",
  "supervise_aesthetic_injection",
  "perform_rn_service",
  "perform_np_service",
  "provide_medical_direction",
  "precept_student",
  "host_at_facility",
] as const;
export type GridActivityKey = (typeof gridActivityKeys)[number];

export type GridActivity = {
  key: GridActivityKey;
  label: string;
  /**
   * Provider types permitted to perform this at all — scope of practice.
   *
   * Checked before credentials, because someone outside scope does not become eligible
   * by holding a current licence. This is the check that stops a marketplace from
   * matching an enthusiastic but unqualified participant to regulated work.
   */
  permittedProviderTypes: readonly string[];
  /**
   * Credential types that satisfy the activity. Any one is sufficient.
   *
   * Empty means the activity needs no professional credential — it does not mean any
   * credential will do.
   */
  acceptableCredentialTypes: readonly string[];
  /**
   * Whether the satisfying credential must be issued by the jurisdiction where the work
   * happens. True for anything requiring a licence to practise.
   */
  requiresJurisdictionMatch: boolean;
  requiresMalpractice: boolean;
  /** Whether the participant must hold a current privilege at the specific facility. */
  requiresFacilityPrivilege: boolean;
};

/**
 * The activity catalog.
 *
 * Enumerated rather than free-form so that adding regulated work is a reviewed change
 * to this file, not a string a caller invents. An unknown activity key is a refusal,
 * which is the safe direction: a marketplace that matches work it cannot describe is a
 * marketplace that has stopped checking.
 *
 * These requirements are Klinikos policy, not legal advice, and several of them vary by
 * state. `requiresJurisdictionMatch` is what makes that variation expressible; the
 * per-state rules themselves belong to clinical governance and are not encoded here.
 */
export const gridActivityCatalog: readonly GridActivity[] = [
  {
    key: "perform_aesthetic_injection",
    label: "Perform aesthetic injection",
    permittedProviderTypes: ["Nurse Injector", "Registered Nurse", "Nurse Practitioner", "Physician Assistant", "Physician"],
    acceptableCredentialTypes: ["RN", "NP", "PA", "MD", "DO"],
    requiresJurisdictionMatch: true,
    requiresMalpractice: true,
    requiresFacilityPrivilege: true,
  },
  {
    key: "supervise_aesthetic_injection",
    label: "Supervise aesthetic injection",
    permittedProviderTypes: ["Nurse Practitioner", "Physician Assistant", "Physician"],
    acceptableCredentialTypes: ["NP", "PA", "MD", "DO"],
    requiresJurisdictionMatch: true,
    requiresMalpractice: true,
    requiresFacilityPrivilege: false,
  },
  {
    key: "perform_rn_service",
    label: "Perform registered-nurse service",
    permittedProviderTypes: ["Registered Nurse", "Nurse Injector", "Nurse Practitioner"],
    acceptableCredentialTypes: ["RN", "NP"],
    requiresJurisdictionMatch: true,
    requiresMalpractice: true,
    requiresFacilityPrivilege: true,
  },
  {
    key: "perform_np_service",
    label: "Perform nurse-practitioner service",
    permittedProviderTypes: ["Nurse Practitioner"],
    acceptableCredentialTypes: ["NP"],
    requiresJurisdictionMatch: true,
    requiresMalpractice: true,
    requiresFacilityPrivilege: true,
  },
  {
    key: "provide_medical_direction",
    label: "Provide medical direction",
    permittedProviderTypes: ["Physician"],
    acceptableCredentialTypes: ["MD", "DO"],
    requiresJurisdictionMatch: true,
    requiresMalpractice: true,
    requiresFacilityPrivilege: false,
  },
  {
    key: "precept_student",
    label: "Precept a student",
    permittedProviderTypes: ["Registered Nurse", "Nurse Practitioner", "Physician Assistant", "Physician"],
    acceptableCredentialTypes: ["RN", "NP", "PA", "MD", "DO"],
    requiresJurisdictionMatch: true,
    requiresMalpractice: true,
    requiresFacilityPrivilege: true,
  },
  {
    key: "host_at_facility",
    label: "Host work at a facility",
    // A facility owner offering space is not practising, so no professional credential
    // and no jurisdiction match. The facility's own approvals are checked elsewhere.
    permittedProviderTypes: [],
    acceptableCredentialTypes: [],
    requiresJurisdictionMatch: false,
    requiresMalpractice: false,
    requiresFacilityPrivilege: false,
  },
];

export function getGridActivity(key: string): GridActivity | undefined {
  return gridActivityCatalog.find((activity) => activity.key === key);
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export type GridEligibilityParticipant = {
  /** `verified` is the only value that admits a participant to regulated work. */
  verificationStatus: string;
  providerType: string;
  malpracticeVerificationStatus: string;
  malpracticeExpiration: Date | null;
};

export type GridEligibilityCredential = {
  type: string;
  /** Issuing jurisdiction. Null is unknown, and unknown never matches. */
  state: string | null;
  expiresAt: Date | null;
  /** Lifecycle on the credential itself — `active`, `revoked`, `suspended`. */
  status: string;
  verificationStatus: string;
};

export type GridEligibilityPrivilege = {
  facilityId: string;
  status: string;
  expiresAt: Date | null;
};

export const gridEligibilityFailureCodes = [
  "unknown_activity",
  "participant_unverified",
  "participant_suspended",
  "scope_of_practice",
  "no_acceptable_credential",
  "credential_unverified",
  "credential_expired",
  "credential_not_active",
  "credential_wrong_jurisdiction",
  "jurisdiction_unknown",
  "malpractice_unverified",
  "malpractice_expired",
  "facility_unknown",
  "no_facility_privilege",
  "facility_privilege_expired",
] as const;
export type GridEligibilityFailureCode = (typeof gridEligibilityFailureCodes)[number];

export type GridEligibilityFailure = { code: GridEligibilityFailureCode; detail: string };

/**
 * Why a participant was admitted.
 *
 * Recorded so an audit can answer "on what basis", which the constitution requires of
 * any consequential decision. A booking that cites the credential it relied on can be
 * re-examined later; one that cites nothing cannot.
 */
export type GridEligibilityBasis = {
  activity: GridActivityKey;
  jurisdiction: string | null;
  credentialType: string | null;
  credentialExpiresAt: Date | null;
  facilityId: string | null;
  evaluatedAt: Date;
  evaluatedThrough: Date | null;
};

export type GridEligibilityDecision =
  | { eligible: true; basis: GridEligibilityBasis }
  | { eligible: false; failures: GridEligibilityFailure[] };

const SUSPENDED_PARTICIPANT_STATUSES = ["suspended", "revoked", "rejected", "expired"];

function normalizeJurisdiction(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

/**
 * Whether a date is still in force across the whole engagement.
 *
 * `through` matters more than it looks. A credential that is current on the day work
 * starts and lapses midway through a booked engagement makes the later half unlicensed,
 * and checking only the start date is how that happens. Callers evaluating a booking
 * pass the end of the window; callers merely listing candidates may omit it.
 */
function currentThrough(expiresAt: Date | null, at: Date, through: Date | null) {
  if (!expiresAt) return true;
  return expiresAt > (through ?? at);
}

// ---------------------------------------------------------------------------
// The decision
// ---------------------------------------------------------------------------

export function evaluateGridEligibility(input: {
  participant: GridEligibilityParticipant;
  credentials: readonly GridEligibilityCredential[];
  privileges?: readonly GridEligibilityPrivilege[];
  /** Activity key. An unrecognised one is refused rather than waved through. */
  activity: string;
  /** Where the work happens. Null is unknown. */
  jurisdiction?: string | null;
  facilityId?: string | null;
  at: Date;
  /** End of the engagement, when there is one. Credentials must survive it. */
  through?: Date | null;
}): GridEligibilityDecision {
  const failures: GridEligibilityFailure[] = [];
  const activity = getGridActivity(input.activity);
  if (!activity) {
    return {
      eligible: false,
      failures: [{ code: "unknown_activity", detail: `"${input.activity}" is not a declared Grid activity, so no eligibility rule exists for it.` }],
    };
  }

  const at = input.at;
  const through = input.through ?? null;
  const jurisdiction = normalizeJurisdiction(input.jurisdiction);

  // --- the participant themselves -----------------------------------------
  if (SUSPENDED_PARTICIPANT_STATUSES.includes(input.participant.verificationStatus)) {
    failures.push({
      code: "participant_suspended",
      detail: `This participant is ${input.participant.verificationStatus} and cannot be matched to Grid work.`,
    });
  } else if (input.participant.verificationStatus !== "verified") {
    failures.push({
      code: "participant_unverified",
      detail: "Human verification of this participant has not completed. Purchase and profile completion do not substitute for it.",
    });
  }

  // --- scope of practice ---------------------------------------------------
  // Checked before credentials: someone outside scope is not made eligible by holding a
  // current licence, and saying "expired credential" to them would be the wrong answer.
  if (activity.permittedProviderTypes.length > 0 && !activity.permittedProviderTypes.includes(input.participant.providerType)) {
    failures.push({
      code: "scope_of_practice",
      detail: `${activity.label} is not within the scope of a ${input.participant.providerType}.`,
    });
  }

  // --- the credential that would authorise the work ------------------------
  let satisfying: GridEligibilityCredential | null = null;
  if (activity.acceptableCredentialTypes.length > 0) {
    const ofType = input.credentials.filter((credential) => activity.acceptableCredentialTypes.includes(credential.type));

    if (ofType.length === 0) {
      failures.push({
        code: "no_acceptable_credential",
        detail: `${activity.label} requires one of: ${activity.acceptableCredentialTypes.join(", ")}.`,
      });
    } else {
      // Jurisdiction is narrowed first so the reported reason is the most specific one.
      // Telling a New York nurse their licence is expired when the real problem is that
      // the work is in Texas sends them to fix the wrong thing.
      let candidates = ofType;
      if (activity.requiresJurisdictionMatch) {
        if (!jurisdiction) {
          failures.push({
            code: "jurisdiction_unknown",
            detail: "The jurisdiction where this work happens is not known, and a licence cannot be matched against an unknown one.",
          });
          candidates = [];
        } else {
          candidates = candidates.filter((credential) => normalizeJurisdiction(credential.state) === jurisdiction);
          if (candidates.length === 0) {
            failures.push({
              code: "credential_wrong_jurisdiction",
              detail: `No credential issued in ${jurisdiction}. A licence is valid only where it was issued.`,
            });
          }
        }
      }

      const active = candidates.filter((credential) => credential.status === "active");
      if (candidates.length > 0 && active.length === 0) {
        failures.push({ code: "credential_not_active", detail: "The matching credential is not active." });
      }

      const verified = active.filter((credential) => credential.verificationStatus === "verified");
      if (active.length > 0 && verified.length === 0) {
        failures.push({
          code: "credential_unverified",
          detail: "The matching credential has not completed primary-source verification.",
        });
      }

      const current = verified.filter((credential) => currentThrough(credential.expiresAt, at, through));
      if (verified.length > 0 && current.length === 0) {
        failures.push({
          code: "credential_expired",
          detail: through
            ? "The matching credential expires before this engagement ends."
            : "The matching credential has expired.",
        });
      }

      // Prefer the credential that stays valid longest, so the recorded basis is the
      // strongest one available rather than an arbitrary pick.
      satisfying = current.slice().sort((a, b) => (b.expiresAt?.getTime() ?? Infinity) - (a.expiresAt?.getTime() ?? Infinity))[0] ?? null;
    }
  }

  // --- malpractice ---------------------------------------------------------
  if (activity.requiresMalpractice) {
    if (input.participant.malpracticeVerificationStatus !== "verified") {
      failures.push({ code: "malpractice_unverified", detail: "Malpractice coverage has not been verified by a person." });
    } else if (!currentThrough(input.participant.malpracticeExpiration, at, through)) {
      failures.push({
        code: "malpractice_expired",
        detail: through ? "Malpractice coverage lapses before this engagement ends." : "Malpractice coverage has expired.",
      });
    }
  }

  // --- facility privilege --------------------------------------------------
  if (activity.requiresFacilityPrivilege) {
    if (!input.facilityId) {
      failures.push({
        code: "facility_unknown",
        detail: `${activity.label} happens at a facility, and no facility was named to check privileges against.`,
      });
    } else {
      const privilege = (input.privileges ?? []).find((entry) => entry.facilityId === input.facilityId);
      if (!privilege || privilege.status !== "active") {
        failures.push({ code: "no_facility_privilege", detail: "No active privilege at this facility." });
      } else if (!currentThrough(privilege.expiresAt, at, through)) {
        failures.push({
          code: "facility_privilege_expired",
          detail: through ? "Facility privileges lapse before this engagement ends." : "Facility privileges have expired.",
        });
      }
    }
  }

  if (failures.length > 0) return { eligible: false, failures };

  return {
    eligible: true,
    basis: {
      activity: activity.key,
      jurisdiction,
      credentialType: satisfying?.type ?? null,
      credentialExpiresAt: satisfying?.expiresAt ?? null,
      facilityId: input.facilityId ?? null,
      evaluatedAt: at,
      evaluatedThrough: through,
    },
  };
}

/**
 * The activities a participant is eligible for right now.
 *
 * Convenience over the same decision, used to show a contractor what they may take on
 * and what is standing between them and the rest. It never widens the answer — it calls
 * the same function once per activity.
 */
export function eligibleGridActivities(input: {
  participant: GridEligibilityParticipant;
  credentials: readonly GridEligibilityCredential[];
  privileges?: readonly GridEligibilityPrivilege[];
  jurisdiction?: string | null;
  facilityId?: string | null;
  at: Date;
}) {
  return gridActivityCatalog.map((activity) => ({
    activity: activity.key,
    label: activity.label,
    decision: evaluateGridEligibility({ ...input, activity: activity.key }),
  }));
}

export const gridEligibilityRequestSchema = z.object({
  activity: z.enum(gridActivityKeys),
  jurisdiction: z.string().trim().length(2).optional().nullable(),
  facilityId: z.string().trim().min(1).max(64).optional().nullable(),
  startsAt: z.string().datetime({ offset: true }).optional().nullable(),
  endsAt: z.string().datetime({ offset: true }).optional().nullable(),
});
