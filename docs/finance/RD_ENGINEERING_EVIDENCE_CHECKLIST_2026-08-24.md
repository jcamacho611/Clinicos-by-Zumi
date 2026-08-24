# Klinikos Engineering R&D Evidence Checklist — Week Ending 2026-08-24

> Documentation-support artifact only. **Tax-credit eligibility is explicitly unassessed.** A qualified tax professional must determine whether any activity satisfies applicable federal/state research-credit requirements. GitHub activity does not establish qualified research expenses, wages, payroll allocations, contractor eligibility, supply costs, or credit amounts.

## Review window

Engineering work reviewed: approximately 2026-08-17 through 2026-08-24 in `jcamacho611/Clinicos-by-Zumi`.

## Evidence standard for this checklist

For each candidate business component, preserve contemporaneous evidence showing:

- the business component / product subsystem being improved;
- the technical capability or performance objective;
- the technical uncertainty that existed before or during the work;
- alternatives considered, attempted, rejected, or refined;
- experiments, test-first commits, adversarial cases, migration rehearsals, mutation checks, benchmarks, or controlled runtime observations;
- the conclusion reached and why;
- relevant PRs, commits, tests, design/verification notes, and external technical constraints;
- who performed the work and when, using actual payroll/time/accounting records outside GitHub;
- any non-development activity that should be separated from technical experimentation.

Do **not** infer tax eligibility or qualified-research expense amounts from commit count, lines changed, PR count, GitHub author identity, or repository activity.

---

## Candidate business components

### 1. Clinical longitudinal evidence / BodyMap / Current Visit

**Candidate documentation value:** High.

**Technical uncertainties evidenced in repository**
- how to represent longitudinal findings without treating omission as clinical resolution;
- whether `initial / previous / today` should be persisted or derived contextually;
- how to normalize symptom severity without misusing the scale for ROM/strength or other measurements;
- how to select the correct prior finalized encounter deterministically;
- how to preserve append-only amendments, provenance, tenant/patient/encounter scope, and auditability;
- how to enforce invariants both in application logic and PostgreSQL.

**Experimentation / alternatives captured**
- test-first BodyMap comparator work;
- adversarial empty/partial-map and cross-patient cases;
- rejected persisted comparison-role design;
- disposable production-shaped Neon migration rehearsals;
- PostgreSQL CHECK/NULL loophole discovered during rehearsal and corrected;
- explicit resolved-severity invariant added after a failing test;
- deterministic `capturedAt DESC -> createdAt DESC` ordering and no update/delete repository API.

**Relevant PRs / commits / tests**
- PR #248 / #278 — immutable BodyMap change foundation;
- PR #265 / #276 — prior finalized encounter selector;
- PR #269 — Current Visit clinical convergence;
- PR #288 / #295 — append-only BodyMap persistence;
- commits `27f3073e`, `963b412c`, `9575dce1`, `3462ed0e`, `c16d2eab`;
- `tests/body-map-change.test.ts`;
- `tests/body-map-domain-invariants.test.ts`;
- `tests/previous-finalized-encounter.test.ts`;
- BodyMap persistence/invariant tests referenced in PR #295 verification.

**Missing contemporaneous evidence**
- [ ] short dated engineering note stating the original technical hypotheses before implementation;
- [ ] explicit alternatives matrix for mutable snapshot vs append-only versioning vs event-sourced approaches;
- [ ] developer time records tied to BodyMap / Current Visit work;
- [ ] physician/user technical acceptance notes separated from tax eligibility conclusions;
- [ ] screenshots/logs from the disposable migration runs retained in a durable evidence folder;
- [ ] one consolidated experiment chronology linking RED -> GREEN -> adversarial correction commits.

### 2. Zumi public intelligence, routing, cost metering, and confidentiality

**Candidate documentation value:** High.

**Technical uncertainties evidenced in repository**
- how to maintain contextual public conversation without granting authenticated tenant authority;
- how to degrade usefully when paid inference is unavailable without creating uncontrolled provider spend;
- how to meter model plus hosted-tool costs accurately at micro-USD precision;
- how to prevent browser exposure of proprietary routing/orchestration logic while preserving the deterministic no-cost fallback;
- how to bind provider configuration immutably rather than mixing construction-time and ambient runtime environment state.

