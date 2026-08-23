import type { BodyMapDelta, BodyMapEvidenceRef, BodyMapFinding, BodyMapVersion } from "./body-map-types";

export function bodyMapFindingKey(finding: BodyMapFinding) {
  return [finding.bodyRegion.trim().toLowerCase(), finding.laterality, finding.symptom.trim().toLowerCase()].join("::");
}

function findingEvidence(version: BodyMapVersion, finding: BodyMapFinding): BodyMapEvidenceRef {
  return { bodyMapVersionId: version.id, findingId: finding.id };
}

function versionEvidence(version: BodyMapVersion): BodyMapEvidenceRef {
  return { bodyMapVersionId: version.id, findingId: null };
}

export function compareBodyMapVersions(previous: BodyMapVersion, current: BodyMapVersion): BodyMapDelta[] {
  if (current.findings.length === 0) return [];

  const previousByKey = new Map(previous.findings.map((finding) => [bodyMapFindingKey(finding), finding]));
  const currentByKey = new Map(current.findings.map((finding) => [bodyMapFindingKey(finding), finding]));
  const deltas: BodyMapDelta[] = [];

  for (const [key, currentFinding] of currentByKey) {
    const previousFinding = previousByKey.get(key);

    if (!previousFinding) {
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

  for (const [key, previousFinding] of previousByKey) {
    if (currentByKey.has(key)) continue;

    deltas.push({
      key,
      bodyRegion: previousFinding.bodyRegion,
      laterality: previousFinding.laterality,
      symptom: previousFinding.symptom,
      kind: "finding_removed",
      previousValue: previousFinding.symptom,
      currentValue: null,
      evidence: [findingEvidence(previous, previousFinding), versionEvidence(current)],
    });
  }

  return deltas;
}
