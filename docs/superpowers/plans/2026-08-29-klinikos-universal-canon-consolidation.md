# Klinikos Universal Canon Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the widest accepted Klinikos healthcare-universe, product, company-building, partnership, economic, operating, security, distribution, capital, and scaling architecture into `docs/KLINIKOS_MASTER_CANON.md` as the sole supreme authority, while safely retiring duplicate governing documents and producing one canonical graph that engineering and business systems can implement.

**Architecture:** Use the approved universal healthcare-universe/company-constitution design as the target. First inventory every governing-looking document and current implementation/evidence source; then merge unique accepted decisions upward into the Master Canon; then reclassify remaining documents into implementation contracts, evidence registers, specialist references, or historical/retired artifacts. Build typed registries and tests beneath the Canon rather than creating parallel narrative authorities.

**Tech Stack:** Git/GitHub, Markdown/YAML governance, TypeScript strict mode, Next.js App Router, Prisma/PostgreSQL, existing Klinikos route/domain registries, OpenAI Responses provider abstraction, repository tests and CI.

**Spec:** `docs/superpowers/specs/2026-08-29-klinikos-universal-healthcare-universe-company-constitution-design.md`

## Global Constraints

- `docs/KLINIKOS_MASTER_CANON.md` is the only supreme company/product authority after consolidation.
- Current verified implementation/evidence remains authoritative for what exists now.
- Preserve all accepted Luxe reconciliation detail; wider scope supersedes narrower framing, not the recovered decisions.
- Do not mass-delete documents before extracting and verifying unique content.
- Every non-code document must end classified as `IMPLEMENTATION_CONTRACT`, `EVIDENCE_REGISTER`, `SPECIALIST_REFERENCE`, or `HISTORICAL_RETIRED` unless it is the Master Canon.
- Preserve one Person identity with many relationships/contexts.
- Preserve `CLAIM != VERIFIED FACT != AUTHORITY`.
- Preserve `MATCH != AGREEMENT != FULFILLMENT != PAYMENT != SETTLEMENT`.
- Preserve Grid as both a major application and universal governed exchange substrate; do not reduce Klinikos to Grid.
- Preserve EDU, Current Visit, Clinic OS, Financial OS, Quality/Expert, med-spa commerce/resource, patient/care, enterprise, Network, Zumi/OpenAI, integrations, and company operating architecture.
- Preserve plain-language user surfaces and technical backend precision.
- OpenAI partnership/intelligence claims are evidence-classified; AI never becomes deterministic domain authority.
- Do not claim production readiness, traction, revenue, contracts, partner benefits, or compliance without evidence.
- Do not big-bang rewrite working code or create duplicate kernels.

---

## Program decomposition

This program is intentionally wider than one ordinary feature. Execute in independent reviewable tranches. Each tranche must leave the repository more coherent even if later tranches pause.

### Task 1: Establish the consolidation branch authority baseline

**Files:**
- Bring forward: `docs/KLINIKOS_MASTER_CANON.md` from the authoritative Canon branch.
- Bring forward: `docs/KLINIKOS_AUTHORITY_MAP.yaml` if present.
- Preserve: both 2026-08-29 approved specs.

**Interfaces:**
- Consumes: authoritative Master Canon branch and current main implementation.
- Produces: one branch containing current implementation baseline plus supreme Canon artifacts and approved consolidation designs.

- [ ] Compare `origin/main`, the authoritative Canon branch, and the reconciliation branch for Canon-only differences.
- [ ] Bring forward only the authoritative Canon/authority-map artifacts; do not overwrite unrelated implementation.
- [ ] Verify the Canon's sole-authority header and existing stable decisions.
- [ ] Commit the authority baseline independently.

### Task 2: Inventory every governing-looking repository document

**Files:**
- Create: `docs/governance/KLINIKOS_DOCUMENT_AUTHORITY_INVENTORY.md`
- Read: `CLAUDE.md`, `docs/**`, `governance/**`, root `*.md`, relevant `src/lib/*canon*`, `src/lib/*registry*`.