**Experimentation / alternatives captured**
- stateful public conversation design with bounded context;
- durable-quota attestation fail-closed path;
- client-side deterministic fallback originally retained for cost control, then moved server-side after confidentiality analysis;
- hosted-tool cost accounting for web search, file search, and Code Interpreter;
- mutation/reintroduction check showing browser-side engine disclosure guard fails when reintroduced;
- degraded path designed to return confidence zero instead of inventing a resolved answer.

**Relevant PRs / commits / tests**
- PR #211 — OpenAI hosted-tool cost accounting;
- PR #216 — stateful/persistent public Zumi;
- PR #219 — durable public inference quota gate;
- PR #286 — public intent-routing regression fixes;
- PR #309 / commit `9aa7ab00` — move public routing engine out of browser bundle;
- public Zumi conversation/provider-disabled tests referenced in PR #216;
- `tests/public-living-home.test.ts` boundary assertions referenced in PR #309.

**Missing contemporaneous evidence**
- [ ] dated architecture decision record comparing client deterministic routing, server deterministic routing, and paid model routing;
- [ ] controlled provider-cost observations matched to provider-side usage evidence;
- [ ] measured latency/cost comparison between deterministic and model-assisted paths;
- [ ] screenshots or bundle-inspection evidence showing the proprietary engine before/after removal;
- [ ] developer time records mapped to Zumi inference, routing, cost, and security experiments.

### 3. Universal identity / Account / authority compatibility

**Candidate documentation value:** High.

**Technical uncertainties evidenced in repository**
- how to add durable lifelong Person identity without breaking legacy clinic `User` tenant/role authority;
- how to model effective-dated organization/location relationships using Prisma multi-file schema while keeping legacy models authoritative;
- how to introduce universal Account login without allowing fallback to widen clinic authority;
- how to preserve password compatibility and prevent issuer/audience confusion between account and clinic JWT rails;
- how to reconcile additive migrations with production-shaped legacy data.

**Experimentation / alternatives captured**
- additive context-only substrate rather than replacing current auth authority;
- multi-file Prisma schema organization;
- isolated Neon migration rehearsal with deterministic backfill and orphan checks;
- legacy-linked account fallback hardened after review;
- case-insensitive collision prevention;
- distinct JWT issuer/audience pairs despite shared configured signing secret;
- explicit decision not to replay an obsolete architecture-precedence rewrite.

**Relevant PRs / tests**
- PR #245 / #271 — Person + OrganizationMembership + LocationAssignment;
- PR #281 — current-main identity reconciliation;
- PR #282 — Account/free-member backend;
- identity compatibility/effective-date/anti-authority-widening tests described in those PRs;
- `docs/verification/2026-08-23-universal-account-neon-rehearsal.md`.

**Missing contemporaneous evidence**
- [ ] explicit pre-build alternatives record: extend legacy User vs new Person substrate vs full auth replacement;
- [ ] migration rehearsal output retained with exact commands and timestamps;
- [ ] controlled auth failure matrices retained as artifacts rather than only PR prose;
- [ ] developer time records separated between architecture, migration experimentation, security hardening, and routine integration work.

### 4. Grid transaction economics / monetization policy safety

**Candidate documentation value:** Medium-High.

**Technical uncertainties evidenced in repository**
- how to map heterogeneous transaction/resource classes onto one policy fabric without creating a second pricing engine;
- how to ensure a `default` persisted fee policy cannot accidentally apply to referrals or regulated clinical services;
- how to make static declaration policy and persisted settlement authority converge fail-closed;
- how to handle unknown demand kinds/resource text values without assuming economic permission.

**Experimentation / alternatives captured**
- shared transaction-class adapter layered over existing Grid economics;
- static declarations intentionally not treated as production activation;
- settlement-time revalidation added in addition to create-time validation;
- 10 refusal scenarios mutation-checked with the guard removed;
- no class treated as counsel-cleared merely because a fee shape exists.

