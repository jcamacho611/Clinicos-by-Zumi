import { roleLabel } from "@/lib/auth/rbac";
import type { ClinicRole } from "@/lib/auth/rbac";

/**
 * Who recorded a piece of staff handoff evidence.
 *
 * The physician requirement is that every handoff item names the role that recorded
 * it, and that medical assistants, LPNs and RNs are never collapsed into one another.
 * Those are different licences, so "a nurse took the vitals" is not the same clinical
 * claim as "an unlicensed assistant took the vitals".
 *
 * The `vitals` table stores no recorder today, so for existing measurements the honest
 * answer is that attribution was not captured. This module exists to make that absence
 * explicit rather than silent: a handoff that simply omits the question reads as though
 * attribution were unimportant, and a handoff that guesses would be worse still.
 *
 * The shape is deliberately ready for real attribution. When the recorder is persisted,
 * only `handoffAttributionFor`'s input changes — every consumer already renders both
 * outcomes.
 */

export interface ClinicalRecorder {
  readonly name: string;
  /** Null when the record predates role capture, or the role was never stored. */
  readonly role: ClinicRole | null;
}

export type HandoffAttribution =
  | {
      readonly recorded: true;
      readonly name: string;
      readonly role: ClinicRole;
      readonly roleLabel: string;
    }
  | {
      readonly recorded: false;
      /**
       * `not_captured` — nothing was stored about who recorded this.
       * `role_not_captured` — a person is known, but not the role they held.
       * `role_not_specific` — a role is known but it is the generic `clinical_staff`,
       *   which is precisely the collapse the requirement prohibits.
       */
      readonly reason: "not_captured" | "role_not_captured" | "role_not_specific";
    };

/**
 * Roles that answer "who recorded this" specifically enough to satisfy the
 * requirement. `clinical_staff` is deliberately excluded: it is retained so existing
 * memberships keep working, but it cannot distinguish an assistant from a nurse.
 */
const SPECIFIC_CLINICAL_ROLES = new Set<ClinicRole>([
  "medical_assistant",
  "licensed_practical_nurse",
  "registered_nurse",
  "provider",
]);

export function handoffAttributionFor(recorder: ClinicalRecorder | null | undefined): HandoffAttribution {
  if (!recorder) return { recorded: false, reason: "not_captured" };
  if (!recorder.role) return { recorded: false, reason: "role_not_captured" };
  if (!SPECIFIC_CLINICAL_ROLES.has(recorder.role)) {
    return { recorded: false, reason: "role_not_specific" };
  }
  return {
    recorded: true,
    name: recorder.name,
    role: recorder.role,
    roleLabel: roleLabel(recorder.role),
  };
}

/**
 * The sentence a clinician reads.
 *
 * Plain language first: no internal state names, no acronyms the reader has to decode,
 * and no phrasing that implies someone failed to do their job. An absent recorder is a
 * gap in what the software saved, not a gap in the care.
 */
export function describeHandoffAttribution(attribution: HandoffAttribution): string {
  if (attribution.recorded) {
    return `Recorded by ${attribution.name}, ${attribution.roleLabel.toLowerCase()}.`;
  }
  if (attribution.reason === "role_not_captured") {
    return "Who recorded this is known, but their role was not saved.";
  }
  if (attribution.reason === "role_not_specific") {
    return "This was recorded before Klinikos told medical assistants, LPNs and RNs apart.";
  }
  return "Who recorded this was not saved with the measurement.";
}
