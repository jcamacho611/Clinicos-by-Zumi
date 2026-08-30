# Klinikos Zero-Context Master Build Handoff

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Give any capable engineering/product agent enough permanent context to continue building Klinikos correctly without reducing it to one familiar software category, duplicating systems, losing founder/clinician intent, or repeatedly asking the founder to restate the architecture.

**Architecture:** Klinikos is one governed healthcare operating network with a radically simple, role/context-specific frontend over a deep shared substrate for identity, relationships, authority, Care, Grid, EDU, Network, Financial OS, evidence, integrations, Zumi, and enterprise operations. Existing authoritative systems are preserved and converged. The user sees only the active experience envelope needed for the current person, relationship, purpose, authority, entitlement, object, and moment.

**Tech Stack:** Current repository truth controls. Inspect the actual Next.js/TypeScript/PostgreSQL/Prisma application, current infrastructure, tests, Render deployment contract, and active PRs before changing implementation.

**Spec:** This handoff composes the approved final-form universal-experience design, operating-network kernel design, path execution map, frontend canon, Grid/EDU/clinical canons, product-truth rules, and screen/Zumi/data-governance work in PRs #356 and #357.

## Global constraints

- Product: **KLINIKOS**.
- Canonical public line: **Klinikos. The clinic operations ecosystem, powered by Zumi.**
- Zumi is Klinikos intelligence/orchestration, not legal, clinical, credential, permission, payment, or security authority.
- EHR/EMR, CRM, LMS, telemedicine, billing, marketplace, staffing, analytics, etc. are capability labels, not the parent definition.
- **Complexity belongs in Klinikos, not in the user's hands.**
- **One identity, many governed experiences.**
- **Free participation is distribution infrastructure.**
- **Land without displacement. Expand by usefulness. Replace by earned trust.**
- **Founder omission does not equal engineering omission.**
- **No known failure mode may disappear silently.**
- Browser = experience. Server = authority/proprietary logic. DTO = disclosure boundary.
- Claim != verified fact != authority.
- Match != offer != acceptance != reservation != booking != fulfillment != settlement.
- Code != merged != deployed != runtime-verified != production-live.
- Do not create a second Grid, Zumi, identity system, Clinic OS, Financial OS, truth registry, audit authority, or parallel app.
- Do not big-bang rewrite. Preserve, understand, adapt, harden, generalize, extend.
- Do not claim HIPAA compliance, certification, live integrations, payment completion, credential verification, customer status, or measured outcomes without evidence.
- Use synthetic/deidentified data until the PHI production gate is actually satisfied.

---

# 1. Product definition

Klinikos is the governed operating, clinical, professional, educational, financial, capacity, transaction, network, evidence, memory, and intelligence infrastructure for the healthcare lifecycle.

Two major lifecycle chains converge inside one system:

**Professional lifecycle**

STUDENT → EDUCATION → PRACTICE/SIMULATION → COMPETENCY EVIDENCE → PLACEMENT → CREDENTIAL → GRID ELIGIBILITY → WORK → EXPERIENCE → REPUTATION → INDEPENDENT PRACTICE → CLINIC OWNER → MULTI-LOCATION OWNER → EMPLOYER/EDUCATOR/PRECEPTOR/NETWORK OPERATOR.

**Patient/care/revenue lifecycle**

PATIENT DEMAND → DISCOVERY/ACCESS → REGISTRATION → SCHEDULING → INTAKE → ENCOUNTER → DOCUMENTATION → ORDERS → RESULTS → FOLLOW-UP → CODING → CHARGE → CLAIM → ADJUDICATION → PAYMENT → RECONCILIATION → OUTCOME → FUTURE CARE.

All major experiences are projections of shared primitives rather than unrelated applications.

Shared primitives include Person, Account, Organization, Location, Relationship, Profession, Role, Capability, Credential, Privilege, Assignment, Purpose, Consent, Patient, Coverage, FinancialCase, Resource, Availability, Demand, Requirement, Eligibility, Opportunity, Encounter, Evidence, Task, Order, Result, Document, Communication, Event, Transaction, Obligation, PaymentEvidence, Fulfillment, Outcome, Audit, Configuration, Memory, Knowledge, and Decision.

# 2. Universal user order

