# KLINIKOS MASTER PRODUCT & ENGINEERING SPECIFICATION

Status: `AUTHORITATIVE — TOP OF THE DOCUMENT CHAIN`
Date: 2026-08-23

This document exists so that a person or an agent can read **one** source and understand
what Klinikos is, what governs it, and which of the other seventy-five documents in this
directory still apply. It does not replace the specialist canons. It sits above them and
says how to read them.

It deliberately does not restate what the specialist canons already say. Where this
document names a subject and a canon owns it, the canon governs the detail.

---

## 1. The distinction this document exists to enforce

The repository contains two kinds of writing, and confusing them is the single most
expensive mistake an agent makes here.

**Permanent decisions.** Product definition, architecture law, safety boundaries,
economic rules. These continue to govern until explicitly superseded.

**Status snapshots.** "Patient portal not built." "Billing not built." True on the day
they were written. Several are now false: substantial PostgreSQL-backed implementations
exist for patients, appointments, encounters, documents, labs, imaging, medications,
referrals, coding, claim readiness and the patient portal.

A snapshot never overrides the repository. When a document and the code disagree about
**what exists**, the code is right and the document is old. When a document and the code
disagree about **what should exist**, the document governs and the code is a defect.

Section 6 classifies every document in this directory on exactly that axis.

## 2. Truth precedence

`docs/KLINIKOS_ARCHITECTURE_INDEX.md` already carries the precedence chain and remains
the navigation authority. It is not duplicated here. Its first rule is the one that
matters most and is repeated for emphasis:

> Current repository implementation, schema, migrations, tests, exact-head CI and
> verified runtime evidence determine **what exists now**.

Planning documents, audits and roadmaps do not.

## 3. What Klinikos is

Klinikos is not an EHR, practice-management system, medical CRM, staffing marketplace,
LMS, billing platform, AI assistant, patient portal, scheduling application, med-spa CRM,
provider directory or telemedicine tool. It is the governed operating, clinical,
professional, educational, financial, capacity, transaction, network, memory and
intelligence infrastructure for the healthcare lifecycle.

It connects two lifecycle chains that no incumbent connects.

**The human lifecycle.** Student → education → simulation → competency evidence →
placement → credential → Grid eligibility → work → experience → reputation → independent
practice → clinic owner → multi-location owner → employer → educator → preceptor.

**The care and revenue lifecycle.** Patient demand → discovery → registration →
scheduling → intake → encounter → documentation → orders → results → follow-up → coding
→ charge → claim → adjudication → payment → reconciliation → outcome → future care.

One person moves along the first chain without their account fracturing. One clinic runs
the second. Grid is where the two meet.

## 4. The governing experience law

> **The complexity belongs to Klinikos, not to the person using Klinikos.**

The backend may be arbitrarily sophisticated. The surface must stay calm, premium,
obvious, fast, spacious and trustworthy. A physician should never need to understand
integration events, Grid policy classes, eligibility engines, obligation objects, audit
state machines or AI routing. Each role asks one question and should get one answer:

| Role | The only question that matters |
| --- | --- |
| Physician | What changed, what matters, what do I do? |
| Clinic owner | What needs attention, who owns it, where are we losing money? |
| Nurse / MA | What work belongs to me right now? |
| Student | What do I need to complete next? |
| Grid participant | What am I eligible for? |
| Patient | What do I need to do next? |

## 5. Permanent laws

These are the decisions that continue to govern. Each names the canon that owns its
detail; this section is the index of law, not a second copy of it.

### 5.1 Identity and authority

1. **One person, one evolving identity, many relationships.** Becoming something new
   never creates a second account.
2. **Identity is not authority.** "I'm an RN" is conversational context. A verified
   active licence is credential evidence. The two must never be conflated.
3. **Identity assurance is a ladder**, from self-described through email, phone,
   organization-linked, identity-proofed, professional-identity, licence, credential and
   privilege. A verified email does not make a verified physician.
4. **Profession is first-class.** `role === "provider"` is insufficient. MA, LPN, RN, NP,
   PA, physician, therapist, coder, biller and the rest differ in scope, delegation,
   supervision, signing, ordering, Grid eligibility and EDU progression, and must not
   stay collapsed into one `clinical_staff` bucket.