**Interfaces:**
- Produces one row per potentially authoritative document with path, declared status, actual purpose, overlap, unique content, proposed class, and disposition.

- [ ] Enumerate all Markdown/YAML/text governance/product/business/architecture documents.
- [ ] Flag names/status language containing `MASTER`, `CANON`, `GOVERNING`, `FINAL`, `BLUEPRINT`, `OPERATING SYSTEM`, `SOURCE OF TRUTH`, `CONSTITUTION`, `STRATEGY`, `PLAN`.
- [ ] Record cross-references and which files currently instruct agents to read them.
- [ ] Classify each as `MASTER_CANON`, `IMPLEMENTATION_CONTRACT`, `EVIDENCE_REGISTER`, `SPECIALIST_REFERENCE`, or `HISTORICAL_RETIRED_CANDIDATE`.
- [ ] Commit the inventory before editing source documents.

### Task 3: Inventory Luxe/project/file provenance

**Files:**
- Create: `docs/governance/KLINIKOS_PROVENANCE_RECONCILIATION_LEDGER.md`

**Interfaces:**
- Consumes: accepted Luxe/project history, uploaded files available to the work session, existing reconciliation spec, repo docs.
- Produces: source→decision→Canon coverage→implementation consequence mapping.

- [ ] Preserve at minimum student/resume/placement, professional profile, RN→injector, provider network, med-spa commerce/resource, Nadja clinic, Current Visit, telemedicine, Melissa/Quality Expert, Grid, EDU, Financial OS, OpenAI partnership, sales/pricing/capital/company operating laws.
- [ ] Add any additional accepted lifecycle/business architecture discovered during the full sweep.
- [ ] Mark each recovered decision `COVERED`, `PARTIAL`, `MISSING`, `CONFLICT`, `RETIRED`, or `EVIDENCE_ONLY`.
- [ ] Require exact destination Canon section or subordinate implementation/evidence register.
- [ ] Commit the ledger.

### Task 4: Build the Canon migration matrix for duplicate governing docs

**Files:**
- Create: `docs/governance/KLINIKOS_CANON_MIGRATION_MATRIX.md`

**Interfaces:**
- Consumes Tasks 2–3.
- Produces migration rows for every duplicate governing document.

Required columns:

`SOURCE PATH | OLD STATUS | UNIQUE DECISIONS | MASTER CANON DESTINATION | SUBORDINATE FILES RETAINED | REFERENCES TO UPDATE | FINAL CLASS | SAFE TO RETIRE? | VERIFICATION`.

- [ ] Populate all current final/master/governing docs.
- [ ] No source may be marked safe-to-retire while unique accepted content has no destination.
- [ ] Commit matrix.

### Task 5: Expand the Master Canon — authority, language, truth, value laws

**Files:**
- Modify: `docs/KLINIKOS_MASTER_CANON.md`
- Modify: `docs/KLINIKOS_AUTHORITY_MAP.yaml`

- [ ] Add sole company+product authority law.
- [ ] Add four subordinate document classes.
- [ ] Add anti-compression law.
- [ ] Add `Simple above. Powerful below.` user-language law.
- [ ] Add truth classes `ACTUAL / CONTRACTED / PIPELINE / ASSUMPTION / SCENARIO / TARGET`.
- [ ] Add Value Graph `USER VALUE → BEHAVIOR → EVIDENCE → ECONOMIC VALUE → RETENTION → NETWORK EFFECT → DEFENSIBILITY → ENTERPRISE VALUE`.
- [ ] Add current-vs-future status dimensions and expansion statuses.
- [ ] Update authority map so no other narrative document can outrank Canon.
- [ ] Run governance/doc tests.
- [ ] Commit.

### Task 6: Expand the Master Canon — complete Healthcare Universe Plane

**Files:**
- Modify: `docs/KLINIKOS_MASTER_CANON.md`

