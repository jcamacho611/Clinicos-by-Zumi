#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const defaultEvidence = "docs/governance/KLINIKOS_SECURITY_EVIDENCE.json";
const evidencePath = resolve(process.cwd(), process.argv[2] ?? defaultEvidence);
const errors = [];
const placeholder = /^(tbd|todo|fixme|unknown|fill later)$/i;
const incompleteClaimStates = new Set([
  "NOT_EVALUATED",
  "BLOCKED",
  "PARTIAL",
  "EXTERNAL_EVIDENCE_REQUIRED",
  "LEGAL_REVIEW_REQUIRED",
  "DEGRADED_OR_REVOKED",
]);
const technicalEvidenceStates = new Set([
  "TECHNICAL_EVIDENCE_GREEN",
  "PRODUCTION_APPROVAL_REQUIRED",
  "PRODUCTION_VERIFIED",
]);

function fail(message) {
  errors.push(message);
}

function requireString(value, path) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${path} must be a non-empty string`);
    return;
  }
  if (placeholder.test(value.trim())) {
    fail(`${path} contains forbidden placeholder value: ${value}`);
  }
}

function requireBoolean(value, path) {
  if (typeof value !== "boolean") fail(`${path} must be a boolean`);
}

function requireStringArray(value, path, { nonEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    fail(`${path} must be an array`);
    return;
  }
  if (nonEmpty && value.length === 0) fail(`${path} must not be empty`);
  value.forEach((entry, index) => requireString(entry, `${path}[${index}]`));
}

function requireNullableString(value, path) {
  if (value !== null) requireString(value, path);
}

function requireIsoTimestamp(value, path) {
  requireString(value, path);
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    fail(`${path} must be an ISO timestamp`);
  }
}

let evidence;
try {
  evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
} catch (error) {
  console.error(`Klinikos security evidence invalid: ${error.message}`);
  process.exit(1);
}

requireString(evidence.version, "version");
requireString(evidence.status, "status");
requireString(evidence.authority?.parent, "authority.parent");
requireString(evidence.authority?.traceability, "authority.traceability");
requireString(evidence.authority?.program, "authority.program");
requireStringArray(evidence.states, "states", { nonEmpty: true });

if (!Array.isArray(evidence.controls)) {
  fail("controls must be an array");
} else {
  const ids = new Set();

  for (const [index, control] of evidence.controls.entries()) {
    const base = `controls[${index}]`;
    requireString(control.controlId, `${base}.controlId`);
    requireString(control.family, `${base}.family`);
    requireString(control.state, `${base}.state`);
    requireStringArray(control.environments, `${base}.environments`, { nonEmpty: true });
    requireStringArray(control.dataClasses, `${base}.dataClasses`, { nonEmpty: true });
    requireString(control.owner, `${base}.owner`);
    requireNullableString(control.lastVerifiedAt, `${base}.lastVerifiedAt`);
    requireStringArray(control.technicalEvidenceRefs, `${base}.technicalEvidenceRefs`);
    requireStringArray(control.operationalEvidenceRefs, `${base}.operationalEvidenceRefs`);
    requireStringArray(control.externalEvidenceRefs, `${base}.externalEvidenceRefs`);
    requireStringArray(control.legalEvidenceRefs, `${base}.legalEvidenceRefs`);
    requireBoolean(control.externalDependency, `${base}.externalDependency`);
    requireBoolean(control.legalDependency, `${base}.legalDependency`);
    requireNullableString(control.blocker, `${base}.blocker`);
    requireBoolean(control.customerClaimAllowed, `${base}.customerClaimAllowed`);
    requireNullableString(control.customerClaim, `${base}.customerClaim`);

    if (ids.has(control.controlId)) fail(`Duplicate controlId: ${control.controlId}`);
    ids.add(control.controlId);

    if (!evidence.states?.includes(control.state)) {
      fail(`${base}.state has unsupported value ${JSON.stringify(control.state)}`);
    }

    if (incompleteClaimStates.has(control.state) && control.customerClaimAllowed === true) {
      fail(`${base}.customerClaimAllowed cannot be true while state is ${control.state}`);
    }

    if (control.customerClaimAllowed === true && (typeof control.customerClaim !== "string" || control.customerClaim.trim() === "")) {
      fail(`${base}.customerClaim must be non-empty when customerClaimAllowed is true`);
    }

    if (technicalEvidenceStates.has(control.state)) {
      requireIsoTimestamp(control.lastVerifiedAt, `${base}.lastVerifiedAt`);
      requireStringArray(control.technicalEvidenceRefs, `${base}.technicalEvidenceRefs`, { nonEmpty: true });
    }

    if (control.state === "PRODUCTION_VERIFIED") {
      requireStringArray(control.environments, `${base}.environments`, { nonEmpty: true });
      requireStringArray(control.dataClasses, `${base}.dataClasses`, { nonEmpty: true });
      requireStringArray(control.operationalEvidenceRefs, `${base}.operationalEvidenceRefs`, { nonEmpty: true });
      if (control.externalDependency === true) {
        requireStringArray(control.externalEvidenceRefs, `${base}.externalEvidenceRefs`, { nonEmpty: true });
      }
      if (control.legalDependency === true) {
        requireStringArray(control.legalEvidenceRefs, `${base}.legalEvidenceRefs`, { nonEmpty: true });
      }
      if (control.blocker !== null) {
        fail(`${base}.blocker must be null for PRODUCTION_VERIFIED`);
      }
    }
  }
}

const mainProtection = evidence.controls?.find((control) => control.controlId === "P16-GITHUB-MAIN-PROTECTION");
if (mainProtection) {
  try {
    const protectionDoc = readFileSync(resolve(process.cwd(), "docs/governance/GITHUB_MAIN_PROTECTION.md"), "utf8");
    if (protectionDoc.includes("MANUAL_ADMIN_ACTION_REQUIRED") && !["BLOCKED", "PARTIAL"].includes(mainProtection.state)) {
      fail("P16-GITHUB-MAIN-PROTECTION branch protection remains manual and cannot be elevated beyond BLOCKED/PARTIAL");
    }
  } catch (error) {
    fail(`P16-GITHUB-MAIN-PROTECTION evidence could not be read: ${error.message}`);
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`- ${error}`));
  console.error(`Klinikos security evidence invalid: ${errors.length} error(s)`);
  process.exit(1);
}

console.log(`Klinikos security evidence valid: ${evidence.version}`);
