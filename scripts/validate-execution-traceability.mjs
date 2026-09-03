import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const canonicalLedgerPath = resolve(
  root,
  "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json",
);
const ledgerPath = resolve(process.argv[2] || canonicalLedgerPath);
const executionEnginePath = resolve(
  root,
  "docs/superpowers/plans/2026-09-03-klinikos-master-execution-engine.md",
);

const expected = {
  truthClasses: new Set([
    "ACTUAL",
    "CONTRACTED",
    "PIPELINE",
    "ASSUMPTION",
    "SCENARIO",
    "TARGET",
  ]),
  strategyStates: new Set([
    "NOW",
    "NEXT",
    "LATER",
    "PARTNER",
    "CONNECT",
    "INTERNALIZE",
    "NEVER_BUILD",
  ]),
  implementationStates: new Set([
    "LIVE_VERIFIED",
    "BUILT_NEEDS_VERIFICATION",
    "PARTIAL",
    "DESIGNED",
    "PLANNED",
    "EXTERNAL_CONNECTION_REQUIRED",
    "LEGAL_REVIEW_REQUIRED",
    "NOT_BUILT",
    "HISTORICAL_ONLY",
  ]),
  codeDispositions: new Set([
    "REUSE",
    "EXTEND",
    "GENERALIZE",
    "CONNECT",
    "PARTNER",
    "BUILD_NEW",
  ]),
  reconciliationStates: new Set([
    "REVIEW_REQUIRED",
    "PARTIALLY_SUPERSEDED",
    "SUPERSEDED",
    "BLOCKED",
    "RESOLVED",
  ]),
  reconciliationSubjectTypes: new Set([
    "PULL_REQUEST",
    "DOCUMENT",
    "BRANCH",
    "RUNTIME",
    "EXTERNAL_RAIL",
  ]),
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

const placeholderValues = new Set(["tbd", "todo", "fixme", "unknown", "fill later"]);
const errors = [];

function fail(message) {
  errors.push(message);
}

function parseJson(path) {
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

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlaceholder(value) {
  return nonEmptyString(value) && placeholderValues.has(value.trim().toLowerCase());
}

function requireString(value, path) {
  if (!nonEmptyString(value)) {
    fail(`${path} must be a non-empty string`);
    return;
  }
  if (isPlaceholder(value)) {
    fail(`${path} contains a placeholder value: ${value.trim()}`);
  }
}

function requireStringArray(value, path, { allowEmpty = true } = {}) {
  if (!Array.isArray(value)) {
    fail(`${path} must be an array`);
    return;
  }
  if (!allowEmpty && value.length === 0) {
    fail(`${path} must be non-empty`);
  }
  value.forEach((item, index) => requireString(item, `${path}[${index}]`));
}

function validateExactEnumList(actual, expectedSet, path) {
  if (!Array.isArray(actual)) {
    fail(`${path} must be an array`);
    return;
  }
  const seen = new Set();
  for (const [index, value] of actual.entries()) {
    requireString(value, `${path}[${index}]`);
    if (seen.has(value)) fail(`Duplicate ${path} value: ${value}`);
    seen.add(value);
    if (!expectedSet.has(value)) fail(`Unknown ${path} value: ${value}`);
  }
  for (const value of expectedSet) {
    if (!seen.has(value)) fail(`${path} is missing required value: ${value}`);
  }
}

function validateLedger(ledger) {
  requireString(ledger?.version, "version");
  requireString(ledger?.status, "status");

  requireString(ledger?.authority?.masterCanon, "authority.masterCanon");
  requireString(
    ledger?.authority?.masterEngineeringBlueprint,
    "authority.masterEngineeringBlueprint",
  );
  requireString(ledger?.authority?.executionEngine, "authority.executionEngine");
  requireString(ledger?.authority?.rule, "authority.rule");

  validateExactEnumList(ledger?.truthClasses, expected.truthClasses, "truthClasses");
  validateExactEnumList(ledger?.strategyStates, expected.strategyStates, "strategyStates");
  validateExactEnumList(
    ledger?.implementationStates,
    expected.implementationStates,
    "implementationStates",
  );
  validateExactEnumList(
    ledger?.codeDispositions,
    expected.codeDispositions,
    "codeDispositions",
  );

  if (ledger?.commercialLaws?.personAccount !== "FREE") {
    fail("commercialLaws.personAccount must equal FREE");
  }
  if (ledger?.commercialLaws?.organizationActivation !== "COMMERCIAL") {
    fail("commercialLaws.organizationActivation must equal COMMERCIAL");
  }
  requireStringArray(
    ledger?.commercialLaws?.paymentNeverCreates,
    "commercialLaws.paymentNeverCreates",
    { allowEmpty: false },
  );
  const protectedAuthorities = new Set(ledger?.commercialLaws?.paymentNeverCreates || []);
  for (const authority of expected.paymentNeverCreates) {
    if (!protectedAuthorities.has(authority)) {
      fail(
        `commercialLaws.paymentNeverCreates is missing protected authority: ${authority}`,
      );
    }
  }

  if (!Array.isArray(ledger?.experienceFrames)) {
    fail("experienceFrames must be an array");
  } else {
    const frameIds = new Set();
    ledger.experienceFrames.forEach((frame, index) => {
      requireString(frame?.id, `experienceFrames[${index}].id`);
      requireString(frame?.name, `experienceFrames[${index}].name`);
      if (frameIds.has(frame?.id)) fail(`Duplicate experience frame id: ${frame?.id}`);
      frameIds.add(frame?.id);
    });
  }

  requireStringArray(ledger?.performanceModes, "performanceModes", { allowEmpty: false });

  const programs = Array.isArray(ledger?.programs) ? ledger.programs : [];
  if (!Array.isArray(ledger?.programs)) fail("programs must be an array");
  const programIds = new Set();
  programs.forEach((program, index) => {
    requireString(program?.id, `programs[${index}].id`);
    requireString(program?.name, `programs[${index}].name`);
    requireString(program?.wave, `programs[${index}].wave`);
    requireStringArray(program?.realities, `programs[${index}].realities`);
    requireStringArray(program?.primaryScope, `programs[${index}].primaryScope`);
    requireStringArray(program?.dependencies, `programs[${index}].dependencies`);
    requireStringArray(program?.kpis, `programs[${index}].kpis`, { allowEmpty: false });
    if (programIds.has(program?.id)) fail(`Duplicate program id: ${program?.id}`);
    programIds.add(program?.id);
  });

  programs.forEach((program, index) => {
    for (const dependency of program?.dependencies || []) {
      if (!programIds.has(dependency)) {
        fail(`programs[${index}].dependencies references unknown program: ${dependency}`);
      }
    }
  });

  if (ledger?.releaseWaves && typeof ledger.releaseWaves === "object") {
    for (const [waveId, wave] of Object.entries(ledger.releaseWaves)) {
      requireString(wave?.days, `releaseWaves.${waveId}.days`);
      requireString(wave?.outcome, `releaseWaves.${waveId}.outcome`);
      requireStringArray(wave?.programs, `releaseWaves.${waveId}.programs`, {
        allowEmpty: false,
      });
      for (const programId of wave?.programs || []) {
        if (!programIds.has(programId)) {
          fail(`releaseWaves.${waveId}.programs references unknown program: ${programId}`);
        }
      }
    }
  } else {
    fail("releaseWaves must be an object");
  }

  requireStringArray(ledger?.programDefinitionOfDone, "programDefinitionOfDone", {
    allowEmpty: false,
  });
  requireStringArray(ledger?.nextChildPlans, "nextChildPlans", { allowEmpty: false });

  const requirements = Array.isArray(ledger?.requirements) ? ledger.requirements : [];
  if (!Array.isArray(ledger?.requirements)) fail("requirements must be an array");
  const requirementIds = new Set();
  requirements.forEach((record, index) => {
    const base = `requirements[${index}]`;
    requireString(record?.requirementId, `${base}.requirementId`);
    if (requirementIds.has(record?.requirementId)) {
      fail(`Duplicate requirementId: ${record?.requirementId}`);
    }
    requirementIds.add(record?.requirementId);

    requireString(record?.title, `${base}.title`);
    requireStringArray(record?.sourceRefs, `${base}.sourceRefs`, { allowEmpty: false });
    requireStringArray(record?.canonRefs, `${base}.canonRefs`, { allowEmpty: false });
    requireString(record?.truthClass, `${base}.truthClass`);
    requireString(record?.strategyState, `${base}.strategyState`);
    requireString(record?.implementationState, `${base}.implementationState`);
    requireString(record?.programId, `${base}.programId`);
    requireString(record?.codeDisposition, `${base}.codeDisposition`);
    requireString(record?.owner, `${base}.owner`);
    requireString(record?.releaseWave, `${base}.releaseWave`);
    requireString(record?.currentGap, `${base}.currentGap`);

    if (!expected.truthClasses.has(record?.truthClass)) {
      fail(`${base}.truthClass has unknown value: ${record?.truthClass}`);
    }
    if (!expected.strategyStates.has(record?.strategyState)) {
      fail(`${base}.strategyState has unknown value: ${record?.strategyState}`);
    }
    if (!expected.implementationStates.has(record?.implementationState)) {
      fail(`${base}.implementationState has unknown value: ${record?.implementationState}`);
    }
    if (!expected.codeDispositions.has(record?.codeDisposition)) {
      fail(`${base}.codeDisposition has unknown value: ${record?.codeDisposition}`);
    }
    if (!programIds.has(record?.programId)) {
      fail(`${base}.programId references unknown program: ${record?.programId}`);
    }

    const arrayFields = [
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
    ];
    for (const field of arrayFields) {
      requireStringArray(record?.[field], `${base}.${field}`);
    }
    requireStringArray(record?.testContracts, `${base}.testContracts`, { allowEmpty: false });
    requireStringArray(record?.kpis, `${base}.kpis`, { allowEmpty: false });

    if (
      ["LIVE_VERIFIED", "BUILT_NEEDS_VERIFICATION"].includes(
        record?.implementationState,
      ) &&
      (!Array.isArray(record?.evidenceRefs) || record.evidenceRefs.length === 0)
    ) {
      fail(`${base}.evidenceRefs must be non-empty for ${record?.implementationState}`);
    }
  });

  const reconciliations = Array.isArray(ledger?.openReconciliations)
    ? ledger.openReconciliations
    : [];
  if (!Array.isArray(ledger?.openReconciliations)) {
    fail("openReconciliations must be an array");
  }
  const reconciliationIds = new Set();
  reconciliations.forEach((item, index) => {
    const base = `openReconciliations[${index}]`;
    requireString(item?.id, `${base}.id`);
    requireString(item?.subjectType, `${base}.subjectType`);
    requireString(item?.subjectRef, `${base}.subjectRef`);
    requireString(item?.state, `${base}.state`);
    requireStringArray(item?.preservedLaws, `${base}.preservedLaws`, { allowEmpty: false });
    requireStringArray(item?.conflictingLaws, `${base}.conflictingLaws`, {
      allowEmpty: false,
    });
    requireString(item?.requiredAction, `${base}.requiredAction`);
    requireStringArray(item?.evidenceRefs, `${base}.evidenceRefs`, { allowEmpty: false });

    if (reconciliationIds.has(item?.id)) fail(`Duplicate reconciliation id: ${item?.id}`);
    reconciliationIds.add(item?.id);
    if (!expected.reconciliationSubjectTypes.has(item?.subjectType)) {
      fail(`${base}.subjectType has unknown value: ${item?.subjectType}`);
    }
    if (!expected.reconciliationStates.has(item?.state)) {
      fail(`${base}.state has unknown value: ${item?.state}`);
    }
  });
}

function validateExecutionEnginePointer() {
  if (!existsSync(executionEnginePath)) {
    fail(`Execution engine does not exist: ${executionEnginePath}`);
    return;
  }
  const engine = readFileSync(executionEnginePath, "utf8");
  const matches = [
    ...engine.matchAll(
      /docs\/governance\/KLINIKOS_EXECUTION_TRACEABILITY\.(?:json|ya?ml)/g,
    ),
  ].map((match) => match[0]);
  const distinctPaths = [...new Set(matches)];
  const canonicalRelative = "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json";

  if (!distinctPaths.includes(canonicalRelative)) {
    fail(`Execution engine must declare canonical ledger: ${canonicalRelative}`);
  }
  if (distinctPaths.length > 1) {
    fail(`Execution engine declares multiple active traceability ledger paths: ${distinctPaths.join(", ")}`);
  }
}

const ledger = parseJson(ledgerPath);
if (ledger) validateLedger(ledger);
validateExecutionEnginePointer();

if (errors.length > 0) {
  for (const error of errors) console.error(`[traceability] ${error}`);
  process.exit(1);
}

console.log(
  `[traceability] validation passed: ${ledgerPath === canonicalLedgerPath ? "canonical ledger" : ledgerPath}`,
);