5. **Authorization is contextual policy**, resolving identity, organization, active
   context, relationship, role, profession, licence, credential, privilege, location,
   assignment, service, purpose, consent, supervision and effective date.
6. **Administration is not chart authority.** Owner and admin may configure the
   organization without unrestricted access to every clinical record. Billing access is
   not clinical signing. An EDU instructor is not a clinician. A Grid profile is not a
   credential.
7. **Delegation and supervision are modelled**, not assumed: may perform independently,
   may prepare, may perform under delegation, requires supervisor, requires cosign,
   requires later review, cannot perform.
8. **Purpose-of-use and break-glass are recorded.** Not only whether a person may see
   something, but why — and emergency override carries reason, scope, duration, audit and
   post-event review, never a hidden admin switch.

### 5.2 Clinical

9. **Current Visit is the provider convergence surface.** Patient snapshot → what changed
   → staff handoff → today → clinical → assessment and plan → orders and results →
   documentation and coding → close visit. The physician does not assemble a visit by
   navigating eight modules.
10. **AI may explain structured change. AI must never invent it.** Improved, worsened,
    unchanged, new, resolved and pending are computed deterministically from evidence.
    Resolution is never inferred from omission.
11. **Clinical history is immutable.** Signed notes do not mutate; corrections are
    separate attributable addenda. Body maps, consents, results and templates are
    versioned, never overwritten.
12. **Staff work is not recreated by the physician.** What the MA, LPN or RN completed
    arrives as a handoff, with unresolved questions surfaced.
13. **Specialties compose, they do not fork.** Klinikos core + specialty pack +
    organization configuration + location override. There is no cardiology repository.
14. **Orders are universal typed actions** with a closed loop: ordered → transmitted →
    accepted → performed → resulted → reviewed → communicated → closed. An internal order
    record does not prove an external lab received it. A result is not a provider review.
    A review is not patient notification.
15. **Telehealth is an encounter mode, not a second chart.**
16. **Ambient AI cannot** invent exam findings, change laterality, diagnose, place
    unapproved orders, sign, submit claims or close a visit.

### 5.3 Grid

17. **Grid is a universal healthcare resource, capacity, opportunity and transaction
    network** — people, work, space, equipment, services, education and referral capacity
    — not a staffing product. Public expression stays `I NEED` / `I HAVE`.
18. **Eligibility always precedes ranking.** AI cannot override failed policy. Neither
    can sponsorship, payment or popularity.
19. **Transaction states are distinct.** Acceptance ≠ reservation. Reservation ≠ payment.
    Booking ≠ fulfilment. Obligation ≠ payout. Payout ≠ settlement.
20. **Fulfilment is tracked.** Most marketplaces stop at booking; Klinikos knows whether
    the work actually happened.
21. **Reputation starts from objective evidence**, and star ratings never substitute for
    professional eligibility.

### 5.4 Money

22. **Financial OS is shared.** Price, quote, checkout, payment intent, payment evidence,
    entitlement, obligation, payable, payout, settlement, refund and reconciliation are
    separate concepts on one substrate. No module invents its own ledger.
23. **REDIRECT ≠ PAYMENT.** Browser state cannot create trusted payment truth.
24. **The server owns price.** The frontend is never fee authority.
25. **Revenue integrity is a graph**: performed → charge expected → charge present →
    claim ready → claim sent → accepted → adjudicated → paid → reconciled. Exceptions are
    surfaced, not hidden.
26. **Subscription pays for Klinikos; expensive external usage is customer-funded or
    bounded.** AI, SMS, voice, maps, verification and storage are not funded without
    limit ahead of customer revenue.

### 5.5 Intelligence

27. **Zumi is Klinikos Intelligence, never authority** — not for clinical decisions,
    authentication, RBAC, tenant access, credentials, patient release, payment,
    settlement, Grid eligibility or legal effect.
28. **Zumi orchestrates; deterministic engines execute.** Understanding "schedule Mary
    Thursday" is Zumi's job. Performing the write, after verifying patient, organization,
    eligibility, availability, location, authorization and conflicts, is the scheduling
    engine's.
