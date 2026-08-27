# KLINIKOS ACTIVE BRANCH / PR CONVERGENCE LEDGER

Snapshot date: `2026-08-27 America/New_York`
Repository: `jcamacho611/Clinicos-by-Zumi`
Main at snapshot start: `0c562d02bba5ca4e9500ef53cfb49c50126ed6bc`

Status: `ACTIVE EXECUTION SNAPSHOT - REVERIFY BEFORE CURRENT CLAIMS`

The prior August 17 closeout ledger is preserved verbatim at `docs/history/BRANCH_LEDGER_2026-08-17.md`. It is historical provenance and no longer describes the current open-PR state.

## 1. Governing rule

`main` is the sole implementation baseline after changes merge.

`docs/KLINIKOS_MASTER_CANON.md` is the sole product/architecture/business/experience target authority.

Open branches/PRs are work candidates, not alternate current products.

Never mass-merge a stale branch. Recover valuable behavior selectively after comparing it to current `main`, the Master Canon, overlapping active work, and exact-head verification.

## 2. Status vocabulary

| Status | Meaning |
| --- | --- |
| `CANON_MERGE` | Current authority/convergence PR that must land before dependent feature reconciliation. |
| `ACTIVE_PRIMARY` | Primary active implementation lane after canon convergence. |
| `ACTIVE_STACKED` | Active work intentionally stacked on another active PR and must follow that dependency. |
| `ACTIVE_COMPANY_EXECUTION` | Symphony/company execution lane, separate from product runtime authority. |
| `RECONCILE_AFTER_CANON` | Valuable active work that must be rebased/reconciled to the new Master Canon before merge. |
| `SELECTIVE_RECOVERY` | Contains potentially valuable implementation/evidence, but current architecture likely supersedes portions. Recover file-by-file, never wholesale. |
| `EXTERNAL_CONTINGENCY` | Code/runbook for an external operational contingency, not the default product path. |
| `PROVENANCE_ONLY` | Historical design/architecture intent that may inform current work but should not merge as current authority. |
| `SUPERSEDE_AFTER_COVERAGE` | Likely replaced by newer work; close only after explicit coverage audit. |

## 3. Current convergence spine

### PR #364 - `docs/architecture: unify Klinikos into one Master Canon`

Status: `CANON_MERGE`

Purpose:

- establish `docs/KLINIKOS_MASTER_CANON.md` as sole product authority;
- lock the B + C hybrid Experience Engine;
- correct protected app order;
- demote old competing master/source-of-truth docs;
- align Zumi canonical retrieval;
- establish Black Label, Screen Contract, confidentiality, legal-defense, Grid/EDU/clinical/financial convergence;
- establish multi-agent execution controls.

Required action:

1. exact-head Quality must execute successfully;
2. merge to `main` under explicit founder authorization;
3. every other active PR must reconcile to the resulting new main.

Do not merge dependent feature work ahead of this authority change.

### PR #361 - `feat: supreme Klinikos convergence + Zumi→Grid continuation`

Status: `ACTIVE_PRIMARY` after #364 lands.

Valuable work:

- public Zumi/Grid continuation;
- identity-safe Grid professional enrollment;
- universal relationship attachment;
- OpenAI/Zumi direction;
- relevant design/architecture work.

Known conflict:

Its PR body and some older docs still describe `PROBLEM ENTRY → ZUMI → VALUE PREVIEW → ACCOUNT...` as canonical. That is superseded by the B + C protected-app order.

Required action after #364:

- reconcile to current main;
- remove/demote duplicate supreme/master authority;
- preserve actual identity/claim/Grid implementation;
- update journey tests/docs to access airlock → identity → authenticated Zumi → Experience Engine;
- rerun exact-head release gates;
- browser/mobile/accessibility review changed user-facing surfaces.

Do not merge current #361 unchanged.

### PR #365 - `fix: rebuild Klinikos public entry as interactive platform`

Status: `ACTIVE_STACKED` on #361.

Target:

- remove brochure-first public/product experiences;
- restore protected access entry;
- rebuild Living Home around Zumi;
- rebuild Grid around real map/list/inspector exchange;
- rebuild Clinics as interactive operating gateway;
- rebuild EDU as interactive academy/workforce gateway.

Known conflict:

Its first tranche was built during the earlier Terms → Zumi → later account interpretation. The protected product flow now requires identity before authenticated Zumi.

Required action:

- remain stacked until #361 reconciles;
- update the root/protected route split to the new literal order;
- preserve useful Grid map/repository work;
- apply Screen Contracts to Grid/Clinic/EDU/Living Home;
- remove remaining card-wall/brochure architecture;
- complete browser/mobile/accessibility verification.

## 4. Core supporting active work

### PR #362 - Legal defense stack

Status: `RECONCILE_AFTER_CANON`

Valuable work:

- severe breach/remedies architecture;
- versioned protected-access agreement;
- breach consequence acknowledgment;
- DTSA notice;
- E-SIGN record requirements;
- server-side agreement hash/evidence binding.