Canonical lifecycle:

DISCOVER → RECEIVE VALUE → EXPRESS INTENT → IDENTITY WHEN PERSISTENCE MATTERS → CLAIM → VERIFY WHAT THE NEXT ACTION REQUIRES → ESTABLISH RELATIONSHIP/AUTHORITY → PERSONALIZED EXPERIENCE → WORK → OUTCOME → ECONOMIC VALUE → EVIDENCE → RETURN → NETWORK EXPANSION.

Do not force registration before useful public value where persistence/authority is not yet needed.

Signup is the first experience-resolution event, not permanent classification.

# 3. Active Experience Envelope

Continuously resolve the user's active experience from at least:

- identity and assurance level
- active relationship
- active organization/location
- profession/role
- credential/privilege state
- authority and purpose
- entitlement
- current intent
- current work object
- patient/case context where authorized
- policy/jurisdiction
- time and risk state

Keep separate:

EXISTS != DISCOVERABLE != PROMOTED != ELIGIBLE != ENTITLED != AUTHORIZED != VISIBLE DATA != ACTIONABLE NOW.

Changing Clinic A → Grid → EDU → Clinic B is a security/context event. Recompute navigation, data scope, permissions, Zumi context/tools, notifications, promotions, and audit. Do not let prior-context PHI or organization data bleed across experiences.

# 4. Every screen requires a Screen Experience Contract

No route is complete until its contract declares:

- audience and purpose
- visible-by-default information
- intentionally hidden information
- discoverable/promotable capabilities
- eligibility, entitlement, and authority requirements
- minimum-necessary data projection
- available actions
- blocked/denied/loading/empty/error/partial states
- mobile composition
- accessibility/keyboard/focus requirements
- analytics/evidence events
- Zumi READ scope
- Zumi INFER scope
- Zumi RECOMMEND scope
- Zumi PREPARE/DRAFT scope
- Zumi EXECUTE-through-governed-tools scope
- Zumi FORBIDDEN actions
- AI-processable data classes
- prohibited AI data
- processing purpose/basis/agreement key
- PHI boundary
- model-training boundary
- audit/provenance requirements
- commercial-targeting restrictions

An unclassified active route is a release blocker.

# 5. Zumi operating contract

Zumi should feel like Klinikos itself is intelligent, not like a detached chatbot.

Zumi may understand, retrieve, organize, summarize, compare, explain, recommend, prepare, draft, route, orchestrate, and invoke already-authorized tools.

Zumi may not manufacture identity, organization ownership, credential validity, licensure, role/privilege, clinical truth, signature, consent, eligibility, payment truth, settlement truth, legal acceptance, or security policy.

Preferred action loop:

NATURAL LANGUAGE → INTENT → AUTHORIZED CONTEXT → DETERMINISTIC ELIGIBILITY/POLICY → PREPARE → HUMAN REVIEW/CONFIRMATION WHERE REQUIRED → TOOL EXECUTION → VERIFY RESULT → AUDIT/EVIDENCE → NEXT ACTION.

AI service processing must be purpose-specific and minimum necessary. Ordinary product acceptance is not unrestricted permission for general-purpose model training. Public Zumi must not accept PHI. PHI-enabled Zumi workflows require the approved healthcare AI rail and applicable contractual/privacy/security controls. Authentication secrets and payment secrets never enter model context. Clinical PHI must not silently become advertising/commercial targeting data.

# 6. Frontend law

The frontend must feel calmer as the backend becomes more sophisticated.

Default question: **What needs to happen?**

Default user answers should make clear:

- where am I?
- what matters?
- what changed?
- what needs me?
- what happens next?

Do not expose internal domain architecture as navigation merely because it exists.

Normal role navigation should remain small, generally 4–7 destinations. Deep functionality is available through context, search, Zumi, object stages, progressive disclosure, and deep links.

Visual target: premium, calm, precise, trustworthy, spacious, intentional. Public Living Home may be cinematic Obsidian; operational product should support appropriate Marble/Obsidian expressions. No generic hospital-blue portal, cyberpunk AI, card-wall dashboard, or decorative motif that overwhelms the product. Brand atmosphere is subordinate to product clarity.

# 7. Living Home