**Relevant PRs / commits / tests**
- PR #217 — review evidence before fee proposals activate;
- PR #250 — universal transaction policy fabric adapter;
- PR #308 / commit `7aaeeb6f` — persisted fee policies gated against declared monetization limits;
- `tests/transaction-policy-fabric.test.ts`;
- 28 monetization-policy tests described in PR #308.

**Missing contemporaneous evidence**
- [ ] technical alternatives note comparing one universal fee engine vs resource-specific engines plus shared gate;
- [ ] documented examples of the pre-fix default-fallback behavior and expected/actual outputs;
- [ ] developer time records separated from legal/business-policy analysis;
- [ ] qualified tax professional review to determine whether and which software-engineering portions, if any, are relevant; legal/commercial review itself should not be assumed qualifying.

### 5. Communications / SMS / micro-unit provider funding

**Candidate documentation value:** High.

**Technical uncertainties evidenced in repository**
- how to fund sub-cent vendor operations without rounding each event to a whole cent or silently subsidizing cost;
- how to separate consent, suppression, phone possession, provider routing proof, and commercial funding authority;
- how to guarantee funding/reservation precedes paid provider execution under concurrency/restart conditions;
- how to validate inbound Twilio requests and resolve tenant/patient identity without ambiguous auto-association.

**Experimentation / alternatives captured**
- whole-cent per-event funding rejected in favor of micro-unit pooled reservation model;
- arithmetic RFC proves aggregation, carry, release, and overrun cases;
- patient SMS execution blocked until durable micro persistence exists;
- ambiguous identity and routing cases fail closed;
- disposable Neon lookup-index rehearsal;
- inbound signature/body/duplicate-key limits tested;
- provider credentials explicitly not treated as spending authority.

**Relevant PRs / tests**
- PR #214 — exact micro-unit customer funding arithmetic/RFC;
- PR #221 — variable-cost ownership micro-unit policy;
- PR #224 — block patient SMS until micro funding durable;
- PR #262 — governed patient SMS security re-anchor;
- Twilio routing, webhook, consent, phone-normalization, and micro-funding tests described in PR #262.

**Missing contemporaneous evidence**
- [ ] concurrency experiment results for future persisted micro-unit funding implementation;
- [ ] benchmark showing why whole-cent rounding was technically/economically unacceptable for representative events;
- [ ] retained Twilio signature-vector test logs and provider sandbox observations;
- [ ] developer time records for funding algorithm, webhook security, identity resolution, and routing experiments.

### 6. EDU workforce evidence / completion integrity

**Candidate documentation value:** Medium-High.

**Technical uncertainties evidenced in repository**
- how to prove attendance, applied work, knowledge, instructor review, completion, credential, and reporting without collapsing them into one status;
- how to reuse one healthcare-rooted institutional EDU substrate for multiple workforce pathways without creating a procurement-specific fork;
- how to keep AI/Zumi from becoming completion/credential authority;
- how to prevent client-supplied thresholds or cross-cohort writes from corrupting evidence.

**Experimentation / alternatives captured**
- verified attendance distinguished from enrollment/login;
- separate scored knowledge attempts rather than treating confidence surveys as measured knowledge gain;
- deterministic cumulative evidence-chain projection;
- adversarial fail-open downstream-flag case discovered and corrected;
- completion thresholds moved from client round-trip back to server authority;
- roster data narrowed at load boundary, not merely hidden in markup;
- assessment write scope tied to assigned cohorts.

**Relevant PRs / commits / tests**
- PR #230 / #231 — institutional program and reusable AI-literacy foundation;
- PR #260 — workforce delivery/evidence layer;
- PR #294 — evaluator-proof evidence projection;
- PR #304 / commit `e587df79` — EDU authority hardening;
- `docs/verification/2026-08-23-workforce-max-foundation-local-proof.md`;
- EDU completion/attendance/assessment authority tests described in PRs #260/#294/#304.

