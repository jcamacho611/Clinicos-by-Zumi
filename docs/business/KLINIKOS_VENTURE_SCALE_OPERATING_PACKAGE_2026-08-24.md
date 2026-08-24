# Klinikos Venture-Scale Operating Package

**Date:** 2026-08-24  
**Status:** STRATEGIC OPERATING BASELINE — evidence-classified, not a traction claim  
**Repository baseline:** `main@126e1fb5ad0c170b2920c9e5ee2434d697cea88a`

## Executive decision

Klinikos' primary near-term growth constraint is **commercial execution**, not lack of monetization ideas.

The company currently has substantial product/architecture depth, a real live Stripe account, three truthful one-time services that can be purchased, code-owned clinic subscription anchors, Grid transaction primitives, payment-evidence architecture, revenue-integrity logic, and a broad NYC-metro prospect discovery universe. What is not yet present is the business evidence that matters most: a functioning CRM pipeline, observed Stripe payments, live recurring subscriptions, proven customer retention, or a dense Grid market cell.

Therefore the operating sequence is:

1. **Cash now:** sell the existing service ladder into high-signal healthcare organizations.
2. **Prove implementation value:** convert qualified service engagements into implementation.
3. **Finish free identity safely:** unlock distribution without granting authority.
4. **Build one dense Grid wedge:** prove liquidity before marketplace monetization.
5. **Activate recurring Care only against real implemented customer value.**
6. **Delay Connect/payout complexity until a lawful transaction cell has repeat fulfillment.**

This package does not optimize for valuation. It optimizes for the conditions that could eventually support venture-scale economics: useful product value, distribution, repeat activation, retention, expansion, positive contribution, network density, evidence accumulation, and enterprise governance.

---

# Evidence classification

Use these labels throughout:

- **VERIFIED:** authoritative system/provider/repository evidence confirms it.
- **OBSERVED:** directly observed in current connected tooling or runtime, but may not be globally exhaustive.
- **SELF_REPORTED:** supplied by an operator/customer/person and not independently verified.
- **ESTIMATED:** derived from a stated model or external dataset.
- **INFERRED:** reasoned from evidence but not directly measured.
- **HYPOTHESIS:** proposed strategy to test.
- **UNKNOWN:** current evidence is insufficient.

## Current evidence ledger

| Fact | Classification | Evidence |
|---|---|---|
| Current main is `126e1fb...` | VERIFIED | GitHub branch truth |
| Main latest merge reports Prisma validate, TypeScript, 1,699 tests, and 0 lint errors from local verification | VERIFIED AS COMMIT EVIDENCE, NOT HOSTED-CI PROOF | commit #292 |
| Main branch protection/required checks are off | VERIFIED | GitHub branch metadata |
| Live Stripe account is `KLINIKOS.IO` | VERIFIED | connected Stripe account |
| Live Stripe has three active one-time service products | VERIFIED | Stripe products |
| Live service prices are $500, $1,500 and $3,500 | VERIFIED | Stripe prices |
| Live account has no PaymentIntents | OBSERVED | Stripe list as of 2026-08-24 |
| Live account has no subscriptions | OBSERVED | Stripe list as of 2026-08-24 |
| Code-owned clinic anchors are $995/$1,995/$3,995 monthly plus Enterprise custom | VERIFIED AS PRODUCT CONFIGURATION, NOT REVENUE | commercial canon/code |
| HubSpot has 0 deals and only sample records | VERIFIED | connected HubSpot portal |
| HubSpot portal is not onboarded | VERIFIED | connected HubSpot portal |
| Broad NYC-metro medical-practice/outpatient/physician discovery query matched 19,419 records | OBSERVED VENDOR-DATABASE COUNT, NOT TAM | connected prospecting data |
| Narrow buying-intent version of the same search returned 9 records | OBSERVED VENDOR SIGNAL, NOT PURCHASE INTENT CERTAINTY | connected prospecting data |
| Grid economics exist as proposals and fail closed until legal evidence + persisted activation | VERIFIED | `src/lib/commercial/grid-economics.ts` |
| External Grid payout settlement is not live | VERIFIED | current product truth |
| Free universal Account backend exists on draft work but unrestricted signup is not production-released | VERIFIED | current PR/product truth |
| Retention/NRR/CAC/LTV are measurable today | UNKNOWN / NOT YET EVIDENCED | no active customer cohort source reviewed |

---

# A. Current Business Truth Map

## What Klinikos is now

**VERIFIED:** Klinikos is an operating ecosystem under active development with real Care/Clinic OS, Grid, EDU, Patient, Intelligence/Zumi, Financial/Revenue, Network and enterprise-oriented primitives. The strongest architecture is continuity between domains, not standalone modules.

## What can be sold now without overstating product status

### Production-purchasable service offers