Living Home is the adaptive operating front door, not a KPI dashboard or module directory.

User intent may resolve to Care, Grid, Money, EDU, Network, Patient, Enterprise, or another governed workflow without requiring the user to know the domain name.

Examples:

- “I need an RN Friday.” → Grid demand/opportunity path.
- “Which patients still need intake tomorrow?” → patient/operations readiness.
- “Why haven't we been paid?” → revenue/claim/evidence composition.
- “Find clinical placements for these students.” → EDU + Grid.

Prefer inline useful result and action. Deep workspace only when the task actually requires it.

# 8. Public SEO/acquisition architecture

Public routes are precise problem-entry doors into one ecosystem, not disconnected microsites.

Required route families to preserve/audit/implement as truthful demand warrants:

- `/ehr`
- `/compare/mdland`
- `/ehr/independent-practices`
- `/telemedicine`
- `/ai-medical-scribe`
- `/no-fault`
- `/billing-readiness`
- `/labs`
- `/imaging`
- `/referrals`
- `/clinic-operations`
- `/clinical-change`
- `/specialties/pain-management`
- `/specialties/physical-therapy`
- `/specialties/emg-neurodiagnostics`
- `/grid`
- `/edu`

Public flow:

SEARCH / ADS / SOCIAL / REFERRAL → EXACT PROBLEM ROUTE → USEFUL ANSWER → ZUMI UNDERSTANDS INTENT → RELEVANT CTA → ACCOUNT ONLY WHEN USEFUL → CLAIM/VERIFICATION IF NEEDED → CORRECT EXPERIENCE → REAL WORK/PROPOSAL/OPPORTUNITY → OUTCOME/EVIDENCE → RETURN.

SEO requirements:

- truthful canonical URLs
- unique title/meta/H1 by intent
- canonical tags
- sitemap/robots correctness
- schema markup where truthful/useful
- index public value pages
- do not index authenticated/private operational routes
- avoid duplicate thin pages
- no fake integrations/results/customer claims
- connect each route to a measurable conversion event and revenue/network path

Language should describe the buyer's problem in ordinary terms first. Do not lead every page with architecture jargon.

Canonical public company/category/promise:

**Klinikos. The clinic operations ecosystem, powered by Zumi.**

Supporting ideas:

- “Run the clinic through one connected operating experience.”
- “The expensive part isn't storing information. It's failing to move the work forward.”
- “Complexity underneath. Clarity above.”
- “Not more modules. One operating experience.”
- “Zumi turns intent into action.”

Do not claim competitors lack features they actually have. Differentiate on workflow continuity, orchestration, longitudinal context, role-specific simplicity, network participation, unfinished-work ownership, and economic completion.

# 9. Free participation and Grid distribution

Free is distribution/network infrastructure, not simply a cheap plan.

A participant may enter to learn, work, earn, find staff, find space, offer capacity, find services, create a professional identity, or advance a career.

Primary public Grid language: **I NEED / I HAVE**.

Grid must support generalized people/resources/capabilities/demand/availability rather than only staffing.

Candidate resource/opportunity classes include professionals, shifts/work, rooms/chairs/space, facilities, services, equipment where appropriate, education capacity, preceptors, placements, diagnostic capacity, referral capacity, and other lawful healthcare business resources.

Transaction truth remains staged:

DEMAND → DISCOVERY → ELIGIBILITY → MATCH → OFFER → ACCEPTANCE → AGREEMENT → RESERVATION → PAYMENT CONDITION → BOOKING → FULFILLMENT → OBLIGATION → PAYOUT/RECONCILIATION → CLOSED.

Hard eligibility precedes ranking. Uploaded credentials do not themselves establish legal authority. Zumi may interpret intent and explain eligibility, but deterministic policy/credential/relationship systems govern eligibility.

# 10. Land-without-displacement commercialization

Do not require a clinic to replace an incumbent system on day one.

Possible progression:

PUBLIC VALUE → GRID / OPERATING MAP / WORKFLOW REVIEW → ORGANIZATION VERIFICATION → ONE HIGH-VALUE WORKFLOW → IMPLEMENTATION → RECURRING OPERATIONS → MONEY/INTELLIGENCE → CURRENT VISIT / CARE EXPANSION → BROADER KLINIKOS ADOPTION.

