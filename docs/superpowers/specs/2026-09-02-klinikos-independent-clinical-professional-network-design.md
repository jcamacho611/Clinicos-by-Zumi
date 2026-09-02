# Klinikos Independent Clinical Professional Network — build directive

Status: DESIGN / EXECUTION DIRECTIVE
Date: 2026-09-02
Base: `main` at `07b0caf2` (`feat(frontend): Living Universe visual stage (#474)`)
Authority: subordinate to `docs/KLINIKOS_MASTER_CANON.md` and
`docs/superpowers/specs/2026-08-29-klinikos-master-engineering-blueprint.md`.
This document adds no new company authority. It converts an approved product
direction into an implementation contract.

Not a sixth plane. Not a second Grid. Not a second identity system. Not a
pharmaceutical marketplace.

---

## 1. The problem, stated exactly

There are skilled licensed professionals — most visibly RNs and nurse injectors —
who already have the two things a business normally struggles hardest to get:

- the clinical skill;
- the customers.

What they do not have is the apparatus that makes paid clinical work lawful:
prescribing authority, a medical practice, an ordering clinician, product access
under proper custody, consent and documentation, a compliant treatment site,
insurance, payment operations, and a business entity.

Today those professionals resolve the gap in one of two ways. Either they take
$50/hour inside someone else's clinic and give up the customer relationship they
built, or they operate informally and accept risk they usually cannot see.

Klinikos should offer a third way: **bring the skill and the demand; Klinikos
assembles the rest, or tells you truthfully what is missing.**

### 1.1 The founder's question, answered precisely

> What is the difference between an RN hired by a med spa using the practice's
> product at $50/hour, and the same RN acquiring her own customer, buying the
> product, and treating that customer at the customer's home?

The difference is **not** employment status, and it is **not** who bought the
product. Independent-contractor status is a tax and employment construct; it
does not move clinical authority, and it does not, on its own, relieve a
practice or a supervising clinician of responsibility.

The differences that actually matter, and that this system must model:

| Dimension | Employed/contracted in a practice | Professional with her own customer |
|---|---|---|
| Who holds the clinical relationship | The practice | **Unassigned — must be established** |
| Who evaluated the patient | Practice clinician | **Unassigned — must be established** |
| Who issued the patient-specific order | Practice prescriber | **Unassigned — must be established** |
| Who owns the product under custody | The practice | **Unassigned — must be established** |
| Where treatment occurs | Registered facility with privileges | **A site with no privilege record** |
| Who documents and retains the record | The practice | **Unassigned — must be established** |
| Who answers an adverse event | The practice | **Unassigned — must be established** |

Every "unassigned" row is a real gap, not a formality. The product's job is to
make each row explicitly assigned to a real, verified party before the encounter
may proceed — and to refuse when a row cannot be filled.

That reframing is the whole architecture. Klinikos does not make the RN a
prescriber. Klinikos finds and binds the party who can be.

### 1.2 What we must never claim

We cannot promise a physician or practice has "no liability" because the treating
professional is an independent contractor. That is not true, and selling it would
be both dishonest and dangerous.

The honest and more valuable promise is:

> Klinikos makes every responsibility in a clinical encounter explicit,
> attributed to a verified party, and evidenced — so that nobody accidentally
> accepts responsibility they did not intend to accept, and so that what did
> happen can be reconstructed afterward.

Defensibility is the product. Immunity is not on offer.

---

## 2. What already exists — reuse before building

A large part of this already exists on `main`. Codex must read these before
proposing anything new. Building a parallel version of any of them is a defect.

### 2.1 Eligibility — `src/lib/grid/eligibility.ts`

`evaluateGridEligibility` already decides whether a participant may perform a
regulated activity, and it already models this exact domain:

- `gridActivityCatalog` distinguishes `perform_aesthetic_injection`,
  `supervise_aesthetic_injection`, `provide_medical_direction`,
  `perform_rn_service`, `perform_np_service`, `precept_student`,
  `host_at_facility`. Activity, not job title, is the unit of decision.
- Scope of practice is checked **before** credentials, so a current licence
  never rescues someone outside scope.
- Jurisdiction match, malpractice verification and expiry, facility privilege
  and expiry are all enforced.
- `currentThrough` checks the credential against the **end** of the engagement,
  not just its start.