1. **Clinic Operating Analysis — $500 one-time**
2. **Klinikos Operational Audit — $1,500 one-time**
3. **Klinikos Workflow Sprint — $3,500 one-time**

The live payment links explicitly state that purchase does not itself activate production PHI processing, clinical authority, or regulated capabilities. This is good commercial truth and should remain.

### Code-owned future/contract anchors

- Implementation Blueprint — $1,500 one-time in repository commercial canon
- Founding Clinic Implementation — from $8,000
- Klinikos Core — $995/month
- Klinikos Growth — $1,995/month
- Klinikos Scale — $3,995/month
- Klinikos Enterprise — custom
- Zumi Intelligence Plus — from $350/month
- Revenue OS — from $750/month + setup
- Network — from $300/month + setup

These are **commercial anchors**, not proof that recurring billing is activated or that customers currently pay them.

## Current strongest product proof

- governed healthcare workflows and tenant boundaries;
- substantial automated test coverage and release discipline;
- Grid demand/resource/offer/reservation primitives;
- deterministic revenue-integrity path;
- immutable/evidence-oriented clinical architecture;
- payment truth separated from browser redirects and entitlement;
- customer-funded usage architecture;
- public Grid and EDU entry surfaces;
- current product can truthfully demonstrate real workflow structure without inventing integrations.

## Current weakest business proof

- no HubSpot deal pipeline;
- no observed Stripe payments;
- no observed Stripe recurring subscriptions;
- no measured retention/expansion cohorts;
- no proven Grid liquidity cell;
- no validated CAC/payback;
- no customer-level contribution model;
- no repeatable implementation-to-subscription conversion evidence.

---

# B. Revenue Engine Map

Scores use 1–10 strategic priority, not observed revenue performance.

| Engine | Buyer | Value | Pricing unit | Current status | Strategic score | Immediate next proof |
|---|---|---|---|---|---:|---|
| Clinic Operating Analysis | clinic owner/operator | diagnose operational leakage and workflow friction | $500 engagement | LIVE PURCHASABLE | 10 | first paid engagement + useful deliverable |
| Operational Audit | clinic/group | deeper workflow/revenue/capacity diagnosis | $1,500 engagement | LIVE PURCHASABLE | 9 | close from Analysis or direct high-fit buyer |
| Workflow Sprint | clinic/group | implement one bounded workflow improvement | $3,500 engagement | LIVE PURCHASABLE | 10 | first paid sprint with before/action/after proof |
| Founding implementation | qualified clinic | configure/adopt Klinikos workflow | from $8,000 | CONFIGURED / SALES-ASSISTED | 10 | paid implementation agreement |
| Care subscription | clinic/group | recurring operating platform | $995–$3,995+/mo | PRICE ARCHITECTURE EXISTS; LIVE RECURRING BILLING NOT OBSERVED | 10 | implemented customer reaches first recurring value |
| Intelligence | Care/Grid/EDU/Enterprise users | work reduced via governed AI | allowance/usage/add-on | FOUNDATION | 8 | cost per Zumi value event |
| Revenue OS | clinics/groups | find and resolve legitimate revenue blockers | subscription/setup | PARTIAL PRODUCT / COMMERCIAL ANCHOR | 9 | evidence-backed exception resolution |
| Grid org subscription | clinics/resource owners | operating tools for recurring Grid use | free → from $299/mo | PROPOSED/NOT ACTIVE REVENUE | 8 | dense cell + repeat usage first |
| Grid professional subscription | professionals | saved availability/search/history | free → $49/mo / higher tier | PROPOSED/NOT ACTIVE REVENUE | 6 | repeat professional value before charging |
| Grid transaction economics | lawful marketplace participants | reservation/fulfillment infrastructure | class-specific | POLICY DRAFT / FAIL CLOSED | 7 | repeat lawful fulfillment + counsel-cleared cell |
| Network | organizations | preserve partner/referral/capacity relationships | from $300/mo / enterprise | FOUNDATION | 8 | recurring cross-org workflow value |
| EDU institutional | workforce boards/schools/employers | applied training + evidence + reporting | contract/per participant | PRODUCT FOUNDATION / ACTIVE BIDDING MOTION | 9 | signed institutional contract |
| EDU direct learner | learner | practice/evidence | free/individual price hypotheses | NOT PRIMARY EARLY REVENUE | 4 | only after institutional strategy protected |
| Enterprise | groups/networks/institutions | hierarchy, governance, integrations, policy | contracted ACV | FUTURE / SALES-ASSISTED | 9 | first multi-org governance need |
| Integrations/API | enterprise/partners | governed connectivity | setup/recurring/usage | FUTURE / connection-dependent | 7 | one real paid external rail |
| Professional services | practices/institutions | implementation/advisory | project/retainer | SELLABLE NOW | 9 | productize recurring work |

### Revenue priority conclusion

