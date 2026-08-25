# KLINIKOS EXECUTIVE OPERATING SNAPSHOT — 2026-08-25

Status: CURRENT-STATE EXECUTIVE HANDOFF
Snapshot date: 2026-08-25
Repository baseline: `main@2e418c7d94cb411a88dafdcefcc8f13d269cfbeb`

This snapshot operationalizes, but does not replace:

- `governance/KLINIKOS_COMPANY_OPERATING_SYSTEM.md`
- `src/lib/company-operating-canon.ts`
- `governance/KLINIKOS_COMPANY_CONTROL_REGISTERS.md`
- `governance/KLINIKOS_EXECUTIVE_REVIEW_GAUNTLET.md`
- `docs/business/KLINIKOS_SBA_FUNDING_CONTROL_PLANE_2026-08-25.md`
- `CLAUDE.md`

It is a dated evidence snapshot. External truth must be re-read before consequential action.

## 1. Executive conclusion

The company operating layer is now real.

The highest-leverage sequence is no longer “design more architecture.” It is:

`PROVE PRODUCTION HEALTH → WIN/LAUNCH ONE REAL PILOT → MEASURE CUSTOMER VALUE → CONVERT PROOF INTO CASH / SALES / CANCERX / CAPITAL EVIDENCE → FINISH GOLDEN CLINICAL CASE → PROTECT RELEASE GOVERNANCE → SCALE DISTRIBUTION`

The current business constraint remains execution and proof, not shortage of strategic surface area.

## 2. What changed since the original company-OS handoff

### 2.1 Production release architecture materially improved

Merged PR #321 changed the production-migration model.

Current release policy now:

- keeps Render commit auto-deploy;
- permits automatic application only for explicitly approved additive migrations;
- requires exact SHA-256 manifest validation;
- blocks destructive, unknown, modified-after-approval, or unparsable migration states;
- made the BodyMap migration idempotent;
- re-checks migration state after deployment before allowing release.

The PR also records that the BodyMap schema was applied to the production Neon branch after explicit authorization, with zero existing BodyMap rows, and that the exact migration was replayed successfully on a temporary production clone.

This is a meaningful production-readiness improvement.

It does **not** by itself prove the public application is healthy.

### 2.2 Capital control plane is now installed on main

`docs/business/KLINIKOS_SBA_FUNDING_CONTROL_PLANE_2026-08-25.md` now provides evidence-backed control for:

- customer capital;
- startup / SBA / CDFI debt outreach;
- SBA portal identity workflow;
- Texas SBA 504 expansion lane;
- ETRDC engagement;
- institutional/non-dilutive pipeline;
- startup lender data-room requirements;
- use-of-funds architecture;
- repayment logic;
- corporate financing gaps;
- explicit privacy controls for lender documents.

This is now the capital/lender execution authority for the current snapshot. Do not create a parallel lender truth store.

## 3. Current fact register

