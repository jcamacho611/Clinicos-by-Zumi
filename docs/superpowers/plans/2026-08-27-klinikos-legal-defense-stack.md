# Klinikos Legal Defense Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the existing Klinikos legal/access architecture so protected use has explicit severe-breach definitions, anti-facilitation and anti-circumvention rules, cumulative remedies, immutable acceptance evidence, and clear counsel-review gates.

**Architecture:** Extend the existing server-authoritative legal system rather than creating a parallel contract stack. Keep the current signed global agreement and clickwrap ceremony, add a focused legal-defense policy module and stronger agreement sections/acknowledgments, version the agreement, strengthen the document registry and legal suite, and test that the current-version/hash/evidence boundary remains authoritative.

**Tech Stack:** Next.js 15, TypeScript 5.9, Vitest 3, server-only legal modules, existing Klinikos legal registry and agreement acceptance flow.

**Spec:** `docs/superpowers/specs/2026-08-27-klinikos-legal-defense-stack-design.md`

## Global Constraints

- Preserve existing public discovery and risk-based verification architecture.
- Do not represent any draft as attorney-approved or universally enforceable.
- Keep `counselReviewRequired: true` and `productionApproved: false` until actual licensed-counsel approval is recorded.
- Do not hardcode punitive liquidated-damages figures as production-approved.
- Preserve mandatory statutory carve-outs, including applicable DTSA whistleblower immunity and non-waivable electronic-record rights.
- Proprietary logic remains server-side; the browser receives only presentation text and minimum necessary acceptance state.
- Material agreement changes require a new version/hash and reacceptance.

---

### Task 1: Lock legal-defense behavior with failing tests

**Files:**
- Create: `tests/legal-defense-stack.test.ts`

**Interfaces:**
- Consumes: `src/lib/legal/global-agreement.ts`, `src/lib/legal/document-registry.ts`
- Produces: executable expectations for severe breach, facilitation, cumulative remedies, no-double-recovery, DTSA notice, version bump, and counsel-review state.

- [ ] Write tests that fail against the current branch because the new defense module/terms do not yet exist.
- [ ] Run `npm test -- tests/legal-defense-stack.test.ts` and confirm failure is caused by the missing defense implementation.
- [ ] Commit the failing test.

### Task 2: Add server-authoritative legal-defense policy module

**Files:**
- Create: `src/lib/legal/legal-defense.ts`

**Interfaces:**
- Produces: `LEGAL_DEFENSE_VERSION`, `BREACH_CLASSES`, `SEVERE_PROTECTED_ASSET_TRIGGERS`, `CUMULATIVE_REMEDIES`, `ANTI_FACILITATION_RULE`, `ANTI_CIRCUMVENTION_RULE`, `DTSA_IMMUNITY_NOTICE`, and `LIQUIDATED_DAMAGES_POLICY`.

- [ ] Implement the minimum policy data required by Task 1.
- [ ] Keep preset liquidated damages disabled pending counsel.
- [ ] Run the focused test and confirm the policy assertions pass.
- [ ] Commit.

### Task 3: Harden the signed global agreement

**Files:**
- Modify: `src/lib/legal/global-agreement.ts`

**Interfaces:**
- Consumes: legal-defense constants from `src/lib/legal/legal-defense.ts`.
- Produces: new material agreement version, explicit severe-breach and remedies sections, attempt/facilitation liability, anti-circumvention scope, evidence-preservation obligations, mandatory carve-outs, and a consequences acknowledgment.

- [ ] Bump `GLOBAL_TERMS_VERSION` and effective date.
- [ ] Add acknowledgment key `breach_consequences` to the required baseline acknowledgments.
- [ ] Expand prohibited conduct to cover direct/indirect attempts, inducement, financing, assistance, enablement, conspiracy, and knowing benefit.
- [ ] Add explicit Class I / II / III breach classification language.
- [ ] Add cumulative remedies and no-double-recovery language.
- [ ] Add targeted anti-circumvention protections with pre-existing/independent/public relationship carve-outs.
- [ ] Add evidence-preservation and non-spoliation requirements.
- [ ] Add DTSA whistleblower immunity notice and preserve non-waivable rights.
- [ ] Keep liquidated-damages language counsel-gated and non-punitive.
- [ ] Run focused tests.
- [ ] Commit.

### Task 4: Strengthen registry and legal-document suite

**Files:**
- Modify: `src/lib/legal/document-registry.ts`
- Modify: `docs/legal/LEGAL_DOCUMENT_SUITE.md`
- Modify: `governance/KLINIKOS_ACCESS_IDENTITY_AGREEMENTS_IP_TRUST_CANON.md`

**Interfaces:**
- Produces: updated legal versions/notes, explicit severe-breach/remedies architecture, clickwrap evidence requirements, and counsel-review boundaries.

- [ ] Version the website/access terms to the new legal-defense release.
- [ ] Expand registry notes to require severe-breach/remedies/evidence review.
- [ ] Add defense-stack requirements to the legal suite.
- [ ] Add the governing rule that every prohibited act maps to consequence, evidence, survival, and remedy.
- [ ] Commit.

### Task 5: Verify acceptance ceremony remains enforceable-by-design

**Files:**
- Review/modify only if needed: `src/app/legal/accept/LegalAcceptanceClient.tsx`
- Review/modify only if needed: acceptance API/server handlers and persistence models discovered in current repo.
- Test: `tests/legal-acceptance-and-offer-terms.test.ts`, `tests/legal-defense-stack.test.ts`

**Interfaces:**
- Produces: affirmative unchecked acceptance, current-version/hash binding, preserved historical evidence, no client authority over counsel/production status.

- [ ] Verify unchecked controls cannot create acceptance.
- [ ] Verify old version acceptance cannot satisfy current material version.
- [ ] Verify acceptance record binds version and content hash.
- [ ] Verify acceptance evidence is server-derived.
- [ ] Verify historical records are not silently mutated.
- [ ] Add targeted tests/fixes only where current behavior is insufficient.
- [ ] Run focused tests, type-check, lint, and security checks.
- [ ] Commit.

### Task 6: Final verification and PR

**Files:**
- No new production behavior unless verification uncovers a defect.

- [ ] Run `npm test`.
- [ ] Run `npm run type-check`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run security:check`.
- [ ] Run `npm run build` if CI/runtime environment supports required dependencies.
- [ ] Confirm no document is marked production-approved.
- [ ] Confirm no fixed liquidated-damages amount is activated.
- [ ] Open PR with counsel-review checklist and statutory-source notes.