- Success returns `GridEligibilityBasis` — the auditable record of *why* someone
  was admitted.
- Failures are typed (`gridEligibilityFailureCodes`), which makes them
  projectable to a person without inventing new copy.

This engine is the foundation of everything below. Extend it; do not replace it.

### 2.2 Clinical records — `prisma/schema.prisma`

Already present: `ClinicalOrder`, `Prescription`, `Encounter`, `Consent`,
`Signature`, `Provider`, `ProviderCredential`, `ProviderFacilityPrivilege`,
`Patient`, `Appointment`, `Document`, `FormSubmission`.

### 2.3 Inventory — `prisma/schema.prisma`

`InventoryItem` already carries `lotNumber`, `expiresAt`, `quantityOnHand`,
`quantityReserved`, `controlledItem`, `coldChain`, `recallStatus`, and is scoped
to `organizationId` / `locationId`. `InventoryTransaction` already carries
`type`, `quantity`, `direction`, `patientId`, `actorId`, `fromLocationId`,
`toLocationId`.

The custody substrate exists. What is missing is the **authorization gate** in
front of it and the **encounter binding** behind it.

### 2.4 Money — `src/lib/commercial/monetization-policy.ts`

Already correct and already load-bearing. It is the single place that decides
whether a fee *shape* may touch a transaction *class*, and it already refuses
percentage fees on professional care and referrals absent counsel clearance,
citing New York fee-splitting restrictions and the federal Anti-Kickback
Statute. `manual_review_required` is the default for unmapped classes.

Do not add a percentage anywhere else. Route every new money question through
this module.

### 2.5 Identity — `prisma/models/universal-identity.prisma`

`Person`, `OrganizationMembership`, `LocationAssignment`, `PersonRelationship`
already exist, and `PersonRelationship` is already documented as
context/evidence only: "Even a verified relationship does not grant
professional, clinical, billing, organization-binding, listing, signing, payout,
school/site approval, or other consequential authority."

That sentence is the law this whole directive obeys.

### 2.6 Paths — `src/lib/paths/catalog.ts`

`become-grid-ready` ("RN to injector readiness"),
`clinician-independent-practice`, `find-extra-work`,
`clinic-monetize-capacity` already exist as governed Paths with truthful
`availability` states. The professional journey described here is largely a
matter of making these Paths real, not adding new ones.

---

## 3. What is genuinely missing

Seven gaps. Everything else is reuse.

**G1 — Patient-specific authorization.** `evaluateGridEligibility` answers *who
may perform this activity*. Nothing answers *whether this specific patient has
been evaluated and has a current order permitting this treatment*. Today an
eligible injector plus a willing customer looks complete to the system. It is
not. A patient's request is not an order.

**G2 — Site class.** The engine assumes a registered facility with privilege
records. A patient's home has none, so a home encounter currently fails with
`facility_unknown`. That fail-closed behavior is correct and must be preserved,
but there is no modeled lawful path for mobile care at all.

**G3 — Regulated inventory allocation.** Nothing binds a specific lot to a
specific authorized encounter, and nothing prevents regulated product from being
treated as ordinary Grid merchandise.

**G4 — Jurisdiction policy as data.** Rules are currently expressed as booleans
on activities. They are jurisdiction-, service-, site- and provider-type
dependent, and they change. They need to be declared data with an explicit
`UNKNOWN` state that fails closed.

**G5 — Responsibility attribution.** No record answers "who was responsible for
what in this encounter."

**G6 — Readiness projection.** No surface tells a professional what is missing
between where she stands and lawful independent work.

**G7 — Client-sourced demand.** Grid models a clinic needing a professional. It
does not model a professional arriving with her own customer.

---

## 4. The central new primitive: the Encounter Authorization Set

One server-owned record that answers a single question:

> May this specific encounter, with these specific parties, at this specific
> site, using this specific product, lawfully proceed?

It is a **composition of existing truth**, never a second source of it. Each slot
holds a reference to the authoritative record plus the decision that consumed it.