Large organizations may retain an incumbent core record system while Klinikos coordinates surrounding workflow. Smaller/new practices may eventually use much more of the full environment.

# 11. Dr. Nadja / first-practice clinical requirements

Treat Nadja as practicing clinical leadership/design-customer evidence and the first-practice implementation path. Do not call her an independent paying customer unless contract/payment evidence exists.

Central requirement: **ONE CONTINUOUS CURRENT VISIT.**

The physician should not navigate a wall of disconnected modules.

Desired qualities:

- simple
- fast
- easy to learn
- minimal unnecessary screens
- important clinical/history/context information immediately available

Immediate context should include, where relevant/authorized:

- demographics/photo/identity context
- chief complaint
- past medical history
- surgical history/hospitalizations
- medications
- allergies
- problem list
- prior diagnoses/procedures/codes
- recent labs/imaging/results
- vitals
- prior/follow-up information
- insurance/case context
- emergency/kin relationships
- consent/authorization state
- immunization/advance-planning state where applicable

Staff workflow must support MA/LPN/RN intake and handoff into provider work.

Canonical encounter:

SCHEDULED → INTAKE → PATIENT SNAPSHOT / WHAT CHANGED → STAFF HANDOFF → CURRENT VISIT / TODAY → CLINICAL → ASSESSMENT & PLAN → ORDERS & RESULTS → DOCUMENTATION & CODING → FOLLOW-UP → CLOSE VISIT.

Telemedicine belongs inside the same encounter:

appointment → readiness/consent → video → same encounter → documentation → orders → coding/readiness → follow-up → close.

Do not create a separate telehealth chart.

# 12. Longitudinal Clinical Change

Clinical reasoning is INITIAL → PREVIOUS → TODAY, not isolated notes.

Track evidenced change in symptoms, pain, body region, laterality, functional limitation, ADLs, ROM, exam findings, work status, medications, treatment progression, procedure response, labs, imaging, new evidence, improved/worsened/unchanged/resolved state.

Body maps and clinical observations must be versioned. Today must never overwrite prior truth.

AI may explain evidenced changes. AI must not invent changes.

# 13. Clinical documentation and scribe

Documentation can include demographics, CC, HPI/history, ROS, vitals, exam, body diagrams, diagnoses, assessment, plan, procedures, instructions, follow-up, signatures, addenda, and provenance/version history.

AI scribe pipeline:

audio/dictation → transcript → evidence extraction → structured draft → missing-documentation detection → coding candidates → human review/edit → authorized signature.

AI must never invent exam findings, laterality, diagnosis, procedure, medical history, justification, or evidence.

# 14. Coding, billing readiness, Revenue Integrity

Support ICD-10-CM, CPT, HCPCS where applicable, modifiers, evidence-linked suggestions, missing-documentation detection, accept/edit/reject, provider/coder review, claim readiness, and effective-date awareness.

Never create documentation simply to justify a higher code.

Long-term revenue chain:

PERFORMED → DOCUMENTED → CODE SUPPORTED → CHARGE EXPECTED → CHARGED → CLAIM READY → SENT → ACCEPTED/REJECTED → ADJUDICATED → PAID → RECONCILED.

Surface leakage such as performed-not-charged, signed-not-coded, charge-without-claim, claim-without-acceptance, denial follow-up, unreconciled payment, etc.

# 15. No-Fault / case-based specialty depth

No-Fault must be more than a note template. Support configurable case context such as accident date/mechanism, carrier, policy/claim, adjuster, attorney, authorizations, IME, denials/appeals/deadlines, baseline injury/symptoms/body regions, hospital/ER/surgery history, work status, ADLs/function, treatment progression, imaging/EMG/procedures, codes, correspondence, and financial progression.

Specialty depth must come through a configurable clinical-component/specialty-pack model, not customer code forks.

# 16. Orders, results, referrals, external integrations

Klinikos owns the internal workflow/state; external networks remain adapters/rails where appropriate.

Canonical order/result lifecycle should distinguish created, transmitted, externally accepted, accessioned/scheduled, collected/performed, preliminary, final, corrected/amended, provider reviewed, patient informed where appropriate, financially reconciled, and closed.

