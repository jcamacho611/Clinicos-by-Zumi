# Klinikos Luxe Canon + Full-Stack Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile accepted Klinikos product architecture from the Luxe project, current repository, authoritative Master Canon branch, and implementation evidence into one canonical product/route/full-stack model that preserves the complete student, professional, injector, clinic, med-spa commerce, quality/expert, Grid, EDU, financial, OpenAI/Zumi, identity, security, distribution, and enterprise ecosystem without exposing backend jargon to ordinary users.

**Architecture:** Preserve the existing Master Canon as the sole product authority, preserve current implementation as current-state truth, and converge accepted missing lifecycle detail upward into the Canon. Encode detailed journeys in a subordinate route/ecosystem registry and extend existing shared backend kernels rather than creating parallel applications, identities, ledgers, marketplaces, or AI stacks. OpenAI is Zumi's primary production intelligence platform under the verified partnership direction, while provider abstraction and deterministic Klinikos authority remain mandatory.

**Tech Stack:** Next.js App Router, TypeScript strict mode, Prisma/PostgreSQL, existing Klinikos identity/organization/trust/Grid/EDU/clinical/financial/Zumi services, OpenAI Responses API adapter, provider abstraction, Vitest/Jest-style repository tests, Playwright where existing route E2E coverage applies.

**Spec:** `docs/superpowers/specs/2026-08-29-luxe-to-master-canon-reconciliation-design.md`

## Global Constraints

- `docs/KLINIKOS_MASTER_CANON.md` remains the sole active product, architecture, business, experience, and design authority.
- Current verified code/schema/tests/deployment evidence determine what exists today.
- Do not create another competing Master/Supreme/Source-of-Truth document.
- Preserve `CLAIM != VERIFIED FACT != AUTHORITY`.
- Preserve `MATCH != OFFER != ACCEPTANCE != RESERVATION != FULFILLMENT != PAYMENT != SETTLEMENT`.
- Preserve one persistent Person identity with multiple evolving relationships and contexts.
- Preserve server-side authority; browser receives minimum-necessary presentation state.
- Preserve Grid as one flagship application and the universal governed need/resource/capacity/opportunity exchange substrate; do not reduce Klinikos to Grid.
- Preserve EDU as learning/simulation/evidence/human-review/workforce infrastructure; education never manufactures licensure.
- Preserve Current Visit as provider-facing clinical convergence and telemedicine as a visit mode inside the encounter.
- Preserve provider abstraction around Zumi; OpenAI is primary production intelligence platform, not domain authority.
- Do not send PHI to OpenAI merely because a partnership exists. PHI-capable OpenAI use requires exact verified account/configuration/contract/BAA/deployment evidence and current policy approval.
- Do not claim OpenAI tier, credits, co-sell rights, leads, certifications, specializations, customer referrals, FDE access, enterprise pricing, or other benefits without evidence.
- Ordinary user-facing copy must use plain task language; backend architecture terminology stays internal unless precise terminology is actually useful to the user.
- Do not big-bang rewrite working systems. Reuse, adapt, harden, generalize, and extend.
- Historical numeric pricing and provider tiers remain provenance unless current approved commercial authority separately activates them.
- Patient/customer identity remains private and never becomes public marketplace supply.
- Regulated products/services/referrals/payment economics remain policy/legal-gated by resource/transaction class.
- No new production-ready claim is allowed from code existence alone.

---

# File Structure / Target Ownership

## Canon / governance

- Modify/bring forward: `docs/KLINIKOS_MASTER_CANON.md` — sole product authority.
- Modify: `docs/KLINIKOS_AUTHORITY_MAP.yaml` — machine-readable routing/index companion.
- Create: `docs/governance/KLINIKOS_LUXE_RECONCILIATION_LEDGER.md` — provenance-to-canon decision ledger; never a competing authority.
- Modify: `docs/ROUTE_REGISTRY.md` — human-readable route laws and full lifecycle catalog.
- Create: `docs/partners/OPENAI_PARTNER_NETWORK_TRUTH_AND_EXECUTION.md` — evidence-classified OpenAI partnership operating register.

## Machine-readable product topology

- Modify: `src/lib/paths/catalog.ts` — runtime route definitions and plain-language route steps.
- Create: `src/lib/paths/ecosystem-registry.ts` — application/resource/profile/route topology referenced by UI/tests; subordinate to Canon.
- Create: `src/lib/paths/profile-projections.ts` — private person, learner, Grid professional, organization, patient profile projection contracts.
- Create: `src/lib/paths/plain-language.ts` — approved frontend terminology map for internal concepts.

## Data / persistence

- Modify only after schema audit: `prisma/schema.prisma`.
- Create migration only for fields/models proven missing after reuse review.
- Likely additive models/relations if absent: career/resume artifact, learner profile/placement requirement, placement assignment, preceptor relationship, Grid commerce product listing/stock projection, expert engagement, partner evidence register.
- Reuse existing `Provider`, `ProviderCredential`, `ProviderAvailability`, `GridServiceListing`, `GridRequest`, `GridPayout`, `Location`, `InventoryItem`, `Organization`, EDU, clinical and financial models wherever they already express the requirement.

## Zumi / OpenAI

- Preserve/modify: `src/features/zumi/adapters/openai-responses.ts`.
- Inspect/modify existing provider abstraction under `src/features/zumi/providers*` and Zumi orchestration/policy layers rather than bypassing them.
- Add partner-status evidence to governance/config only; never branch business logic on an unsupported marketing claim.

## Tests

- Modify/create route catalog tests adjacent to existing path tests.
- Add canon/authority-map consistency tests where the repository already enforces documentation authority.
- Add projection/security tests for profile visibility.
- Add route invariant tests for student placement, injector readiness, med-spa commerce, expert engagement, clinic/EHR, money truth, and OpenAI authority boundaries.

---

### Task 1: Converge the authoritative Master Canon onto the reconciliation branch

**Files:**
- Bring forward: `docs/KLINIKOS_MASTER_CANON.md` from `docs/unified-master-canon-20260827`.
- Bring forward/modify if present there: `docs/KLINIKOS_AUTHORITY_MAP.yaml`.
- Read: `docs/superpowers/specs/2026-08-29-luxe-to-master-canon-reconciliation-design.md`.

**Interfaces:**
- Consumes: authoritative Canon version `2026-08-27.2` and current `main` implementation evidence.
- Produces: one branch containing the actual Master Canon plus the approved reconciliation spec.

- [ ] **Step 1: Compare the Canon branch against current `main`**