Hard gate:

`counselReviewRequired: true` and `productionApproved: false` remain meaningful. Do not merge as if legal wording is attorney-approved or automatically activate enforcement.

Reconcile legal/version language with the Master Canon and the canonical protected entry ceremony.

### PR #359 - Symphony email-first execution foundation

Status: `ACTIVE_COMPANY_EXECUTION`

Valuable work:

- opportunity vocabulary;
- target classification;
- deterministic prioritization;
- outbound dedupe/follow-up;
- founder-only gates;
- truth-state separation;
- existing outbound adapter reuse.

Required action:

- reconcile to new main;
- adopt `SYMPHONY.md` and `docs/KLINIKOS_MULTI_AGENT_EXECUTION_CONTROL.md`;
- run focused + full repo gates on exact head;
- keep Symphony separate from Zumi/product authority;
- add persistence only after auditing existing company/prospect/outreach truth.

### PR #360 - final-form onboarding / Account release

Status: `SELECTIVE_RECOVERY`

Valuable work:

- organization-agnostic Account substrate;
- member authentication/session concepts;
- durable abuse throttling;
- append-only legal acceptance/account binding;
- browser disclosure guards.

Overlap:

Major identity/auth/onboarding overlap with #361 and historical #281/#282. It also predates the final B + C sequence.

Required action:

- audit file-by-file against #361/new main;
- recover only stronger/non-duplicative Account/session/abuse/legal-binding behavior;
- do not merge wholesale;
- close after coverage is proved.

## 5. Design and experience recovery

### PR #354 - measured design/palette/accessibility repairs

Status: `SELECTIVE_RECOVERY`

Valuable evidence/work:

- duplicate-title repair;
- truthful Black Label token naming;
- raw-hex convergence;
- dead home CSS removal;
- primary button contrast correction from measured 4.10 to 7.18;
- browser QA method and route evidence.

Do not inherit its older homepage composition as authority. Recover compatible measured fixes into the current Black Label/Screen Contract implementation.

### PR #240 - Marble / Obsidian theme system

Status: `SELECTIVE_RECOVERY`

Valuable intent:

- Auto/System, Light/Marble, Dark/Obsidian;
- legacy theme migration;
- theme preference as presentation only.

Required action:

- compare with current design tokens and #354/#361/#365;
- recover the strongest unified theme implementation;
- do not create a second theme framework.

### PR #325 - Living Home server authority

Status: `SELECTIVE_RECOVERY`

Valuable work:

- moves proprietary intent/path resolution server-side;
- minimum-necessary projected path state;
- authenticated command API;
- preserves browser confidentiality.

Required action:

- reconcile with authenticated-Zumi-first Experience Engine architecture;
- prefer server-authority patterns where compatible;
- avoid reviving obsolete path catalogs/persona routing.

### PR #267 - presentation-state truth plan

Status: `PROVENANCE_ONLY / SELECTIVE_PATTERN`

Valuable rule:

- empty/partial/blocked/unavailable state truth belongs at appropriate server projection boundaries;
- do not wrap all repositories in a new universal state envelope.

Use as a subordinate pattern for Screen Contracts.

## 6. Identity / auth historical stack

### PR #281 - lifelong identity foundation

Status: `SUPERSEDE_AFTER_COVERAGE`

Valuable historical implementation includes Person, OrganizationMembership, LocationAssignment and relationship compatibility.

Current #361 contains newer universal relationship work. Audit only for missing semantics/migration evidence before close. Do not merge wholesale.

### PR #282 - Universal Account / free-member backend

Status: `SUPERSEDE_AFTER_COVERAGE`

Valuable historical implementation includes Account/auth models, free-member sessions, legal binding, abuse protections and migration rehearsal.

Current #360/#361 are newer overlapping lanes. Audit for unique stronger behavior only.

### PR #263 - Universal Entry Gateway

Status: `SELECTIVE_RECOVERY`

Its target sequence `PUBLIC → ENTER → AGREEMENT → SIGNUP/LOGIN → IDENTITY BINDING → ZUMI` closely matches the new Master Canon and is high-value provenance/implementation.

Audit its existing legal/auth continuation logic against #361/#365 and recover the strongest non-duplicative implementation. Do not blindly replay old history.

## 7. Grid / network / commerce backlog

### PR #252 - deterministic Grid liquidity metrics

Status: `RECONCILE_AFTER_CANON`

Potentially valuable for internal/owner/network decision support. Keep metrics truthful and do not turn them into fake public liquidity or generic KPI theater.

### PR #253 - public reviewed Grid resource details

Status: `RECONCILE_AFTER_CANON`

Potentially valuable for public-safe resource discovery. Must fit the new Grid spatial product and protected-app order. Public detail may exist without exposing protected transaction authority.

### PR #249 - shared governed trust projection

Status: `RECONCILE_AFTER_CANON`

Potentially valuable read/projection layer over existing Grid disputes/incidents. Preserve source-domain authority and minimum necessary projection.

