import type { BodyMapDelta, BodyMapEvidenceRef, BodyMapFinding, BodyMapVersion } from "./body-map-types";

export function bodyMapFindingKey(finding: Pick<BodyMapFinding, "bodyRegion" | "laterality" | "symptom">) {
  return [finding.bodyRegion.trim().toLowerCase(), finding.laterality, finding.symptom.trim().toLowerCase()].join("::");
}

export function validateBodyMapFinding(finding: Pick<BodyMapFinding, "severity" | "severityScale">) {
  if (finding.severity !== null && finding.severityScale === null) {
    throw new Error("Body map severity scale required");
  }
  if (finding.severity === null && finding.severityScale !== null) {
    throw new Error("Body map severity requires a numeric value");
  }
  if (finding.severityScale === "zero_to_ten" && finding.severity !== null && (finding.severity < 0 || finding.severity > 10)) {
    throw new Error("Body map severity out of range");
  }
}

function findingEvidence(version: BodyMapVersion, finding: BodyMapFinding): BodyMapEvidenceRef {
  return { bodyMapVersionId: version.id, findingId: finding.id };
}

function indexFindings(version: BodyMapVersion) {
  const findingsByKey = new Map<string, BodyMapFinding>();
  for (const finding of version.findings) {
    validateBodyMapFinding(finding);
    const key = bodyMapFindingKey(finding);
    if (findingsByKey.has(key)) throw new Error(`Duplicate body map finding key: ${key}`);
    findingsByKey.set(key, finding);
  }
  return findingsByKey;
}

export function compareBodyMapVersions(previous: BodyMapVersion, current: BodyMapVersion): BodyMapDelta[] {
  if (previous.organizationId !== current.organizationId) throw new Error("Body map organization mismatch");
  if (previous.patientId !== current.patientId) throw new Error("Body map patient mismatch");
  if (previous.contextType !== current.contextType || previous.contextId !== current.contextId) {
    throw new Error("Body map clinical context mismatch");
  }

  const previousByKey = indexFindings(previous);
  const currentByKey = indexFindings(current);
  if (currentByKey.size === 0) return [];

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

    if (
      previousFinding.severity !== null
      && currentFinding.severity !== null
      && previousFinding.severityScale !== null
      && previousFinding.severityScale === currentFinding.severityScale
    ) {
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
