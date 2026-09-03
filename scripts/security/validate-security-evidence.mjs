import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(process.argv[2] ?? "docs/governance/KLINIKOS_SECURITY_EVIDENCE.json");
const ledger = JSON.parse(readFileSync(path, "utf8"));
const errors = [];
const ids = new Set();
const forbiddenClaims = /\b(?:HIPAA compliant|SOC ?2 compliant|certified)\b/i;
const placeholder = /^(?:TBD|TODO|UNKNOWN|N\/A|PLACEHOLDER|OWNER)$/i;
const now = Date.now();

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

function validDate(value) {
  if (value === null) return true;
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

if (ledger?.status !== "SUBORDINATE_SECURITY_EVIDENCE") {
  errors.push("register status must be SUBORDINATE_SECURITY_EVIDENCE");
}
if (ledger?.authority?.parent !== "docs/KLINIKOS_MASTER_CANON.md") {
  errors.push("register authority must remain subordinate to docs/KLINIKOS_MASTER_CANON.md");
}
if (ledger?.authority?.mayOverrideProductAuthority !== false) {
  errors.push("register may not override product authority");
}
if (!Array.isArray(ledger.states) || ledger.states.length === 0) errors.push("register states are required");
if (!Array.isArray(ledger.dataClasses) || ledger.dataClasses.length === 0) errors.push("register dataClasses are required");
if (!Array.isArray(ledger.controls) || ledger.controls.length === 0) errors.push("register controls are required");

for (const [index, control] of (ledger.controls ?? []).entries()) {
  const id = typeof control.controlId === "string" && control.controlId.trim() ? control.controlId.trim() : `index-${index}`;
  if (!control.controlId || ids.has(control.controlId)) errors.push(`duplicate control ${id}`);
  ids.add(control.controlId);

  if (!ledger.states?.includes(control.state)) errors.push(`${id}: unknown state`);
  if (!isStringArray(control.environments)) errors.push(`${id}: environments must be a non-empty string array`);
  if (!isStringArray(control.dataClasses) || control.dataClasses.some((value) => !ledger.dataClasses.includes(value))) {
    errors.push(`${id}: dataClasses contain an unknown or empty value`);
  }
  if (!isStringArray(control.capabilities)) errors.push(`${id}: capabilities must be a non-empty string array`);

  for (const field of ["technicalEvidenceRefs", "operationalEvidenceRefs", "externalEvidenceRefs", "legalEvidenceRefs"]) {
    if (!Array.isArray(control[field]) || control[field].some((ref) => typeof ref !== "string" || !ref.trim() || placeholder.test(ref.trim()))) {
      errors.push(`${id}: ${field} must contain only concrete string references`);
    }
  }

  if (typeof control.owner !== "string" || !control.owner.trim() || placeholder.test(control.owner.trim())) {
    errors.push(`${id}: placeholder owner is not allowed`);
  }
  if (!validDate(control.lastVerifiedAt)) errors.push(`${id}: invalid lastVerifiedAt`);
  if (!validDate(control.expiresAt)) errors.push(`${id}: invalid expiresAt`);
  if (control.lastVerifiedAt && Date.parse(control.lastVerifiedAt) > now + 60_000) {
    errors.push(`${id}: future verification timestamp is not allowed`);
  }
  if (forbiddenClaims.test(control.allowedClaim ?? "")) errors.push(`${id}: unsupported broad claim`);

  if (control.state === "PRODUCTION_VERIFIED") {
    if (control.technicalEvidenceRefs.length === 0) {
      errors.push(`${id}: PRODUCTION_VERIFIED lacks technical evidence`);
    }
    if (control.expiresAt && Date.parse(control.expiresAt) <= now) {
      errors.push(`${id}: expired evidence cannot remain PRODUCTION_VERIFIED`);
    }
    if (control.dataClasses.includes("PHI") && control.operationalEvidenceRefs.length === 0) {
      errors.push(`${id}: PRODUCTION_VERIFIED PHI lacks operational evidence`);
    }
    const externalPhiRail = control.dataClasses.includes("PHI")
      && control.capabilities.some((capability) => /external|vendor|provider/i.test(capability));
    if (externalPhiRail && control.externalEvidenceRefs.length === 0) {
      errors.push(`${id}: PRODUCTION_VERIFIED external PHI rail lacks external evidence`);
    }
    if (externalPhiRail && control.legalEvidenceRefs.length === 0) {
      errors.push(`${id}: PRODUCTION_VERIFIED external PHI rail lacks legal evidence`);
    }
  }

  if ([
    "BLOCKED",
    "EXTERNAL_EVIDENCE_REQUIRED",
    "LEGAL_REVIEW_REQUIRED",
    "PRODUCTION_APPROVAL_REQUIRED",
    "DEGRADED_OR_REVOKED",
  ].includes(control.state) && (typeof control.blockerReason !== "string" || !control.blockerReason.trim())) {
    errors.push(`${id}: blocking state requires blockerReason`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Security evidence valid: ${ledger.version}`);