### PR #250 - transaction policy fabric

Status: `RECONCILE_AFTER_CANON`

Potentially valuable canonical transaction vocabulary. Keep economics/policy server-side and fail closed on classes without active economic/legal source.

### PR #254 - network invitation continuity

Status: `RECONCILE_AFTER_CANON`

Valuable closed-loop distinction: invitation acceptance does not automatically create governed relationship, sharing agreement, chart access, or consent.

### PR #256 - universal obligation projection

Status: `RECONCILE_AFTER_CANON`

Potentially valuable projection for "What still needs to happen?" if it continues to project authoritative Task/Referral/etc. state rather than creating a second task authority.

## 8. Zumi / memory backlog

### PR #257 - governed memory and reviewed knowledge context

Status: `RECONCILE_AFTER_CANON`

Potentially valuable authority/scope model for memory and approved organizational knowledge.

Required rules:

- memory remains context, not clinical/payment/credential truth;
- use current Master Canon and authenticated Experience Engine;
- no parallel assistant or memory truth database;
- current live domains are re-retrieved before consequential action.

## 9. EDU / workforce stacked backlog

### PR #293 - operating network / workforce design

Status: `PROVENANCE_ONLY / SUPERSEDED_PRODUCT_AUTHORITY`

Its valid workforce concepts are now subordinate to the Master Canon. Do not merge its older seven-commercial-door architecture as a parallel current product definition.

### PR #294 - Workforce max foundation

Status: `SELECTIVE_RECOVERY`

Potentially valuable implementation/evidence:

- exact five current workforce pathway keys;
- DOL-aligned learning loop;
- deterministic evidence projection;
- evaluator-safe synthetic healthcare scenario;
- EDU→Grid non-authority boundary.

Rebase/rebuild valuable pieces on current EDU architecture. Do not preserve its brochure-style `/edu` presentation if it conflicts with the interactive academy canon.

## 10. Integrations / operations

### PR #251 - interoperability lifecycle truth

Status: `RECONCILE_AFTER_CANON`

Potentially valuable canonical external lifecycle and production-proof semantics. Reconcile with current external dependency matrix and do not call `CONNECTED` production verified.

### PR #262 - governed patient SMS security

Status: `RECONCILE_AFTER_CANON`

Security-sensitive, potentially valuable work. Keep transactional consent, suppression, phone verification, tenant routing, funding/economic authority and production activation distinct. Requires exact-head migration/security/provider verification before merge/live claims.

### PR #328 - zero-cost Vercel failover

Status: `EXTERNAL_CONTINGENCY`

Do not convert this into default production architecture merely because Render is constrained. Use only after current external deployment state is reverified and preview/runtime proof succeeds.

## 11. Legal backlog beyond #362

### PR #353 - advanced confidential-access agreement

Status: `SUPERSEDE_AFTER_COVERAGE`

Likely substantially absorbed by Master Canon legal architecture and PR #362. Audit for unique useful language/evidence, then close rather than maintaining two legal-defense authorities.

### PR #264 - generated legal documents foundation

Status: `RECONCILE_AFTER_CANON`

Potentially valuable separate organization Legal Vault/generated-document infrastructure. It does not replace protected-entry Terms. Keep generated legal lifecycle tenant-scoped, review-gated, artifact-hash-bound, and counsel-gated.

## 12. Current merge / build order

Dependency-safe sequence:

1. PR #364 - merge one Master Canon + agent controls.
2. Reconcile PR #361 to new main and final protected-entry/Experience Engine law.
3. Reconcile PR #365 as the active experience rebuild stacked on #361.
4. In parallel where non-overlapping, reconcile #362 legal, #359 Symphony, #251 integration lifecycle, and high-value security/release work.
5. Audit/recover #360/#263/#281/#282 identity/auth overlap into one authoritative implementation.
6. Complete Grid flagship spatial exchange, then Clinic, Current Visit, EDU, Billing/Financial, Network/Enterprise surfaces against Screen Contracts.
7. Recover subordinate Grid/network/commerce/memory/communications work only after overlap audit.
8. Close superseded PRs after explicit coverage is recorded.

## 13. Mandatory branch/PR handoff

Every material active PR must state:

- canon basis;
- base/head SHA;
- current main reconciliation state;
- exact files/domain authority touched;
- built vs unbuilt/external;
- migration/data impact;
- security/confidentiality boundary;
- exact verification evidence;
- browser/mobile/accessibility evidence where relevant;
- overlap/dependency on other PRs;
- next dependency-safe action;
- explicit no-claims.

## 14. Closing rule

This ledger is an execution snapshot, not a second architecture.

Reverify open PRs before acting.

When a PR merges, `main` becomes implementation truth for its merged behavior and the branch becomes historical.

When a product decision changes, the Master Canon changes first or in the same reviewed convergence.

Do not let old branches, old PR descriptions, old screenshots, or old handoffs become parallel Klinikos products.