```
ENCOUNTER AUTHORIZATION SET
  encounter                → Encounter
  patient                  → Patient          (private; never Grid supply)
  demand origin            → clinic_sourced | professional_sourced | patient_sourced
  clinical relationship    → Organization responsible for the clinical record
  evaluating clinician     → Provider + evaluation evidence
  patient-specific order   → ClinicalOrder / Prescription  (status, scope, expiry)
  performing professional  → Person + GridEligibilityBasis
  supervision              → Provider + basis, or "not required" + why
  site                     → SiteClass + site decision + conditions
  inventory allocation     → InventoryItem lot(s) + reserved quantity + custody chain
  consent                  → Consent + Signature
  insurance                → malpractice basis for each acting party
  responsibility map       → §7
  decision                 → AUTHORIZED | AUTHORIZED_WITH_CONDITIONS
                             | REVIEW_REQUIRED | LEGAL_REVIEW_REQUIRED | BLOCKED
  basis                    → every input decision, timestamped, for audit
```

Laws:

1. **Nothing consequential happens on a set that is not `AUTHORIZED` or
   `AUTHORIZED_WITH_CONDITIONS` with its conditions satisfied.** Not inventory
   reservation, not appointment confirmation, not payment capture, not payout.
2. **Any slot that cannot be filled blocks.** An unfillable slot is a truthful
   product state, not an error to route around.
3. **The set is re-evaluated at execution time, not only at booking time.** A
   credential that lapses between booking and treatment must invalidate the set.
   Reuse `currentThrough`'s existing discipline.
4. **The set is append-only evidence.** Revocation writes a new state; it never
   erases the prior one.
5. **Zumi may assemble and explain a set. Zumi may never authorize one.**

---

## 5. Site class — replacing the facility boolean

`requiresFacilityPrivilege: boolean` is too coarse. Introduce a site dimension.

```
registered_facility        organization-owned, privilege records exist
partner_facility           third-party site under an agreement; privileges verified
mobile_patient_residence   the patient's home
mobile_other               employer site, event, hotel, etc.
telehealth                 no physical co-location
```

Each `(jurisdiction, activity, siteClass)` triple resolves to a requirement set,
not a yes/no. A mobile aesthetic injection is not "allowed" or "forbidden" as a
category; it depends on the jurisdiction, the service, the order, the patient's
risk, the storage and transport of the product, and the emergency plan.

The evaluation shape:

```
MOBILE / SITE EVALUATION
  jurisdiction policy         → §6
  activity requirements       → gridActivityCatalog
  performing professional     → evaluateGridEligibility
  order requirement satisfied → §4
  patient clinical risk       → screening result, clinician-owned
  site requirements           → space, sanitation, lighting, waste, privacy
  product storage/transport   → cold chain, custody, time out of storage
  emergency plan              → escalation contact, distance to care, equipment
  ⇒ APPROVED | APPROVED_WITH_CONDITIONS | REVIEW_REQUIRED | BLOCKED
```

**Never encode "RNs may perform aesthetic injections at home."** Encode the
evaluation, and let declared jurisdiction policy answer.

---

## 6. Jurisdiction policy engine

Rules become declared data, versioned, with provenance, evaluated server-side.

```
JurisdictionPolicy
  jurisdiction            "NY"
  activity                GridActivityKey
  siteClass               SiteClass
  providerType            string
  serviceClass            string
  requiresPatientSpecificOrder        bool | UNKNOWN
  requiresPriorEvaluationByClinician  bool | UNKNOWN
  requiresSupervision                 none | available | onsite | UNKNOWN
  requiresCollaborationAgreement      bool | UNKNOWN
  entityRestriction                   none | professional_entity_required | UNKNOWN
  feeSplittingRestriction             none | restricted | UNKNOWN
  productCustodyRequirement           string | UNKNOWN
  outcome   ALLOWED | ALLOWED_WITH_CONDITIONS | REVIEW_REQUIRED
          | LEGAL_REVIEW_REQUIRED | EXTERNAL_VERIFICATION_REQUIRED
          | BLOCKED | UNKNOWN
  source                  citation + reviewedBy + reviewedAt + version
  counselCleared          bool
```

Laws:

1. **`UNKNOWN` fails closed.** Absence of a rule is never permission.
2. **No AI-authored legal permission.** A policy row is only `ALLOWED` when
   `counselCleared` is true and a human reviewer is named. Zumi may draft a
   candidate row; it may never set `counselCleared`.
3. **Seed narrowly and honestly.** Ship New York first, `UNKNOWN` everywhere
   else, and let the product say so. An empty policy table is a truthful product;
   a guessed one is a liability.