| Record | Truth class | Current fact | Evidence | Status / next action |
| --- | --- | --- | --- | --- |
| REPO-001 | CURRENT_FACT | `main` observed at `2e418c7d94cb411a88dafdcefcc8f13d269cfbeb`. | GitHub branch metadata | re-read before merge/release because main is moving quickly |
| GOV-001 | EXECUTED | Company Operating System, company canon, control registers, executive review gauntlet and mandatory agent read order are installed. | current repo | use them, do not create parallel umbrella strategy |
| PROD-001 | EXECUTED | Approved-additive production migration policy merged through PR #321. | current repo / PR #321 | preserve fail-closed policy |
| PROD-002 | CURRENT_FACT | `https://www.klinikos.io/` still returned HTTP 503 after the release-policy merge during this review. | direct production fetch, 2026-08-25 | production health remains P0 until health + deployed SHA are proven |
| REPO-002 | CURRENT_FACT | GitHub still reports `main` unprotected with required status checks disabled. | GitHub branch metadata / #226 | restore executable CI then require real checks |
| CRM-001 | CURRENT_FACT | Connected HubSpot contains 8 companies: 7 real Klinikos target companies plus the original HubSpot sample company. | HubSpot read, 2026-08-25 | maintain as target-company universe, not customer count |
| CRM-002 | CURRENT_FACT | Connected HubSpot contains 0 deals. | HubSpot DEAL read, 2026-08-25 | create deals only after real qualification events |
| SALES-001 | EXECUTED | Direct $500 Operating Analysis follow-ups were already sent to multiple clinic targets. | Outlook sent-mail evidence | monitor replies/payment evidence; do not duplicate |
| CX-001 | CURRENT_FACT | CancerX replied that Klinikos sounds like a strong fit, copied its Associate Director, and invited a fit conversation. | Outlook inbound / #317 | complete conversation; convert real pilot proof into application evidence |
| ROOTS-001 | CURRENT_FACT | NC ROOTS / Impact Health said scope and contracting are still being finalized and partner engagement is expected later. | Outlook inbound | preserve as future partner lane, not revenue/contract |
| CAPITAL-001 | EXECUTED | Evidence-backed SBA/capital funding control plane is installed on `main`. | current repo | use its lender/capital register rather than rediscovering prior outreach |
| CAPITAL-002 | CURRENT_FACT | ETRDC confirmed statewide Texas coverage and provided an SBA 504 initial-information checklist; startup-specific follow-up was sent. | Outlook + capital control plane | await lender response; prepare only truthful startup documents |
| CLIN-001 | EXECUTED | MA, LPN and RN are distinct application roles with conservative authority separation. | merged #311 | persist recorder provenance next |
| CLIN-002 | EXECUTED | Staff Handoff explicitly refuses to invent missing recorder/role attribution. | merged #312 | wire persisted recorder identity/role |
| CLIN-003 | EXECUTED | Clinical Change derives deterministic BodyMap comparison states instead of a hardcoded placeholder. | merged #313 | load real BodyMap versions into Current Visit and render per-finding change |
| PR-257 | CURRENT_FACT | Zumi Memory/Knowledge contains unique unmerged authority-context code. | open PR #257 | preserve; re-anchor only unique tranche |
| PR-282 | CURRENT_FACT | Universal Account/free-member foundation remains unique unmerged implementation. | open PR #282 | re-anchor after current auth/identity reconciliation |
| PR-294 | CURRENT_FACT | Workforce Max contains unique unmerged workforce/evidence/EDU→Grid implementation. | open PR #294 | extract from stale stacked base rather than merge wholesale |

## 4. Evidence unavailable in this pass

### Live Stripe financial state

The currently connected Stripe session exposed only `KLINIKOS.IO sandbox`.

Therefore this snapshot does **not** refresh or assert current live:

- cash received;
- processor balance;
- PaymentIntents;
- subscriptions;
- MRR;
- ARR.

Historical live observations are historical only.

Required operating rule:

`LIVE SOURCE AVAILABLE? → READ → RECONCILE → DATE/SOURCE THE FACT`

If not available:

`UNKNOWN / SOURCE UNAVAILABLE`

### Complete company cash / runway

No complete current bank/accounting read was performed here.

Current company-wide cash, AR, AP, booked revenue, COGS, gross margin, debt service and runway are therefore not asserted by this snapshot.

Use the capital control plane and private financial data room to close those gaps.

## 5. Current P0 register

### P0-A — Prove production health

The old migration deadlock architecture has been materially repaired.

The remaining P0 is now narrower and more concrete:

`APPROVED MIGRATION POLICY MERGED → RENDER DEPLOY → HEALTH → DEPLOYED SHA → CRITICAL JOURNEY SMOKE → PRODUCTION TRUTH`

Current public evidence still shows 503.

Success requires:

1. `klinikos.io` responds successfully;
2. `/api/health` succeeds;
3. deployed commit SHA is the intended reviewed release;
4. critical public and authenticated journeys pass;
5. no failed migration state exists;
6. no production PHI-readiness claim is made unless that separate gate passes.

### P0-B — First real customer/pilot proof

GitHub: #305

Target:

`QUALIFIED PROBLEM → PAID ANALYSIS / BOUNDED PILOT → IMPLEMENT → FIRST VALUE → BEFORE / ACTION / AFTER / EVIDENCE → REPEAT / EXPAND`

Success is not send count.

Success is either:

- verified paid/pilot evidence with measurable customer value; or
- a documented no-sale/pilot failure with causal learning that changes ICP, proof, pricing, implementation or product decisions.

This single proof should be designed to support multiple legitimate uses:

- sales credibility;
- implementation benchmark;
- customer-value evidence;
- CancerX eligibility/application evidence;
- lender/investor diligence;
- grants/procurement;
- product prioritization.

Never change the underlying facts for the audience.

## 6. Capital / bankability operating posture

The current capital hierarchy is:

1. customer capital / earned revenue;
2. properly documented customer commitments/prepayments where appropriate;
3. qualified debt / credit-enhanced financing only where repayment is supportable;
4. non-dilutive procurement, workforce, grant, prize, R&D and tax programs where eligible;
5. strategic capital;
6. venture equity when evidence supports accelerated scale.

