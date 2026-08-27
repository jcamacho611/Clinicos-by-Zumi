# KLINIKOS UNIFIED MASTER CANON CONVERGENCE DESIGN

Date: 2026-08-27
Status: APPROVED ARCHITECTURAL CONVERGENCE DESIGN
Repository baseline: `main@045a66d03404ed472c2f7dbf1c644be4446db33b`
Repository: `jcamacho611/Clinicos-by-Zumi`

## 1. Purpose

Klinikos has graduated through many product, architecture, design, clinical, Grid, EDU, financial, identity, security, commercial, and Zumi iterations. Those iterations are evidence of product maturation. They are not parallel current products.

The repository currently still exposes multiple documents as independently authoritative. That creates a predictable retrieval failure: an agent can select a historically valid snapshot or narrower specialist canon and answer as though it defines current Klinikos. This design removes that ambiguity.

The convergence target is one current product authority:

`docs/KLINIKOS_MASTER_CANON.md`

Everything else must be classified as one of:

1. verified implementation evidence,
2. subordinate specialist elaboration,
3. operational status evidence,
4. provenance/evidence,
5. historical/superseded material.

There is one current Klinikos.

## 2. Core doctrine

Past discovery + past decisions + physician feedback + engineering discovery + Grid evolution + EDU evolution + clinical convergence + financial architecture + identity/authority + Zumi/memory + commercial strategy + current repository truth = one current Klinikos.

Past work is not discarded. It is merged forward.

The repository must distinguish two questions without creating two competing architectures:

- **What Klinikos is:** `docs/KLINIKOS_MASTER_CANON.md`.
- **What exists today:** current code, schema, migrations, tests, exact-head verification, deployment/runtime evidence, and implementation-state records derived from that evidence.

History may explain why. History never overrides current canon or verified implementation.

## 3. Required authority model

### 3.1 Product authority

`docs/KLINIKOS_MASTER_CANON.md` is the sole active product/architecture/business/experience governing document.

It owns:

- product definition,
- user experience order,
- identity and authority model,
- role and organization paths,
- Grid,
- EDU,
- Clinic OS,
- Current Visit,
- intake and consent,
- scheduling and capacity,
- orders and results,
- financial OS and RCM,
- integrations,
- Zumi and memory,
- security and confidentiality,
- configuration,
- Black Label design law,
- commercial strategy,
- wiring law,
- implementation-state reporting format,
- convergence and execution order.

### 3.2 Implementation authority

Current implementation truth is determined only by current code/schema/migrations/tests/exact-head verification/runtime evidence.

A canon decision does not manufacture implementation.

A stale implementation-status file does not outrank current code.

### 3.3 Specialist documents

Specialist documents may remain because a single master file should not become the only place engineers can find every low-level protocol, schema, security note, or integration detail.

Specialist documents are subordinate elaborations. They may:

- expand a master-canon section,
- record protocol detail,
- capture operational runbooks,
- document integration specifics,
- document test or compliance evidence.

They may not:

- redefine Klinikos,
- create a second product lifecycle,
- create a second front-door experience,
- override a master decision,
- silently promote roadmap work to implemented truth.

### 3.4 Evidence and history

Historical architecture and old prompts retain provenance value but no current authority.

Superseded material must carry a visible warning or be classified by the machine-readable authority map as non-authoritative.

## 4. Canonical human experience

The literal interactive order is not the abstract value lifecycle.

The canonical front-door sequence is:

`PROTECTED ACCESS / NDA / TERMS / CONFIDENTIALITY AIRLOCK`
→ `ENTER KLINIKOS`
→ `LIVING HOME: WHAT NEEDS TO HAPPEN?`
→ `ZUMI CONVERSATION`
→ `INTENT / I AM / I NEED / I HAVE / I WANT TO DO`
→ `SAFE VALUE PREVIEW`
→ `ACCOUNT VALUE TRIGGER`
→ `ONE UNIVERSAL KLINIKOS IDENTITY`
→ `PRESERVE ORIGINAL CONVERSATION + INTENT`
→ `CLAIMS`
→ `PATH-AWARE VERIFICATION`
→ `AUTHORITY`
→ `ACTIVE EXPERIENCE ENVELOPE`
→ `ROLE / RELATIONSHIP / OBJECT-SPECIFIC KLINIKOS EXPERIENCE`
→ `GRID / EDU / CARE / CLINIC OS / FINANCIAL / NETWORK CAPABILITIES AS NEEDED`
→ `REAL ACTION`
→ `FULFILLMENT / OUTCOME / EVIDENCE`
→ `MEMORY + NEXT ACTION`
→ `RETURN / EXPANSION / NETWORK EFFECT`.