Corrected results may reopen clinical review.

External mapping/rejection failures become visible reconciliation work, never silent loss.

Integrate rather than needlessly recreate authoritative rails such as labs (Quest/Labcorp/BioReference/etc.), imaging/PACS, payer/clearinghouse transactions, pharmacy/eRx networks, payment networks, and government/credential sources. Do not claim any vendor is live until verified.

# 17. EDU/workforce

EDU is not a disconnected LMS. It connects learning to evidence and opportunity:

LEARN → PRACTICE → DEMONSTRATE → HUMAN REVIEW → COMPETENCY EVIDENCE → OPT-IN GRID DISCOVERY → OPPORTUNITY → WORK → EXPERIENCE.

Institutional capabilities may include organizations/programs/cohorts, instructors, roster/import, live/remote/hybrid delivery, curriculum selection/configuration, objectives, completion criteria, assessment/rubrics, attendance, completion evidence, accessibility metadata, reporting, certificates with non-licensure disclaimers, revision history, and audit evidence.

Zumi supports scenarios/drafts/critique but does not become instructor authority, licensure authority, completion authority, or employment-eligibility authority.

# 18. Network and relationship graph

Represent relationships explicitly and effectively-dated.

Canonical professional/org relationship dimensions can include:

Provider × Organization × Location × Specialty × Role × Privilege × Service × Payer × Credentialing Readiness × Effective Dates.

Invitation acceptance does not automatically create trusted access. Relationship establishment, purpose, organization approval, sharing agreement/consent, and data authority remain separate.

# 19. Financial OS

One Financial OS should own server-side truth for price, quote, checkout intent, payment intent, payment evidence, entitlement, financial obligation, payable, refund, settlement, reconciliation, and audit.

Do not scatter pricing/fee logic across domains. Browser does not create payment truth. Redirect/checkout success page != payment evidence.

# 20. Backend engineering floor

Engineer for failures the founder should not have to name individually:

- duplicate requests/webhooks
- stale sessions/tabs
- concurrent writes
- partial transactions
- timeouts/late external success
- provider outages
- queue failure/retry storms
- failed migrations/deployments
- credential expiry/revocation
- relationship/consent changes
- duplicate/corrected external results
- failed communications
- refunds/disputes/no-shows
- malicious uploads/fraud/impersonation
- cross-tenant access attempts
- AI hallucination/prompt injection/provider outage
- backup restoration/disaster recovery

Use domain-appropriate idempotency, transactional writes, outbox/inbox patterns where warranted, queues, backoff, DLQ, reconciliation, correlation IDs, append-only audit, observability, feature flags, rollback, backups, restore tests, SLOs, runbooks, incident response, rate limits, abuse controls, and migration safety.

# 21. Security/privacy/secret boundary

Anything confidential/proprietary stays server-side, including hidden Zumi prompts/orchestration rules, Grid ranking/anti-gaming logic, risk/trust algorithms, pricing/margins, security heuristics, source/database internals, credentials/secrets, and unnecessary PHI/PII.

Use least privilege, tenant isolation, server-owned authority, minimum-necessary projections, secure uploads, encrypted transport/storage, secure secrets, audit, session security, MFA where required, environment separation, retention/deletion controls, vendor/BAA tracking, incident response, backup/restore, and negative authorization tests.

Do not publicly claim PHI production readiness until the verified security/compliance deployment gate is satisfied.

# 22. Configuration over forks

Create/use one versioned configuration registry so specialty/org/location differences become configuration inheritance rather than customer-specific code.

Preferred inheritance:

BASE KLINIKOS → SPECIALTY PACK → ORGANIZATION OVERRIDE → LOCATION OVERRIDE.

Configuration candidates include templates, components, appointment types, specialty rules, order sets, workflows, permissions, questionnaires, coding rules, patient forms, entitlements, No-Fault rules, notifications, and integration options.

# 23. Product truth and evidence

Every capability must have explicit truth state such as:

BUILT / PARTIAL / PLACEHOLDER / DEMO-ONLY / IMPLEMENTED-UNVERIFIED / DEPLOYED-UNVERIFIED / PRODUCTION-VERIFIED / BLOCKED / PLANNED / DEPRECATED / NEEDS-REFACTOR.

