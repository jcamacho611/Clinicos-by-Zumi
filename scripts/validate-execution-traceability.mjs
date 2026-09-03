#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const defaultLedger = "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json";
const ledgerPath = resolve(process.cwd(), process.argv[2] ?? defaultLedger);
const errors = [];
const placeholder = /^(tbd|todo|fixme|unknown|fill later)$/i;

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

function requireStringArray(value, path, { nonEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    fail(`${path} must be an array`);
    return;
  }
  if (nonEmpty && value.length === 0) fail(`${path} must not be empty`);
  value.forEach((entry, index) => requireString(entry, `${path}[${index}]`));
}

function requireEnum(value, allowed, path) {
  if (!Array.isArray(allowed) || !allowed.includes(value)) {
    fail(`${path} has unsupported value ${JSON.stringify(value)}; allowed: ${Array.isArray(allowed) ? allowed.join(", ") : "<invalid enum>"}`);
  }
}

let ledger;
try {
  ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
} catch (error) {
  console.error(`Execution traceability invalid: ${error.message}`);
  process.exit(1);
}

requireString(ledger.version, "version");
requireString(ledger.status, "status");
requireString(ledger.authority?.parent, "authority.parent");
requireString(ledger.authority?.engineeringBlueprint, "authority.engineeringBlueprint");
requireString(ledger.authority?.executionEngine, "authority.executionEngine");

for (const [name, value] of Object.entries({
  truthClasses: ledger.truthClasses,
  strategyStates: ledger.strategyStates,
  implementationStates: ledger.implementationStates,
  codeDispositions: ledger.codeDispositions,
  performanceModes: ledger.performanceModes,
})) {
  requireStringArray(value, name, { nonEmpty: true });
}

if (ledger.commercialLaws?.personAccount !== "FREE") {
  fail("commercialLaws.personAccount must be FREE");
}
if (ledger.commercialLaws?.organizationActivation !== "COMMERCIAL") {
  fail("commercialLaws.organizationActivation must be COMMERCIAL");
}

const forbiddenAuthorityPurchases = [
  "identity_authority",
  "professional_verification",
  "clinical_authority",
  "eligibility",
  "legal_authority",
  "tenant_permission",
  "referral_priority",
];
for (const law of forbiddenAuthorityPurchases) {
  if (!ledger.commercialLaws?.paymentNeverCreates?.includes(law)) {
    fail(`commercialLaws.paymentNeverCreates must include ${law}`);
  }
}

const programIds = new Set();
for (const [programId, program] of Object.entries(ledger.programs ?? {})) {
  if (!/^P(?:0\d|1\d|2[0-3])$/.test(programId)) fail(`Unsupported programId: ${programId}`);
  if (programIds.has(programId)) fail(`Duplicate programId: ${programId}`);
  programIds.add(programId);
  requireString(program?.name, `programs.${programId}.name`);
}

const requirementIds = new Set();
for (const [index, requirement] of (ledger.requirements ?? []).entries()) {
  const base = `requirements[${index}]`;
  requireString(requirement.requirementId, `${base}.requirementId`);
  if (requirementIds.has(requirement.requirementId)) {
    fail(`Duplicate requirementId: ${requirement.requirementId}`);
  }
  requirementIds.add(requirement.requirementId);

  requireString(requirement.title, `${base}.title`);
  requireStringArray(requirement.sourceRefs, `${base}.sourceRefs`, { nonEmpty: true });
  requireStringArray(requirement.canonRefs, `${base}.canonRefs`, { nonEmpty: true });
  requireEnum(requirement.strategyState, ledger.strategyStates, `${base}.strategyState`);
  requireEnum(requirement.implementationState, ledger.implementationStates, `${base}.implementationState`);
  requireEnum(requirement.codeDisposition, ledger.codeDispositions, `${base}.codeDisposition`);
  requireString(requirement.programId, `${base}.programId`);
  if (!programIds.has(requirement.programId)) {
    fail(`${base}.programId references unknown program ${requirement.programId}`);
  }

  for (const field of [
    "realityIds",
    "journeyIds",
    "frameIds",
    "domainObjects",
    "routeOrApiContracts",
    "events",
    "zumiCapabilities",
    "monetizationClasses",
    "authorityGates",
    "securityPrivacyLegalGates",
    "reuseTargets",
    "testContracts",
    "dependencies",
    "kpis",
    "evidenceRefs",
  ]) {
    requireStringArray(requirement[field], `${base}.${field}`);
  }

  requireString(requirement.owner, `${base}.owner`);
  requireString(requirement.releaseWave, `${base}.releaseWave`);
  requireString(requirement.currentGap, `${base}.currentGap`);
  requireStringArray(requirement.testContracts, `${base}.testContracts`, { nonEmpty: true });
  requireStringArray(requirement.kpis, `${base}.kpis`, { nonEmpty: true });

  if (["LIVE_VERIFIED", "BUILT_NEEDS_VERIFICATION", "PARTIAL"].includes(requirement.implementationState)) {
    requireStringArray(requirement.evidenceRefs, `${base}.evidenceRefs`, { nonEmpty: true });
  }
}

const reconciliationStates = ["REVIEW_REQUIRED", "PARTIALLY_SUPERSEDED", "SUPERSEDED", "BLOCKED", "RESOLVED"];
const reconciliationTypes = ["PULL_REQUEST", "DOCUMENT", "BRANCH", "RUNTIME", "EXTERNAL_RAIL"];
for (const [index, item] of (ledger.openReconciliations ?? []).entries()) {
  const base = `openReconciliations[${index}]`;
  requireString(item.id, `${base}.id`);
  requireEnum(item.subjectType, reconciliationTypes, `${base}.subjectType`);
  requireString(item.subjectRef, `${base}.subjectRef`);
  requireEnum(item.state, reconciliationStates, `${base}.state`);
  requireStringArray(item.preservedLaws, `${base}.preservedLaws`);
  requireStringArray(item.conflictingLaws, `${base}.conflictingLaws`);
  requireString(item.requiredAction, `${base}.requiredAction`);
  requireStringArray(item.evidenceRefs, `${base}.evidenceRefs`, { nonEmpty: true });
}

if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`);
  console.error(`Execution traceability invalid: ${errors.length} error(s)`);
  process.exit(1);
}

console.log(`Execution traceability valid: ${ledger.version}`);