Important legal caveat: the product must implement the strongest technically defensible clickwrap/e-sign evidence architecture, but production legal language and enforceability remain counsel-reviewed. The master canon may define the product requirement without claiming that an unreviewed clause is legally guaranteed.

## 5. The protected access airlock

The first protected interactive experience is a legal/trust airlock, not a footer link and not passive browsewrap.

The airlock must support:

- exact document key,
- exact version,
- exact content/hash,
- explicit affirmative assent,
- required acknowledgments,
- typed/electronic signature where required,
- timestamp,
- acceptance event/evidence,
- session or anonymous acceptance binding,
- later binding to the authenticated universal identity,
- append-only evidence,
- progressive agreement layering,
- fail-closed behavior for protected experiences when the required current agreement is not accepted.

Public discovery/SEO and patient-specific access may have different legal routing where the governing legal design requires it. This does not permit a second current product journey. It is an exception within the one journey, governed by purpose and audience.

## 6. Universal identity, claims, verification, and authority

The product must keep these concepts separate:

`PERSON ≠ ACCOUNT ≠ CLAIM ≠ VERIFIED FACT ≠ RELATIONSHIP ≠ ROLE ≠ PROFESSION ≠ CREDENTIAL ≠ PRIVILEGE ≠ AUTHORITY`.

One person may simultaneously be patient, student, professional, employee, contractor, educator, clinic owner, organization representative, Grid participant, or other supported relationships.

A user statement such as "I am an RN" is conversational context until verified by an authoritative process where verification is required.

Authority is contextual and time-bound. It may depend on:

- identity,
- organization,
- location,
- relationship,
- role,
- profession,
- license,
- credential,
- privilege,
- assignment,
- service,
- purpose of use,
- patient/case/resource scope,
- consent,
- supervision/delegation,
- effective date,
- current policy.

## 7. Experience Envelope

The Active Experience Envelope is the server-resolved description of what Klinikos becomes for the person right now.

It should resolve minimum necessary state such as:

- identity and account state,
- active relationship/organization/location,
- active role/profession,
- verified claims needed for the current action,
- permissions and prohibitions,
- current intent,
- relevant object/case/patient/resource,
- current obligations,
- current route/path,
- allowed next actions,
- blockers,
- safe context from prior interaction.

The browser receives only the minimum necessary projection.

## 8. Role and lifecycle paths

The master canon must define full first-class paths, not feature inventories.

### Patient

`DEMAND → ACCESS → IDENTITY → REGISTRATION → INTAKE → CONSENT → COVERAGE / CASE → SCHEDULING → CURRENT VISIT → ORDERS → RESULTS → FOLLOW-UP → BILLING → OUTCOME → FUTURE CARE`

### Professional

`IDENTITY → EDU → COMPETENCY → CREDENTIAL → AUTHORITY → GRID ELIGIBILITY → OPPORTUNITY → WORK → EXPERIENCE → REPUTATION → INDEPENDENT PRACTICE → CLINIC → NETWORK → EDUCATOR / EMPLOYER`

### Clinic

`ORGANIZATION → PEOPLE → LOCATIONS → CAPACITY → PATIENT ACCESS → OPERATIONS → CARE → WORKFLOW → FINANCIAL TRUTH → REVENUE → GRID → NETWORK → MULTI-LOCATION → ENTERPRISE`

### Revenue

`CARE → DOCUMENTATION → EVIDENCE → CODING → CHARGE → BILLING READINESS → CLAIM → EXTERNAL RAIL → ACCEPTANCE → ADJUDICATION → REMITTANCE → PAYMENT → RECONCILIATION → REVENUE INTEGRITY`

### Grid

`NEED / HAVE → RESOURCE OR DEMAND → REQUIREMENTS → ELIGIBILITY → MATCH → OFFER → AGREEMENT → RESERVATION → FINANCIAL OBLIGATION → FULFILLMENT → EVIDENCE → REPUTATION → REPEAT`