**Now:** services + implementation.  
**Next recurring:** Care + Intelligence/Revenue expansion.  
**Next network:** Grid subscription only after liquidity.  
**Later transaction:** Connect/payout after lawful repeat fulfillment.  
**Institutional parallel lane:** EDU contracts.

---

# C. Persona Economic Map

| Persona | Free reason to enter | First value event | Who should usually pay | Paid expansion |
|---|---|---|---|---|
| Clinic owner/operator | understand Klinikos / Grid / operating fit | operational issue identified and next action prepared | organization | analysis → implementation → Care → Revenue → Grid/Network → Enterprise |
| Provider | useful clinical workflow/context | Current Visit answers what changed/what needs judgment | organization | Care/Intelligence funded by org |
| Front desk/MA/RN | faster owned workflow | patient/visit becomes ready without duplicate work | organization | Care |
| Biller | revenue blocker becomes actionable | supported exception resolved | organization | Revenue OS / higher Care tier |
| Professional/Grid participant | free identity + discoverability | qualified opportunity | employer/buyer/organization where possible | Pro tools only after repeat value |
| Resource owner | free listing | real qualified demand | seller/buyer according to lawful cell | Pro / transaction tools |
| Learner | route + practice | evidence-backed learning/completion | institution/employer preferred | advanced training, not pay-to-win jobs |
| Instructor | program/workflow support | review/completion workflow | institution | institutional EDU |
| Employer | workforce need | evidenced candidate/capacity route | employer | Grid/EDU/Enterprise |
| Patient | access + next action | necessary action completed | healthcare organization generally | minimal direct monetization |
| Enterprise admin | cross-org control | policy/governance workflow improved | enterprise | contracted platform/integration/usage |

---

# D. Network Flywheel Map

## Primary flywheel

`ORGANIZATION → OPERATING WORK → NEED → GRID DEMAND → ELIGIBLE SUPPLY → FULFILLMENT → EVIDENCE → NETWORK RELATIONSHIP → EASIER REPEAT → MORE ORGANIZATION VALUE`

## Care → Grid

Care identifies an actual shortage or capacity gap. Human confirms. Grid receives the minimum necessary demand object. No retyping.

## Grid → Network

Successful fulfillment creates evidence and the option to preserve a trusted relationship. The second interaction should be cheaper and easier than the first.

## EDU → Grid → Employer

Training → reviewed evidence → participant opt-in → eligible opportunity discovery → employer relationship → work evidence → upskilling.

## Enterprise multiplier

One organization can legitimately invite staff, providers, partners, learners, vendors and related organizations. Track **network participants created per active enterprise organization**, but do not claim a viral coefficient until data exists.

---

# E. Market Cell Map

## Market-cell rule

Grid liquidity is measured by:

`RESOURCE TYPE × GEOGRAPHY × TIME WINDOW × ELIGIBILITY CLASS`

Never use national signup totals as liquidity.

## Discovery evidence

A broad connected prospecting search for NYC-metro medical practices/outpatient centers/physician organizations with 1–200 employees and websites returned **19,419 matching database records**. This number is a **vendor discovery universe, not TAM** and contains noise/duplicates/misclassification risk.

A more restrictive query requiring selected buying-intent signals around healthcare automation, staffing, practice management, revenue cycle, scheduling, billing or clinical workflow returned **9 current matches**. The signal is useful for account prioritization, not proof of budget or purchase intent.

## Recommended first commercial ICP cell

**Independent/specialty ambulatory organizations in NYC/tri-state with operational complexity and visible scheduling/revenue/workflow pain.**

Why:
- close geographic founder access;
- current clinical/No-Fault/product work can demonstrate complex continuity;
- service offers can be sold before full SaaS activation;
- Grid and Network needs can emerge naturally from clinic operations;
- implementation can generate product learning.

## Recommended first Grid liquidity experiments

Rank by regulatory simplicity first:

1. **clinic rooms/chairs/space capacity** — high relevance, but NY percentage-of-practice-revenue structures must be avoided; use transaction structure tied to actual rental economics only after review.
2. **non-clinical business services** — IT, admin, workflow, approved vendor services.
3. **education/training capacity** — seats/instructors/program capacity under EDU boundaries.
4. **permitted equipment/resources** — after category/safety rules.
5. **professional availability** — strategically powerful but higher employment/credential/fee-splitting complexity; employer-side/fixed technology economics preferred until counsel-cleared.
6. **clinical referral / patient-care payments** — no transaction percentage under current policy; monetize software/coordination instead.

---

# F. ICP Matrix

