# Versioned Member Acceptance Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Klinikos legal-evidence substrate so a free Person/Account can atomically record exact versioned Website Terms acceptance and Privacy notice acknowledgment during account creation, while public signup remains fail-closed until approved source documents and operator/legal gates are all ready.

**Architecture:** Reuse `legal_agreement_versions`, `access_gate_acceptances`, and `legal_agreement_events`; add nullable Person/Account evidence bindings without destructive foreign-key ownership; keep organization/User legal execution unchanged. Public signup receives only bounded affirmative acknowledgment flags and current version identifiers; the server resolves the authoritative document source/hash and writes evidence inside the existing Person+Account transaction. Do not create another legal ledger or `/access` identity rail.

**Tech Stack:** Next.js App Router, TypeScript, Zod, Prisma/PostgreSQL, Vitest, existing legal/document registries and Person/Account authentication.

**Spec:** `docs/KLINIKOS_MASTER_CANON.md`, `docs/superpowers/specs/2026-08-29-klinikos-master-engineering-blueprint.md`, `docs/legal/LEGAL_ACCESS_FOUNDATION.md`, and the founder-approved September 1 convergence law.

## Global Constraints

- `docs/KLINIKOS_MASTER_CANON.md` remains sole intended-truth authority.
- One Person / one Account authentication principal; no synthetic Organization.
- Agreement acceptance grants no credential, membership, Grid eligibility, clinical authority, entitlement, or payment truth.
- Existing clinic `User`/Organization legal acceptance remains intact.
- Executed evidence is retained independently from identity deletion; new Person/Account IDs are evidentiary bindings, not destructive ownership.
- Browser never chooses trusted document text/hash; server resolves current source.
- Website Terms and Privacy remain `productionApproved: false` until counsel approval; engineering completion must not enable signup by itself.
- Account creation and required baseline acceptance evidence must commit or roll back together.
- Migration is additive-only and requires a production-release manifest.

---

### Task 1: Lock Person/Account legal evidence RED contracts

**Files:**
- Modify: `tests/person-account-signup-db.test.ts`
- Create: `tests/member-signup-legal-evidence-contract.test.ts`

**Interfaces:**
- Consumes: `createFreePersonAccount`, current legal tables.
- Produces: RED requirements for atomic Person/Account legal evidence, exact snapshot/hash, no organization/User authority, and fail-closed source readiness.

- [ ] Write failing DB/source tests.
- [ ] Run focused tests and prove failures are the missing member-acceptance rail.
- [ ] Commit RED tests before production implementation.

### Task 2: Add additive Person/Account evidence bindings

**Files:**
- Create: `prisma/migrations/20260902040000_member_legal_acceptance_bindings/migration.sql`
- Create: `prisma/migrations/20260902040000_member_legal_acceptance_bindings/production-release.json`

**Interfaces:**
- Adds nullable `personId` / `accountId` to `access_gate_acceptances` and `legal_agreement_events` plus indexes/active-version uniqueness.
- No destructive FKs; existing `userId` / `organizationId` behavior remains.

- [ ] Implement additive SQL.
- [ ] Generate exact migration SHA manifest.
- [ ] Verify fresh full migration chain.

### Task 3: Create authoritative member acceptance source adapter

**Files:**
- Create: `src/lib/legal/member-signup-acceptance.ts`
- Modify minimally: `src/lib/legal/document-registry.ts` only if an explicit acceptance-source readiness field is required.

**Interfaces:**
- Produces server-only current member agreement descriptors and hashes/snapshots only when exact source text exists.
- Returns fail-closed readiness while Website Terms or Privacy source/approval is incomplete.

- [ ] Server resolves source/version/hash; browser cannot provide trusted text/hash.
- [ ] Keep current draft/counsel state explicit.

### Task 4: Record member evidence inside account transaction

**Files:**
- Modify: `src/lib/auth/person-account-repository.ts`
- Modify or extend: existing legal repository helper without creating a second ledger.

**Interfaces:**
- `createFreePersonAccount(input, context, legalEvidence)` records required legal rows/events in the same transaction as Person, Account, credential, session and account event.
- Any legal write failure rolls back identity creation.

- [ ] Register immutable agreement versions.
- [ ] Insert member acceptance rows and events with Person/Account binding.
- [ ] Record no organization/User authority.
- [ ] Make retries/idempotency safe.

### Task 5: Wire bounded signup acknowledgments

**Files:**
- Modify: `src/lib/auth/person-account-signup.ts`
- Modify: `src/app/signup/signup-form.tsx`
- Modify: `src/app/signup/page.tsx`
- Modify: `src/app/api/account/signup/route.ts`
- Modify: `src/lib/auth/member-signup-release.ts`

**Interfaces:**
- Browser submits affirmative agreement/acknowledgment plus bounded server-issued version identifiers only.
- Route resolves authoritative sources again and passes evidence to the transaction.
- Release state separately exposes `acceptanceRailImplemented` and `acceptanceSourcesReady`.

- [ ] Website Terms agreement and Privacy notice acknowledgment are distinct.
- [ ] Missing/stale/wrong version fails closed.
- [ ] Operator/counsel/legal-config gates remain mandatory.
- [ ] Do not enable production signup while `productionApproved` is false.

### Task 6: Full verification and handoff

- [ ] Prisma generate/validate.
- [ ] Fresh migrations.
- [ ] Focused legal/signup tests.
- [ ] Full test suite.
- [ ] Typecheck/lint/confidentiality gates.
- [ ] Production build/start smoke.
- [ ] Exact-head GitHub Quality.
- [ ] Reconcile against current `main`; merge only after green.
- [ ] Report that the rail is built separately from counsel document approval and public signup enablement.