**Missing contemporaneous evidence**
- [ ] explicit engineering alternatives record for single completion status vs cumulative evidence chain;
- [ ] preserved RED test output from the fail-open chain before correction;
- [ ] controlled performance/load observations for institution-scale cohorts if such work is performed;
- [ ] developer time records separated from curriculum authoring, proposal writing, and general training-content work.

### 7. Release / migration verification architecture

**Candidate documentation value:** Medium.

**Technical uncertainties evidenced in repository**
- how to reproduce Render production install/build/start behavior in portable verification;
- how to prevent Git auto-deploy from silently applying production migrations when migration ledger/schema drift exists;
- how to distinguish code failure from GitHub Actions runner non-execution;
- how to prove migration behavior safely on disposable databases.

**Experimentation / alternatives captured**
- release gate changed from approximate build flow to Render-aligned contract;
- automatic `prisma migrate deploy` removed from Render build;
- disposable-verification marker required before migration deployment in canonical verification;
- missing DB config and migration drift fail closed;
- build ordering, post-build confidentiality scans, and migration guard tests mutation-checked.

**Relevant PRs / commits / tests**
- PR #287 — align canonical verification with Render;
- PR #290 / commit `e5e82791` — explicit production migration boundary;
- PR #292 — main-gate repair and release-contract test correction;
- `tests/render-release-contract.test.ts`;
- `tests/render-no-automatic-production-migrations.test.ts`.

**Missing contemporaneous evidence**
- [ ] architecture decision record comparing auto-migrate, pre-deploy migrate, manual approved migrate, and disposable verification paths;
- [ ] saved migration-drift inspection output and commands;
- [ ] time records distinguishing routine DevOps maintenance from experimental release-safety development.

---

## Weekly evidence checklist status

### Present / strong
- [x] PR narratives often identify the technical defect or uncertainty.
- [x] Multiple tranches preserve explicit alternatives or rejected approaches.
- [x] Test-first sequencing is documented for BodyMap, prior-encounter selection, clinical truth fixes, and other domains.
- [x] Adversarial cases are frequently documented.
- [x] Several branches preserve disposable production-shaped database rehearsals.
- [x] Mutation checks are documented in security, fee-policy, release, and tenant-scope work.
- [x] GitHub history includes exact commit SHAs and test names for many candidate experiments.
- [x] Repository language distinguishes verification evidence from production claims.

### Missing / highest priority
- [ ] Create a weekly engineering R&D experiment log with one row per candidate technical experiment.
- [ ] Record the uncertainty **before or at the start** of the experiment, not only after a successful fix.
- [ ] Record alternatives considered and why each was accepted/rejected.
- [ ] Preserve RED/failing test output, not just the final passing test count.
- [ ] Preserve exact commands/results for disposable DB rehearsals and controlled provider/runtime tests.
- [ ] Map work to actual personnel/time/accounting records outside GitHub; never derive hours or wages from commits.
- [ ] Separate potentially technical experimentation from routine styling, content authoring, sales/proposal work, legal/compliance review, data entry, and ordinary maintenance.
- [ ] Preserve contractor statements of work/invoices and technical deliverables where applicable, subject to tax-professional review.
- [ ] Add a quarterly review with a qualified tax professional before classifying any activity or expense as eligible.

## Recommended weekly experiment-log fields

For future entries capture:

1. Date / period
2. Business component
3. Engineer(s) / contributor(s)
4. Technical objective
5. Technical uncertainty
6. Starting hypothesis
7. Alternatives considered
8. Experiment / prototype / test performed
9. Failure or unexpected result
10. Iteration / correction
11. Final technical conclusion for the period
12. PR / commit / test / migration / benchmark references
13. Deployment or verification status
14. Remaining uncertainty
15. Time-record / accounting-record reference (external to GitHub)
16. Tax-professional disposition: `UNASSESSED` until reviewed

## Current disposition

All listed components remain **TAX ELIGIBILITY: UNASSESSED**.

This checklist is intended to improve contemporaneous engineering documentation and evidence retention. It does not determine federal or state R&D credit eligibility and does not estimate qualified research expenses or credit amounts.