Debt repayment must be supported by operating cash flow, assets, receivables, guarantor/collateral support where applicable, and realistic projections.

Do not use future unicorn valuation, SBA guaranty existence, speculative Grid liquidity, or unsigned pipeline as repayment capacity.

Current capital-specific P0 gaps include:

- verify/complete Klinikos-specific internal corporate records for financing;
- maintain opening/current interim balance sheet and P&L;
- maintain 13-week cash forecast;
- build 12/24/36-month base/conservative/stress projections;
- maintain sources-and-uses and business debt schedule;
- keep private owner/guarantor documents outside GitHub;
- verify current SBA portal completion state directly before treating identity workflow as complete.

## 7. Commercial truth

Current real target companies structured in HubSpot include:

- Lincroft Oral & Maxillofacial Surgery
- Professional Orthopaedic Associates
- Abilities In Action Pediatric Therapy
- Bluehouse Eyecare
- Robert Wood Johnson University Hospital in New Brunswick
- Hudson Medical
- The Spine & Pain Institute of New York

The HubSpot sample company is not Klinikos pipeline.

### Deal qualification law

A company record is not a customer.

An email is not a deal.

A reply is not revenue.

A payment link is not cash.

A qualified deal requires enough evidence to store:

- actual buyer/buying process;
- real problem;
- stage;
- next action;
- owner;
- plausible offer;
- amount only when supportable.

HubSpot currently has zero deal objects, and that remains the truthful number until a qualifying commercial event exists.

## 8. Strategic opportunities

### CancerX 2027

Decision: TEST / BUILD EVIDENCE
GitHub: #317

Current evidence supports a real fit conversation.

The strongest strategy is not to manufacture an oncology story. It is to prove a reusable operations primitive in a real pilot, then translate that primitive into oncology only where the evidence legitimately transfers.

Candidate primitive families:

- unfinished-work ownership;
- intake/readiness;
- patient outreach;
- care coordination;
- staff handoff;
- authorization/referral/result visibility;
- operational data backbone;
- governed workflow intelligence.

No oncology deployment, CancerX acceptance, oncology outcome or partnership claim without direct evidence.

### NC ROOTS / Impact Health

Decision: DEFER ACTIVE BUILD / PRESERVE RELATIONSHIP

Treat as a legitimate future public-sector/regional-network relationship.

Do not build speculative ROOTS-specific product before a concrete buyer/problem/contract path exists.

## 9. Clinical convergence

Doctor acceptance remains the clinical proof target:

`PATIENT SNAPSHOT → WHAT CHANGED → STAFF HANDOFF → TODAY → CLINICAL → ASSESSMENT & PLAN → ORDERS / RESULTS → DOCUMENTATION / CODING → CLOSE VISIT`

Best next clinical slices:

1. persist recorder provenance for measurements/intake;
2. load BodyMap versions into Current Visit context;
3. render per-finding `INITIAL → PREVIOUS → TODAY` evidence;
4. preserve explicit resolution only;
5. complete Golden Provider Case across handoff, encounter, orders/results, documentation/coding and close;
6. keep provider signature and human clinical authority;
7. keep AI in governed draft/explanation support rather than authority.

Do not create a parallel clinical module.

## 10. Preserved unmerged implementation

### PR #257 — Memory & Knowledge

Decision: MODIFY / RE-ANCHOR

Keep unique governed memory-authority code. Reconcile with newer Zumi Expert Intelligence, server-boundary and company-knowledge canons before merge.

### PR #282 — Universal Account / Free Member

Decision: MODIFY / RE-ANCHOR

Keep unique free-account implementation. Reconcile with current lifelong identity, agreements, rate limits, session authority and trust canon.

### PR #294 — Workforce Max

Decision: MODIFY / RE-ANCHOR

Keep unique workforce/evidence/demo/EDU→Grid code. Extract it from the stale stacked architecture rather than merging the historical base wholesale.

## 11. Highest current risks