4. Policy is server-only. It is exactly the kind of proprietary governed logic
   `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md` keeps off the wire.

### 6.1 The New York starting point

New York permits an RN to practise nursing independently but not to diagnose or
prescribe medical treatment; RNs execute medical regimens ordered by an
authorized practitioner. New York also regulates professional entities and
restricts fee splitting connected with professional care. Federally, Botox
Cosmetic and approved dermal fillers are prescription-only and are not to be
sold directly to the public.

Therefore the seeded New York default for aesthetic injectables is:

```
requiresPatientSpecificOrder        = true
requiresPriorEvaluationByClinician  = true
entityRestriction                   = professional_entity_required
feeSplittingRestriction             = restricted
siteClass mobile_patient_residence  = REVIEW_REQUIRED
outcome                             = ALLOWED_WITH_CONDITIONS
counselCleared                      = false   ← until counsel signs
```

Until `counselCleared` is true, the product surfaces the Path as
`requires_verification` and does not transact. That is the honest state, and
`klinikosPathCatalog` already supports expressing it.

---

## 7. The responsibility map

For every governed encounter, Klinikos must be able to answer, from stored
evidence rather than inference:

```
who sourced the customer
who holds the clinical relationship
who evaluated the patient
who issued the order
who verified the performing professional, and on what basis
who verified the site
who owned the product
who held custody of the product, and when
who transported it
who performed the service
who supervised, if supervision was required
who documented it
who owns follow-up
who answers an adverse event
who received the customer's money
who is owed money
what insurance covers each acting party
what agreement governs the arrangement
```

This is the deliverable a carrier, a counsel or a regulator actually wants, and
no competitor has it. It is also the reason a practice would agree to work with
an independently-sourced professional at all: the practice can see exactly what
it is and is not accepting, before it accepts it.

**An indemnification clause is not a substitute for any row above.** Contract
language does not create scope, and the product must never present it as if it
does.

---

## 8. Regulated inventory

Three concepts, permanently separate:

```
GRID COMMERCE              ordinary permitted goods and resources
REGULATED CLINICAL INVENTORY   under an authorized practice's custody
ENCOUNTER ALLOCATION       a lot assigned to one authorized encounter
```

Botox never appears next to a treatment chair as "Botox — $600 — Buy Now."
It appears, inside the practice's own workspace, as:

> BOTOX COSMETIC · practice inventory · 100 units · lot X · expires Y ·
> 20 units reserved for encounter #123

Lifecycle, layered onto the existing `InventoryTransaction.type`:

```
RECEIVED → VERIFIED → IN_STOCK
  → RESERVED_FOR_ENCOUNTER   ← requires an AUTHORIZED authorization set
  → RELEASED_TO_CUSTODIAN    ← records who took custody, and when
  → ADMINISTERED | PARTIALLY_USED | WASTED | RETURNED | QUARANTINED
  → RECONCILED
```

Hard invariants, each a test:

1. `RESERVED_FOR_ENCOUNTER` is refused unless the encounter's authorization set
   is `AUTHORIZED` and its order slot is filled and current.
2. A regulated item can never be published as a Grid resource. Enforce at the
   publish boundary, not in the UI.
3. Custody transfer records both parties and a timestamp. Cold-chain items
   record time out of storage.
4. Administered quantity plus waste must reconcile against the reservation.
5. Recalled or expired lots cannot be reserved or released.
6. **Do not model a physician selling prescription product to a nurse who then
   resells treatment.** Model practice-custody allocation to an authorized
   encounter. The former is what the founder described informally; the latter is
   the lawful shape of the same economic outcome.

---

## 9. Client-sourced demand (G7)

Extend Grid demand with an origin, and let a professional bring her own
customer without that fact granting her any clinical authority.

```
PROFESSIONAL SOURCES CUSTOMER
  → customer creates or links a Klinikos Person identity
  → intake, privately          (patient is never Grid supply — existing law)
  → clinical relationship assigned to an authorized organization
  → evaluating clinician performs evaluation
  → patient-specific order issued, or the encounter blocks
  → evaluateGridEligibility on the performing professional
  → site class evaluation
  → inventory allocation
  → consent
  → appointment
  → treatment
  → documentation + product evidence
  → follow-up task
  → financial obligations                     (§10)
  → professional payable, where lawful
  → outcome and reputation evidence
```

