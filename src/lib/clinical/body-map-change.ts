import type { BodyMapDelta, BodyMapEvidenceRef, BodyMapFinding, BodyMapVersion } from "./body-map-types";

export function bodyMapFindingKey(finding: BodyMapFinding) {
  return [finding.bodyRegion.trim().toLowerCase(), finding.laterality, finding.symptom.trim().toLowerCase()].join("::");
}

function evidence(version: BodyMapVersion, finding: BodyMapFinding): BodyMapEvidenceRef {
  return { bodyMapVersionId: version.id, findingId: finding.id };
}

export function compareBodyMapVersions(previous: BodyMapVersion, current: BodyMapVersion): BodyMapDelta[] {
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
        evidence: [evidence(current, currentFinding)],
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
        evidence: [evidence(previous, previousFinding), evidence(current, currentFinding)],
      });
    }

    if (
      previousFinding.functionalImpact !== null &&
      currentFinding.functionalImpact !== null &&
      previousFinding.functionalImpact !== currentFinding.functionalImpact
    ) {
      deltas.push({
        key,
        bodyRegion: currentFinding.bodyRegion,
        laterality: currentFinding.laterality,
        symptom: currentFinding.symptom,
        kind: "functional_impact_changed",
        previousValue: previousFinding.functionalImpact,
        currentValue: currentFinding.functionalImpact,
        evidence: [evidence(previous, previousFinding), evidence(current, currentFinding)],
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
      evidence: [evidence(previous, previousFinding)],
    });
  }

  return deltas;
}
