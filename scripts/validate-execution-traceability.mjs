import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const canonicalLedgerPath = resolve(root, "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json");
const ledgerPath = resolve(process.argv[2] || canonicalLedgerPath);
const executionEnginePath = resolve(
  root,
  "docs/superpowers/plans/2026-09-03-klinikos-master-execution-engine.md",
);

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
  reconciliationStates: ["REVIEW_REQUIRED", "PARTIALLY_SUPERSEDED", "SUPERSEDED", "BLOCKED", "RESOLVED"],
  reconciliationSubjectTypes: ["PULL_REQUEST", "DOCUMENT", "BRANCH", "RUNTIME", "EXTERNAL_RAIL"],
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

const placeholders = new Set(["tbd", "todo", "fixme", "unknown", "fill later"]);
const errors = [];
const fail = (message) => errors.push(message);
const isString = (value) => typeof value === "string" && value.trim().length > 0;

function requireString(value, path) {
  if (!isString(value)) return fail(`${path} must be a non-empty string`);
  if (placeholders.has(value.trim().toLowerCase())) {
    fail(`${path} contains a placeholder value: ${value.trim()}`);
  }
}

function requireStrings(value, path, allowEmpty = true) {
  if (!Array.isArray(value)) return fail(`${path} must be an array`);
  if (!allowEmpty && value.length === 0) fail(`${path} must be non-empty`);
  value.forEach((item, index) => requireString(item, `${path}[${index}]`));
}

function requireExactEnum(value, expectedValues, path) {
  if (!Array.isArray(value)) return fail(`${path} must be an array`);
  const expectedSet = new Set(expectedValues);
  const seen = new Set();
  value.forEach((item, index) => {
    requireString(item, `${path}[${index}]`);
    if (seen.has(item)) fail(`Duplicate ${path} value: ${item}`);
    else seen.add(item);
    if (!expectedSet.has(item)) fail(`Unknown ${path} value: ${item}`);
  });
  expectedValues.forEach((item) => {
    if (!seen.has(item)) fail(`${path} is missing required value: ${item}`);
  });
}