29. **Memory is context, not authority.** It references and retrieves; it never quietly
    replaces the authoritative record. Clinical truth stays in clinical repositories,
    payment truth in Financial OS, credential truth in credential systems.
30. **Information carries an authority ladder**: authoritative live record → verified
    external evidence → human-approved institutional knowledge → human-confirmed personal
    memory → conversation-derived memory → AI hypothesis. An AI hypothesis never silently
    becomes fact.
31. **Organization memory is isolated.** Clinic A never leaks into Clinic B.

### 5.6 Boundaries

32. **Frontend is experience. Backend is authority and proprietary machinery. The DTO is
    the disclosure boundary.** Zumi prompts, Grid ranking weights, anti-gaming logic,
    trust and risk algorithms, private pricing, margin and fraud rules, security
    heuristics and unnecessary PHI stay server-side.
33. **The browser is hostile and inspectable.** Minification, obfuscation, hidden UI and
    a private repository are not secrecy once code reaches a browser.
34. **Integration status is never collapsed into "integrated."** Planned,
    contract-pending, credentials-pending, sandbox, connected, UAT, controlled-production,
    production-verified, degraded and disabled are different things. `CONNECTED` is not
    `PRODUCTION_VERIFIED`.
35. **Failed external exchanges become work**, in a reconciliation queue, never silence.
36. **Preserve, understand, adapt, harden, generalize, extend.** Do not rebuild because a
    new idea arrived. There is no second Grid, second Zumi, second identity system,
    second financial ledger or parallel Clinic OS.

## 6. Document register

Every file in `docs/` is classified here. The classification answers one question: *may
this document tell me what currently exists?*

- **GOVERNING** — law or product direction. Continues to apply until superseded.
- **SNAPSHOT** — true when written. **Never overrides the repository on status.**
- **REFERENCE** — research, design or market input. Directional, not law.

A canon test fails when a document exists in `docs/` without an entry here, so this
register cannot silently fall behind.

### Governing