| ICP | Pain urgency | Speed to close | Product fit | Network potential | Proof required | Priority |
|---|---:|---:|---:|---:|---|---:|
| Independent specialty clinic, 1–10 providers | 8 | 8 | 9 | 7 | workflow demo + implementation confidence | 10 |
| Multi-location specialty practice | 9 | 6 | 9 | 9 | multi-location governance + ROI evidence | 10 |
| No-Fault/MSK/pain/PT practice | 9 | 7 | 10 hypothesis | 9 | physician Golden Case + case/revenue workflow | 10 hypothesis |
| Med spa / cash-pay clinic | 7 | 8 | 7 | 8 | scheduling, CRM, follow-up, space/professional capacity | 8 |
| Independent PT/rehab group | 8 | 7 | 8 | 8 | recurring care + progress + referrals | 9 |
| Workforce board/community college | 8 | 4 | 8 | 9 | evaluator-safe EDU evidence + procurement package | 9 |
| Healthcare employer | 8 | 5 | 7 | 10 | workforce need → training/evidence/opportunity | 8 |
| Resource/facility owner | 7 | 7 | 7 | 10 | demand density + trusted transaction rules | 8 |
| Large health system | 8 | 2 | 6 early | 10 | security, integrations, procurement, references | 5 now / 10 later |
| Payer/large enterprise network | 8 | 1 | 5 early | 10 | mature interoperability/governance/evidence | 3 now / 10 later |

**Beachhead decision:** founder-led sales to independent and multi-location specialty practices first, with No-Fault/MSK as a deep product proof wedge, while institutional EDU continues as a parallel procurement lane.

---

# G. Unit Economic Model

## Current truth

Actual customer-level contribution economics are **UNKNOWN** because current connected Stripe has no observed payments/subscriptions and no customer cohort cost ledger was reviewed.

## Mandatory contribution equations

### Services

`CONTRIBUTION = CASH COLLECTED - DIRECT LABOR - CONTRACTOR COST - VARIABLE VENDOR COST - REFUNDS - DIRECT DELIVERY SUPPORT`

### Care SaaS

`GROSS PROFIT = SUBSCRIPTION REVENUE - AI - COMMS - DATABASE/STORAGE ALLOCATION - EXTERNAL RAILS - VARIABLE SUPPORT`

`CONTRIBUTION = GROSS PROFIT - IMPLEMENTATION AMORTIZATION - CUSTOMER-SPECIFIC SUCCESS/INTEGRATION COST`

### Grid

`CONTRIBUTION = NET PLATFORM REVENUE - PROCESSOR - FRAUD - REFUNDS - DISPUTES - SUPPORT - INCENTIVES - VARIABLE INFRASTRUCTURE`

### EDU

`CONTRIBUTION = CONTRACT/PARTICIPANT REVENUE - INSTRUCTOR - PREPARATION - REPORTING - AI - PLATFORM VARIABLE COST - SUPPORT`

## Provisional operating guards — targets, not current metrics

- Services: quote only after estimating delivery labor; flag engagements whose expected direct delivery cost exceeds 50% of price unless strategically approved.
- SaaS/Intelligence: design toward strong software gross margins; do not activate unlimited external usage without funded allowance.
- Grid: optimize contribution after processor/refunds/disputes, not headline take rate.
- EDU: price live instruction and reporting explicitly; do not model instructor time as free.
- Every engine: unknown vendor cost stays UNKNOWN until measured.

## Immediate measurement backlog

1. founder hours per $500 analysis;
2. delivery hours per $1,500 audit;
3. delivery hours/vendor cost per $3,500 sprint;
4. cost per Zumi value event;
5. communication cost by tenant/capability;
6. database/storage cost by active org;
7. support minutes per active org;
8. implementation hours per workflow/location;
9. Grid support cost per completed reservation;
10. EDU instruction/reporting hours per participant/cohort.

---

# H. Current Product → Revenue Crosswalk

| Existing/near-existing product truth | Revenue path | Do now? |
|---|---|---|
| Public Klinikos + operating narrative | lead → Analysis | YES |
| Public Zumi | qualified intent → smallest useful next step | YES, but no spammy upsell |
| Revenue Integrity | Analysis/Audit/Sprint → Care/Revenue expansion | YES |
| Current Visit / clinical convergence | physician proof → implementation/Care | YES after truth-safe demo path |
| Grid public discovery/listing | network acquisition | YES free/low-friction |
| Grid transaction primitives | future transaction/subscription revenue | NOT until dense cell + legal/settlement proof |
| EDU foundation | institutional contract | YES |
| Workforce configuration | workforce-board/employer contract | YES after evaluator proof |
| Patient portal | organization retention/value | YES, primarily organization-funded |
| Network relationships | Care/enterprise expansion | YES as operational value, not referral commission |
| Financial OS/payment evidence | trustworthy commercial activation | YES |
| Customer-funded allowance architecture | margin protection | YES before paid variable-cost scale |
| External adapters | integration fees/enterprise | only when real connection exists |

---

# I. Free → Paid Conversion Architecture

## Permanent free entry objective

`FREE ACCOUNT → PERSON → SAFE BASIC PROFILE → STRUCTURED INTENT → FIRST VALUE`

Free identity creates **no** professional, clinical, organization, Grid, payment, credential or employment authority.