### EDU

`DISCOVERY → ENROLLMENT → SESSION / MODULE → APPLIED LEARNING → EVIDENCE → ASSESSMENT → HUMAN REVIEW → COMPLETION → NON-LICENSURE CREDENTIAL / RECORD → CAREER READINESS → OPTIONAL GRID DISCOVERY → WORKFORCE OUTCOME`.

## 9. First-party product ownership versus external rails

Klinikos should own the user experience, workflow state, normalization, reconciliation, evidence, and financial/operational truth where that is core to the product.

Klinikos should integrate regulated or network rails rather than pretending to recreate them.

Examples:

- eligibility via 270/271,
- claims via 837,
- claim status via 276/277,
- remittance via 835,
- payer/clearinghouse connectivity,
- laboratory/radiology networks,
- pharmacy/e-prescribing networks,
- payment processors and settlement rails,
- authoritative credential/license sources.

External connectivity state must be explicit. Internal readiness never equals external production verification.

## 10. Intake and consent

Intake/Consent is first-party Klinikos scope.

Klinikos owns:

- questionnaire/form engine,
- conditional logic,
- completion/readiness state,
- patient links/portal completion,
- document and ID upload,
- e-signature capture,
- consent versioning,
- timestamp/provenance,
- staff/provider review queues,
- reminders,
- workflow triggers,
- audit trail,
- organization/location/specialty/service/case configuration.

Organizations control their approved clinical/legal content within the platform's governed configuration model.

Consent is a permission/version engine, not merely a PDF signature.

## 11. Billing and Revenue Cycle Management

Billing is first-party Klinikos scope.

Klinikos owns:

- billing readiness,
- diagnosis/procedure coding support,
- superbills,
- receipts,
- patient invoices/balances,
- CMS-1500 support,
- eligibility workflow when connected,
- claim preparation,
- claim submission orchestration,
- status/rejections/denials workflow,
- payment posting,
- remittance/reconciliation,
- No-Fault and Workers' Compensation case operations,
- documentation completeness,
- performed-versus-charged reconciliation,
- revenue leakage and integrity signals.

The master decision is not "billing module." The master decision is end-to-end clinical-to-financial truth.

## 12. Zumi and Memory

Zumi is Klinikos Intelligence and orchestration, not authority.

Zumi may:

- understand ordinary language,
- preserve safe conversational intent,
- retrieve permitted context,
- explain,
- summarize,
- prepare actions,
- coordinate governed routes,
- surface next work,
- research safe public information.

Zumi may not independently establish:

- authentication,
- tenant access,
- clinical authority,
- credential validity,
- Grid eligibility,
- payment truth,
- settlement,
- legal acceptance,
- patient consent,
- regulated clinical judgment.

Memory must preserve provenance, authority, verification state, effective time, supersession, tenant boundary, and subject/purpose. Memory is context, not a substitute for live regulated truth.

## 13. Security and confidentiality

The permanent boundary is:

`BROWSER INTENT / INPUT → AUTHENTICATED SERVER CAPABILITY → SERVER POLICY / PROPRIETARY ENGINE → MINIMUM-NECESSARY DTO → BROWSER`.

Server-confidential by default:

- credentials/secrets,
- Zumi hidden prompts/orchestration,
- Grid ranking/matching/anti-gaming internals,
- trust/risk/fraud heuristics,
- pricing/margin logic,
- unreleased roadmap/business strategy,
- privileged security/infrastructure detail,
- unnecessary PHI/PII.

No automated outbound process may send confidential decks, labs, PHI, proprietary architecture, or sensitive attachments without the required disclosure classification, recipient validation, and human/approved policy gate.

## 14. Black Label design law

The product should feel premium, calm, editorial, cinematic, and trustworthy rather than generic healthcare SaaS.

The design system is one family with context-specific modes:

- Obsidian/dark shell,
- Marble/warm-light work surfaces where clarity requires it,
- warm ivory/bone/pearl text/surfaces,
- black cherry/oxblood structural depth,
- restrained dusty rose/coral/ember accents,
- high-contrast accessible controls,
- generous negative space,
- state-driven motion only when it clarifies work.