The professional who found the customer does not thereby become the patient's
prescriber. Make that a test, in those words.

---

## 10. Money

Never assume a percentage of a clinical professional fee is lawful. Route every
question through `evaluateGridMonetizationPolicy`.

Separate obligations, never one blended number:

```
CUSTOMER CHARGE
PRACTICE RECEIVABLE
PROFESSIONAL PAYABLE
INVENTORY / PRODUCT COST
FACILITY OR ROOM FEE
ADMINISTRATIVE / TECHNOLOGY FEE       flat, only where counsel-cleared
KLINIKOS SAAS SUBSCRIPTION
EDU FEE
```

The commercial thesis worth stating plainly: **Klinikos does not need a cut of
the medical fee to make money here.** The revenue is the infrastructure —
professional subscription, practice subscription, business setup, EDU, space and
equipment coordination where lawful, credential operations, and implementation.
That is a better business anyway: it is recurring, it is not jurisdiction-
fragile, and it does not require us to defend a percentage of professional care.

Preserve existing law: `REDIRECT ≠ PAYMENT`, `OBLIGATION ≠ PAYMENT`,
`PAYMENT ≠ PAYOUT`, `PAYOUT ≠ SETTLEMENT`. Do not deploy Stripe Connect
marketplace splitting for regulated clinical classes before the policy work
clears. Model obligations first; settle later.

---

## 11. Professional Launchpad (G6)

The surface a professional actually meets. She says:

> "I have twenty clients. Help me do this properly."

Klinikos returns a readiness map: what is done, what is missing, what needs
verification, what needs a practice relationship, what needs counsel.

**The invariant that makes this honest:** the readiness map must be derived from
the same engines that gate the work — `evaluateGridEligibility`'s failure codes,
the jurisdiction policy, the authorization set's slots. It must be structurally
impossible for the checklist to show ready while the booking blocks. A readiness
projection computed independently of the gate is how a product ends up lying to
someone about their own career.

Render each item as: what is missing, why it matters, what would satisfy it, and
who can satisfy it. Never as legal advice, and never with an invented timeline.

---

## 12. Machine invariants — write these as tests

Each of these is a test that must fail before its implementation exists.

1. Independent-contractor status does not create clinical eligibility.
2. A professional sourcing her own customer does not become that patient's
   prescriber.
3. EDU completion does not create a licence.
4. A resume claim does not create a verified credential.
5. Malpractice coverage does not create scope of practice.
6. Payment does not create authority; subscription does not create eligibility.
7. Reputation may reorder eligible results and can never make an ineligible
   participant eligible.
8. Regulated clinical inventory cannot be published as a Grid resource.
9. Inventory cannot be reserved to an encounter without a current, in-scope
   patient-specific order.
10. Unknown jurisdiction policy blocks; absence of a rule is never permission.
11. Zumi cannot set `counselCleared`, cannot authorize an encounter, and cannot
    resolve a legal question.
12. A credential that expires mid-engagement fails the whole engagement.
13. Patient identity and patient intent never appear in public Grid supply.
14. One Person may hold many professional and business relationships without a
    second identity being created.
15. Every authorization-set state change is auditable and append-only.
16. Cross-tenant inventory, patient or credential data cannot leak.
17. An indemnification agreement does not satisfy any responsibility-map row.
18. Percentage fees on professional care and referrals stay refused absent
    counsel clearance carrying evidence.

---

## 13. Do not build

- A public marketplace for Botox, fillers, or any prescription product.
- Doctor-to-nurse resale of prescription inventory.
- Any "the physician is not liable" representation.
- AI prescribing, AI legal clearance, or AI-set `counselCleared`.
- Automatic credential verification from a resume.
- A universal percentage on clinical transactions.
- Referral compensation tied to volume or value.
- A second identity system, a second Grid, a second ledger, a second Zumi, or a
  sixth plane.
- A separate med-spa product. Med spa is a configuration of Clinic OS.

---

## 14. Phases

Backend authority contracts precede UI. Each phase is TDD: RED, minimum
implementation, GREEN, regression, exact-head verification.

**P1 — Jurisdiction policy engine.** Declared data, `UNKNOWN` fails closed,
NY seeded with `counselCleared = false`. Server-only. Tests 10 and 11.