## Conversion paths

### Clinic

`PUBLIC → ZUMI / CONTENT → FREE FIT → $500 ANALYSIS → $1,500 AUDIT/BLUEPRINT → $3,500 SPRINT → $8K+ IMPLEMENTATION → CARE SUBSCRIPTION → REVENUE/INTELLIGENCE → GRID/NETWORK → ENTERPRISE`

### Professional

`FREE IDENTITY → OPTIONAL PROFILE/AVAILABILITY → ELIGIBLE OPPORTUNITY → FULFILLMENT → EVIDENCE → REPEAT → OPTIONAL PRO TOOLS`

### EDU

`INSTITUTION → PARTICIPANT IDENTITY → PRACTICE → REVIEWED EVIDENCE → COMPLETION → OPT-IN GRID DISCOVERY → WORK → NEW EVIDENCE`

## Free boundary law

Free stops where meaningful incremental business value or variable cost begins. It must not be deliberately crippled.

## Current blocker

The universal Account/free-member backend is not yet production-enabled. Distributed abuse throttling and release verification remain mandatory before unrestricted public signup.

---

# J. Grid Monetization Policy Design

The current repository approach is directionally correct: policy by resource class, legal status, evidence and server activation.

## Required policy inputs

- resource/transaction class;
- buyer/seller class;
- jurisdiction;
- regulated-service flag;
- professional status;
- healthcare-referral implications;
- contract type;
- subscription coverage;
- processor cost;
- volume;
- enterprise override;
- effective date/version;
- legal review status + durable evidence.

## Required outputs

- FREE
- SUBSCRIPTION_INCLUDED
- LISTING_FEE
- BUYER_PLATFORM_FEE
- SELLER_PLATFORM_FEE
- FIXED_TRANSACTION_FEE
- PERCENTAGE_MARKETPLACE_FEE
- RECRUITING_FEE
- PLACEMENT_FEE
- IMPLEMENTATION_FEE
- AI_USAGE_FEE
- INSTITUTIONAL_FEE
- ENTERPRISE_CONTRACT
- MANUAL_REVIEW_REQUIRED
- PERCENTAGE_FEE_PROHIBITED

## Current fee proposals — not active

Repository policy currently proposes percentage/fixed economics for lower-risk classes but carries no counsel-clearance evidence, so fee-bearing calculation fails closed. Clinical patient-care/referral classes currently use no platform fee.

## Regulatory guard

New York professional-practice rules restrict fee splitting and certain referral consideration. Federal Anti-Kickback rules can apply to remuneration intended to induce/reward Federal healthcare-program referrals. Therefore no Grid fee tied to professional care/referral volume becomes active merely because Stripe can technically collect it.

---

# K. Stripe / Financial Architecture

## Current live Stripe truth

- live account: `KLINIKOS.IO`;
- three active one-time service products;
- three active one-time prices;
- three active payment links;
- no observed PaymentIntents;
- no observed subscriptions;
- no current Connect transaction/payout evidence;
- automatic tax is not enabled on the reviewed links.

## Near-term architecture

### Services

Keep Stripe Hosted Checkout/Payment Links for current one-time engagements. Reconcile provider payment evidence into Klinikos Financial OS. Payment does not equal implementation completion.

### Care SaaS

Do not create recurring Stripe products until product/entitlement mapping is ready to preserve canonical Klinikos product IDs. Then use Billing/Checkout as the payment rail while Klinikos remains authority for offer, entitlement, allowance, activation and reconciliation.

### Grid marketplace

Do not build money movement first. Sequence:

`DENSE CELL → ELIGIBILITY → OFFER/RESERVATION → REPEAT FULFILLMENT → APPROVED ECONOMIC POLICY → CONNECT ARCHITECTURE → CONTROLLED PAYMENT/PAYOUT PROOF`

Stripe is a financial rail; internal Financial OS owns commercial intent and reconciliation.

---

# L. Sales / CRM Architecture

## Current truth

HubSpot currently contains **0 deals**, one sample company and two sample contacts. The portal is not onboarded. This means Klinikos currently lacks durable CRM operating discipline even if outreach exists elsewhere.

## Required pipeline

`TARGET ACCOUNT → QUALIFIED PROBLEM → CONTACT/CHAMPION → DISCOVERY → ANALYSIS OFFERED → ANALYSIS PAID → AUDIT/SPRINT → IMPLEMENTATION PROPOSAL → CLOSED WON/LOST → ACTIVATION → FIRST VALUE → RENEWAL/EXPANSION`

## Minimum CRM fields

- account/company;
- ICP;
- source;
- problem;
- urgency;
- buyer/champion;
- current workaround/stack;
- product wedge;
- next action/date;
- deal amount;
- stage;
- probability;
- lost reason;
- expansion signal.

## Operating rule

No qualified opportunity may live only in email/chat. Outreach count is not pipeline. CRM must be the durable commercial execution layer once configured.