Run:

```bash
git fetch origin
git diff --stat origin/main...origin/docs/unified-master-canon-20260827 -- docs/KLINIKOS_MASTER_CANON.md docs/KLINIKOS_AUTHORITY_MAP.yaml
```

Expected: identify Canon-only files/diffs without treating unrelated branch changes as current implementation.

- [ ] **Step 2: Bring only the authoritative Canon artifacts forward**

Run:

```bash
git checkout origin/docs/unified-master-canon-20260827 -- docs/KLINIKOS_MASTER_CANON.md
if git cat-file -e origin/docs/unified-master-canon-20260827:docs/KLINIKOS_AUTHORITY_MAP.yaml 2>/dev/null; then
  git checkout origin/docs/unified-master-canon-20260827 -- docs/KLINIKOS_AUTHORITY_MAP.yaml
fi
```

Expected: reconciliation branch now contains the authoritative Canon without overwriting unrelated current implementation.

- [ ] **Step 3: Assert the authority header is intact**

Run:

```bash
grep -n "SOLE PRODUCT / ARCHITECTURE / BUSINESS / EXPERIENCE AUTHORITY" docs/KLINIKOS_MASTER_CANON.md
grep -n "KLINIKOS-OPENAI-001" docs/KLINIKOS_MASTER_CANON.md
```

Expected: both assertions present.

- [ ] **Step 4: Commit the authority convergence**

```bash
git add docs/KLINIKOS_MASTER_CANON.md docs/KLINIKOS_AUTHORITY_MAP.yaml 2>/dev/null || true
git commit -m "governance: converge authoritative Master Canon for Luxe reconciliation"
```

---

### Task 2: Build the Luxe-to-Canon reconciliation ledger

**Files:**
- Create: `docs/governance/KLINIKOS_LUXE_RECONCILIATION_LEDGER.md`
- Read: current Master Canon, `docs/ROUTE_REGISTRY.md`, `src/lib/paths/catalog.ts`, current Prisma schema, relevant EDU/Grid/clinical/Zumi specs.

**Interfaces:**
- Consumes: accepted Luxe provenance and current repo evidence.
- Produces: explicit classification of every recovered material decision as `COVERED`, `PARTIAL`, `MISSING`, `CONFLICT`, or `RETIRED`, with target Canon section and implementation consequence.

- [ ] **Step 1: Create the ledger schema with required columns**

Use this exact header:

```markdown
# Klinikos Luxe Reconciliation Ledger

Status: PROVENANCE / RECONCILIATION EVIDENCE — NOT A COMPETING AUTHORITY

| ID | Domain | Recovered decision | Evidence/provenance | Current Canon coverage | Current implementation evidence | Classification | Resolution | Target Canon section | Runtime consequence | Test consequence |
|---|---|---|---|---|---|---|---|---|---|---|
```

- [ ] **Step 2: Populate at minimum these recovered domains**

Create rows for:

```text
ENTRY-001 protected entry airlock
IDENTITY-001 one person / evolving contexts
LANGUAGE-001 simple-above technical-below user language
PROFILE-001 private person vs Grid professional vs learner vs organization vs patient projections
RESUME-001 resume as structured career artifact and unverified claim source
STUDENT-001 student verification
STUDENT-002 student career profile
PLACEMENT-001 multi-party clinical placement composition
PLACEMENT-002 site/preceptor/program approvals
EDU-001 simulation/evidence/human review
EDU-002 EDU -> Grid workforce progression
PRO-001 professional verification-for-X
INJECTOR-001 RN-to-injector EDU/readiness path
INJECTOR-002 provider availability/travel/location choices
INJECTOR-003 supervised opportunity -> evidence -> reputation -> higher-value opportunity
GRID-001 Grid as application + universal exchange substrate
GRID-002 resource classes include work/services/space/equipment/products/education/capacity/expert services
GRID-003 eligibility before ranking
COMMERCE-001 med-spa products/supplies commerce
COMMERCE-002 restricted clinical stock stays gated/internal unless lawful path exists
COMMERCE-003 rooms/chairs/equipment capacity commerce
CLINIC-001 Nadja independent-practice depth model
CLINIC-002 Current Visit continuous encounter
CLINIC-003 telemedicine as encounter mode
CLINIC-004 Clinic OS emits Grid demand/supply
QUALITY-001 Melissa-style quality/expert escalation path
QUALITY-002 minimum-necessary expert access
FIN-001 transaction/payment/payout/reconciliation separation
GROWTH-001 Grid/email/share/invite distribution loops
GROWTH-002 learner -> professional -> owner -> educator network lifecycle
OPENAI-001 OpenAI Partner Network accepted/onboarding evidence
OPENAI-002 OpenAI primary production intelligence platform
OPENAI-003 provider abstraction retained
OPENAI-004 AI never becomes authority
OPENAI-005 PHI gate independent of partnership
OPENAI-006 partner benefits/tier claims evidence-gated
```

- [ ] **Step 3: Verify each ledger row against current code/docs**

For every row, record exact file paths instead of generic phrases.

- [ ] **Step 4: Fail the review if an accepted route survives only as chat/provenance**

Add this rule to the ledger:

```markdown
A material accepted journey is not considered reconciled until either:
1. it is explicit in `docs/KLINIKOS_MASTER_CANON.md`; or
2. the Canon explicitly delegates its exact lifecycle detail to a referenced governed registry that is covered by tests.
```

- [ ] **Step 5: Commit**

```bash
git add docs/governance/KLINIKOS_LUXE_RECONCILIATION_LEDGER.md
git commit -m "governance: add Luxe-to-Canon reconciliation ledger"
```

---

### Task 3: Amend the Master Canon with anti-compression and plain-language laws

**Files:**
- Modify: `docs/KLINIKOS_MASTER_CANON.md`
- Modify: `docs/KLINIKOS_AUTHORITY_MAP.yaml`

**Interfaces:**
- Consumes: Task 2 ledger.
- Produces: permanent governing laws that prevent accepted lifecycle architecture from being compressed away.

- [ ] **Step 1: Add stable decisions**

Add these stable identifiers under the Canon stable decisions section:

```markdown
- `KLINIKOS-COMPRESSION-001`: Canon compression must not erase accepted lifecycle architecture; material routes must remain explicit in the Canon or a Canon-governed tested registry.
- `KLINIKOS-LANGUAGE-001`: ordinary user-facing experiences use plain task language; internal medical-technical, policy-engine, data-model, infrastructure, and authorization terminology remains underneath unless precision is useful to the user.
- `KLINIKOS-PROFILE-001`: one underlying identity may project distinct private-person, learner, Grid-professional, organization, and patient/customer profiles without creating duplicate identity authority.
- `KLINIKOS-RESUME-001`: a resume is a career artifact and claim source, not verification or authority.
- `KLINIKOS-PLACEMENT-001`: clinical placement is a governed multi-party relationship among learner, program, site, preceptor/supervisor, requirements, capacity, approvals, hours/evidence, and completion authority.
- `KLINIKOS-COMMERCE-001`: Grid commerce reuses universal Grid primitives for approved products, supplies, equipment, space and services; restricted clinical inventory remains separately governed.
- `KLINIKOS-EXPERT-001`: quality/audit/compliance/operations expert engagement is a governed Grid service path with scoped minimum-necessary access and human accountability.
- `KLINIKOS-OPENAI-PARTNER-001`: OpenAI partnership status and benefits are evidence-classified; partnership does not override security, PHI, authority, or procurement gates.
```

- [ ] **Step 2: Add the permanent anti-compression paragraph**

Insert exactly:

```markdown
> **Founder omission does not equal product omission, and Canon compression must not erase accepted lifecycle architecture. Every accepted participant journey that materially changes identity, authority, Grid composition, EDU, Clinic OS, Financial OS, distribution, experience composition, partner architecture, or network effects must be represented explicitly in this Master Canon or in a Canon-governed registry referenced by it.**
```

- [ ] **Step 3: Add the plain-language contract**

Add a section with examples:

```markdown
Backend: contextual professional authority -> User: "Prove you are allowed to do this work."
Backend: credential evidence ingestion -> User: "Upload your license."
Backend: eligibility evaluation -> User: "Can I apply for this?"
Backend: Demand -> User: "I need..."
Backend: Resource -> User: "I have..."
Backend: Active Experience Envelope -> User: "Here's what needs your attention."
Backend: financial obligation -> User: "Who is owed money, and for what?"
```

- [ ] **Step 4: Update authority map references**

Ensure the authority map explicitly routes detailed route/profile topology to `docs/ROUTE_REGISTRY.md`, `src/lib/paths/catalog.ts`, and `src/lib/paths/ecosystem-registry.ts` while stating they are subordinate to the Master Canon.

- [ ] **Step 5: Run documentation authority tests**

Run the repository's existing documentation/governance test suite discovered via `package.json`/test search. At minimum:

```bash
npm test -- --runInBand 2>/dev/null || npm run test
```

Expected: no authority/register test identifies the new files as unclassified.

- [ ] **Step 6: Commit**

```bash
git add docs/KLINIKOS_MASTER_CANON.md docs/KLINIKOS_AUTHORITY_MAP.yaml
git commit -m "governance: preserve complete lifecycle architecture and plain-language law"
```

---

### Task 4: Encode the complete ecosystem topology in a machine-readable registry

**Files:**
- Create: `src/lib/paths/ecosystem-registry.ts`
- Test: create/modify the existing paths catalog test file located by searching for `klinikosPathCatalog`.

**Interfaces:**
- Consumes: Canon stable decisions.
- Produces: typed definitions for applications, participant/context types, resource classes, route families, cross-application edges, verification gates, money classes, and status labels.

- [ ] **Step 1: Write the failing registry test**

The test must assert at minimum:

```ts
expect(applicationKeys).toEqual(expect.arrayContaining([
  "grid", "edu", "care", "current_visit", "clinic_os", "financial_os",
  "network", "insights", "identity_trust", "zumi", "integration_hub",
  "memory_knowledge", "enterprise_configuration"
]));

expect(resourceClasses).toEqual(expect.arrayContaining([
  "professional", "job", "shift", "service", "space", "room", "chair",
  "equipment", "permitted_product", "permitted_supply", "education_capacity",
  "clinical_placement", "preceptor", "organization_capacity", "expert_service"
]));

expect(routeFamilies).toEqual(expect.arrayContaining([
  "student_to_placement", "rn_to_injector", "professional_to_work",
  "professional_to_independent_practice", "provider_to_clinic_owner",
  "clinic_to_staffing", "clinic_to_capacity_commerce", "clinic_to_grid_commerce",
  "clinic_to_quality_expert", "patient_to_care", "enterprise_to_deployment"
]));
```

- [ ] **Step 2: Run the focused test and verify failure**

Expected: module/exports do not yet exist.

- [ ] **Step 3: Implement registry types**

Define explicit types:

```ts
export type KlinikosApplicationKey =
  | "grid" | "edu" | "care" | "current_visit" | "clinic_os"
  | "financial_os" | "network" | "insights" | "identity_trust"
  | "zumi" | "integration_hub" | "memory_knowledge"
  | "enterprise_configuration";

export type KlinikosResourceClass =
  | "professional" | "job" | "shift" | "service" | "space" | "room"
  | "chair" | "equipment" | "permitted_product" | "permitted_supply"
  | "education_capacity" | "clinical_placement" | "preceptor"
  | "organization_capacity" | "expert_service";

export type KlinikosImplementationState =
  | "live_verified" | "built_needs_verification" | "partly_built"
  | "designed" | "planned" | "external_connection_needed"
  | "legal_review_needed" | "not_built";
```

- [ ] **Step 4: Encode cross-application edges**

Include at minimum:

```text
EDU -> Grid: learner readiness / placement / work
Grid -> EDU: missing readiness / education opportunity
Clinic OS -> Grid: staffing need / idle space / equipment / vendor / expert need
Grid -> Clinic OS: accepted worker/resource/service relationship
Grid -> Care: patient/service discovery to appointment/intake
Care -> Financial OS: completed clinical work to billing/payment state
Grid -> Financial OS: order/reservation/assignment to obligation/payment/payout
Clinic OS -> Quality/Expert(Grid): unresolved quality/compliance/operations need
Quality/Expert(Grid) -> Clinic OS: human findings/remediation evidence
Grid Commerce -> Clinic OS inventory: accepted/fulfilled product/resource state where appropriate
```

- [ ] **Step 5: Run tests and commit**

```bash
npm run test -- ecosystem-registry

git add src/lib/paths/ecosystem-registry.ts <test-path>
git commit -m "feat: encode canonical Klinikos ecosystem topology"
```

---

### Task 5: Expand the runtime route catalog without losing plain-language UX

**Files:**
- Modify: `src/lib/paths/catalog.ts`
- Modify: `docs/ROUTE_REGISTRY.md`
- Test: existing route catalog tests.

