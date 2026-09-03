import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const canonicalLedger = resolve(root, "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json");
const ledgerPath = resolve(process.argv[2] ?? canonicalLedger);
const executionEnginePath = resolve(root, "docs/superpowers/plans/2026-09-03-klinikos-master-execution-engine.md");

const expected = {
  truthClasses: ["ACTUAL", "CONTRACTED", "PIPELINE", "ASSUMPTION", "SCENARIO", "TARGET"],
  strategyStates: ["NOW", "NEXT", "LATER", "PARTNER", "CONNECT", "INTERNALIZE", "NEVER_BUILD"],
  implementationStates: [
    "LIVE_VERIFIED",
    "BUILT_NEEDS_VERIFICATION",
    "PARTIAL",
    "DESIGNED",
    "PLANNED",
    "EXTERNAL_CONNECTION_REQUIRED",
    "LEGAL_REVIEW_REQUIRED",
    "NOT_BUILT",
    "HISTORICAL_ONLY",
  ],
  codeDispositions: ["REUSE", "EXTEND", "GENERALIZE", "CONNECT", "PARTNER", "BUILD_NEW"],
  reconciliationTypes: ["PULL_REQUEST", "DOCUMENT", "BRANCH", "RUNTIME", "EXTERNAL_RAIL"],
  reconciliationStates: ["REVIEW_REQUIRED", "PARTIALLY_SUPERSEDED", "SUPERSEDED", "BLOCKED", "RESOLVED"],
  paymentNeverCreates: [
    "identity_authority",
    "professional_verification",
    "clinical_authority",
    "eligibility",
    "legal_authority",
    "tenant_permission",
    "referral_priority",
  ],
};

const errors = [];
const placeholderPattern = /\b(?:TBD|TODO|FIXME|unknown|fill later)\b/i;

function fail(message) {
  errors.push(message);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function requireString(value, path) {
  if (!isNonEmptyString(value)) {
    fail(`${path}: required non-empty string`);
    return;
  }
  if (placeholderPattern.test(value)) fail(`${path}: placeholder values are forbidden`);
}

function requireStringArray(value, path, { allowEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    fail(`${path}: required array`);
    return;
  }
  if (!allowEmpty && value.length === 0) fail(`${path}: required non-empty array`);
  value.forEach((item, index) => requireString(item, `${path}[${index}]`));
}

function exactArray(actual, wanted, path) {
  if (!Array.isArray(actual) || actual.length !== wanted.length || actual.some((value, index) => value !== wanted[index])) {
    fail(`${path}: must exactly equal ${wanted.join(", ")}`);
  }
}

function validateRequirement(record, index, programIds, seenRequirementIds) {
  const path = `requirements[${index}]`;
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    fail(`${path}: required object`);
    return;
  }

  requireString(record.requirementId, `${path}.requirementId`);
  if (seenRequirementIds.has(record.requirementId)) fail(`${path}.requirementId: duplicate ${record.requirementId}`);
  seenRequirementIds.add(record.requirementId);

  requireString(record.title, `${path}.title`);
  requireStringArray(record.sourceRefs, `${path}.sourceRefs`);
  requireStringArray(record.canonRefs, `${path}.canonRefs`);
  if (!expected.strategyStates.includes(record.strategyState)) fail(`${path}.strategyState: unknown value ${record.strategyState}`);
  if (!expected.implementationStates.includes(record.implementationState)) fail(`${path}.implementationState: unknown value ${record.implementationState}`);
  requireString(record.programId, `${path}.programId`);
  if (isNonEmptyString(record.programId) && !programIds.has(record.programId)) fail(`${path}.programId: unknown program ${record.programId}`);
  if (!expected.codeDispositions.includes(record.codeDisposition)) fail(`${path}.codeDisposition: unknown value ${record.codeDisposition}`);

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
    "dependencies",
  ]) {
    requireStringArray(record[field], `${path}.${field}`, { allowEmpty: true });
  }

  requireStringArray(record.testContracts, `${path}.testContracts`);
  requireString(record.owner, `${path}.owner`);
  requireStringArray(record.kpis, `${path}.kpis`);
  requireString(record.releaseWave, `${path}.releaseWave`);
  requireString(record.currentGap, `${path}.currentGap`);

  const builtTruth = new Set(["LIVE_VERIFIED", "BUILT_NEEDS_VERIFICATION", "PARTIAL"]);
  requireStringArray(record.evidenceRefs, `${path}.evidenceRefs`, { allowEmpty: !builtTruth.has(record.implementationState) });
}

function validateReconciliation(item, index) {
  const path = `openReconciliations[${index}]`;
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    fail(`${path}: required object`);
    return;
  }
  requireString(item.id, `${path}.id`);
  if (!expected.reconciliationTypes.includes(item.subjectType)) fail(`${path}.subjectType: unknown value ${item.subjectType}`);
  requireString(item.subjectRef, `${path}.subjectRef`);
  if (!expected.reconciliationStates.includes(item.state)) fail(`${path}.state: unknown value ${item.state}`);
  requireStringArray(item.preservedLaws, `${path}.preservedLaws`, { allowEmpty: true });
  requireStringArray(item.conflictingLaws, `${path}.conflictingLaws`, { allowEmpty: item.state === "RESOLVED" });
  requireString(item.requiredAction, `${path}.requiredAction`);
  requireStringArray(item.evidenceRefs, `${path}.evidenceRefs`);
}