---

# M. Distribution Graph

## Product-generated distribution

- **Care → Grid:** staffing/capacity/service shortages create confirmed demand.
- **EDU → Grid:** participant opt-in converts evidence into opportunity discovery.
- **Grid → Network:** successful fulfillment becomes relationship continuity.
- **Network → Enterprise:** multi-org coordination creates governance need.
- **Public Zumi → Free Identity:** intent becomes structured entry.
- **Patient → Care:** next actions strengthen organization value.
- **Operating Analysis → Care:** paid diagnosis becomes implementation.

## External acquisition lanes

- founder-led sales;
- high-signal outbound;
- referrals;
- institutional procurement/RFP;
- professional/clinic communities;
- content/SEO → Zumi;
- partner channels where they add distribution rather than reseller dependence.

## Immediate distribution priority

1. 9 signal-rich accounts from current intent search: account research, not mass blast.
2. warm existing clinical relationships: operating-analysis conversation.
3. workforce/institutional opportunities: procurement lane.
4. public site/Zumi: convert qualified intent into Analysis or relevant free path.

---

# N. Venture-Scale Scorecard

These are **strategic judgment scores**, not empirical KPIs.

| Dimension | Current | Target | Evidence / biggest gap | Next action |
|---|---:|---:|---|---|
| Product value | 7 | 9 | deep workflow substrate; customer outcome proof limited | paid workflow proof |
| Market urgency | 8 | 9 | strong operational/workforce/revenue pain category | validate ICP-specific urgency |
| Distribution | 2 | 8 | CRM empty; no repeatable channel | activate CRM + signal-based sales |
| Activation | 3 | 8 | public surfaces exist; universal free account not released | finish free identity release gate |
| Retention | UNKNOWN | 8 | no verified cohort | first implemented customer cohort |
| Expansion | 5 | 9 | architecture strong, observed expansion absent | Analysis → Sprint → Care proof |
| Gross margin | UNKNOWN | 8 | customer-level costs not measured | unit-cost ledger |
| Network effects | 3 | 9 | primitives exist, no proven dense cell | one Grid cell with repeat fulfillment |
| Defensibility | 6 | 9 | workflow/evidence/relationship direction strong | accumulate real evidence/relationships |
| Enterprise readiness | 5 | 9 | governance building; references/integrations limited | reusable procurement/security proof |
| Regulatory resilience | 7 | 9 | architecture fails closed; external approvals remain | counsel/BAA/PHI gates by rail |
| Execution velocity | 8 | 9 | rapid technical progress | reduce branch sprawl; prioritize revenue proof |
| Reliability | 7 | 9 | local main verification strong; hosted Actions unavailable | restore mandatory CI + protect main |
| Capital efficiency | 7 hypothesis | 9 | lean build, but cash/runway source not included here | cash/burn forecast from accounting truth |

**Weakest scored variable: Distribution. Attack it first.**

---

# O. Top 25 Business Bottlenecks

Priority order reflects current evidence.

1. **No real CRM pipeline** — 0 deals.
2. **No observed live Stripe payments** — offers exist but payment proof does not.
3. **No recurring subscription evidence** — recurring Care economics remain unvalidated.
4. **No repeatable founder-led sales operating cadence tied to CRM.**
5. **No proven first-value customer outcome/case study.**
6. **Free identity is not production-released**, limiting low-friction network acquisition.
7. **No dense Grid liquidity cell** with repeat supply/demand fulfillment.
8. **Marketplace payout rail is not production-connected**, appropriately blocking transaction claims.
9. **Grid fee-bearing policies lack counsel-clearance evidence**, appropriately fail-closed.
10. **No measured customer contribution margin.**
11. **No measured CAC by channel.**
12. **No CAC payback evidence.**
13. **No retention/NRR/GRR cohort evidence.**
14. **No measured Zumi cost per value event.**
15. **No verified implementation-hours model** by clinic/workflow.
16. **Pricing is substantially above low-cost EHR anchors**, requiring stronger value proof.
17. **Public category comprehension has previously failed an evaluator**, so messaging remains revenue-critical.
18. **Branch/PR sprawl risks diffusing engineering attention** away from revenue-critical tranches.
19. **Main is unprotected** and hosted Actions remain unreliable/unavailable.
20. **External integrations remain mostly unverified**, constraining enterprise/clinical proof.
21. **PHI-production readiness is separate and unresolved by product polish.**
22. **No reusable customer reference engine/case study evidence.**
23. **No production-grade sales attribution graph from source → payment → activation.**
24. **No verified buyer-level stack-savings dataset** from real prospects.
25. **Cash/runway/committed-expense operating truth was not connected into this package**, so capital strategy cannot yet be optimized from authoritative books.

---

# P. Top 25 Highest-Leverage Growth Experiments

