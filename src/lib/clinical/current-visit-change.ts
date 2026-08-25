import { compareBodyMapVersions } from "@/lib/clinical/body-map-change";
import type { BodyMapDelta, BodyMapVersion } from "@/lib/clinical/body-map-types";

/**
 * "What changed" is the section a physician reads first, and it was a hardcoded
 * placeholder: the encounter always reported that structured change had not been
 * captured, regardless of what the chart actually held. A working comparison engine
 * already existed beside it and was never called.
 *
 * The states below stay deliberately distinct. A first recorded body map is real
 * clinical information with nothing yet to compare against — reporting that as "not
 * captured" would be false and would hide that a map exists.
 *
 * Nothing here infers resolution. `compareBodyMapVersions` emits no delta for a finding
 * that was present before and is absent now, because an omission is not evidence of
 * recovery. That silence is intentional and must not be "helpfully" filled in.
 */

export type CurrentVisitChangeState =
  | { status: "not_available" }
  | { status: "baseline"; capturedAt: string; findingCount: number }
  | {
      status: "compared";
      previousCapturedAt: string;
      currentCapturedAt: string;
      deltas: BodyMapDelta[];
      improved: number;
      worsened: number;
      unchanged: number;
      added: number;
    };

export function buildCurrentVisitChange(input: {
  previous: BodyMapVersion | null;
  current: BodyMapVersion | null;
}): CurrentVisitChangeState {
  const { previous, current } = input;
  if (!current) return { status: "not_available" };

  if (!previous) {
    return {
      status: "baseline",
      capturedAt: current.capturedAt,
      findingCount: current.findings.length,
    };
  }

  const deltas = compareBodyMapVersions(previous, current);
  let improved = 0;
  let worsened = 0;
  let unchanged = 0;
  let added = 0;
  for (const delta of deltas) {
    if (delta.kind === "severity_improved") improved += 1;
    else if (delta.kind === "severity_worsened") worsened += 1;
    else if (delta.kind === "severity_unchanged") unchanged += 1;
    else if (delta.kind === "finding_added") added += 1;
  }

  return {
    status: "compared",
    previousCapturedAt: previous.capturedAt,
    currentCapturedAt: current.capturedAt,
    deltas,
    improved,
    worsened,
    unchanged,
    added,
  };
}

function plural(count: number, singular: string) {
  return count === 1 ? `1 ${singular}` : `${count} ${singular}s`;
}

/**
 * The sentence a clinician reads above the detail.
 *
 * Leads with what moved, because that is the question being asked. No internal state
 * names, and no claim that anything resolved.
 */
export function summariseClinicalChange(state: CurrentVisitChangeState): string {
  if (state.status === "not_available") {
    return "No body map has been recorded for this patient yet.";
  }
  if (state.status === "baseline") {
    return "This is the first body map recorded. It becomes the baseline to compare against next visit.";
  }

  const { improved, worsened, added, unchanged, deltas } = state;
  if (deltas.length === 0) {
    return "No body map findings were recorded to compare against the last visit.";
  }
  if (improved > 0 && worsened > 0) {
    return `${plural(improved, "finding")} improved and ${worsened} worsened since the last body map.`;
  }
  if (improved > 0) return `${plural(improved, "finding")} improved since the last body map.`;
  if (worsened > 0) return `${plural(worsened, "finding")} worsened since the last body map.`;
  if (added > 0) return `${plural(added, "new finding")} since the last body map.`;
  if (unchanged > 0) return `${plural(unchanged, "finding")} unchanged since the last body map.`;
  return "No measurable change since the last body map.";
}