let ledger;
try {
  ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
} catch (error) {
  console.error(`Execution traceability invalid\n- ledger: malformed JSON (${error instanceof Error ? error.message : String(error)})`);
  process.exit(1);
}

requireString(ledger.version, "version");
if (ledger.status !== "IMPLEMENTATION_CONTRACT") fail(`status: expected IMPLEMENTATION_CONTRACT`);
requireString(ledger.authority?.parent, "authority.parent");
requireString(ledger.authority?.engineeringBlueprint, "authority.engineeringBlueprint");
requireString(ledger.authority?.executionEngine, "authority.executionEngine");
requireString(ledger.authority?.law, "authority.law");

for (const authorityPath of [ledger.authority?.parent, ledger.authority?.engineeringBlueprint, ledger.authority?.executionEngine]) {
  if (isNonEmptyString(authorityPath) && !existsSync(resolve(root, authorityPath))) fail(`authority: referenced repository file does not exist: ${authorityPath}`);
}

exactArray(ledger.truthClasses, expected.truthClasses, "truthClasses");
exactArray(ledger.strategyStates, expected.strategyStates, "strategyStates");
exactArray(ledger.implementationStates, expected.implementationStates, "implementationStates");
exactArray(ledger.codeDispositions, expected.codeDispositions, "codeDispositions");

if (ledger.commercialLaws?.personAccount !== "FREE") fail(`commercialLaws.personAccount: expected FREE`);
if (ledger.commercialLaws?.organizationActivation !== "COMMERCIAL") fail(`commercialLaws.organizationActivation: expected COMMERCIAL`);
exactArray(ledger.commercialLaws?.paymentNeverCreates, expected.paymentNeverCreates, "commercialLaws.paymentNeverCreates");

const frames = ledger.experienceFrames;
if (!frames || typeof frames !== "object" || Array.isArray(frames)) {
  fail("experienceFrames: required object");
} else {
  const frameIds = Object.keys(frames);
  const expectedFrames = Array.from({ length: 12 }, (_, index) => `F${index}`);
  const uniqueFrameIds = new Set(frameIds);
  if (uniqueFrameIds.size !== frameIds.length) fail("experienceFrames: duplicate frame IDs");
  if (expectedFrames.some((id) => !uniqueFrameIds.has(id)) || frameIds.some((id) => !expectedFrames.includes(id))) {
    fail(`experienceFrames: expected exactly F0 through F11`);
  }
  for (const [id, name] of Object.entries(frames)) requireString(name, `experienceFrames.${id}`);
}

const programEntries = ledger.programs && typeof ledger.programs === "object" && !Array.isArray(ledger.programs)
  ? Object.entries(ledger.programs)
  : [];
if (programEntries.length === 0) fail("programs: required non-empty object");
const programIds = new Set(programEntries.map(([id]) => id));
for (const [id, program] of programEntries) {
  if (!/^P(?:0\d|1\d|2[0-3])$/.test(id)) fail(`programs.${id}: program ID must be P00-P23`);
  requireString(program?.name, `programs.${id}.name`);
  requireString(program?.wave, `programs.${id}.wave`);
  requireStringArray(program?.realities, `programs.${id}.realities`);
  requireStringArray(program?.primaryScope, `programs.${id}.primaryScope`);
  requireStringArray(program?.dependencies, `programs.${id}.dependencies`, { allowEmpty: true });
  requireStringArray(program?.kpis, `programs.${id}.kpis`);
}
for (const [id, program] of programEntries) {
  for (const dependency of program.dependencies ?? []) {
    if (!programIds.has(dependency)) fail(`programs.${id}.dependencies: unknown program ${dependency}`);
  }
}

if (!Array.isArray(ledger.requirements)) fail("requirements: required array");
else {
  const seenRequirementIds = new Set();
  ledger.requirements.forEach((record, index) => validateRequirement(record, index, programIds, seenRequirementIds));
}

if (!Array.isArray(ledger.openReconciliations)) fail("openReconciliations: required array");
else {
  const reconciliationIds = new Set();
  ledger.openReconciliations.forEach((item, index) => {
    validateReconciliation(item, index);
    if (reconciliationIds.has(item?.id)) fail(`openReconciliations[${index}].id: duplicate ${item?.id}`);
    reconciliationIds.add(item?.id);
  });
}

if (resolve(ledgerPath) === canonicalLedger && existsSync(executionEnginePath)) {
  const executionEngine = readFileSync(executionEnginePath, "utf8");
  if (executionEngine.includes("docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml")) {
    fail("executionEngine: retired YAML ledger is still declared; JSON must be the sole machine authority");
  }
  if (!executionEngine.includes("docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json")) {
    fail("executionEngine: canonical JSON traceability ledger is not declared");
  }
}

if (errors.length > 0) {
  console.error(`Execution traceability invalid\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exit(1);
}

console.log(`Execution traceability valid: ${ledger.version} (${programEntries.length} programs, ${ledger.requirements.length} requirements)`);