Every experiment must record hypothesis, cohort, action, metric, cost, result and decision. Do not run all simultaneously.

## P0 — execute first

1. **Signal-account Analysis campaign:** target the 9 current intent-matched accounts with a personalized operational observation and $500 Analysis CTA. Metric: qualified conversations → paid analyses.
2. **Warm-clinic conversion:** offer Operating Analysis to existing trusted clinic relationships. Metric: paid analysis rate and time to payment.
3. **Analysis-to-Sprint ladder:** standardize deliverable so every Analysis ends with either no-fit or a specific $1,500/$3,500 next engagement. Metric: expansion conversion.
4. **CRM pipeline activation:** create real Klinikos pipeline/stages and ensure every qualified conversation has owner/next action. Metric: zero orphan qualified opportunities.
5. **48-hour deliverable test:** make the $500 Analysis fast, useful and bounded. Metric: labor hours, buyer satisfaction, next-step conversion.
6. **Workflow Sprint before/after ledger:** for first sprint, capture BEFORE → ACTION → AFTER → EVIDENCE. Metric: credible reusable value proof.
7. **No-Fault physician Golden Case sales demo:** use synthetic, truthful Current Visit/longitudinal proof to test specialty buyer interest. Metric: meeting-to-next-step rate.

## P1 — distribution + product conversion

8. **Public Zumi → Analysis routing:** only when clinic operational pain is expressed. Metric: qualified next-action conversion.
9. **Stack-savings interview:** collect real current software/workaround spend from 10 qualified clinics. Metric: validated alternative-cost model.
10. **Price objection decomposition:** classify every lost/no-decision as price, proof, trust, timing, feature, authority, implementation, or fit. Metric: dominant lost reason.
11. **Core vs Growth packaging interview:** test outcome language, not “would you pay.” Metric: buyer preference tied to real need.
12. **Free identity controlled cohort:** after release gate, invite 25 professionals/resource owners. Metric: first value, not signup.
13. **Grid space cell pilot:** one NYC submarket, reviewed supply only. Metric: active demand coverage/time-to-match.
14. **Grid nonclinical service cell:** test clinics needing admin/IT/ops services. Metric: eligible match → fulfillment.
15. **Care-generated Grid demand prototype:** when clinic identifies a shortage, prepare a demand object for user confirmation. Metric: duplicate-entry reduction + fulfilled requests.
16. **EDU → opt-in Grid discovery pilot:** only reviewed/released evidence. Metric: participants reaching qualified opportunities.

## P2 — retention/margin/enterprise

17. **Zumi value-event meter:** classify work-reduced events and estimated provider cost. Metric: cost per successful value event.
18. **Implementation-hour benchmark:** track hours by workflow/location. Metric: declining hours per implementation.
19. **Customer health v0:** after first customers, use product value events + unresolved setup + support burden. Metric: renewal-risk detection.
20. **Monthly customer economic report:** work completed/value evidence, clearly separating realized from estimated. Metric: renewal/expansion discussion quality.
21. **Multi-product retention test:** Care vs Care+Zumi/Grid/Network once cohorts exist. Metric: retention difference; no claim before data.
22. **Institutional EDU reusable package:** turn each RFP requirement into configuration/evidence asset. Metric: proposal assembly time + win rate.
23. **Enterprise invitation multiplier:** measure legitimate new network participants created per enterprise org. Metric: activated participants, not invites.
24. **One real external rail experiment:** choose the highest customer-value integration and take it Sandbox → UAT → controlled production → verified production. Metric: operational value, not “connected” badge.
25. **Founder attention audit:** weekly classify time into product, sales, delivery, admin, financing. Metric: more time on current primary constraint until it changes.

---

# 30 / 60 / 90-day operating sequence

## Next 30 days — prove paid demand

- activate HubSpot pipeline discipline;
- work the 9 current signal-rich accounts and warm clinic relationships;
- close first/next paid Analysis/Audit/Sprint;
- measure service delivery labor and conversion;
- preserve engineering focus on production reliability + doctor Golden Case + free identity release gate;
- do not build Connect/payout yet;
- do not create new pricing tiers without buyer evidence.

### Graduation evidence

- real qualified pipeline exists;
- at least one paid service event has provider payment evidence;
- every qualified account has next action/lost reason;
- service delivery hours are measured.

## Days 31–60 — prove implementation value

- convert service diagnosis into bounded implementation;
- capture before/action/after evidence;
- validate clinic subscription willingness only after value is visible;
- release controlled free identity when security/abuse gates pass;
- seed one tightly bounded Grid cell with real supply/demand.

### Graduation evidence

- paid implementation or equivalent customer-funded delivery;
- first-value proof;
- controlled free users reaching actual value events;
- first Grid cell has measurable active supply/demand.

## Days 61–90 — prove repeatability