- [ ] Add full people taxonomy.
- [ ] Add care-delivery organizations and specialties.
- [ ] Add diagnostic/therapeutic/fulfillment rails.
- [ ] Add payer/financial/admin actors.
- [ ] Add education/workforce ecosystem.
- [ ] Add supply/commerce/facility ecosystem.
- [ ] Add quality/research/governance ecosystem.
- [ ] Add technology/strategic partners.
- [ ] Require every sector to carry `NOW/NEXT/LATER/PARTNER/CONNECT/INTERNALIZE/NEVER_BUILD` strategy state.
- [ ] Commit.

### Task 7: Expand the Master Canon — Economic/Resource Plane and Grid

**Files:**
- Modify Canon.
- Modify: `docs/ROUTE_REGISTRY.md`.
- Modify/create typed ecosystem registry under `src/lib/paths/`.

- [ ] Encode all approved resource/economic classes from the spec.
- [ ] Preserve Grid as application + exchange substrate.
- [ ] Encode universal need/resource lifecycle and class-specific variations.
- [ ] Encode patient privacy and regulated commerce/referral fee exclusions.
- [ ] Encode rooms/chairs/equipment/products/supplies/education/placement/preceptor/expert/org capacity/work/service classes.
- [ ] Add tests preventing Grid from collapsing to staffing-only.
- [ ] Commit.

### Task 8: Expand the Master Canon — complete Lifecycle Plane

**Files:**
- Modify Canon.
- Modify `docs/ROUTE_REGISTRY.md`.
- Modify `src/lib/paths/catalog.ts` and ecosystem registry.

- [ ] Encode universal lifecycle grammar.
- [ ] Encode person evolution graph.
- [ ] Encode student/resume/career/placement/work loop.
- [ ] Encode RN→injector/advanced-professional loop.
- [ ] Encode patient/care loop.
- [ ] Encode clinic acquisition→implementation→value→expansion loop.
- [ ] Encode med-spa multi-sided commerce/resource loop.
- [ ] Encode quality/expert loop.
- [ ] Encode organization/employer/owner/educator transitions.
- [ ] Encode failure/blocked/expired/suspended/canceled/disputed states.
- [ ] Add route tests.
- [ ] Commit.

### Task 9: Expand the Master Canon — Klinikos Operating Infrastructure Plane

**Files:**
- Modify Canon.
- Modify/create typed application/topology registry.

- [ ] Encode Living Home, Grid, EDU, Care, Current Visit, Clinic OS, Financial OS/RCM, Network, Insights, Zumi, Identity/Trust, Configuration/Enterprise, Memory/Knowledge, Integration Hub.
- [ ] Encode shared substrate ownership and no-duplicate-authority laws.
- [ ] Encode Experience Engine composition.
- [ ] Encode cross-application edges and source-of-truth ownership.
- [ ] Add tests that one app cannot silently create duplicate identity/ledger/credential/resource truth.
- [ ] Commit.

### Task 10: Encode cross-organizational healthcare workflows

**Files:**
- Modify Canon and route/ecosystem registries.

- [ ] Clinic→lab→result→review→patient follow-up.
- [ ] Clinic→imaging→result→review.
- [ ] Clinic→pharmacy/eRx→medication fulfillment/status where connected.
- [ ] Clinic→specialist referral→consult→return.
- [ ] Encounter→claim→clearinghouse→payer→adjudication→remittance→patient responsibility→payment.
- [ ] School→student→site→preceptor→hours→school completion.
- [ ] Org→Grid→professional→assignment→work→payable/payout.
- [ ] Quality→Expert Grid→remediation→evidence.
- [ ] Commerce/resource→buyer/provider→fulfillment→Financial OS.
- [ ] Add purpose/relationship/minimum-necessary gates.
- [ ] Commit.

### Task 11: Preserve complete clinical/Current Visit/Nadja depth architecture

**Files:**
- Modify Canon and relevant clinical specialist references/tests.