**Interfaces:**
- Consumes: Task 4 registry.
- Produces: complete route definitions that can drive Experience Engine/UI without requiring users to understand internal architecture.

- [ ] **Step 1: Add failing tests for required routes**

Assert route IDs exist and retain plain-language labels:

```text
student-clinical-placement
become-grid-ready
find-extra-work
clinician-independent-practice
provider-to-clinic-owner
fill-staffing-need
clinic-monetize-capacity
clinic-operational-optimization
clinic-add-service
medspa-sell-product
medspa-buy-resource
medspa-provider-capacity
clinic-quality-expert-help
resume-to-career-profile
educator-preceptor-capacity
school-placement-network
patient-find-care
enterprise-network-deployment
```

- [ ] **Step 2: Preserve existing implemented routes and extend them**

Do not delete the current RN-to-injector, placement, independent-practice, clinic-owner, staffing, capacity and clinic-optimization definitions.

- [ ] **Step 3: Add resume-to-career-profile route**

Plain-language nodes:

```text
Upload your resume
Check what Klinikos found
Add what is missing
Show proof where needed
Choose what work you want
Set when/where you are available
See opportunities
```

- [ ] **Step 4: Expand student placement route**

Plain-language nodes:

```text
Tell us your school/program
Show what your program requires
Check what you have completed
Find approved placement capacity
Connect school + site + preceptor approvals
Track hours/evidence
Get the human completion decision
See the next step
```

- [ ] **Step 5: Expand RN-to-injector route**

Plain-language nodes:

```text
Choose your goal
Learn the fundamentals
Practice safely
Show what you can do
Get evaluator review
Check license/scope/supervision/location rules
Find eligible supervised opportunities
Complete work and build experience
Review readiness for higher-value/independent opportunities
```

- [ ] **Step 6: Add med-spa commerce/resource routes**

Product-selling route:

```text
Choose what you want to sell
Confirm the business may sell it
Add product details/stock/price
Publish
Receive order/request
Fulfill/deliver
Get paid/reconcile
```

Resource-buying route:

```text
Tell Klinikos what you need
Find verified/eligible options
Compare price/availability/terms
Agree/order/reserve
Receive the resource/service
Confirm completion
Pay/reconcile
```

- [ ] **Step 7: Add quality/expert route**

```text
Show the problem
Try the safe internal next step
Decide whether expert judgment is needed
Find the right verified expert
Approve scoped access
Expert reviews and responds
Apply remediation
Record evidence/outcome
```

- [ ] **Step 8: Update `docs/ROUTE_REGISTRY.md`**

Document the route law:

```text
route = product journey crossing engines
page = implementation detail
route never widens authority
user-facing labels remain task-based and plain-language
```

- [ ] **Step 9: Run tests and commit**

```bash
npm run test -- paths

git add src/lib/paths/catalog.ts docs/ROUTE_REGISTRY.md <test-path>
git commit -m "feat: preserve complete Klinikos lifecycle routes"
```

---

### Task 6: Add canonical profile projections and résumé truth boundaries

**Files:**
- Create: `src/lib/paths/profile-projections.ts`
- Create: `src/lib/paths/plain-language.ts`
- Modify only if missing persistence is proven: `prisma/schema.prisma`
- Test: profile-projection unit tests.

**Interfaces:**
- Consumes: Person/User/Provider/Organization/EDU/credential data.
- Produces: explicit DTO-safe projections for private person, learner, Grid professional, organization and patient/customer contexts.

- [ ] **Step 1: Write failing projection tests**

Required assertions:

```ts
expect(gridProfessionalProjection).not.toHaveProperty("malpracticePolicyNumber");
expect(gridProfessionalProjection).not.toHaveProperty("privateResumeBlob");
expect(learnerProjection).toHaveProperty("program");
expect(learnerProjection).toHaveProperty("expectedGraduation");
expect(learnerProjection).toHaveProperty("placementProgress");
expect(patientProjection.publicMarketplaceVisible).toBe(false);
expect(resumeClaim.verified).toBe(false);
```

- [ ] **Step 2: Implement projection contracts**

Types must distinguish:

```ts
PrivatePersonProfile
LearnerProfileProjection
GridProfessionalProfileProjection
OrganizationProfileProjection
PatientPrivateProfileProjection
ResumeCareerArtifact
ResumeClaimCandidate
```

- [ ] **Step 3: Add plain-language terminology map**

Export internal-to-user label helpers such as:

```ts
"verification_evidence" -> "Proof"
"professional_authority" -> "Allowed work"
"placement_requirement" -> "What your program requires"
"financial_obligation" -> "Money owed"
"reconciliation" -> "Check that the money matches"
"resource_demand" -> "What you need"
"resource_supply" -> "What you have"
```

- [ ] **Step 4: Audit Prisma before adding models**

Search for existing Person/account, education enrollment/profile, document/evidence, Provider, Grid, placement and resume-capable structures. Add schema only for missing canonical state; do not duplicate Provider fields already present.

- [ ] **Step 5: If no reusable career artifact exists, add an additive `CareerArtifact` model**

Minimum schema:

```prisma
model CareerArtifact {
  id             String   @id @default(cuid())
  personId       String
  artifactType   String   @default("resume")
  storageRef     String?
  extractedData  Json?
  claimState     String   @default("self_reported")
  visibility     String   @default("private")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([personId, artifactType])
  @@map("career_artifacts")
}
```

If the repository's universal Person model uses a different key/path, adapt the relation to that existing model rather than creating another Person.

- [ ] **Step 6: Run schema validation and tests**

```bash
npx prisma validate
npm run test -- profile
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/paths/profile-projections.ts src/lib/paths/plain-language.ts prisma/schema.prisma <migration-if-created> <tests>
git commit -m "feat: add governed career and profile projections"
```

---

### Task 7: Make student placement a first-class multi-party governed object

**Files:**
- Modify/reuse EDU/Grid/Network models/services discovered during implementation.
- Modify `prisma/schema.prisma` only for missing state.
- Modify `src/lib/paths/catalog.ts` only if route nodes require capability references.
- Add focused tests.

**Interfaces:**
- Consumes: learner, program, organization/site, preceptor, capacity, requirements, approvals, attendance/evidence.
- Produces: deterministic placement readiness and lifecycle state without treating a Grid match as an approved placement.

- [ ] **Step 1: Write lifecycle tests before persistence changes**

Required truth law:

```text
match != school approval != site approval != assignment != started != hours completed != program completion
```

Test transitions must reject skipping required approvals.