- establish implementation template and time-to-first-value baseline;
- activate recurring Care only where product and entitlement truth are ready;
- measure early retention/usage rather than projecting it;
- pursue repeated Grid fulfillment before transaction monetization;
- continue institutional EDU procurement.

### Graduation evidence

- repeat customer acquisition motion;
- first recurring subscription evidence or explicit reason not to activate yet;
- repeatable implementation economics;
- repeat Grid fulfillment or a documented reason the selected cell failed.

---

# Capital and founder-attention rule

Until recurring/customer evidence changes the constraint, scarce cash and founder time should not be spent on broad paid acquisition, nationwide Grid supply, or marketplace financial infrastructure. Spend first on:

1. production reliability/security;
2. direct revenue-generating sales/delivery;
3. proof of customer value;
4. free identity distribution readiness;
5. one dense network cell;
6. only then scalable paid growth and marketplace settlement.

Customer-funded implementation is strategically valuable because it can produce cash, workflow research, product proof and future recurring revenue simultaneously.

---

# Pre-mortem

If Klinikos fails over the next 12 months, the most plausible causes are:

1. technical scope continues expanding faster than customer proof;
2. founder attention is consumed by building while pipeline stays empty;
3. pricing remains high relative to EHR anchors without proof of broader economic value;
4. Grid launches too broadly and appears empty;
5. free signup launches before abuse/authority boundaries are safe;
6. marketplace economics are activated before legal/category review;
7. external adapter readiness is mistaken for production integration;
8. enterprise promises outrun implementation/security/reference evidence;
9. service engagements are underpriced because founder labor is treated as free;
10. branches and concurrent work create reliability/governance failures.

Mitigation is the operating sequence in this document: **paid proof first, repeatability second, scale third.**

---

# Decision log

## 2026-08-24 — Primary growth constraint

**Decision:** Distribution/commercial execution is the current primary constraint.

**Evidence:** HubSpot has zero deals; live Stripe has saleable products but no observed PaymentIntents/subscriptions; product/technical substrate is materially further along than customer/revenue evidence.

**Consequence:** prioritize signal-based founder sales, service conversion, CRM discipline and customer proof before adding more monetization mechanisms.

## 2026-08-24 — First cash engine

**Decision:** use the current $500 → $1,500 → $3,500 service ladder as the immediate legitimate cash path, with implementation as the highest-leverage expansion.

**Consequence:** do not wait for full Clinic OS subscription or Grid payout rails to pursue revenue.

## 2026-08-24 — Grid economic sequencing

**Decision:** liquidity and lawful fulfillment precede fee activation and Connect/payout engineering.

**Consequence:** one dense cell must prove repeated value before marketplace take-rate optimization.

## 2026-08-24 — Market-size discipline

**Decision:** the 19,419 prospect-database matches are a discovery universe, not TAM.

**Consequence:** TAM/SAM/SOM requires deduplication, buyer definition, spend/value basis and adoption assumptions before publication.

---

# Source references

Internal authority:

- `docs/SOURCE_OF_TRUTH.md`
- `docs/FEATURE_STATUS.md`
- `docs/KLINIKOS_COMMERCIAL_CANON.md`
- `src/lib/commercial/klinikos-commercial.ts`
- `src/lib/commercial/grid-economics.ts`
- `docs/CUSTOMER_FUNDED_ACCESS_MODEL.md`
- current GitHub `main`

Connected operating evidence captured 2026-08-24:

- Stripe `KLINIKOS.IO` product/price/payment-link/PaymentIntent/subscription state;
- HubSpot current portal/deal/company/contact state;
- connected B2B prospecting NYC-metro discovery and intent-filter results.

External current reference points:

- Practice Fusion pricing: `https://www.practicefusion.com/pricing/`
- CharmHealth pricing: `https://www.charmhealth.com/ehr/ehr-pricing-us.html`
- athenaOne pricing model: `https://www.athenahealth.com/solutions/athenaone`
- New York Education Law §6509-a: `https://www.nysenate.gov/legislation/laws/EDN/6509-A`
- New York Education Law §6530: `https://www.nysenate.gov/legislation/laws/EDN/6530`
- HHS OIG fraud/abuse / Anti-Kickback overview: `https://oig.hhs.gov/compliance/physician-education/fraud-abuse-laws/`

---

# Final operating law

**Klinikos should earn more because users accomplish more.**

The next proof is not another feature count. It is:

`REAL BUYER → REAL PROBLEM → REAL PAYMENT → REAL WORKFLOW IMPROVEMENT → EVIDENCE → REPEAT / EXPANSION`

Then the network layer can compound that value:

`MORE ORGANIZATIONS → MORE NEEDS → MORE ELIGIBLE SUPPLY → MORE FULFILLMENT → MORE RELATIONSHIPS → MORE EVIDENCE → BETTER OPERATIONS → MORE ORGANIZATIONS`

Every strategic review should re-fetch current truth, identify the weakest venture-scale variable, and attack that variable until the evidence changes.