- [ ] Encode Schedule→Intake→Staff Handoff→Current Visit→Assessment/Plan→Orders/Results→Documentation/Coding→Follow-up→Close→Billing Readiness.
- [ ] Encode `INITIAL → PREVIOUS → TODAY` longitudinal change.
- [ ] Encode telemedicine as encounter mode.
- [ ] Encode AI scribe draft→human review→signature boundaries.
- [ ] Encode No-Fault/Workers' Comp case requirements as governed specialty composition.
- [ ] Encode labs/imaging/referrals/results/financial handoffs.
- [ ] Preserve first-clinic acceptance as a depth proof without making one clinic the entire product definition.
- [ ] Commit.

### Task 12: Preserve complete EDU/student/placement/professional architecture

**Files:**
- Modify Canon, route registry, profile projection contracts, schema only if gaps proven.

- [ ] Resume/career artifact model.
- [ ] Learner profile distinct from professional profile.
- [ ] School/program verification.
- [ ] Simulation/assessment/evidence/human determination.
- [ ] Placement multi-party state machine.
- [ ] Preceptor/site/program approvals.
- [ ] Hours/evidence/completion.
- [ ] Grid transition and job alerts.
- [ ] Alumni/continuing-education loop.
- [ ] Classmate/instructor/career-center distribution loops.
- [ ] Commit.

### Task 13: Preserve complete professional/injector/independent-practice architecture

**Files:**
- Modify Canon, routes, profile contracts; reuse current provider schema.

- [ ] License/certification/malpractice/credential evidence.
- [ ] Service list and opportunity-specific eligibility.
- [ ] Availability/on-call/travel radius/mobile/clinic/chair/room/home contexts where lawful.
- [ ] Contractor agreement and organization relationship.
- [ ] Supervision/facility/scope checks.
- [ ] Booking/request/accept-decline/assignment.
- [ ] Safety/adverse-event/documentation obligations.
- [ ] Fulfillment/reputation/payable/payout.
- [ ] Professional→independent practice→owner→employer/preceptor/educator transitions.
- [ ] Commit.

### Task 14: Preserve complete med-spa commerce/resource architecture

**Files:**
- Modify Canon, Grid/commerce registries, Clinic OS inventory integration contracts.

- [ ] Services/packages/memberships.
- [ ] Approved product commerce.
- [ ] Restricted clinical inventory separation.
- [ ] Inventory/lot/expiration truth.
- [ ] Rooms/chairs/space/equipment capacity.
- [ ] Buyer/seller/employer/provider/site roles on same organization.
- [ ] Leads→consult→booking→service→follow-up→rebook.
- [ ] Provider/location/product/platform financial consequences as policy-gated classes.
- [ ] EDU/preceptor/site and Quality/Expert intersections.
- [ ] Commit.

### Task 15: Preserve Quality Guardian + Expert Grid architecture

**Files:**
- Modify Canon and quality/expert specialist contracts.

- [ ] Rules/evidence signal.
- [ ] Zumi explanation/prioritization.
- [ ] Internal resolution attempt.
- [ ] Expert-needed decision.
- [ ] Verified expert demand/match.
- [ ] Scoped engagement/agreement.
- [ ] Minimum-necessary access.
- [ ] Human expert finding.
- [ ] Authorized remediation.
- [ ] Evidence/outcome/reputation/assurance loop.
- [ ] Commit.

### Task 16: OpenAI + Partner/External Capability architecture

**Files:**
- Modify Canon.
- Create/modify evidence register for partner truth.
- Preserve existing Zumi provider abstraction.

- [ ] Encode partner state machine.
- [ ] Record OpenAI accepted/onboarding evidence only to the level actually supported.
- [ ] Encode OpenAI as primary intelligence platform where current Canon/evidence supports it.
- [ ] Preserve deterministic Klinikos authority and human approval boundaries.
- [ ] Preserve PHI/BAA/configuration gate.
- [ ] Preserve provider abstraction.
- [ ] Generalize partner register for Stripe, labs, imaging, pharmacy/eRx, clearinghouse, credentialing, cloud, communications, schools/workforce, enterprise identity and channel partners.
- [ ] Add tests that partner status cannot manufacture authority/compliance/production readiness.
- [ ] Commit.