- [ ] **Step 2: Reuse existing EDU enrollment/evidence models**

Map existing Program/Cohort/Enrollment/CompetencyEvidence/CompletionDecision models before adding anything.

- [ ] **Step 3: Add missing placement state only if absent**

Required logical fields:

```text
learner/person
program/cohort
site organization/location
preceptor/provider
requiredHours
completedHours
requirement snapshot/evidence refs
schoolApprovalState
siteApprovalState
preceptorApprovalState
assignmentState
start/end window
completionDecision
```

- [ ] **Step 4: Build deterministic readiness resolver**

Create a focused service in the existing EDU/placement service directory that returns:

```ts
type PlacementReadiness = {
  eligibleToSearch: boolean;
  eligibleToAssign: boolean;
  blockers: Array<{ code: string; userMessage: string }>;
  satisfiedRequirements: string[];
};
```

User messages must be plain, e.g. `"Your school still needs to approve this site."` not `"institutional relationship authority unresolved"`.

- [ ] **Step 5: Connect Grid placement capacity to readiness**

Hard eligibility must run before ranking/displaying an option as eligible.

- [ ] **Step 6: Run focused placement tests and commit**

```bash
npm run test -- placement

git add prisma/schema.prisma <edu-placement-files> <tests>
git commit -m "feat: govern student placement as a multi-party lifecycle"
```

---

### Task 8: Complete the injector/professional marketplace path using existing provider schema

**Files:**
- Reuse: `prisma/schema.prisma` existing `Provider`, `ProviderCredential`, `ProviderAvailability`, Grid service/request/payout models.
- Modify existing provider readiness/eligibility services discovered by code search.
- Modify `src/lib/paths/catalog.ts` only for capability links/state labels.
- Add tests.

**Interfaces:**
- Consumes: provider identity, license/credential evidence, malpractice, scope/supervision/facility requirements, services, availability, travel/location preference, Grid opportunity requirements.
- Produces: activity-specific `VERIFIED FOR X` eligibility and plain-language blockers.

- [ ] **Step 1: Write failing eligibility tests**

Cases:

```text
resume says RN but no verified license -> not eligible
verified RN + expired malpractice where required -> blocked
verified RN + valid requirements + supervised eligible opportunity -> eligible
EDU competency completed but required professional verification absent -> blocked
at-home requested but opportunity/location policy forbids it -> blocked
travel radius excludes location -> not ranked eligible
credential expires after acceptance but before assignment -> re-evaluate and block consequential action
```

- [ ] **Step 2: Reuse existing provider fields**

Do not recreate fields already present for:

```text
malpractice
credentials
servicesOffered
experienceLevel
serviceLocations
mobileServiceAllowed
chairRentalAllowed
atHomeAllowed
travelRadiusMiles
onCallNow
verificationStatus
renewalDueAt
availability
Grid listings/requests/payouts
```

- [ ] **Step 3: Implement activity-specific readiness result**

Return:

```ts
type ProfessionalActivityReadiness = {
  status: "draft" | "needs_proof" | "under_review" | "eligible" | "expired" | "suspended";
  activityKey: string;
  blockers: Array<{ code: string; userMessage: string }>;
  expiresAt: Date | null;
};
```

- [ ] **Step 4: Connect EDU competency as evidence, never authority**

EDU evidence can satisfy a training/competency requirement but must not automatically set license/scope/supervision/facility eligibility.

- [ ] **Step 5: Run tests and commit**

```bash
npm run test -- provider
npm run test -- grid

git add <provider-readiness-files> <tests> src/lib/paths/catalog.ts
git commit -m "feat: complete governed injector and professional Grid readiness"
```

---

### Task 9: Generalize med-spa products, services, equipment and space onto Grid Commerce

**Files:**
- Reuse current Grid resource/listing models/services.
- Reuse: `InventoryItem`, `InventoryTransaction`, `Location`, `Provider`, Grid transaction/financial models in `prisma/schema.prisma`.
- Add resource-class policy module in the existing Grid domain if absent.
- Add tests.

**Interfaces:**
- Consumes: seller/org authority, product/resource class, inventory/availability, location, price/terms, legal/policy class.
- Produces: lawful publish/discover/order/reserve/fulfill/payment workflow using shared Grid primitives.

- [ ] **Step 1: Write resource-class tests**

Required cases:

```text
policy-approved retail product -> may publish after seller authority checks
restricted clinical medication/injectable -> not public commerce by default
room/chair -> may publish only when organization has authority/permitted use
provider service -> professional verification required
ordinary equipment -> owner/business authority required
clinical referral/patient-care economics -> do not apply universal marketplace percentage
```

- [ ] **Step 2: Define resource policy classes**

Use explicit values:

```ts
type GridResourcePolicyClass =
  | "ordinary_product"
  | "permitted_supply"
  | "restricted_clinical_inventory"
  | "equipment"
  | "space"
  | "professional_service"
  | "business_service"
  | "education"
  | "clinical_care"
  | "referral";
```

- [ ] **Step 3: Reuse inventory truth**

Clinic OS inventory remains authoritative for stock/lot/expiration where clinically relevant. Grid Commerce receives only the minimum sellable/listing projection.

- [ ] **Step 4: Implement separate lifecycle adapters instead of duplicate marketplaces**

Examples:

```text
product -> cart/order/delivery
space -> reservation/use
professional work -> offer/assignment/fulfillment
education -> enrollment/placement
```

All use shared Grid owner/requirements/eligibility/agreement/evidence/financial primitives.

- [ ] **Step 5: Run tests and commit**

```bash
npm run test -- grid
npm run test -- inventory

git add <grid-commerce-files> <tests>
git commit -m "feat: generalize med-spa commerce onto governed Grid resources"
```

---

### Task 10: Preserve the Nadja clinic/EHR/telemedicine path as the clinic depth standard

**Files:**
- Modify current Clinic OS / Current Visit route/configuration files discovered by search.
- Modify path registry/docs to reference the clinic depth route.
- Add/extend Current Visit tests.

**Interfaces:**
- Consumes: scheduled appointment, intake/consent, staff handoff, patient history/change, encounter, orders/results, documentation/coding, follow-up, billing readiness.
- Produces: one continuous provider workflow with telemedicine as an encounter modality.

- [ ] **Step 1: Write/extend the acceptance test for the complete visit sequence**

Required logical order:

```text
Scheduled
-> Intake
-> Staff handoff
-> Current Visit
-> What changed
-> Assessment & Plan
-> Orders / Results
-> Documentation / Coding
-> Follow-up
-> Close
```