Current Visit should feel quiet and surgical.
Grid should feel spatial and opportunity-oriented.
Billing should feel structured and financially precise.
EDU should feel editorial and instructional.
Patient should feel warm and hospitality-oriented.
All remain visibly Klinikos.

## 15. Wiring law

A feature is wired only when the full consequential chain works:

`VISIBLE SURFACE → USER INTENT/ACTION → IDENTITY/ACTIVE CONTEXT → CLAIM/REQUIREMENT RESOLUTION → AUTHORIZATION/ELIGIBILITY → ENGINE(S) → AUTHORITATIVE DATA/WORKFLOW → PERSISTENCE/EVENT → EXTERNAL ADAPTER IF REQUIRED → RECONCILIATION → TRUTHFUL RESULT → AUDIT/FINANCIAL CONSEQUENCE → NEXT USEFUL ACTION`.

A route, button, page, or generated answer is not proof of wiring.

## 16. Implementation-state record

Every major capability should carry one current record:

- Canonical State,
- Current Implementation,
- Verified Against,
- Already Working,
- Remaining Gap,
- Dependencies,
- External Gate,
- Next Convergence,
- Evidence Links.

Allowed implementation labels:

- VERIFIED LIVE,
- BUILT,
- PARTIALLY BUILT,
- MANUAL FALLBACK,
- ADAPTER READY,
- PENDING CONNECTION,
- BLOCKED,
- NOT BUILT,
- NOT BUILT BY DESIGN.

Status claims must be refreshed from current evidence. A status file audited ten days earlier is evidence, not immutable truth.

## 17. Commercial doctrine

The product should land with usefulness before displacement.

Founder-led early customer strategy:

`TARGET CLINIC → EXECUTIVE CONVERSATION → IDENTIFY EXPENSIVE WORKFLOW → PAID ASSESSMENT/PILOT → MEASURE IMPROVEMENT → FOUNDING DEPLOYMENT → RECURRING PLATFORM → CASE STUDY/REFERRAL → TARGETED EXPANSION`.

Early adoption should prioritize reachable independent/multi-location practices with measurable scheduling, follow-up, staffing, paperwork, referral, billing-readiness, or revenue-leakage pain.

Avoid exposing crown-jewel implementation detail during sales. Sell outcomes and validated product capability.

Pricing figures remain proposal/status truth unless explicitly approved and current in the master canon or current commercial configuration.

## 18. Repository convergence changes

This design requires:

1. create `docs/KLINIKOS_MASTER_CANON.md`,
2. create `docs/KLINIKOS_AUTHORITY_MAP.yaml`,
3. change `docs/SOURCE_OF_TRUTH.md` into a compatibility pointer to the master canon,
4. change `docs/KLINIKOS_ARCHITECTURE_INDEX.md` into navigation that begins with the master canon and current implementation evidence,
5. mark `docs/CLINICOS_MASTER_CANON.md` superseded,
6. change `docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md` into a subordinate/compatibility pointer,
7. mark `docs/KLINIKOS_ECOSYSTEM_CANON.md` subordinate,
8. mark `docs/KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md` subordinate evidence/translation, never current product authority,
9. update `AGENTS.md` and `CLAUDE.md` so all agents read the master canon first,
10. preserve specialist documents as subordinate elaboration unless individually superseded,
11. make new discoveries merge forward into the master canon instead of spawning another supreme canon.

## 19. New discovery merge protocol

`NEW INFORMATION → CLASSIFY → VERIFY → COMPARE TO CURRENT CANON → ACCEPT / REJECT / MODIFY → UPDATE MASTER CANON → UPDATE IMPLEMENTATION CONSEQUENCES → OLD VERSION BECOMES PROVENANCE`.

No important product discovery should terminate only in chat.

## 20. Success criteria

The convergence succeeds when:

- an agent cannot reasonably interpret the old `CLINICOS_MASTER_CANON.md` signup-first sequence as current,
- an agent cannot reasonably interpret the abstract value lifecycle as the literal screen order,
- the protected access airlock is recorded as the first protected interactive event,
- all role pathways and cross-engine wiring are represented in one current canon,
- specialist docs cannot override the master,
- status claims are explicitly evidence-derived,
- history remains available but non-authoritative,
- future product changes have one merge-forward destination.