function parseLedger(path) {
  if (!existsSync(path)) {
    fail(`Ledger does not exist: ${path}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`Malformed JSON in ${path}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function validateProgramDependencyCycles(programs) {
  const byId = new Map(programs.map((program) => [program.id, program]));
  const state = new Map();
  const stack = [];

  function visit(id) {
    const marker = state.get(id) || 0;
    if (marker === 1) {
      const start = stack.indexOf(id);
      const cycle = [...stack.slice(start), id];
      fail(`Program dependency cycle detected: ${cycle.join(" -> ")}`);
      return true;
    }
    if (marker === 2) return false;

    state.set(id, 1);
    stack.push(id);
    for (const dependency of byId.get(id)?.dependencies || []) {
      if (byId.has(dependency) && visit(dependency)) return true;
    }
    stack.pop();
    state.set(id, 2);
    return false;
  }

  for (const id of byId.keys()) {
    if (visit(id)) return;
  }
}

function validateLedger(ledger) {
  requireString(ledger?.version, "version");
  requireString(ledger?.status, "status");
  requireString(ledger?.dependencySemantics, "dependencySemantics");
  if (ledger?.dependencySemantics !== "HARD_PREREQUISITES_ONLY") {
    fail("dependencySemantics must equal HARD_PREREQUISITES_ONLY");
  }

  requireString(ledger?.authority?.masterCanon, "authority.masterCanon");
  requireString(ledger?.authority?.masterEngineeringBlueprint, "authority.masterEngineeringBlueprint");
  requireString(ledger?.authority?.executionEngine, "authority.executionEngine");
  requireString(ledger?.authority?.rule, "authority.rule");

  requireExactEnum(ledger?.truthClasses, expected.truthClasses, "truthClasses");
  requireExactEnum(ledger?.strategyStates, expected.strategyStates, "strategyStates");
  requireExactEnum(ledger?.implementationStates, expected.implementationStates, "implementationStates");
  requireExactEnum(ledger?.codeDispositions, expected.codeDispositions, "codeDispositions");

  if (ledger?.commercialLaws?.personAccount !== "FREE") fail("commercialLaws.personAccount must equal FREE");
  if (ledger?.commercialLaws?.organizationActivation !== "COMMERCIAL") {
    fail("commercialLaws.organizationActivation must equal COMMERCIAL");
  }
  requireStrings(ledger?.commercialLaws?.paymentNeverCreates, "commercialLaws.paymentNeverCreates", false);
  const protectedAuthorities = new Set(ledger?.commercialLaws?.paymentNeverCreates || []);
  expected.paymentNeverCreates.forEach((authority) => {
    if (!protectedAuthorities.has(authority)) {
      fail(`commercialLaws.paymentNeverCreates is missing protected authority: ${authority}`);
    }
  });

  if (!Array.isArray(ledger?.experienceFrames)) fail("experienceFrames must be an array");
  else {
    const ids = new Set();
    ledger.experienceFrames.forEach((frame, index) => {
      requireString(frame?.id, `experienceFrames[${index}].id`);
      requireString(frame?.name, `experienceFrames[${index}].name`);
      if (ids.has(frame?.id)) fail(`Duplicate experience frame id: ${frame?.id}`);
      ids.add(frame?.id);
    });
  }
  requireStrings(ledger?.performanceModes, "performanceModes", false);

  const programs = Array.isArray(ledger?.programs) ? ledger.programs : [];
  if (!Array.isArray(ledger?.programs)) fail("programs must be an array");
  const programIds = new Set();
  programs.forEach((program, index) => {
    requireString(program?.id, `programs[${index}].id`);
    requireString(program?.name, `programs[${index}].name`);
    requireString(program?.wave, `programs[${index}].wave`);
    requireStrings(program?.realities, `programs[${index}].realities`);
    requireStrings(program?.primaryScope, `programs[${index}].primaryScope`);
    requireStrings(program?.dependencies, `programs[${index}].dependencies`);
    requireStrings(program?.kpis, `programs[${index}].kpis`, false);
    if (programIds.has(program?.id)) fail(`Duplicate program id: ${program?.id}`);
    programIds.add(program?.id);
  });
  programs.forEach((program, index) => {
    for (const dependency of program?.dependencies || []) {
      if (!programIds.has(dependency)) {
        fail(`programs[${index}].dependencies references unknown program: ${dependency}`);
      }
      if (dependency === program?.id) fail(`programs[${index}].dependencies cannot self-reference: ${dependency}`);
    }
  });
  validateProgramDependencyCycles(programs);

  if (!ledger?.releaseWaves || typeof ledger.releaseWaves !== "object" || Array.isArray(ledger.releaseWaves)) {
    fail("releaseWaves must be an object");
  } else {
    for (const [waveId, wave] of Object.entries(ledger.releaseWaves)) {
      requireString(wave?.days, `releaseWaves.${waveId}.days`);
      requireString(wave?.outcome, `releaseWaves.${waveId}.outcome`);
      requireStrings(wave?.programs, `releaseWaves.${waveId}.programs`, false);
      for (const programId of wave?.programs || []) {
        if (!programIds.has(programId)) {
          fail(`releaseWaves.${waveId}.programs references unknown program: ${programId}`);
        }
      }
    }
  }

  requireStrings(ledger?.programDefinitionOfDone, "programDefinitionOfDone", false);
  requireStrings(ledger?.nextChildPlans, "nextChildPlans", false);

  const requirements = Array.isArray(ledger?.requirements) ? ledger.requirements : [];
  if (!Array.isArray(ledger?.requirements)) fail("requirements must be an array");
  const requirementIds = new Set();
  requirements.forEach((record, index) => {
    const base = `requirements[${index}]`;
    requireString(record?.requirementId, `${base}.requirementId`);
    if (requirementIds.has(record?.requirementId)) fail(`Duplicate requirementId: ${record?.requirementId}`);
    requirementIds.add(record?.requirementId);
    requireString(record?.title, `${base}.title`);
    requireStrings(record?.sourceRefs, `${base}.sourceRefs`, false);
    requireStrings(record?.canonRefs, `${base}.canonRefs`, false);
    requireString(record?.truthClass, `${base}.truthClass`);
    requireString(record?.strategyState, `${base}.strategyState`);
    requireString(record?.implementationState, `${base}.implementationState`);
    requireString(record?.programId, `${base}.programId`);
    requireString(record?.codeDisposition, `${base}.codeDisposition`);
    requireString(record?.owner, `${base}.owner`);
    requireString(record?.releaseWave, `${base}.releaseWave`);
    requireString(record?.currentGap, `${base}.currentGap`);

    if (!expected.truthClasses.includes(record?.truthClass)) fail(`${base}.truthClass has unknown value: ${record?.truthClass}`);
    if (!expected.strategyStates.includes(record?.strategyState)) fail(`${base}.strategyState has unknown value: ${record?.strategyState}`);
    if (!expected.implementationStates.includes(record?.implementationState)) {
      fail(`${base}.implementationState has unknown value: ${record?.implementationState}`);
    }
    if (!expected.codeDispositions.includes(record?.codeDisposition)) {
      fail(`${base}.codeDisposition has unknown value: ${record?.codeDisposition}`);
    }
    if (!programIds.has(record?.programId)) fail(`${base}.programId references unknown program: ${record?.programId}`);

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
      "evidenceRefs",
    ]) {
      requireStrings(record?.[field], `${base}.${field}`);
    }
    requireStrings(record?.testContracts, `${base}.testContracts`, false);
    requireStrings(record?.kpis, `${base}.kpis`, false);
    if (
      ["LIVE_VERIFIED", "BUILT_NEEDS_VERIFICATION"].includes(record?.implementationState) &&
      (!Array.isArray(record?.evidenceRefs) || record.evidenceRefs.length === 0)
    ) {
      fail(`${base}.evidenceRefs must be non-empty for ${record?.implementationState}`);
    }
  });

  const reconciliations = Array.isArray(ledger?.openReconciliations) ? ledger.openReconciliations : [];
  if (!Array.isArray(ledger?.openReconciliations)) fail("openReconciliations must be an array");
  const reconciliationIds = new Set();
  reconciliations.forEach((item, index) => {
    const base = `openReconciliations[${index}]`;
    requireString(item?.id, `${base}.id`);
    requireString(item?.subjectType, `${base}.subjectType`);
    requireString(item?.subjectRef, `${base}.subjectRef`);
    requireString(item?.state, `${base}.state`);
    requireStrings(item?.preservedLaws, `${base}.preservedLaws`, false);
    requireStrings(item?.conflictingLaws, `${base}.conflictingLaws`, false);
    requireString(item?.requiredAction, `${base}.requiredAction`);
    requireStrings(item?.evidenceRefs, `${base}.evidenceRefs`, false);
    if (reconciliationIds.has(item?.id)) fail(`Duplicate reconciliation id: ${item?.id}`);
    reconciliationIds.add(item?.id);
    if (!expected.reconciliationSubjectTypes.includes(item?.subjectType)) {
      fail(`${base}.subjectType has unknown value: ${item?.subjectType}`);
    }
    if (!expected.reconciliationStates.includes(item?.state)) {
      fail(`${base}.state has unknown value: ${item?.state}`);
    }
  });
}

function validateExecutionEnginePointer() {
  if (!existsSync(executionEnginePath)) return fail(`Execution engine does not exist: ${executionEnginePath}`);
  const engine = readFileSync(executionEnginePath, "utf8");
  const matches = [...engine.matchAll(/docs\/governance\/KLINIKOS_EXECUTION_TRACEABILITY\.(?:json|ya?ml)/g)].map(
    (match) => match[0],
  );
  const distinctPaths = [...new Set(matches)];
  const canonicalRelative = "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json";
  if (!distinctPaths.includes(canonicalRelative)) {
    fail(`Execution engine must declare canonical ledger: ${canonicalRelative}`);
  }
  if (distinctPaths.length > 1) {
    fail(`Execution engine declares multiple active traceability ledger paths: ${distinctPaths.join(", ")}`);
  }
}

const ledger = parseLedger(ledgerPath);
if (ledger) validateLedger(ledger);
validateExecutionEnginePointer();

if (errors.length) {
  errors.forEach((error) => console.error(`[traceability] ${error}`));
  process.exit(1);
}

console.log(`[traceability] validation passed: ${ledgerPath === canonicalLedgerPath ? "canonical ledger" : ledgerPath}`);