**P2 — Site class.** Replace `requiresFacilityPrivilege` with a
`(jurisdiction, activity, siteClass)` requirement resolution inside the existing
eligibility engine. Preserve every current failure code; add site failures.

**P3 — Patient-specific authorization.** The order slot: is there a current,
in-scope `ClinicalOrder`/`Prescription` for this patient and this treatment?
Tests 2 and 9.

**P4 — Encounter Authorization Set.** Compose P1–P3 plus consent, insurance and
the responsibility map into one server-owned decision with a full basis record.
Re-evaluated at execution time. Tests 1, 12, 15, 17.

**P5 — Regulated inventory allocation.** Encounter binding, custody chain,
reconciliation, publish-boundary refusal. Tests 8 and 9.

**P6 — Client-sourced demand.** Demand origin on Grid; the professional-sourced
journey end to end.

**P7 — Professional payable and obligations.** Separate obligations through
`evaluateGridMonetizationPolicy`. No settlement for uncleared classes.

**P8 — Professional Launchpad readiness.** Derived from P1–P4's engines, never
computed independently. Test 11's shape applies: the checklist cannot outrun the
gate.

**P9 — Living Universe surfaces.** Object Stage for the authorization set;
Inspector showing *why*, the evidence, and the authority; Action Dock showing
the single next real action. Marble for the operational work, Obsidian for the
Living Home entry. Mobile recomposed, not stacked.

**P10 — Med spa proof case.** The Luxe-style end-to-end journey as an
acceptance test.

**P11 — Expert Grid escalation.** When a gap exceeds automated authority, route
to a verified human expert with minimum-necessary access. Reuse
`docs/KLINIKOS_ASSURANCE_AND_EXPERT_GRID_CANON.md`.

**P12 — Full invariant suite and integrated journey.**

---

## 15. Acceptance journey

Synthetic data only.

1. An RN uses her existing Klinikos Person identity. No second identity.
2. Her licence, malpractice and training claims load as *claims*, not verified
   truth.
3. She states she already has customers.
4. Zumi structures the intent into a governed Path and an activity key.
5. The readiness map lists exactly what is missing, derived from the gate.
6. She completes the verification and training steps that are hers to complete.
7. She connects to an authorized practice; the practice sees precisely what it
   is accepting before accepting.
8. She brings a customer. The customer's identity and intent stay private.
9. The customer completes intake.
10. An authorized clinician evaluates and issues a patient-specific order — or
    the encounter blocks here, visibly and truthfully.
11. Eligibility, jurisdiction, and site class all resolve.
12. Practice-custody inventory is allocated to the encounter, lot recorded.
13. Consent is captured.
14. The encounter proceeds only because the authorization set says it may.
15. Documentation, product evidence and waste reconciliation are stored.
16. Follow-up is scheduled and owned by a named party.
17. Financial obligations are created separately; nothing settles in a class
    that is not counsel-cleared.
18. The responsibility map is complete and queryable.
19. Her business surface shows real work, real revenue, real next steps.
20. Klinikos names the next step toward greater independence.

---

## 16. Why this matters commercially

This is not a feature. It is a supply engine.

Every professional who completes this journey becomes Grid supply, an EDU
customer, a subscription, a source of customer demand, and eventually a
preceptor, an employer, or a practice owner who brings their own staff onto
Klinikos. The learner becomes the worker becomes the owner becomes the teacher.
That loop is the network effect, and it compounds in a way a staffing board
cannot copy.

It generalizes far past injectors: physical therapists, mental health
clinicians, mobile phlebotomy, lactation consultants, wound care, home-based
clinicians, educators, preceptors. The architecture is the same every time —
assemble the lawful combination, or say truthfully what is missing.

And the wedge sells itself in one sentence:

> You don't need to know how to build a healthcare business. Bring your skill
> and your customers; Klinikos shows you exactly what you're missing and
> connects the rest.

---

## 17. Reporting

At each checkpoint: branch and exact SHA; files changed and why; tests and
results; which existing primitive was reused; anything new and its
justification; every `LEGAL_REVIEW_REQUIRED` item raised; security and clinical
risks; what is now real versus still designed; the next tranche.

Stop and escalate for: a destructive migration, a genuine security risk, an
external side effect, a legal ambiguity with no safe fail-closed path, or an
unresolvable verification failure.

Do not merge without review. Merging is a production action.