| Document | Owns |
| --- | --- |
| `CLINICOS_MASTER_CANON.md` | Historical master canon retained for provenance; superseded where the current merged canon differs |
| `KLINIKOS_MASTER_CANON.md` | Current merged product, experience, business, AI, spatial and lifecycle master canon |
| `KLINIKOS_CONSTITUTION.md` | Constitutional laws, operationalizing the Master Canon |
| `KLINIKOS_ARCHITECTURE_INDEX.md` | Precedence and navigation |
| `SOURCE_OF_TRUTH.md` | Current operating law |
| `KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md` | Cross-domain knowledge translation |
| `KLINIKOS_ECOSYSTEM_CANON.md` | Ecosystem, wiring and lifecycle direction |
| `KLINIKOS_CLINICAL_CONVERGENCE_CANON.md` | Current Visit, clinical change, clinical experience |
| `CLINIC_OS_CANON.md` | Clinic operations |
| `GRID_CANON.md` | Grid network law |
| `GRID_LOCATION_PROVIDER_CANON.md` | Grid location and provider model |
| `GRID_DISCOVERY_GEOLOCATION_AND_MVP_SPEC.md` | Grid discovery and geolocation |
| `GRID_TRANSACTION_FLOW.md` | Grid transaction states |
| `EDU_CANON.md` | Education and competency |
| `KLINIKOS_EDU_PRODUCT_SPEC.md` | EDU product surface |
| `ZUMI_CANON.md` | Zumi governance |
| `ZUMI_CONVERSATION_INTELLIGENCE_CANON.md` | Zumi conversation architecture |
| `ZUMI_AMBIENT_INTELLIGENCE.md` | Ambient clinical intelligence boundary |
| `ZUMI_MASTER_PROMPT.md` | Zumi prompt design |
| `ZUMI_BRAND_LANGUAGE.md` | Zumi marketing language |
| `ZUMI_CUSTOMER_PRODUCT_CONTEXT.md` | Customer-safe conversational reference |
| `ZUMI.md` | Zumi overview |
| `FINANCIAL_OS_CANON.md` | Money substrate |
| `KLINIKOS_COMMERCIAL_CANON.md` | Commercial architecture |
| `KLINIKOS_PRICING_AND_MONETIZATION_CANON.md` | Pricing and monetization |
| `CUSTOMER_FUNDED_ACCESS_MODEL.md` | Customer-funded usage law |
| `VARIABLE_COST_EXECUTION_COGS.md` | Variable-cost policy |
| `MICRO_UNIT_COMMERCIAL_LEDGER_RFC.md` | Micro-unit funding design |
| `FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md` | Client/server confidentiality law |
| `SECURITY_ARCHITECTURE.md` | Engineering security architecture |
| `CLINICAL_SAFETY.md` | Clinical safety boundaries |
| `PATIENT_PORTABILITY_CANON.md` | Patient portability and safety |
| `PORTAL_AND_ROLE_CANON.md` | Portal and role separation |
| `KLINIKOS_PRODUCT_CONTROL_AND_COMPREHENSION_CANON.md` | Repository law |
| `KLINIKOS_PRODUCT_AND_WEBSITE_MASTER_SCOPE.md` | Product and website map |
| `KLINIKOS_ORCHESTRATION_ENGINES.md` | Orchestration engines |
| `KLINIKOS_ASSURANCE_AND_EXPERT_GRID_CANON.md` | Assurance and expert Grid (candidate) |
| `KLINIKOS_EXPERIENCE_ENVELOPE_AND_ZUMI_DATA_GOVERNANCE.md` | Active Experience Envelope, screen truth, Zumi modes, and AI data-governance law |
| `SCREEN_EXPERIENCE_RELEASE_GATE.md` | Mechanical release gate for exactly one Screen Experience Contract per user-facing page |
| `DESIGN_SYSTEM.md` | Design system |
| `FRONTEND_EXPERIENCE_CANON.md` | Frontend experience law |
| `KLINIKOS_DESIGN_AND_WIRING_CANON.md` | Frontend acceptance law |
| `KLINIKOS_DESIGN_PACKAGE_AUTHORITY_2026-08-16.md` | Design package and pixel authority |
| `APPROVED_LIVING_HOME_REFERENCE_2026-08-16.md` | Living Home visual reference |
| `PIXEL_REFERENCE_RECONSTRUCTION.md` | Pixel reference |
| `PIXEL_REFERENCE_RECONSTRUCTION_PASS.md` | Pixel reconstruction directive |
| `CINEMATIC_PRODUCT_REALIZATION_MAX_SCOPE.md` | Cinematic execution directive |
| `COMPETITOR_INTELLIGENCE_AND_SIMPLICITY_CANON.md` | Simplicity and GTM guidance |
| `PUBLIC_ZUMI_INTELLIGENCE_BOUNDARY.md` | Public Zumi boundary contract |
| `PUBLIC_ZUMI_DURABLE_QUOTA.md` | Public inference quota safety |
| `PUBLIC_ZUMI_SECURITY_NOTES.md` | Public Zumi security notes |
| `ZUMI_CONVERSATION_FIRST_2026-08-18.md` | Conversation-first product decision |
| `SALES-AUDIT-FUNNEL.md` | Commercial operating guide |
| `LUXE_ACQUISITION_BRIDGE.md` | Luxe adapter boundary |
| `LUXE_HOSTED_CONVERSION.md` | Luxe conversion boundary |
| `LUXE_PAYMENT_EVIDENCE.md` | Luxe payment evidence law |
| `LUXE_RECOVERY_REVIEW.md` | Luxe human-review law |
| `DECISIONS_2026-08-16.md` | Decision record |
| `ZUMI_CLOUDFLARE.md` | Cloudflare inference notes |
| `KLINIKOS_BLACK_LABEL_V2_DESIGN_HANDOFF_2026-08-23.md` | Black Label experience ceiling and design handoff |
| `KLINIKOS_BLACK_LABEL_PRODUCTION_INTEGRATION_MAP_2026-08-23.md` | Black Label surface-to-implementation map |
| `KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md` | This document |

### Status indexes — authoritative for status, and only for status

