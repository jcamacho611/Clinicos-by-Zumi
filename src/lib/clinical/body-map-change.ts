import { bodyMapFindingIdentityKey } from "@/lib/clinical/body-map-identity";
import type { BodyMapDelta, BodyMapEvidenceRef, BodyMapFinding, BodyMapVersion } from "./body-map-types";

export const bodyMapFindingKey = bodyMapFindingIdentityKey;

function findingEvidence(version: BodyMapVersion, finding: BodyMapFinding): BodyMapEvidenceRef {
  return { bodyMapVersionId: version.id, findingId: finding.id };
}

function assertValidFinding(finding: BodyMapFinding) {
  if (finding.severity !== null && (
    !Number.isFinite(finding.severity)
    || !Number.isInteger(finding.severity)
    || finding.severity < 0
    || finding.severity > 10
  )) {
    throw new Error(`Invalid body map severity for finding ${finding.id}`);
  }
  if (finding.clinicalState !== "active" && finding.clinicalState !== "resolved") {
    throw new Error(`Invalid body map clinical state for finding ${finding.id}`);
  }
  if (finding.clinicalState === "resolved" && finding.severity !== null && finding.severity !== 0) {
    throw new Error(`Invalid resolved body map severity for finding ${finding.id}`);
  }
}

function indexFindings(version: BodyMapVersion) {
  const findingsByKey = new Map<string, BodyMapFinding>();

  for (const finding of version.findings) {
    assertValidFinding(finding);
    const key = bodyMapFindingKey(finding);
    if (findingsByKey.has(key)) {
      throw new Error(`Duplicate body map finding key: ${key}`);
    }
    findingsByKey.set(key, finding);
  }

  return findingsByKey;
}

export function compareBodyMapVersions(previous: BodyMapVersion, current: BodyMapVersion): BodyMapDelta[] {
  if (previous.patientId !== current.patientId) {
    throw new Error("Body map patient mismatch");
  }

  const previousByKey = indexFindings(previous);
  const currentByKey = indexFindings(current);
  if (currentByKey.size === 0) return [];

  const deltas: BodyMapDelta[] = [];

  for (const [key, currentFinding] of currentByKey) {
    const previousFinding = previousByKey.get(key);

    if (!previousFinding) {
      if (currentFinding.clinicalState === "active") {
        deltas.push({
          key,
          bodyRegion: currentFinding.bodyRegion,
          laterality: currentFinding.laterality,
          symptom: currentFinding.symptom,
          kind: "finding_added",
          previousValue: null,
          currentValue: currentFinding.symptom,
          evidence: [findingEvidence(current, currentFinding)],
        });
      }
      continue;
    }

    if (previousFinding.clinicalState === "active" && currentFinding.clinicalState === "resolved") {
      deltas.push({
        key,
        bodyRegion: currentFinding.bodyRegion,
        laterality: currentFinding.laterality,
        symptom: currentFinding.symptom,
        kind: "finding_resolved",
        previousValue: "active",
        currentValue: "resolved",
        evidence: [findingEvidence(previous, previousFinding), findingEvidence(current, currentFinding)],
      });
      continue;
    }

    if (previousFinding.clinicalState === "resolved" || currentFinding.clinicalState === "resolved") {
      continue;
    }

    if (previousFinding.severity !== null && currentFinding.severity !== null) {
      const kind = currentFinding.severity < previousFinding.severity
        ? "severity_improved"
        : currentFinding.severity > previousFinding.severity
          ? "severity_worsened"
          : "severity_unchanged";

      deltas.push({
        key,
        bodyRegion: currentFinding.bodyRegion,
        laterality: currentFinding.laterality,
        symptom: currentFinding.symptom,
        kind,
        previousValue: previousFinding.severity,
        currentValue: currentFinding.severity,
        evidence: [findingEvidence(previous, previousFinding), findingEvidence(current, currentFinding)],
      });
    }

    if (previousFinding.functionalImpact !== currentFinding.functionalImpact) {
      deltas.push({
        key,
        bodyRegion: currentFinding.bodyRegion,
        laterality: currentFinding.laterality,
        symptom: currentFinding.symptom,
        kind: "functional_impact_changed",
        previousValue: previousFinding.functionalImpact,
        currentValue: currentFinding.functionalImpact,
        evidence: [findingEvidence(previous, previousFinding), findingEvidence(current, currentFinding)],
      });
    }
  }

  return deltas;
}