| Risk | Severity | Current evidence | Mitigation |
| --- | --- | --- | --- |
| Public site still unavailable after release-policy repair | CRITICAL | direct 503 fetch | prove Render deploy + health + SHA; inspect remaining failure cause |
| Main branch unprotected | HIGH | GitHub branch metadata | restore executable CI then enforce real PR/check rules |
| Architecture outrunning customer proof | HIGH | broad platform + 0 HubSpot deals | first real pilot/customer value before broad expansion |
| Live financial truth not continuously available | HIGH | current Stripe session sandbox-only | reconnect/read live source; private accounting reconciliation |
| Klinikos-specific financing corporate records incomplete/uncertain | HIGH | capital control plane | verify bylaws, board/officer/cap-table/borrowing authority privately |
| Clinical recorder provenance incomplete | HIGH clinical fidelity | #312 | persist author identity/role after release path stabilizes |
| Old branches can reintroduce obsolete authority | HIGH | divergent PRs | close superseded; extract/re-anchor unique code only |
| Grid professional/referral economics | HIGH legal | counsel gates | remain fail-closed until category-specific clearance |
| PHI production overclaim | CRITICAL trust | separate unresolved readiness gate | never claim until verified |

## 12. Current decision register

### DEC-001 — Broad umbrella strategy is no longer active P0

Outcome: STOP as primary workstream.

Record discoveries, but spend founder/engineering attention on production, customer proof, cash and Golden Case.

### DEC-002 — Do not scale cold acquisition into an unavailable public site

Outcome: MODIFY.

Continue warm conversations, direct trusted/payment paths and relationship work while production is restored.

### DEC-003 — Do not enable Grid Connect/payout economics yet

Outcome: DEFER.

Do not introduce marketplace liability/settlement complexity before repeat lawful fulfillment and approved fee policy exist.

### DEC-004 — One real pilot is a multi-purpose enterprise-value asset

Outcome: BUILD / TEST.

Design the first proof so one underlying evidence set can support customer, commercial, accelerator, capital and product decisions truthfully.

### DEC-005 — Production release policy is now a reusable governed primitive

Outcome: BUILD ON IT, DO NOT BYPASS IT.

Approved-additive migration manifests are safer than either blind auto-migration or a release path that deadlocks on every additive migration.

Unknown/destructive/unapproved migration states must still fail closed.

## 13. Next five actions

### 1. Prove current production health or isolate the remaining 503 cause

The release architecture is repaired; the public service is not yet healthy.

Do not call #321 a completed production recovery until health and deployed SHA prove it.

### 2. Convert one real clinic problem into paid/pilot evidence

Use the existing paid-entry/sprint/implementation ladder where appropriate.

Capture:

`BASELINE → INTERVENTION → AFTER → EVIDENCE → CUSTOMER CONFIRMATION`

### 3. Complete CancerX fit conversation

Extract the exact oncology operations/champion need and record it as evidence, not speculative scope.

### 4. Complete financing-readiness package privately

Prioritize current financial statements, projections, sources/uses, debt schedule, corporate authority evidence and SBA portal verification using the existing capital control plane.

### 5. Continue Golden Current Visit and release governance

After production stability, advance recorder provenance + BodyMap longitudinal presentation while also fixing executable CI / main protection.

## 14. Daily operating contract

Every daily pass should answer from live sources where available:

1. Is production healthy?
2. Did money actually move?
3. Did a target become a genuinely qualified opportunity?
4. Did a customer/pilot advance toward first value?
5. Did capital readiness materially change?
6. Did a security, privacy, clinical, legal or integration risk change?
7. What is active P0?
8. What should stop today?

If a source is unavailable, write `UNKNOWN / SOURCE UNAVAILABLE` rather than carrying yesterday's value forward.

## 15. Staleness rules

Re-read before consequential claims/actions:

- production health and deployed SHA;
- repository head/protection;
- CRM pipeline;
- payment/cash/accounting state;
- accelerator/procurement deadlines;
- lender program requirements;
- corporate ownership/authority;
- legal/regulatory conditions;
- production integration state.

Historical evidence remains historical evidence.

## 16. Anti-theater rules

Never call:

- prospect records customers;
- outbound volume pipeline;
- replies revenue;
- payment links cash;
- proposed pricing MRR;
- capital outreach funding;
- SBA identity verification loan approval;
- lender interest commitment;
- procurement pipeline booked revenue;
- economic flow Klinikos revenue;
- architecture production readiness;
- adapters production-verified integrations;
- educational competency licensure;
- AI output clinical authority.

## 17. Final operating law

Klinikos has enough architecture to win only if execution now converts it into evidence.

The next level is:

`PRODUCTION TRUTH → CUSTOMER PROOF → CASH → FIRST VALUE → REPEAT VALUE → RETENTION → EXPANSION → NETWORK EFFECTS → DEFENSIBLE EVIDENCE → CAPITAL EFFICIENCY`

Every initiative must justify its place in that chain.