| Document | Owns |
| --- | --- |
| `FEATURE_STATUS.md` | Capability status |
| `EXTERNAL_DEPENDENCY_MATRIX.md` | External connection and gate truth |
| `PRODUCTION_ENVIRONMENT_TRUTH.md` | Runtime configuration truth |
| `ROUTE_REGISTRY.md` | Route implementation truth |
| `MVP_JOURNEYS.md` | End-to-end proof contracts |
| `BRANCH_LEDGER.md` | Branch and PR ledger |

These are maintained against the repository. When one disagrees with the code, the code
wins and the index is a defect to be corrected.

### Snapshots — never authoritative for what exists now

| Document | Was true as of |
| --- | --- |
| `ADVERSARIAL_BUYER_AUDIT_2026-08-18.md` | 2026-08-18 |
| `BUILD_STATUS_2026_FOUNDING_CLINIC_PLAN.md` | undated founding-clinic plan |
| `RECOVERY_AND_COMPLETION_ROADMAP.md` | 2026-08-17 |
| `EXPOSED_UI_AUDIT.md` | undated UI audit |
| `ROUTE_ACTION_AUDIT.md` | undated route audit |
| `COMPETITIVE_INTELLIGENCE_2026-08-20.md` | 2026-08-20 |
| `KLINIKOS_ICP_PRICING_EVIDENCE_2026-08-20.md` | 2026-08-20 |
| `PUBLIC_ZUMI_IMPLEMENTATION_VERIFICATION.md` | dated verification run |
| `ROUTE_REGISTRY_STATUS.md` | generated route-contract status snapshot from 2026-08-27 basis SHA |
| `KLINIKOS_PRODUCT_CONTROL_AND_COMPREHENSION_CANON.md` (§ status sections only) | 2026-08-20 |

### Reference

| Document | Owns |
| --- | --- |
| `MARKETPLACE_DESIGN_RESEARCH.md` | Marketplace design research |

## 7. Definition of done

A feature is not complete because a page exists. The chain is:

> visible UI → user action → identity and context → intent → authorization and
> eligibility → domain engine → real data → persistence and event → truthful result →
> audit and financial state where required → next useful action.

Release additionally requires: current main, clean migration chain on an empty database,
`prisma validate`, `prisma generate`, typecheck, lint, tests, MVP journeys, security
tests, production build, startup smoke, browser and mobile QA, review, merge, and
verification of the exact deployed SHA — plus external runtime evidence where a claim
depends on an external system.

## 8. Priority stack

```
P0  Restore and stabilize CI and the release pipeline
P0  Reconcile database and migration truth
P0  Close PHI-production security gaps
P1  Safely converge the draft PR stack
P1  Finish the Current Visit golden case
P1  Complete staff handoff and clinical change
P1  Complete identity, profession and authority foundation
P1  Complete the Grid pilot transaction loop
P1  Finish the EDU institutional release
P2  Revenue integrity
P2  First verified external lab / clearinghouse / telehealth / radiology rails
P2  Zumi governed action execution
P2  Memory and Knowledge OS
P3  Specialty pack expansion
P3  Enterprise network
P3  Ambient clinical intelligence
P3  Large-scale commerce and network economics
```

## 9. What must never be claimed

Klinikos does not currently claim, and no surface may state, that it is a certified EHR,
HIPAA compliant, or connected live to a lab, payer, clearinghouse or e-prescribing rail;
that a licence or malpractice history has been externally verified; that a payout has
settled; or that a free trial exists.

**PHI production readiness is not claimed.** The production database posture has open
findings across HIPAA configuration, database roles, network access, row-level security,
backup and restore, incident response and negative authorization testing. Until that gate
is evidenced in full, Klinikos must not be represented as ready for real patient data.

## 10. In one paragraph

Klinikos is becoming a healthcare operating ecosystem rather than another EHR. One
identity moves from education to employment to ownership. Clinic OS runs operations and
care. Current Visit makes the physician's work radically simpler. Grid connects
healthcare people, work, space, capacity, services and education. EDU creates competency
and workforce supply. Financial OS connects work to money. Zumi is the governed
intelligence layer that understands context and helps people reach outcomes. Underneath
sit shared identity, authority, evidence, workflow, transaction, configuration and audit.
The frontend stays simple, the backend becomes powerful, and nothing consequential is
allowed to be fake, unauthorized, unsupported or unverifiable.