### Task 17: Financial OS, RCM, commerce and company money truth

**Files:**
- Modify Canon and financial/commercial registries/tests.

- [ ] Preserve charge/invoice/claim/payment evidence/obligation/payable/payout/settlement/refund/reconciliation distinctions.
- [ ] Preserve clinical economics vs Klinikos platform revenue distinction.
- [ ] Encode customer subscription/implementation/EDU/usage/enterprise/network/approved transaction economics as governed families.
- [ ] Preserve payment lifecycle and entitlement authority.
- [ ] Encode revenue-integrity lifecycle.
- [ ] Encode payer/clearinghouse/remittance/patient-responsibility handoffs.
- [ ] Preserve legal-gated fee classes.
- [ ] Commit.

### Task 18: Merge the complete Unicorn Company Operating Constitution into Canon

**Files:**
- Modify Canon.
- Reclassify company operating documents after migration verification.

- [ ] Executive council roles/functions.
- [ ] Scarce-resource optimization.
- [ ] First-principles validation gate.
- [ ] Market intelligence and segment ranking.
- [ ] ICP/audience intelligence.
- [ ] Competitive intelligence.
- [ ] Business model/pricing.
- [ ] Sales funnel.
- [ ] Launch system.
- [ ] Onboarding/activation.
- [ ] Retention/churn/win-back.
- [ ] Brand/content/content factory/social/video/media.
- [ ] Distribution/attribution/referral loops.
- [ ] Automation/simplification.
- [ ] Capital readiness.
- [ ] Credit/bankability.
- [ ] Investor readiness.
- [ ] Financial model.
- [ ] Capital allocation.
- [ ] 90-day execution.
- [ ] Priority algorithm.
- [ ] Product↔company feedback loop.
- [ ] Security/privacy/compliance gate.
- [ ] Defensibility.
- [ ] Scale/unicorn tests.
- [ ] Executive dashboard.
- [ ] Required executive response interface.
- [ ] Final operating loop.
- [ ] Commit.

### Task 19: Build machine-readable company operating contracts beneath Canon

**Files:**
- Inspect/modify existing `src/lib/company-operating-canon.ts` and related registries instead of creating duplicates.
- Add focused registries only where existing code cannot express the Canon.

- [ ] Map Canon truth classes, initiative gate, sales stages, operating loop, priority scoring, partner states, expansion states, evidence statuses, and dashboard metric classes into typed contracts.
- [ ] Add tests proving machine contracts match Canon identifiers.
- [ ] Commit.

### Task 20: Build one canonical ecosystem graph and generated-view registry

**Files:**
- Create/modify typed ecosystem graph under `src/lib/paths/` or the existing most appropriate architecture registry.
- Add tests.

- [ ] Encode node classes, edge classes, authority ownership, app ownership, resource classes, lifecycle states, money states, evidence states, partner/integration states, and business-value edges.
- [ ] Generate/define at least the 21 required views from the approved spec.
- [ ] Ensure views reference graph IDs rather than restating independent architecture.
- [ ] Add completeness tests for student, injector, patient, clinic, med-spa, expert, RCM, OpenAI, capital and network paths.
- [ ] Commit.

### Task 21: Plain-language projection layer

**Files:**
- Create/modify frontend terminology map and experience projection helpers.
- Add tests.

- [ ] Encode internal→user terminology mappings.
- [ ] Require task-oriented labels for common actions.
- [ ] Preserve precise terminology where legally/clinically necessary.
- [ ] Add regression tests preventing internal architecture terms from leaking into ordinary user flows.
- [ ] Commit.

### Task 22: Security and cross-context invariant suite