- [ ] **Step 2: Assert telemedicine does not create a second chart**

Test that a remote visit references the same canonical Patient/Encounter/CurrentVisit domain and only changes visit modality/connection state.

- [ ] **Step 3: Assert AI assistance requires human authority**

AI-generated documentation/coding suggestions remain drafts until authorized human review/sign action.

- [ ] **Step 4: Connect Clinic OS demand/capacity to Grid**

At minimum ensure the architecture supports emitting governed demand/supply from:

```text
unfilled staffing need
unused room/chair/equipment capacity
vendor/expert need
placement/preceptor capacity
```

- [ ] **Step 5: Run clinical tests and commit**

```bash
npm run test -- current-visit
npm run test -- telemedicine

git add <clinic-files> <tests> docs/ROUTE_REGISTRY.md
git commit -m "feat: preserve clinic depth and telemedicine encounter convergence"
```

---

### Task 11: Implement the Melissa-style Quality / Expert Grid escalation route

**Files:**
- Reuse current quality/task/evidence systems.
- Reuse Grid services/resources for expert capacity.
- Add expert-engagement persistence only if current Agreement/Assignment/Fulfillment models cannot express it.
- Add tests.

**Interfaces:**
- Consumes: detected clinic problem, deterministic internal recommendation, human escalation decision, expert qualifications, scoped evidence access.
- Produces: expert engagement with minimum-necessary access, findings, remediation, evidence and outcome.

- [ ] **Step 1: Write escalation tests**

Required cases:

```text
routine deterministic issue -> internal workflow first
issue requiring expert judgment -> create expert Grid demand
expert not verified for requested specialty -> ineligible
expert accepted -> access limited to engagement scope
expert finding -> not automatically applied as authoritative clinic state
authorized clinic human accepts/remediates -> evidence/outcome recorded
engagement closed -> scoped access revoked
```

- [ ] **Step 2: Reuse Grid agreement/assignment/fulfillment states**

Do not create a separate consulting marketplace.

- [ ] **Step 3: Add expert-scope DTO**

```ts
type ExpertEngagementScope = {
  engagementId: string;
  problemClass: string;
  allowedEvidenceIds: string[];
  prohibitedDataClasses: string[];
  expiresAt: Date;
};
```

- [ ] **Step 4: Ensure human accountability**

Expert recommendations and Zumi summaries cannot silently change clinical/compliance/financial authoritative state.

- [ ] **Step 5: Run tests and commit**

```bash
npm run test -- quality
npm run test -- grid

git add <quality-expert-files> <tests>
git commit -m "feat: add governed quality and expert escalation path"
```

---

### Task 12: Make OpenAI partnership and Zumi production architecture explicit and evidence-gated

**Files:**
- Create: `docs/partners/OPENAI_PARTNER_NETWORK_TRUTH_AND_EXECUTION.md`
- Modify: `docs/KLINIKOS_MASTER_CANON.md`
- Preserve/modify if needed: `src/features/zumi/adapters/openai-responses.ts`
- Inspect/modify existing Zumi provider/policy/context orchestration files.
- Add tests.

**Interfaces:**
- Consumes: evidence that Klinikos was accepted into the OpenAI Partner Network / portal onboarding direction, current adapter/config state, PHI/security policy.
- Produces: one evidence-classified partnership register plus technical primary-provider behavior that does not weaken provider abstraction or authority boundaries.

- [ ] **Step 1: Create the partner truth register**

Use this structure:

```markdown
# OpenAI Partner Network Truth and Execution

Status: COMPANY / PARTNER EVIDENCE REGISTER — SUBORDINATE TO KLINIKOS MASTER CANON

## Verified
- Partner Network acceptance: [evidence reference]
- Portal/onboarding access: [evidence reference]
- PartnerU/training status: [evidence reference]

## Unknown / not yet evidenced
- current tier
- certifications
- specializations
- deal registration eligibility
- co-sell eligibility
- leads
- joint customers
- customer stories
- technical enablement benefits
- API credits
- events/MDF
- enterprise pricing
- special support/FDE access

## Technical law
OpenAI is Zumi's primary production intelligence platform. Klinikos remains authority. Provider abstraction remains mandatory.
```

Replace bracketed evidence references with actual repository/file references during implementation; do not leave placeholders in the committed document.

- [ ] **Step 2: Add partnership truth states as data, not marketing assumptions**

Define:

```ts
type PartnerEvidenceState = "verified" | "reported_needs_evidence" | "unknown" | "expired";
```

If a generic partner registry already exists, use it; otherwise keep this initially as governance evidence rather than adding a new runtime subsystem.

- [ ] **Step 3: Preserve OpenAI adapter and provider abstraction**

Confirm existing `createOpenAIResponsesAdapter()` remains behind the common `ProviderAdapter` interface.

- [ ] **Step 4: Add/verify primary-provider selection tests**

Required behavior:

```text
OpenAI configured + policy allows -> selected default production provider
OpenAI unavailable/fails + approved fallback configured -> deterministic approved fallback path
OpenAI BAA flag absent -> PHI-classified request rejected before provider call
partnership=true but PHI gate false -> rejected
AI proposes consequential action -> backend authorization/human-confirmation policy still required
```

- [ ] **Step 5: Preserve cost accounting**

Tests must cover configured token/tool cost requirements already enforced by the adapter so OpenAI partnership does not disable unit economics controls.

- [ ] **Step 6: Commit**

```bash
git add docs/partners/OPENAI_PARTNER_NETWORK_TRUTH_AND_EXECUTION.md docs/KLINIKOS_MASTER_CANON.md src/features/zumi <tests>
git commit -m "governance: integrate OpenAI partnership into governed Zumi architecture"
```

---

### Task 13: Connect every route to Financial OS without collapsing economic truth

**Files:**
- Reuse current Financial OS / Grid financial services.
- Modify resource transaction policy/economics modules as needed.
- Add tests.

**Interfaces:**
- Consumes: offer/quote/order/reservation/assignment/fulfillment/payment events from Grid, clinic, commerce, EDU and expert services.
- Produces: financial obligations, payment evidence, payable/payout/settlement/reconciliation with resource-class-specific fee rules.

- [ ] **Step 1: Write state-separation tests**

Assert:

```text
order_created != fulfilled
booking != service_completed
payment_intent != payment
payment != payout
payout != reconciliation
claim_submitted != claim_accepted
obligation != settlement
```

- [ ] **Step 2: Route resource classes through explicit economic policy**

At minimum classify:

```text
ordinary product
space/equipment
business service
education
professional staffing/time
clinical patient care
referral
```

- [ ] **Step 3: Assert no universal marketplace percentage**

Clinical care/referral paths must default to no ordinary marketplace take-rate unless current counsel-approved policy explicitly authorizes a lawful model.

- [ ] **Step 4: Preserve user-facing transparency**

Before a fee-bearing Grid transaction, customer/professional/org views must be able to show the relevant plain-language price/fee/earnings/total state without exposing backend ledger terminology.

- [ ] **Step 5: Run financial tests and commit**

```bash
npm run test -- financial
npm run test -- grid

git add <financial-policy-files> <tests>
git commit -m "feat: connect ecosystem routes to truthful Financial OS states"
```

---

### Task 14: Wire acquisition, email, alerts and return loops to real network activity

**Files:**
- Reuse communication kernel/email services.
- Modify route/event notification mapping.
- Add tests.

**Interfaces:**
- Consumes: opportunity/listing/search/placement/booking/resource/education events.
- Produces: consent-aware transactional/opportunity/relationship/lifecycle/educational/reactivation/product-marketing communication.

- [ ] **Step 1: Write communication-classification tests**

Examples:

```text
accepted booking receipt -> transactional
new matching shift -> opportunity
school placement invitation -> relationship/opportunity
course reminder -> educational/lifecycle
inactive user campaign -> reactivation/marketing
new product announcement -> product marketing
```

- [ ] **Step 2: Connect saved-search / eligibility events to alerts**

Do not send users opportunities they are deterministically ineligible for merely to improve engagement.

- [ ] **Step 3: Preserve preferences/unsubscribe boundaries**

Transactional/legal notices remain distinct from optional marketing preferences.

- [ ] **Step 4: Add referral/share attribution**

Preserve public-safe object/referral/invitation IDs through protected entry and authentication without putting PHI/secrets in URLs.

- [ ] **Step 5: Run communication tests and commit**

```bash
npm run test -- communication
npm run test -- notifications

git add <communication-files> <tests>
git commit -m "feat: drive growth loops from real Klinikos network activity"
```

---

### Task 15: Add cross-ecosystem security, expiration, dispute and context-switch regression tests

**Files:**
- Add tests to identity/authorization/Grid/EDU/clinical/financial test suites.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: regression proof that one connected ecosystem does not create cross-tenant, cross-role or authority leakage.

- [ ] **Step 1: Test context switching**

Required case:

```text
RN in Clinic A patient context -> switch to personal Grid -> no patient/Clinic A PHI leaks into personal Grid projection
```

- [ ] **Step 2: Test expiration/revocation**

```text
credential expires -> new consequential opportunity action blocked
organization relationship revoked -> org admin action blocked
expert engagement expires -> evidence access revoked
placement/site approval withdrawn -> assignment cannot proceed
consent withdrawn -> protected patient action re-evaluated
```

- [ ] **Step 3: Test dispute/incident paths**

Grid commerce/work/resource transaction disputes must preserve original evidence and not rewrite history.

- [ ] **Step 4: Test profile privacy**

Patient never public; resume private by default; professional public projection excludes private evidence fields; learner public/network projection does not imply licensure.

- [ ] **Step 5: Run broad tests and commit**

```bash
npm run test
npm run lint
npx prisma validate

git add <tests>
git commit -m "test: lock ecosystem authority privacy and failure-state laws"
```

---

### Task 16: Produce the engineering-readable ecosystem blueprint from the reconciled architecture

**Files:**
- Create: `docs/engineering/KLINIKOS_ENGINEERING_ECOSYSTEM_BLUEPRINT.md`
- Update: `docs/KLINIKOS_AUTHORITY_MAP.yaml` to classify/reference it as subordinate engineering projection.

**Interfaces:**
- Consumes: Master Canon, ecosystem registry, route catalog, schema, OpenAI partner register, current implementation evidence.
- Produces: the business ecosystem diagram translated into a buildable engineering architecture without becoming a new product authority.

- [ ] **Step 1: Write the blueprint in four simultaneous views**

The document must contain:

```text
A. HUMAN FLOW — plain-language journey users experience
B. APPLICATION FLOW — Grid / EDU / Care / Current Visit / Clinic OS / Financial OS / Network / Insights
C. DOMAIN FLOW — Identity / Trust / Organization / Profile / Grid / EDU / Clinical / Commerce / Financial / Evidence / Communication / Zumi
D. DATA/EVENT FLOW — exact canonical objects and consequential state transitions
```

- [ ] **Step 2: Include the master object graph**

At minimum:

```text
Person
Account
Organization
Location
Relationship
Claim
VerificationEvidence
Credential
CareerArtifact
LearnerProfile
Provider
Resource
Demand
Availability
Requirement
Eligibility
Match
Opportunity
Offer
Agreement
Reservation
Assignment
Fulfillment
Incident
Dispute
Program
Enrollment
CompetencyEvidence
Placement
PreceptorRelationship
Patient
Appointment
Encounter
CurrentVisit
Order
Result
Referral
InventoryItem
CommerceListing
Quote
Invoice
PaymentIntent
PaymentEvidence
FinancialObligation
Payable
Payout
Settlement
Reconciliation
Task
Evidence
Outcome
Memory
AuditEvent
ExternalExchange
```

When an exact implementation model differs, show `canonical concept -> current model(s)` rather than inventing duplicate persistence.

- [ ] **Step 3: Include event contracts**

Representative events:

```text
identity.created
claim.submitted
verification.changed
credential.expiring
resource.published
demand.published
match.created
offer.accepted
reservation.confirmed
assignment.started
fulfillment.completed
payment.succeeded
payout.completed
reconciliation.exception
edu.evidence.released
placement.approved
placement.completed
encounter.started
result.received
visit.closed
inventory.changed
expert.engagement.started
expert.engagement.closed
communication.delivered
context.switched
```

Every consequential event must specify actor, timestamp, identity/org/location context, prior/new state, evidence/provenance, idempotency/correlation where relevant.

- [ ] **Step 4: Include APIs/service boundaries**

Document the direction:

```text
browser -> Klinikos API/service -> policy/authority -> domain service -> outbox/event -> external adapter where needed
```

The browser must not call private provider/vendor APIs with Klinikos secrets.

- [ ] **Step 5: Include the OpenAI/Zumi execution lane**

Exact conceptual sequence:

```text
USER
-> SECURITY / PRIVACY GATE
-> ACTIVE EXPERIENCE CONTEXT
-> AUTHORIZED CONTEXT BUILDER
-> TASK CLASSIFICATION
-> DETERMINISTIC POLICY
-> ZUMI ORCHESTRATOR
-> OPENAI RESPONSES API WHEN REASONING ADDS VALUE
-> TOOL/ACTION PROPOSAL
-> AUTHORIZATION CHECK
-> HUMAN CONFIRMATION WHEN CONSEQUENTIAL
-> DETERMINISTIC BACKEND EXECUTION
-> VERIFIED RESULT
-> AUDIT / PROVENANCE
-> USER-FACING PLAIN-LANGUAGE RESULT
```

- [ ] **Step 6: Include implementation-state labels**

Every subsystem/route in the blueprint must be marked one of:

```text
LIVE / VERIFIED
BUILT BUT NEEDS VERIFICATION
PARTLY BUILT
DESIGNED
PLANNED
EXTERNAL CONNECTION NEEDED
LEGAL REVIEW NEEDED
NOT BUILT
```

Status must come from current evidence, not desired architecture.

- [ ] **Step 7: Include dependency order**

Canonical build dependency:

```text
Authority/Canon truth
-> Identity/Organization/Trust
-> Profile/Resume projections
-> Route/Ecosystem registry
-> Grid eligibility/resource classes
-> EDU/Placement
-> Professional/Injector readiness
-> Clinic/Current Visit/Telemedicine
-> Commerce/Inventory
-> Quality/Expert
-> Financial truth
-> Communication/growth loops
-> Zumi/OpenAI orchestration across governed tools
-> Insights/enterprise expansion
```

This is dependency order, not necessarily market launch order.

- [ ] **Step 8: Run doc/register tests and commit**

```bash
npm run test
npm run lint

git add docs/engineering/KLINIKOS_ENGINEERING_ECOSYSTEM_BLUEPRINT.md docs/KLINIKOS_AUTHORITY_MAP.yaml
git commit -m "docs: translate Klinikos ecosystem into buildable engineering blueprint"
```

---

### Task 17: Verify the reconciliation against the original failure mode

**Files:**
- Review all files changed in Tasks 1-16.

**Interfaces:**
- Consumes: complete branch.
- Produces: evidence that no major accepted Luxe path is still discoverable only through chat history.

- [ ] **Step 1: Search for all required route/domain concepts**

Run:

```bash
for term in \
  "student-clinical-placement" \
  "RN to injector" \
  "resume" \
  "preceptor" \
  "permitted products" \
  "expert" \
  "Current Visit" \
  "telemedicine" \
  "OpenAI" \
  "Partner Network" \
  "plain language"; do
  echo "=== $term ==="
  git grep -n -i "$term" docs src prisma | head -40 || true
done
```

Expected: each material concept has current Canon/registry/implementation projection, not only an old snapshot.

- [ ] **Step 2: Run the full verification suite**

```bash
npx prisma validate
npm run lint
npm run test
npm run build
```

Expected: all pass, or failures are documented as actual pre-existing/current blockers with exact evidence rather than hidden.

- [ ] **Step 3: Compare branch to main for scope discipline**

```bash
git diff --stat origin/main...HEAD
git diff origin/main...HEAD -- docs/KLINIKOS_MASTER_CANON.md docs/ROUTE_REGISTRY.md src/lib/paths prisma/schema.prisma src/features/zumi docs/partners docs/engineering
```

Expected: changes are directly tied to the approved reconciliation.

- [ ] **Step 4: Update reconciliation ledger classifications**

Every `PARTIAL`/`MISSING` row implemented in this tranche must become `COVERED` or explicitly remain future work with a truthful implementation-state label.

- [ ] **Step 5: Commit final evidence update**

```bash
git add docs/governance/KLINIKOS_LUXE_RECONCILIATION_LEDGER.md
git commit -m "docs: close Luxe reconciliation evidence loop"
```

---

# Engineering Blueprint Summary

The buildable system is not a collection of apps talking ad hoc to each other. It is one governed operating substrate with application projections.

```text
ACQUISITION / DISCOVERY
    |
    v
PROTECTED ENTRY + ONE IDENTITY
    |
    v
INTENT / CONTEXT (Zumi assists)
    |
    v
CLAIMS -> VERIFICATION -> RELATIONSHIP -> AUTHORITY -> PERMISSION
    |
    v
EXPERIENCE ENGINE
    |
    +-------------------+-------------------+------------------+------------------+
    |                   |                   |                  |                  |
    v                   v                   v                  v                  v
  GRID                 EDU                CARE            CLINIC OS         FINANCIAL OS
    |                   |                   |                  |                  |
    |                   |                   v                  v                  |
    |                   |             CURRENT VISIT       OPERATIONS              |
    |                   |             + TELEMED MODE      / CAPACITY              |
    |                   |                   |                  |                  |
    +---- work ----------+---- readiness ----+                  +---- demand -------+
    +---- placement -----+                                      +---- supply -------+
    +---- products / equipment / rooms / services / experts ----------------------+
    |                                                                          |
    v                                                                          v
AGREEMENT / RESERVATION / ORDER / ASSIGNMENT                           OBLIGATION / PAYMENT
    |                                                                          |
    v                                                                          v
FULFILLMENT / EVIDENCE ---------------------------------------> PAYOUT / SETTLEMENT / RECONCILIATION
    |
    v
NETWORK RELATIONSHIP + REPUTATION + MEMORY + NEXT ACTION
    |
    v
EMAIL / ALERT / SHARE / INVITE / RETURN / EXPANSION
```

Shared backend kernels underneath every path:

```text
IDENTITY
ORGANIZATION
TRUST / AUTHORITY
PROFILE / CAREER / RESUME
INTENT
GRID
EDU
CLINICAL
COMMERCE / INVENTORY
FINANCIAL
WORK / OBLIGATION
EVIDENCE / AUDIT
COMMUNICATION
INTEGRATION
ZUMI / OPENAI INTELLIGENCE
ENTITLEMENT
ANALYTICS
RELIABILITY
```

The user does not see those kernel names. The user sees things such as:

```text
What do you need?
What do you have?
Upload your resume.
Show your license.
Find work.
Finish your clinical hours.
Book a room.
Sell this product.
Your tele-visit is ready.
Two notes need to be finished before billing.
Your school still needs to approve this site.
This credential expired. Upload the renewed version.
An expert can help with this. Review what they will be allowed to see.
You were paid $X. Here is what the fee was for.
```

That is the intended separation: **extreme system complexity underneath, exemplary clarity above.**
