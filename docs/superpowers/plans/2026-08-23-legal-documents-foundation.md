# Klinikos Legal Documents Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tenant-scoped, review-gated, evidence-bound generated legal-document foundation beginning with NDA preparation, without changing the existing static legal registry, protected-access gate, legal acceptance evidence, or Prisma schema.

**Architecture:** Pure deterministic domain modules only. Generated NDA packages create explicit review items; lifecycle approval requires those items to be explicitly resolved and signer authority confirmed. Frozen artifacts are SHA-256-bound, and execution evidence must match the exact current frozen artifact hash. Persistence is represented only by a tenant-scoped interface in this tranche.

**Tech Stack:** TypeScript, Node crypto, Vitest/source-contract tests, existing Klinikos legal/auth conventions.

**Spec:** `docs/superpowers/specs/2026-08-23-legal-documents-foundation-design.md`

## Global Constraints

- Do not modify `prisma/schema.prisma` or add a migration in this tranche.
- Do not replace `/admin/legal` or `src/lib/legal/legal-access.ts`.
- Do not add generated NDAs to the static mandatory-audience `legalDocumentRegistry`.
- Generated output is document-preparation support, never an automated legal opinion or attorney approval.
- No generated document grants PHI, production, source-code, credential, secret, payment, equity, partnership, or clinical authority.
- Every generated record and Legal Vault operation is organization-scoped.
- Blocking review items require explicit resolution; warning text/status cannot implicitly resolve them.
- Execution evidence must match the exact frozen artifact SHA-256.
- Destructive delete is not part of the Legal Vault contract.

---

### Task 1: Deterministic NDA drafting package

**Files:**
- Create: `src/lib/legal/generated/nda-drafting.ts`
- Create: `tests/legal-nda-drafting.test.ts`

**Produces:**
- `NdaRelationshipType`
- `DisclosureLevel`
- `NdaDraftInput`
- `LegalReviewItem`
- `buildNdaDraftPackage(input)`

- [x] Write tests first for Level 1/2/3 disclosure boundaries, companion-agreement prompts, review-required jurisdiction handling, drafting-target labeling, and crown-jewel exclusions.
- [x] Confirm the test source fails because the new module does not exist.
- [x] Implement a pure NDA package generator that emits modules, disclosure controls, companion agreements, drafting targets, warnings, and stable review-item keys.
- [x] Ensure California/Florida handling creates review prompts rather than automated enforceability conclusions.
- [x] Ensure liquidated-damages values are labeled review-required drafting targets, not fines/guaranteed recovery.
- [x] Preserve explicit PHI/source-code/credential/key/database/admin exclusions at every disclosure level.

### Task 2: Review-gated tenant lifecycle

**Files:**
- Create: `src/lib/legal/generated/legal-document-lifecycle.ts`
- Create: `tests/legal-document-lifecycle.test.ts`

**Consumes:** `NdaDraftInput`, `NdaDraftPackage`, `LegalReviewItem` from Task 1.

**Produces:**
- `GeneratedLegalDocumentStatus`
- `GeneratedLegalSigner`
- `GeneratedLegalDocumentRecord`
- `resolveLegalReviewItem(record, input)`
- `signatureReadiness(record)`
- `transitionGeneratedLegalDocument(record, nextStatus, event)`
- `addVerifiedExecutionEvidence(record, evidence)`

- [x] Write tests first proving generated records require `organizationId` and start `NEEDS_REVIEW`.
- [x] Write tests proving unresolved blocking review items prevent approval.
- [x] Write tests proving every required signer must have authority confirmed.
- [x] Write tests proving `NEEDS_REVIEW -> APPROVED_FOR_SIGNATURE` throws until review/signers are ready.
- [x] Write tests proving approval succeeds after explicit review resolutions and signer authority.
- [x] Write tests proving illegal transitions throw.
- [x] Write tests proving execution is impossible without exact current artifact-hash evidence.
- [x] Implement the minimal lifecycle satisfying those contracts.
- [x] Keep `productionApproved: false` invariant and expose no function that changes it.

### Task 3: Immutable artifact and tenant-scoped Legal Vault contracts

**Files:**
- Create: `src/lib/legal/generated/legal-artifacts.ts`
- Create: `src/lib/legal/generated/legal-vault-store.ts`
- Create: `tests/legal-artifact-vault-contract.test.ts`

**Produces:**
- `FrozenGeneratedLegalArtifact`
- `hashGeneratedLegalArtifact(bytes)`
- `buildFrozenGeneratedLegalPdfArtifact(input)`
- `GeneratedLegalVaultStore`
- `GENERATED_LEGAL_VAULT_INVARIANTS`

- [x] Write tests first for non-empty PDF bytes, lowercase 64-character SHA-256, organization-scoped storage keys, and deterministic file naming.
- [x] Write source-contract tests requiring `organizationId` on every vault operation.
- [x] Write source-contract tests forbidding destructive delete and requiring compare-and-set status transitions.
- [x] Implement the artifact helper with Node `crypto` and exact-byte hashing.
- [x] Implement the persistence-neutral store interface with organization scope on create/get/list/event/artifact/evidence/status operations.
- [x] Keep events/evidence append-only and artifacts immutable by contract.

### Task 4: Current-main compatibility and anti-overwrite guard

**Files:**
- Create: `tests/legal-generated-documents-compatibility.test.ts`

- [x] Write source-contract tests proving `src/app/(platform)/admin/legal/page.tsx` still uses `listOrganizationLegalAcceptances` and is not imported/replaced by the generated-document modules.
- [x] Prove `src/lib/legal/document-registry.ts` remains unchanged in this branch and does not gain `master_nda` as a mandatory static product document.
- [x] Prove generated modules do not import Prisma/db/auth session directly; authorization belongs to future server adapters before persistence invocation.
- [x] Prove the generated vault interface requires organization scope instead of document-id-only access.

### Task 5: Review and PR hygiene

- [x] Compare branch to current `main` and ensure no Prisma/admin-legal overwrite.
- [x] Review the lifecycle against the stale #173 dead-end bug and verify explicit review resolution is now the only approval path.
- [x] Review exact artifact-hash execution binding and tenant-scope invariants.
- [ ] Open a draft current-main PR only after the pure contracts are internally consistent.
- [ ] Link stale #173 and close it only after file-by-file useful-concept coverage is accounted for.
- [ ] Record exact-head GitHub Actions truth; keep draft while jobs return `steps:null` or until the full release gate executes.

## Verification truth

Source-level review caught and corrected two defects before PR creation:
- invalid mixed nullish/logical jurisdiction fallback syntax;
- storage-key sanitization that would have altered stable organization/document identifiers.

The branch remains intentionally unclaimed as test/build green until an exact-head runner executes the repository release gate.

## Deferred persistence tranche

After release capacity returns: add a multi-file Prisma model/migration, organization-scoped repository, immutable storage adapter, e-sign webhook/replay reconciliation, and `/admin/legal/documents` UI. None of those are part of this plan.