Maintain evidence for customer/investor/lender/procurement use without converting projection into fact.

# 24. Repository and production truth

Repository: `jcamacho611/Clinicos-by-Zumi`.
Production domain: `https://klinikos.io`.
Render is current production hosting authority unless explicitly superseded.

At every execution cycle re-fetch latest `main`, recent commits, active PRs, schema/migrations, route tree, canons, tests, CI, Render deploy state, health/release identity, and blockers.

Current architecture work to reconcile includes at minimum PR #356 (design) and PR #357 (implementation), plus older active identity/account, Living Home server-authority, EDU/workforce, memory, network, commerce, legal, communications, theme, and failover work. Do not bulk merge. Build a dependency/overlap graph.

# 25. Dependency-ordered implementation program

- [ ] **Gate 0 — current truth/concurrency:** latest main, PR graph, deployment truth, schema/migration truth, product-truth registry, current route census, current blockers.
- [ ] **Gate 1 — shared control plane:** identity/account/person, organizations/locations, relationships, authority/purpose/consent, entitlements, audit/events, configuration, Financial OS, data-projection boundaries.
- [ ] **Gate 2 — public acquisition/entry:** problem routes, SEO, public Zumi, value-before-registration, safe intent continuation, universal protected entry, free account, claim/verification routing.
- [ ] **Gate 3 — Active Experience Envelope:** context switching, experience composer, screen contracts, role/object projections, promotion vs eligibility vs entitlement vs authority.
- [ ] **Gate 4 — Grid free-distribution loop:** I NEED/I HAVE, supply/demand, eligibility, matching, opportunity, return/invite/referral, organization conversion.
- [ ] **Gate 5 — first-practice clinical convergence:** intake, Current Visit, clinical change, body map, telemedicine-in-encounter, close visit, measured Nadja golden case.
- [ ] **Gate 6 — orders/results/referrals/communication:** canonical lifecycle, external adapters, reconciliation, unfinished-work ownership.
- [ ] **Gate 7 — documentation/coding/revenue:** scribe/evidence, coding review, billing readiness, revenue integrity, Financial OS convergence.
- [ ] **Gate 8 — specialty/case depth:** No-Fault first deep pack; configuration engine; additional specialty packs without forks.
- [ ] **Gate 9 — EDU/workforce/network convergence:** learning evidence, Grid discovery, placements, professional lifecycle, organization/network relationships.
- [ ] **Gate 10 — reliability/security/PHI hardening:** authorization negatives, distributed throttling, tenant defense, BAA/vendor controls, backups/PITR/restore, incident response, model/data egress, load/performance.
- [ ] **Gate 11 — enterprise:** hierarchy, SSO, centralized policy/configuration, integration governance, procurement/security evidence, multi-location command, support/SLA readiness.
- [ ] **Gate 12 — commercialization/evidence:** measured first-practice results, repeatable implementation, funnel/activation/retention/expansion, customer evidence, lender/investor/procurement truth packets.

Do not treat these as permission to wait for later gates when an earlier-independent revenue route is already truthful and sellable. Manual-first is acceptable when state, ownership, evidence, and later automation seams are explicit.

# 26. Definition of done

A feature is not done because a page exists.

VISIBLE UI → USER ACTION → IDENTITY/CONTEXT → INTENT → AUTHORIZATION/ELIGIBILITY → AUTHORITATIVE DOMAIN ENGINE → REAL DATA → PERSISTENCE/EVENT → TRUTHFUL RESULT → AUDIT/FINANCIAL EVIDENCE WHEN REQUIRED → NEXT USEFUL ACTION.

A release is not done until the exact candidate receives executable evidence for relevant schema/migrations, Prisma validation/generation, typecheck, lint, tests, security negatives, builds, startup/health smoke, browser/mobile/accessibility, review reconciliation, merge, Render deploy status, `/api/health` release identity, and critical production-route smoke.

# 27. Final product test

The user should increasingly experience:

> I tell Klinikos what I need. It understands my authorized context. It shows only what matters. It prepares the correct work. It asks me only for decisions that actually require me. It executes what it is authorized to execute. It proves what happened. And it tells me what needs to happen next.

That is the target. Build the entire operating network underneath it without forcing the user to see the machinery.