**Files:**
- Add focused tests adjacent to identity/Grid/EDU/clinical/financial/Zumi domains.

Required invariants include:

- [ ] resume claim never equals verified credential;
- [ ] EDU completion never equals licensure;
- [ ] payment never equals authority;
- [ ] subscription never equals professional eligibility;
- [ ] patient never becomes public Grid supply;
- [ ] unverified professional cannot publicly offer governed professional services;
- [ ] placement match does not equal school/site approval;
- [ ] AI cannot sign/submit/settle consequential actions without authority path;
- [ ] partner relationship cannot bypass PHI/security/compliance gates;
- [ ] tenant/context switching does not leak data;
- [ ] cross-org workflows enforce relationship/purpose/minimum necessary;
- [ ] regulated inventory does not become ordinary public commerce;
- [ ] financial states remain distinct;
- [ ] commit.

### Task 23: Retire duplicate governing documents safely

**Files:**
- Update/retire files identified in migration matrix.
- Update `CLAUDE.md` and repository guidance.

- [ ] For each candidate, verify every unique decision has a Canon destination.
- [ ] Preserve specialist implementation/evidence detail where still useful.
- [ ] Replace governing headers with explicit subordinate/historical status where file remains.
- [ ] Move/delete only files proven redundant and safe.
- [ ] Update every inbound reference.
- [ ] Ensure no surviving file claims parallel supreme/final/master authority.
- [ ] Commit in small batches grouped by domain.

### Task 24: Google Drive and external-document hygiene

**Files/Systems:**
- Google Drive only where accessible artifacts exist.

- [ ] Search for Klinikos master/canon/final blueprint/business-plan duplicates.
- [ ] If none are found, record `NO_MATCHING_CANONICAL_DUPLICATE_FOUND` rather than inventing one.
- [ ] If duplicates are found, classify as distribution copy/data-room/investor material/evidence/historical; do not create a second source of truth.
- [ ] If a human-readable Drive copy is desired later, mark it `MIRROR — NON-AUTHORITATIVE; GitHub Master Canon controls` and include Canon commit/version.

### Task 25: Full repository verification

**Files:**
- No new architecture unless verification exposes a defect.

- [ ] Run targeted governance/route/domain tests after each tranche.
- [ ] Run TypeScript/typecheck.
- [ ] Run lint.
- [ ] Run unit/integration tests.
- [ ] Run build.
- [ ] Run relevant E2E tests.
- [ ] Search repo for competing authority phrases.
- [ ] Search repo for stale references to retired masters/canons.
- [ ] Verify the Master Canon contains every acceptance criterion from the universal spec.
- [ ] Verify current-vs-future claims remain truthful.
- [ ] Commit verification repairs separately.

### Task 26: Final Canon release / PR

**Files:**
- Master Canon, authority map, inventories, migration matrix, typed registries, tests, subordinate docs.

- [ ] Produce a PR summary organized by `AUTHORITY / PRODUCT UNIVERSE / ROUTES / COMPANY OS / PARTNERS / MONEY / SECURITY / DUPLICATE CLEANUP / TESTS / REMAINING EXTERNAL GATES`.
- [ ] Keep PR draft until verification passes and duplicate-retirement review is complete.
- [ ] Require explicit review that no accepted Luxe lifecycle disappeared.
- [ ] Require explicit review that no unsupported live/partner/revenue/compliance claim was introduced.
- [ ] Merge only after required checks/review.

---

## Completion definition

The program is complete only when an engineer, operator, salesperson, marketer, CFO, investor-prep worker, security reviewer, or AI agent can start from `docs/KLINIKOS_MASTER_CANON.md`, understand the governing Klinikos company/product universe, follow subordinate implementation/evidence links, and never need to guess which of several competing 'final' documents is authoritative.

The Master Canon must be broad enough to represent the ultimate healthcare operating network while the implementation plan remains dependency-ordered, evidence-based, secure, capital-efficient, and commercially focused.
