# KLINIKOS MASTER CANON

Version: `2026-08-27.1`
Status: `ACTIVE - SOLE PRODUCT / ARCHITECTURE / BUSINESS / EXPERIENCE AUTHORITY`
Repository convergence baseline: `main@045a66d03404ed472c2f7dbf1c644be4446db33b`

> **There is one Klinikos.**
>
> We did not abandon our earlier work. We graduated through it.

This file is the single current governing specification for what Klinikos is, how it works as one ecosystem, how users experience it, what Klinikos owns, what external rails it integrates, how Zumi fits, how the product protects itself, and how implementation must converge.

Earlier prompts, canons, architecture snapshots, physician feedback, Grid iterations, EDU iterations, clinical models, identity models, financial models, legal drafts, business plans, design packages, PR descriptions, and status reports are evidence and provenance. They are not parallel current products.

---

# 0. AUTHORITY, TRUTH, AND MERGE-FORWARD LAW

## 0.1 One product authority

`docs/KLINIKOS_MASTER_CANON.md` is the sole active product/architecture/business/experience authority.

No specialist document, old master file, PR body, prompt, design handoff, status snapshot, or historical architecture may independently redefine Klinikos.

Specialist documents may elaborate this canon. They may not override it.

Historical documents may explain why a decision exists. They may not override it.

## 0.2 What exists today

Current implementation truth is determined by current evidence:

- code,
- schema,
- migrations,
- tests,
- exact-head verification,
- deployment evidence,
- verified runtime behavior,
- verified external integration state.

A canon decision does not manufacture implementation.

A stale status file does not defeat current code.

A merge does not prove deployment.

A credential does not prove a complete production integration.

## 0.3 Precedence

When sources conflict:

1. Current verified implementation determines what exists today.
2. This Master Canon determines instituted product architecture, product law, business architecture, experience direction, and intended behavior.
3. Specialist documents elaborate this Master Canon.
4. Evidence/provenance explains why decisions exist.
5. Historical/superseded documents have no current authority.

Conflicts must be resolved explicitly. Never silently blend contradictory snapshots.

## 0.4 Merge-forward protocol

Every material discovery follows:

`NEW INFORMATION`
→ `CLASSIFY`
→ `VERIFY`
→ `COMPARE TO CURRENT CANON`
→ `ACCEPT / REJECT / MODIFY`
→ `UPDATE THIS MASTER CANON`
→ `UPDATE IMPLEMENTATION CONSEQUENCES`
→ `OLD VERSION BECOMES PROVENANCE`.

Do not create another competing `SUPREME`, `FINAL`, `MASTER`, `SOURCE OF TRUTH`, or equivalent current product authority for an accepted product change.

## 0.5 Stable decisions

Material decisions use stable IDs inside this canon rather than a competing decision registry.

- `KLINIKOS-UX-001`: the protected access Terms/Confidentiality/IP airlock is the first protected interactive event.
- `KLINIKOS-PROTOTYPE-001`: prototype/UI language is an architectural claim that must be made true underneath.
- `KLINIKOS-IDENTITY-001`: one person, one evolving identity, many governed relationships.
- `KLINIKOS-AUTHORITY-001`: identity, claims, and conversational context are not authority.
- `KLINIKOS-GRID-001`: Grid is universal healthcare need/resource/capacity/opportunity infrastructure.
- `KLINIKOS-CLINICAL-001`: Current Visit is the provider-facing convergence surface.
- `KLINIKOS-INTAKE-001`: Intake and Consent are first-party Klinikos infrastructure.
- `KLINIKOS-BILLING-001`: Klinikos owns end-to-end clinical-to-financial workflow truth while integrating regulated external rails.
- `KLINIKOS-ZUMI-001`: Zumi interprets and orchestrates, deterministic Klinikos domains remain authority.
- `KLINIKOS-OPENAI-001`: OpenAI is the primary production intelligence platform for Zumi under the verified partnership direction, while provider abstraction and deterministic Klinikos authority remain intact.
- `KLINIKOS-SECURITY-001`: browser is experience, server is authority/proprietary execution, DTO is the disclosure boundary.
- `KLINIKOS-DOCS-001`: accepted product knowledge merges forward into this canon.

---

# 1. WHAT KLINIKOS IS

Klinikos is the governed operating, clinical, professional, educational, financial, capacity, transaction, network, memory, and intelligence infrastructure for the healthcare lifecycle.

It connects people, patients, professionals, students, educators, clinic staff, owners, organizations, locations, schools, employers, services, facilities, resources, care, referrals, education, work, credentials, authority, appointments, intake, consent, encounters, orders/results, documentation, coding, claims, money, outcomes, memory, and future opportunity through one ecosystem.

Klinikos is not reducible to an EHR, EMR, CRM, billing app, patient portal, staffing marketplace, job board, provider directory, LMS, telemedicine app, med-spa CRM, AI assistant, workflow automation tool, or payments product. Those may exist as capabilities inside Klinikos.

## 1.1 Governing experience law

> **Simple above. Powerful below.**
>
> **The complexity belongs to Klinikos, not to the person using Klinikos.**

The backend may be sophisticated. The surface should remain calm, premium, obvious, role-aware, purpose-aware, fast, and truthful.

## 1.2 One ecosystem, many experiences

A person should not feel that they are moving among disconnected products.

Klinikos composes the active experience from identity, relationship, role, profession, verified facts, intent, permissions, organization, location, current work, active object, consent/purpose, and policy.

The system may become a patient experience, provider workspace, clinic command environment, Grid surface, EDU environment, financial workspace, or network surface without fragmenting the person's identity.

---

# 2. PROTOTYPE-TO-PRODUCTION LAW

## KLINIKOS-PROTOTYPE-001

A prototype statement is not merely UI copy. It is a compressed architectural claim.

Every prototype, landing funnel, concept screen, Claude Design artifact, Figma concept, or visual handoff must be interrogated with:

> **What real identity, relationship, authority, workflow, evidence, financial, network, and data infrastructure would make this statement true?**

If a prototype says:

- a student becomes staff,
- competency follows the person,
- Grid knows eligibility,
- a clinic makes an offer,
- a reservation creates an obligation,
- a payment settles something,
- a worker gains experience,
- a clinic grows through the network,
- Zumi remembers what happened,
- Klinikos compounds an operating record,

engineering must build or map the real governed infrastructure underneath the statement.

Do not copy screens while leaving the underlying claim fake.

## 2.1 Canonical compounding workforce architecture

`EDU`
→ `LEARNING`
→ `APPLIED PRACTICE / SIMULATION`
→ `COMPETENCY EVIDENCE`
→ `HUMAN / INSTITUTIONAL REVIEW`
→ `CREDENTIAL / VERIFIED READINESS WHERE APPLICABLE`
→ `GRID DISCOVERY / ELIGIBILITY`
→ `ORGANIZATION / OPPORTUNITY`
→ `WORK`
→ `FULFILLMENT / EXPERIENCE EVIDENCE`
→ `REPUTATION / PROFESSIONAL RECORD`
→ `UPSKILLING / CONTINUING EDU`
→ `MORE OPPORTUNITY`.

Training evidence may inform opportunity readiness. It does not automatically create licensure or regulated authority.

## 2.2 Canonical compounding clinic/network architecture

`CLINIC OPERATIONS`
→ `DETECTED NEED / AVAILABLE CAPACITY`
→ `GRID`
→ `RELATIONSHIP / AGREEMENT`
→ `FULFILLMENT`
→ `FINANCIAL / OPERATIONAL EVIDENCE`
→ `NETWORK RELATIONSHIP`
→ `MORE CAPACITY / SUPPLY / DEMAND`
→ `MORE USEFUL KLINIKOS`
→ `MORE RETENTION / REVENUE / EXPANSION`.

---

# 3. SHARED KLINIKOS SUBSTRATE

Klinikos should converge onto reusable governed primitives instead of rebuilding the same truth independently inside each domain.

## 3.1 Identity and authority primitives

- Person
- Account
- Organization
- Location
- Relationship
- OrganizationMembership
- LocationAssignment
- Role
- Profession
- Capability
- Claim
- VerificationEvidence
- Credential
- License
- Privilege
- Assignment
- Delegation
- Supervision
- PurposeOfUse
- Consent
- AuthorityDecision

## 3.2 Care primitives

- Patient
- Coverage
- FinancialCase
- Encounter
- CurrentVisit
- ClinicalEvidence
- Observation
- Vitals
- BodyMap
- Diagnosis
- Procedure
- Medication
- Order
- Result
- Referral
- CarePlan
- Document
- Communication
- FollowUp

## 3.3 Grid/work/capacity primitives

- Resource
- Demand
- Availability
- Requirement
- Eligibility
- Match
- Opportunity
- Offer
- Agreement
- Reservation
- Assignment
- Fulfillment
- Incident
- Dispute
- ReputationEvidence

## 3.4 EDU primitives

- Program
- Cohort
- Module
- Session
- Enrollment
- AttendanceEvidence
- Scenario
- Assessment
- Rubric
- Submission
- CompetencyEvidence
- CompletionDecision
- EducationCredential

## 3.5 Financial/execution primitives

- Price
- Quote
- Charge
- Invoice
- PaymentIntent
- PaymentEvidence
- FinancialObligation
- Claim
- Remittance
- Payable
- Payout
- Settlement
- Refund
- Reconciliation
- RevenueIntegrityException
- Entitlement
- Task
- Obligation
- Event
- AuditEvent
- Evidence
- Outcome

## 3.6 Intelligence/governance primitives

- Configuration
- Memory
- Knowledge
- Decision
- Provenance
- ExternalExchange
- ReconciliationWorkItem

## 3.7 No duplicate authority

Do not create a second identity system for Grid, second ledger for Billing, second scheduler for telemedicine, second task system for referrals, second credential truth store for EDU, second organization model for Marketplace, second Zumi, second Current Visit, second patient chart, or memory layer that quietly replaces live records.

Where legacy systems overlap, preserve, understand, adapt, harden, generalize, and extend. Do not big-bang rewrite working systems.

---

# 4. CANONICAL LITERAL USER EXPERIENCE

## KLINIKOS-UX-001 - Protected access comes first

The literal protected interactive experience begins with the legal/trust airlock.

Abstract product lifecycle diagrams such as `DISCOVER → VALUE → INTENT → IDENTITY` describe economics and product logic. They do **not** override literal protected screen/event order.

## 4.1 Exact order

`PROTECTED ACCESS TERMS + CONFIDENTIALITY / IP / RESTRICTED-USE AIRLOCK`
↓
`ENTER KLINIKOS`
↓
`LIVING HOME - WHAT NEEDS TO HAPPEN?`
↓
`ZUMI CONVERSATION`
↓
`INTENT - I AM / I NEED / I HAVE / I WANT TO DO`
↓
`SAFE VALUE PREVIEW`
↓
`ACCOUNT VALUE TRIGGER`
↓
`ONE UNIVERSAL KLINIKOS IDENTITY`
↓
`PRESERVE ORIGINAL CONVERSATION + INTENT`
↓
`CLAIMS`
↓
`PATH-AWARE VERIFICATION`
↓
`AUTHORITY`
↓
`ACTIVE EXPERIENCE ENVELOPE`
↓
`ROLE / RELATIONSHIP / OBJECT-SPECIFIC EXPERIENCE`
↓
`GRID / EDU / CARE / CLINIC OS / FINANCIAL / NETWORK CAPABILITIES AS NEEDED`
↓
`REAL ACTION`
↓
`FULFILLMENT / OUTCOME / EVIDENCE`
↓
`MEMORY + NEXT ACTION`
↓
`RETURN / EXPANSION / NETWORK EFFECT`.

## 4.2 Public discovery versus protected interaction

Public SEO and public marketing/discovery may remain readable where appropriate. Public visibility is not protected product access.

Klinikos distinguishes:

- public discovery,
- public-safe product/Zumi explanation,
- patient-specific access,
- protected professional/product interaction,
- protected investor/partner/demo/data-room interaction,
- authenticated governed product use.

The protected-access policy controls which interactions require the first airlock. Patient-specific legal routing may differ where required by patient-access law and product safety.

## 4.3 Protected access airlock

The first protected interaction must be affirmative and versioned.

The execution package should combine the baseline access terms with confidentiality, IP, trade-secret, restricted-use, and misuse consequences rather than reducing protection to a footer Terms link.

The package should include, as appropriate and after licensed-counsel review:

- Terms of Use,
- privacy acknowledgment,
- confidentiality obligations,
- protected-access restrictions,
- intellectual-property ownership/reservation,
- trade-secret protection,
- no unauthorized copying/export/recording,
- anti-scraping/crawling/harvesting,
- anti-reverse-engineering/reconstruction,
- no hidden-prompt/orchestration/ranking extraction,
- no unauthorized AI ingestion/training/fine-tuning/benchmarking for replication,
- no credential sharing or security-gate bypass,
- no competitive use of protected information,
- bounded anti-circumvention for protected non-public introductions where lawful,
- no indirect facilitation loophole,
- return/deletion/destruction obligations where applicable,
- evidence-preservation obligations,
- suspension/revocation rights,
- breach consequences and remedies,
- liability allocation and indemnity where counsel-approved,
- dispute/governing-law provisions in the applicable execution version,
- electronic execution evidence.

Technical evidence should preserve:

- document key,
- version,
- effective date,
- content hash,
- signer identity,
- signer capacity,
- organization context,
- authority representation,
- required acknowledgments,
- presentation/review evidence,
- signature method,
- signed timestamp,
- request/session correlation evidence,
- protected destination,
- superseded-version relationship.

The server owns the current agreement/version/hash and acceptance state.

Electronic execution should be designed consistently with applicable E-SIGN requirements and exceptions. Covered employee/contractor/consultant confidentiality agreements must account for the DTSA notice requirement in 18 U.S.C. §1833(b). Final enforceability, liquidated damages, liability caps, indemnity, fee shifting, restrictive covenants, anti-circumvention scope, forum, arbitration, and consumer/business treatment remain licensed-counsel decisions.

## 4.4 Enter Klinikos

After the required protected-access acceptance, the person deliberately enters Klinikos.

This should feel like entry into a controlled operating environment, not a generic SaaS checkbox modal.

## 4.5 Living Home

Primary prompt:

> **WHAT NEEDS TO HAPPEN?**

Do not lead with a permanent persona picker or a wall of product modules.

## 4.6 Zumi conversation

Representative statements:

- "I need a physical therapist."
- "I own a clinic and our billing is a mess."
- "I'm an RN looking for work."
- "I want to start my own practice."
- "We need coverage Tuesday."
- "I'm here for my appointment."
- "I need clinical placement hours."
- "I have procedure space Fridays."
- "Show me what changed with this patient."

Zumi internally normalizes useful context such as `I AM`, `I NEED`, `I HAVE`, `I WANT TO DO`, but the user should not have to learn the taxonomy.

## 4.7 Safe value preview

Klinikos should create useful momentum before demanding unnecessary registration where policy permits.

Safe preview may show relevant classes of resources/opportunities, a clinic workflow/readiness insight, an educational route, service discovery, or what is required next.

Safe preview may not disclose PHI, protected identities, private tenant state, hidden ranking/policy logic, confidential prompts, sensitive business strategy, or proprietary internals.

## 4.8 Account value trigger

Signup/login should occur when persistence or governed action becomes useful, such as save, apply, contact, request, book, claim, manage, post, message, transact, enroll, upload, sign, operate, or return later.

## 4.9 Preserve original intent

Authentication must not erase the journey.

Preserve the minimum safe state needed to resume:

- source route,
- structured intent,
- stated goal,
- safe bounded continuation context,
- user-authorized location,
- public object IDs,
- intended action.

Do not serialize raw PHI, secrets, confidential prompts, or proprietary internal state into URLs or browser-owned continuation data.

---

# 5. UNIVERSAL IDENTITY, CLAIMS, VERIFICATION, AUTHORITY

## KLINIKOS-IDENTITY-001

One person has one durable Klinikos identity with many governed relationships and contexts.

The same person may be a patient, student, MA, LPN, RN, NP, PA, physician, therapist, coder, biller, employee, contractor, Grid participant, educator, preceptor, clinic owner, organization executive, employer, or resource owner without creating disconnected identities.

## 5.1 Conceptual stack

`PERSON`
→ `ACCOUNT / AUTHENTICATION`
→ `CLAIMS`
→ `VERIFICATION EVIDENCE`
→ `RELATIONSHIPS`
→ `ROLES / PROFESSIONS`
→ `CREDENTIALS / LICENSES / PRIVILEGES`
→ `ASSIGNMENTS / LOCATIONS`
→ `PURPOSE / CONSENT / CASE / RESOURCE CONTEXT`
→ `AUTHORITY DECISION`.

## KLINIKOS-AUTHORITY-001

`CLAIM != VERIFIED FACT != AUTHORITY`.

"I'm a nurse," "I own this clinic," "I'm the patient's daughter," or "I'm the manager" may establish conversational context. Those statements do not independently grant regulated or organization authority.

## 5.2 Progressive/path-aware verification

Verify only what the next consequential action requires.

Examples:

- browse learning: basic identity may be enough;
- regulated Grid opportunity: profession/license/credential evidence may be required;
- organization claim: representative authority must be established;
- chart access: tenant, relationship, role, purpose, resource scope, and privacy/clinical authorization must be satisfied;
- note signature: profession, privilege, assignment, scope, location, supervision/cosign, and encounter context matter;
- billing management: billing authority does not imply clinical signing;
- organization administration: admin authority does not automatically create unrestricted patient access.

## 5.3 Assurance ladder

Possible evidence levels include:

1. self-described context,
2. verified email,
3. verified phone,
4. organization-domain association,
5. organization representative evidence,
6. student/institutional evidence,
7. identity proofing where required,
8. professional identity evidence,
9. license evidence,
10. credential/privilege evidence,
11. organization/location assignment,
12. specific purpose/case/resource authority.

This is not one universal onboarding wizard. The action determines the required proof.

---

# 6. ACTIVE EXPERIENCE ENVELOPE

The Active Experience Envelope is the server-resolved context determining what Klinikos becomes for the person now.

Inputs may include:

- person/account,
- authentication assurance,
- organization/location,
- relationships,
- patient relationship,
- role/profession,
- claims/verification,
- licenses/credentials/privileges,
- assignments,
- delegation/supervision,
- purpose of use,
- consent,
- active patient/case/resource,
- current intent,
- current obligations/work,
- available capabilities,
- policy blockers,
- entitlements,
- external dependency state,
- safe remembered context.

Outputs should be minimum necessary:

- current context label,
- current objective,
- permitted next actions,
- relevant work,
- required verification,
- blockers,
- safe navigation/workspace options.

Context switching is a security event. Clinic A, Grid, EDU, Clinic B, provider, owner, and patient contexts must recompute scope, tools, permissions, data visibility, Zumi context, and audit. Prior PHI or tenant data must not bleed across contexts.

---

# 7. FIRST-CLASS USER PATHS

## 7.1 Patient

`DEMAND → ACCESS → IDENTITY → REGISTRATION → INTAKE → CONSENT → COVERAGE / FINANCIAL CASE → SCHEDULING → CURRENT VISIT / ENCOUNTER → ORDERS → RESULTS → FOLLOW-UP → BILLING → OUTCOME → FUTURE CARE`.

Patient Living Home may surface upcoming appointments, patient-owned incomplete intake, consent requiring action, released results, referral steps, visible balances, approved messages, and follow-up.

Patient access remains separately governed from staff/clinic access.

## 7.2 Professional

`IDENTITY → EDU → COMPETENCY → CREDENTIAL → AUTHORITY → GRID ELIGIBILITY → OPPORTUNITY → WORK → EXPERIENCE → REPUTATION → INDEPENDENT PRACTICE → CLINIC → NETWORK → EDUCATOR / EMPLOYER`.

An already licensed professional may enter at a later stage. Klinikos EDU is not a prerequisite for professional identity.

## 7.3 Clinical staff

`ASSIGNMENT → PATIENT / WORKLIST → INTAKE / VITALS / PREPARATION → TASKS / HANDOFFS → AUTHORIZED ORDERS / RESULTS WORK → COMMUNICATION → ESCALATION / REVIEW → COMPLETION EVIDENCE`.

MA, LPN, RN, NP, PA, physician, therapist, and others must not remain collapsed into one generic authority bucket where scope differs.

## 7.4 Provider

`PATIENT SNAPSHOT → WHAT CHANGED → STAFF HANDOFF → TODAY'S REASON → RELEVANT HISTORY / ROS / VITALS / EXAM / BODY MAP → ASSESSMENT → PLAN → PROCEDURES → ORDERS / REFERRALS → RESULT REVIEW → DOCUMENTATION → CODING SUPPORT → REVIEW / SIGN / LOCK → FOLLOW-UP`.

## 7.5 Clinic / organization

`ORGANIZATION → PEOPLE → LOCATIONS → CAPACITY → PATIENT ACCESS → OPERATIONS → CARE → WORKFLOW → FINANCIAL TRUTH → REVENUE → GRID → NETWORK → MULTI-LOCATION → ENTERPRISE`.

Owner/admin context should surface staffing gaps, scheduling/capacity, incomplete intake, follow-up, orders/results, referral leakage, billing readiness, claims, revenue exceptions, Grid opportunities, and expansion readiness without automatically exposing unrestricted clinical data.

## 7.6 School / workforce institution

`ORGANIZATION → PROGRAM → COHORT → INSTRUCTORS → PARTICIPANTS → DELIVERY MODE → CURRICULUM → SESSIONS → ATTENDANCE → APPLIED EVIDENCE → ASSESSMENT → HUMAN REVIEW → COMPLETION → NON-LICENSURE CREDENTIAL / CERTIFICATE → REPORTING → OUTCOME / ITERATION`.

## 7.7 Educator / preceptor

`IDENTITY / AUTHORITY → ASSIGNMENT → ROSTER → SESSION / PLACEMENT → ACTIVITY / EVIDENCE → ASSESSMENT / RUBRIC → FEEDBACK → COMPLETION APPROVAL → REPORTING → FUTURE OPPORTUNITY`.

## 7.8 Grid participant

`IDENTITY → CLAIMS → VERIFICATION AS REQUIRED → I NEED / I HAVE → RESOURCE / DEMAND → REQUIREMENTS → ELIGIBILITY → MATCH → OFFER → AGREEMENT → RESERVATION → FINANCIAL OBLIGATION → FULFILLMENT → EVIDENCE → REPUTATION → REPEAT / EXPANSION`.

## 7.9 Employer

`ORGANIZATION AUTHORITY → NEED / POSITION / CAPACITY GAP → REQUIREMENTS → ELIGIBILITY POLICY → GRID DISTRIBUTION → CANDIDATES / MATCH → OUTREACH / APPLICATION → SELECTION → AGREEMENT → WORK → FULFILLMENT / PERFORMANCE EVIDENCE → REPEAT / WORKFORCE PLANNING`.

## 7.10 Network / referral

`NEED → IDENTIFY ORGANIZATION / PROVIDER / CAPACITY → RELATIONSHIP REQUIREMENT → PURPOSE / CONSENT / SHARING RULE → REQUEST / REFERRAL → TRANSMISSION → ACCEPTANCE → SCHEDULING / FULFILLMENT → RESULT / CONSULTATION → REVIEW / COMMUNICATION → CLOSED LOOP → NETWORK EVIDENCE`.

Invitation acceptance alone does not create chart access, patient consent, or professional authority.

---

# 8. LIVING HOME

Living Home is the adaptive command surface, not a static dashboard, marketing card wall, or persona menu.

When the user submits ordinary language, Klinikos should:

1. preserve continuity where possible,
2. place the request in the active thread,
3. infer the objective,
4. resolve active identity/context,
5. retrieve only authorized context,
6. determine required verification/authority,
7. resolve relevant engines,
8. show useful data/action/workspace,
9. keep the composer available,
10. surface blockers truthfully,
11. preserve unfinished work for return,
12. use deeper workspaces only when they add value.

Living Home should increasingly answer:

- what is expected,
- who owns it,
- what is acknowledged,
- what is in progress,
- what is blocked,
- what is fulfilled,
- what requires verification,
- what requires reconciliation,
- what is closed.

Do this by projecting authoritative domain work, not by inventing a second universal task authority.

---

# 9. ZUMI / KLINIKOS INTELLIGENCE

## KLINIKOS-ZUMI-001

Zumi is Klinikos Intelligence. Zumi is not product authority, clinical authority, payment authority, credential authority, or legal authority.

Zumi may understand conversational intent, preserve safe continuity, retrieve permitted context, summarize, explain, compare, prepare actions, organize information, suggest next steps, coordinate routes, research safe public information, and draft communications subject to outbound controls.

Zumi may not independently establish authentication, tenant membership, clinical signing, patient release, license/credential validity, Grid eligibility, payment success, settlement, entitlement, legal acceptance, patient consent, or regulated clinical truth.

Preferred execution:

`USER INTENT → PRIVACY / SECURITY GATE → ACTIVE EXPERIENCE ENVELOPE → AUTHORIZED CONTEXT → DETERMINISTIC POLICY → ZUMI REASONING WHEN USEFUL → TOOL/ACTION PROPOSAL → AUTHORIZATION / HUMAN CONFIRMATION WHEN REQUIRED → DETERMINISTIC DOMAIN ACTION → VERIFIED RESULT → AUDIT / PROVENANCE → USER INTERFACE`.

---

# 10. OPENAI STRATEGIC INTELLIGENCE DIRECTION

## KLINIKOS-OPENAI-001

Current verified company direction records Klinikos as accepted into the OpenAI Partner Network and uses OpenAI as the primary production intelligence platform for Zumi. This relationship must not be inflated into unverified claims about tier, specialization, co-sell status, public listing, referrals, credits, BAA, enterprise pricing, FDE support, or other entitlement unless direct evidence establishes them.

OpenAI supplies intelligence where appropriate. Klinikos supplies:

- identity,
- authority,
- privacy/security policy,
- clinical state,
- financial truth,
- Grid policy,
- business logic,
- workflows,
- tools,
- evidence,
- audit,
- deterministic action.

Provider abstraction remains intact for fallback, resilience, evaluation, specialized workloads, and commercial leverage.

Do not create a parallel Zumi or parallel OpenAI client architecture when the existing governed adapter can be extended.

Model access is always bounded by tool schemas, authorization, data classification, audit, idempotency/failure behavior, and confirmation requirements.

---

# 11. MEMORY & KNOWLEDGE OS

Memory is governed context, not a chat dump and not a second truth database.

Distinguish:

- authoritative live domain record,
- verified external evidence,
- human-approved institutional knowledge,
- verified outcome evidence,
- human-confirmed personal memory,
- conversation-derived context,
- AI hypothesis,
- historical/provenance material.

Memory/knowledge should carry appropriate source, tenant scope, subject, purpose, time, effective range, version, confidence, verification state, authority class, supersession, expiry/retention, and provenance.

Before consequential actions, Klinikos re-retrieves governing live state where required. Clinical truth stays clinical, payment truth stays financial, credential truth stays credentialing, organization authority stays identity/relationship, legal acceptance stays legal evidence, Grid eligibility stays policy/eligibility.

Do not blend contradictory same-authority memory into fabricated certainty.

---

# 12. GRID

## KLINIKOS-GRID-001

Grid is universal healthcare resource, capacity, opportunity, relationship, and transaction infrastructure.

Grid may govern lawful combinations of professionals, work, shifts, jobs, contracts, rooms, chairs, facilities, time, services, equipment/permitted resources, organization capacity, education seats, clinical placements, preceptors, referrals, and appointment/diagnostic capacity.

Universal language:

**I NEED** = demand.

**I HAVE** = resource/supply/capacity.

Canonical flow:

`NEED / HAVE → STRUCTURED DEMAND OR RESOURCE → REQUIREMENTS → HARD ELIGIBILITY → CANDIDATE SET → RANK / EXPLAIN → OFFER / REQUEST → AGREEMENT → RESERVATION / ASSIGNMENT → FINANCIAL OBLIGATION → FULFILLMENT → EVIDENCE → REPUTATION / OUTCOME → REPEAT`.

Hard eligibility precedes ranking. AI may interpret and explain. Payment, sponsorship, popularity, or model preference never overrides disqualifying policy.

Public discovery exposes minimum necessary information only. Patients are not public Grid profiles.

Clinic OS can create governed Grid demand/supply from staffing gaps, unused capacity, schedule gaps, referral leakage, unmet services, specialist shortages, and resource needs. Grid outcomes return to Clinic OS as real booking, assignment, fulfillment, follow-up, financial obligation, issue, and audit state.

EDU may release competency/training evidence into future Grid discovery or eligibility where policy permits. EDU completion never automatically creates licensure or professional authority.

---

# 13. KLINIKOS EDU / WORKFORCE

Klinikos EDU is education, simulation, competency, institutional delivery, career-readiness, and workforce infrastructure, not merely an LMS.

Institutional structure should support organizations, programs, cohorts, instructors, participant enrollment/import, delivery mode, curriculum, custom modules/configuration, learning objectives, completion criteria, assessments/rubrics, non-licensure certificate templates, workforce reporting, accommodations metadata, lifecycle states, and audit evidence.

Instructor workflow:

`ROSTER → SESSION AGENDA → SCENARIO / ACTIVITY → PARTICIPANT EVIDENCE → ASSESSMENT QUEUE → RUBRIC / HUMAN REVIEW → FEEDBACK → COMPLETION DECISION → RELEASE → REPORTING`.

Assessments may include knowledge checks, scenario decisions, workflow sequencing, error identification, AI-output critique, short response, and instructor rubric.

Virtual Clinic Lab is synthetic-data-first and may simulate front desk, MA, nurse, provider, biller, coder, practice manager, and compliance officer roles.

Representative curriculum families include Medical Office Operations, Intro to EHR/Clinical Systems, Billing/Claims, Clinical Documentation Lab, Referral/Care Coordination, Privacy/Security/HIPAA Operations, AI in Healthcare Operations, and Healthcare Entrepreneurship/Practice Management.

Career readiness may support responsible AI job search, resume support without fabrication, applications, professional communication, interview prep, prompt basics, fact checking, privacy, employer policy, honest disclosure of AI-assisted work, and recognizing inaccurate AI output.

---

# 14. CLINIC OS

Clinic OS is the operating layer for healthcare organizations.

It should progressively unify organization/location management, staff, schedules/capacity, patient management, appointments, intake/consent readiness, tasks/handoffs, communications, referrals, documents, provider profiles, clinical work, orders/results, billing readiness, revenue integrity, owner reporting, Grid demand/supply, multi-location operations, and network relationships.

Commercially, Klinikos should be able to land without immediate EHR rip-and-replace. Initial value may overlay workflow, follow-up, staffing/capacity, intake readiness, referral coordination, billing readiness, revenue recovery, communications, and owner intelligence. Deeper clinical replacement can follow earned trust and migration readiness.

---

# 15. CURRENT VISIT / CLINICAL CONVERGENCE

## KLINIKOS-CLINICAL-001

Current Visit is the provider-facing convergence surface.

Provider sequence:

`PATIENT SNAPSHOT → WHAT CHANGED → STAFF HANDOFF → TODAY'S REASON → RELEVANT HISTORY → ROS → VITALS → PHYSICAL EXAM / BODY MAP → ASSESSMENT → PLAN → PROCEDURES / INJECTIONS → ORDERS / REFERRALS → RESULT REVIEW → DOCUMENTATION → CODING SUPPORT → REVIEW / SIGN / LOCK → FOLLOW-UP`.

Klinikos should maintain structured longitudinal change such as new, improved, worsened, unchanged, resolved, and pending where evidence supports it. AI may summarize deterministic change but may not invent change from absence.

Specialties compose through:

`BASE KLINIKOS → SPECIALTY PACK → ORGANIZATION OVERRIDE → LOCATION OVERRIDE`.

Signed records do not silently mutate. Corrections/addenda remain attributable and time-stamped. Body maps, consent, results, templates, orders, and important clinical evidence require appropriate version/provenance.

AI scribe/dictation may assist but may not invent findings/laterality, create unsupported diagnoses, place unapproved orders, sign, submit claims, or close a visit.

Telehealth is an encounter modality, not a second chart.

---

# 16. INTAKE & CONSENT OS

## KLINIKOS-INTAKE-001

Intake and consent are first-party Klinikos capabilities.

Klinikos owns the patient/staff workflow engine, form/questionnaire engine, conditional logic, completion/readiness, patient links/portal completion, document/ID upload, patient-photo workflows where appropriate, e-signature capture, consent versioning, timestamps/provenance, reminders, review queues, workflow triggers, audit trail, and configuration by organization/location/specialty/service/case.

Organizations control approved clinical/legal content within platform governance and law, including required forms, consent language, questions, re-consent rules, review requirements, and case-specific content.

Consent is permission + version + purpose, not merely a PDF signature.

A consent record should answer who agreed, what they agreed to, version, purpose, when, active relationship/context, validity, what workflow it permits, and whether it was withdrawn/replaced.

Consent families may include privacy/HIPAA acknowledgments, treatment/procedure, telehealth, AI/audio, photo/media, communication preferences, information sharing, proxy/access, specialty, and case-specific/No-Fault/Workers' Compensation documents.

---

# 17. SCHEDULING & CAPACITY

Scheduling is a capability/eligibility engine, not merely a calendar row.

Depending on the action it may consider patient/service need, provider capability, profession/privilege, location assignment, appointment type, room/equipment, duration, availability, recurring series, insurance/case restrictions, supervision, telehealth mode, organization policy, resource capacity, and conflicts.

Capacity is shared by Clinic OS, Grid, referrals, EDU, and patient access, including provider hours, rooms/chairs, imaging slots, therapy slots, education seats, preceptor capacity, appointment inventory, and staffing capacity.

Recurring care should support a series model with recurrence pattern, effective dates, exceptions, cancellation/reschedule effects, linked plan/case, and authorization limits.

---

# 18. PATIENT, COVERAGE, FINANCIAL CASE

Do not collapse patient identity, coverage, and financial/legal case context.

- Patient = person in care context.
- Coverage = payer/coverage with effective periods.
- FinancialCase = financial/legal billing context for an episode/case, including insurance, cash pay, No-Fault, Workers' Compensation, and other supported structures.

One patient may have multiple cases/coverage contexts over time.

---

# 19. ORDERS & RESULTS

Target semantic lifecycle:

`DRAFT / PROPOSED → ORDERED → TRANSMISSION REQUIRED → TRANSMITTED → ACCEPTED / ACKNOWLEDGED EXTERNALLY → SCHEDULED / IN PROCESS → PERFORMED → RESULTED → PROVIDER REVIEWED → PATIENT COMMUNICATED AS REQUIRED → CLOSED`.

An internal order does not prove external receipt. A result does not prove provider review. Review does not prove patient communication. Communication does not always close every downstream obligation.

External ambiguity becomes work: rejected transmission, unmatched result, duplicate result, stale pending, wrong patient, missing review, or missing communication.

---

# 20. BILLING, FINANCIAL OS, AND RCM

## KLINIKOS-BILLING-001

Billing is first-party Klinikos scope.

Klinikos owns workflow, domain model, financial state, normalization, reconciliation, revenue integrity, evidence, and user experience. Klinikos integrates external payer/clearinghouse rails rather than pretending to recreate regulated networks.

Canonical path:

`CARE / EVENT → DOCUMENTATION → EVIDENCE → CODING → CHARGE → BILLING READINESS → CLAIM PREPARATION → EXTERNAL TRANSMISSION / CLEARINGHOUSE / PAYER RAIL → ACCEPTANCE / REJECTION → ADJUDICATION → REMITTANCE → PAYMENT → RECONCILIATION → REVENUE INTEGRITY`.

Klinikos-owned capabilities include billing readiness, documentation completeness, coding support, modifiers, superbills, itemized receipts, patient invoices/balances, cash-pay receipts, CMS-1500 support, eligibility workflow when connected, claim preparation/submission orchestration, claim status, rejections/denials workflow, payment posting, remittance reconciliation, No-Fault/Workers' Compensation workflows, performed-versus-charged reconciliation, revenue leakage detection, and owner revenue-integrity views.

External insurance rails may include 270/271 eligibility, 837 claims, 276/277 status, 835 ERA/remittance, clearinghouses, and payer networks.

Keep separate:

`PRICE != QUOTE != CHARGE != INVOICE != PAYMENT INTENT != PAYMENT EVIDENCE != ENTITLEMENT != OBLIGATION != PAYABLE != PAYOUT != SETTLEMENT != REFUND != RECONCILIATION`.

`REDIRECT != PAYMENT`.

`CLAIM SENT != CLAIM ACCEPTED`.

`CLAIM ACCEPTED != ADJUDICATED`.

`ERA RECEIVED != RECONCILED`.

Revenue Integrity Graph should progressively surface exceptions across:

`PERFORMED → DOCUMENTED → CODED → CHARGE EXPECTED → CHARGE PRESENT → CLAIM READY → CLAIM SENT → CLAIM ACCEPTED → ADJUDICATED → PAID → RECONCILED`.

---

# 21. PAYMENTS & TRANSACTIONS

General transaction path:

`OPPORTUNITY → AGREEMENT → BOOKING / RESERVATION → FULFILLMENT → FINANCIAL OBLIGATION → PAYMENT EVIDENCE → PAYOUT / SETTLEMENT WHERE APPLICABLE → RECONCILIATION → REPORTING`.

The browser is never trusted price authority.

Customer-funded variable usage should generally follow:

`CUSTOMER PAYMENT / PLAN → ENTITLEMENT → INCLUDED ALLOWANCE / PREPAID BALANCE → EXTERNAL USAGE → COST LEDGER → OVERAGE / LIMIT / HOLD → MARGIN / RECONCILIATION`.

Do not finance unbounded AI, SMS, voice, maps, verification, or other variable external usage without economic control.

---

# 22. EXTERNAL INTEGRATION STRATEGY

Klinikos builds its own experience, workflows, normalization, evidence, intelligence, and reconciliation where that creates product value. It integrates regulated/network infrastructure where rebuilding would be unsafe, wasteful, or impossible.

External service classes include platform infrastructure, customer/organization external relationships, and activate-after-sale/use-case services.

Never collapse all external states into "integrated." Use truthful states such as PLANNED, CONTRACT PENDING, CREDENTIALS PENDING, ADAPTER READY, SANDBOX, CONNECTED, UAT, CONTROLLED PRODUCTION, PRODUCTION VERIFIED, DEGRADED, DISABLED, or BLOCKED.

External failures become reconciliation work. Do not silently swallow rejected claims, failed lab transmissions, duplicate webhooks, unmatched remittances, stale statuses, or provider failures.

---

# 23. NETWORK

Network is the governed relationship/capacity fabric connecting organizations, professionals, referrals, education, services, employment, and operational collaboration.

Relationships may include employment, contracting, organization membership, referral relationships, school/clinical site, preceptor, vendor/service, payer/clearinghouse, and network affiliation.

Relationship is not authority. It may enable authority evaluation but does not automatically create chart access, consent, privilege, transaction approval, or payment authority.

Network flywheel:

`CLINIC VALUE → GRID ACTIVITY → RELATIONSHIPS → MORE CAPACITY / SUPPLY / DEMAND → MORE USEFUL MATCHES → MORE WORK / CARE / EDUCATION → MORE EVIDENCE → MORE TRUST → MORE ORGANIZATIONS → MORE CLINIC VALUE`.

---

# 24. CONFIGURATION REGISTRY

Avoid customer-specific forks.

Configuration hierarchy:

`BASE KLINIKOS → SPECIALTY PACK → ORGANIZATION OVERRIDE → LOCATION OVERRIDE`.

Configurable areas may include intake, consent, workflow, clinical templates, scheduling, services, billing requirements, lawful role configuration, alerts, routing, reporting, EDU programs, and Grid policies.

Material configuration should support version, effective date, approval, source/provenance, audit, and history/rollback.

Configuration may not violate platform-level security/safety law.

---

# 25. SECURITY, CONFIDENTIALITY, AND IP

## KLINIKOS-SECURITY-001

Permanent boundary:

`BROWSER INTENT / INPUT → AUTHENTICATED SERVER CAPABILITY → SERVER-SIDE POLICY / PROPRIETARY ENGINE → MINIMUM-NECESSARY DTO → BROWSER`.

Assume everything delivered to the browser can be inspected, copied, retained, replayed, diffed, automated, and decompiled where applicable.

Server-confidential by default:

- secrets/credentials,
- Zumi hidden prompts/directives,
- private orchestration state,
- Grid ranking/matching/anti-gaming internals,
- trust/risk/fraud heuristics,
- private pricing/margin logic,
- unpublished discount strategy,
- unreleased roadmap/business strategy,
- privileged security/infrastructure detail,
- unnecessary PHI/PII,
- private tenant state.

Raw ORM/domain records are not browser contracts by default. Server Component values passed to Client Components are browser disclosures.

Tenant context is server-owned. Sensitive actions enforce identity, tenant, relationship, role, permission, purpose, resource scope, and minimum necessary access as applicable.

Do not make blanket unsupported compliance claims. Do not represent PHI-capable external AI use as approved without exact provider, contract/BAA, configuration, egress, and deployment evidence.

---

# 26. LEGAL DEFENSE AND LIABILITY ARCHITECTURE

The protected access stack should be defense-in-depth, not one weak NDA.

## 26.1 Layer 1 - Combined protected access Terms

The first protected airlock should combine website/protected-access terms with confidentiality, IP, trade-secret, restricted-use, and explicit breach-consequence acknowledgments.

## 26.2 Layer 2 - Relationship/product agreements

Additional progressive agreements may include:

- Acceptable Use Policy,
- AI/Zumi terms,
- Grid provider/organization/marketplace terms,
- Clinic MSA,
- implementation SOW,
- DPA/Security Addendum,
- BAA where required,
- EDU institution/learner terms,
- contractor/employee/contributor confidentiality/IP assignment,
- investor/partner/data-room agreements.

## 26.3 Layer 3 - Technical enforcement

Contract rights do not replace controls. Protect through authentication, authorization, tenant isolation, server-side proprietary logic, secure sessions, rate limits, anti-enumeration, audit, access revocation, safe downloads, client-bundle/source-map leakage checks, secret management, and incident response.

## 26.4 Breach classes

Contract drafts may classify material breach, serious confidentiality/IP breach, and severe protected-asset breach to ensure prohibited acts map to consequence, evidence, survival, and remedy.

Severe examples may include intentional/reckless trade-secret theft, unauthorized repository/source acquisition, deliberate security/auth/legal-gate bypass, mass exfiltration, hidden-prompt/orchestration/ranking extraction for exploitation, credential compromise, evidence destruction, coordinated breach, or use of protected information to materially accelerate a competitor.

## 26.5 Remedies and liability

Subject to governing law and counsel-approved final language, the legal stack may preserve rights to:

- immediate suspension/termination,
- credential/session/token/invitation revocation,
- return/deletion/destruction,
- evidence preservation,
- injunctive/equitable relief,
- specific performance where available,
- proven actual damages,
- restitution/unjust enrichment/disgorgement where available,
- recoverable forensic/containment/credential-rotation/restoration/remediation/notification/incident-response costs caused by breach,
- attorneys' fees, experts, costs, and enforcement expenses where contract/law permit,
- applicable statutory/IP/trade-secret remedies,
- termination of evaluation/license/Grid/partner/data-room rights,
- lawful referral to authorities where appropriate.

No double recovery for the same injury.

Do not use arbitrary punitive liquidated-damages numbers. Any liquidated-damages provision must target a defined hard-to-measure breach, be a reasonable estimate rather than punishment, avoid duplicate recovery, and receive licensed-counsel approval for the governing law and facts.

## 26.6 Mandatory-law carve-outs

Protected reporting and non-waivable whistleblower rights must remain intact. Covered worker/contractor/consultant confidentiality agreements must include or lawfully cross-reference the applicable DTSA 18 U.S.C. §1833(b) immunity notice.

Electronic execution should preserve reproducible records and intent-to-sign evidence consistent with applicable E-SIGN rules and exceptions.

## 26.7 Production legal gate

No legal document becomes attorney-approved or production-approved merely because it is drafted, committed, rendered, accepted in test, or technically enforceable in code.

Licensed counsel should review the final contracting entity, governing law, forum, arbitration/jury/class terms if used, indemnity, limitation of liability, fee shifting, liquidated damages, restrictive covenant/anti-circumvention scope, worker rules, consumer/business distinctions, privacy/healthcare requirements, and international use.

---

# 27. AUTOMATED OUTBOUND AND CONFIDENTIAL DISCLOSURE

No automated or agent-assisted process may send confidential decks, proprietary architecture, source code, sensitive roadmaps, non-public financial details, labs/clinical documents, PHI, patient lists, credentials/secrets, or protected attachments without required disclosure classification, intended-recipient validation, minimum-necessary review, and governing human/policy approval.

Keep truth states separate:

`MESSAGE PREPARED != PROVIDER ACCEPTED != DELIVERED != RESPONSE RECEIVED != APPLICATION SUBMITTED != AWARD / CONTRACT != CASH RECEIVED`.

Protected business materials should support public/green, limited/yellow, confidential/red, and crown-jewel classifications or equivalent governed labels.

---

# 28. BLACK LABEL DESIGN SYSTEM

Klinikos should feel premium, calm, editorial, cinematic, and trustworthy rather than generic healthcare SaaS.

Core visual family:

- obsidian/near-black foundation,
- black cherry/oxblood depth,
- warm ivory/bone/pearl text/surfaces,
- restrained dusty rose/coral/ember accents,
- exceptional typography,
- strong negative space,
- high-contrast accessible controls,
- state-driven motion,
- minimal decorative theater without meaning.

Contextual modes:

- Living Home: cinematic, spacious, conversational;
- Current Visit: quiet, surgical, clinically focused;
- Grid: spatial, geographic/opportunity-oriented;
- Billing: structured and financially precise;
- EDU: editorial and instructional;
- Patient: warm, calming, hospitality-oriented;
- Admin/operations: efficient and exception-oriented.

All modes remain recognizably Klinikos.

Product clarity outranks decoration. Brand assets may support the experience but may not reduce comprehension, contrast, or task efficiency.

---

# 29. WIRING LAW

A page is not completion. A button is not wiring. A route is not proof. An AI answer is not execution.

Full consequential chain:

`VISIBLE SURFACE`
→ `USER INTENT / ACTION`
→ `IDENTITY / ACTIVE CONTEXT`
→ `CLAIM / REQUIREMENT RESOLUTION`
→ `AUTHORIZATION / ELIGIBILITY`
→ `RELEVANT ENGINE(S)`
→ `AUTHORITATIVE DATA / WORKFLOW`
→ `PERSISTENCE / EVENT`
→ `EXTERNAL ADAPTER IF REQUIRED`
→ `EXTERNAL ACK / RECONCILIATION IF REQUIRED`
→ `TRUTHFUL RESULT`
→ `AUDIT / FINANCIAL CONSEQUENCE IF REQUIRED`
→ `NEXT USEFUL ACTION`.

For every major flow ask:

1. What surface starts it?
2. What user action occurs?
3. Which identity/context is active?
4. Which claims/requirements matter?
5. Who decides authority?
6. Which domain owns read/write truth?
7. What persists?
8. What event/evidence is created?
9. Does an external rail participate?
10. How is external truth reconciled?
11. What does the user see?
12. What remains unfinished?
13. What is the next useful action?
14. What is audited?
15. What financial consequence exists?
16. Can failure be distinguished from success?

Never fake payment, delivery, license verification, claim acceptance, payout, API result, Grid supply, distance, availability, or completion. Manual fallback is valid only when represented honestly.

---

# 30. IMPLEMENTATION-STATE RECORD

Product target and implementation state belong together.

Every major capability should carry one current record containing:

- **Canonical State** - what this canon requires.
- **Current Implementation** - VERIFIED LIVE / BUILT / PARTIALLY BUILT / MANUAL FALLBACK / ADAPTER READY / PENDING CONNECTION / BLOCKED / NOT BUILT / NOT BUILT BY DESIGN.
- **Verified Against** - commit, tests, runtime/deployment evidence, date.
- **Already Working** - specific proven behavior.
- **Remaining Gap** - specific missing behavior.
- **Dependencies** - internal prerequisites.
- **External Gate** - vendor/legal/contract/credential/deployment/BAA/payer/institution condition.
- **Next Convergence** - dependency-aware next step.
- **Evidence Links** - code/tests/verification/runbooks/PRs.

Status snapshots are evidence, not immutable truth. Reverify before current claims.

---

# 31. COMMERCIALIZATION AND UNICORN-SCALE FLYWHEEL

Klinikos should land with usefulness, expand by value, and replace legacy systems only after earned trust.

Early clinic sequence:

`TARGET CLINIC → EXECUTIVE CONVERSATION → IDENTIFY EXPENSIVE WORKFLOW → PAID ASSESSMENT / PROOF → MEASURE IMPROVEMENT → FOUNDING DEPLOYMENT → RECURRING PLATFORM → CASE STUDY / REFERRAL → TARGETED EXPANSION`.

Prioritize reachable independent and multi-location practices with measurable scheduling, follow-up, staffing, paperwork, referral, billing-readiness, revenue-leakage, or coordination pain.

Sell outcomes and validated capability, not crown-jewel internals.

Do not make exact pricing immutable canon unless it is current, approved, and intended as product/commercial truth.

## 31.1 Compounding platform flywheel

`EDU → SKILLS → COMPETENCY EVIDENCE → GRID → OPPORTUNITY → WORK → EXPERIENCE → REPUTATION → INDEPENDENT PRACTICE → CLINIC OWNERSHIP → CLINIC OS → NETWORK → MORE CAPACITY / JOBS / PATIENT DEMAND → GRID → MORE OPPORTUNITY → MORE EDUCATION DEMAND → EDU`.

This is one of the central network-effect mechanisms supporting venture-scale value.

## 31.2 Financial flywheel

`OPPORTUNITY → AGREEMENT → BOOKING → FULFILLMENT → PAYMENT / OBLIGATION → SETTLEMENT / RECONCILIATION → REPORTING → TRUST / REPEAT`.

## 31.3 Klinikos 10

Klinikos 10 is the first high-value organization network proof program, not a separate product. Its purpose is to prove active network nodes across onboarding, organization verification, Current Visit, telemedicine continuity, Grid demand/supply, Financial OS usefulness, provider/staff/patient/vendor/referral growth, Zumi value, measurable outcomes, retention, and expansion.

---

# 32. EXECUTION ORDER

Implementation should converge dependency-first rather than jumping among visible screens.

## 32.1 Foundation

1. One Master Canon and authority map.
2. Truthful implementation-state records.
3. Universal identity/account foundation.
4. relationship/context model.
5. claim/verification/authority model.
6. Active Experience Envelope.
7. server/client confidentiality boundary.
8. audit/evidence/event foundations.
9. configuration registry.
10. shared financial semantics.

## 32.2 Front door

11. protected access Terms/Confidentiality/IP airlock.
12. exact acceptance evidence and identity binding.
13. Enter Klinikos transition.
14. Living Home continuity.
15. Zumi intent understanding.
16. safe value preview.
17. account value trigger.
18. conversation/intent continuation through auth.
19. path-aware verification.
20. experience-envelope activation.

## 32.3 Core operations

21. Clinic OS operational work.
22. scheduling/capacity.
23. patient registration/intake/consent.
24. Current Visit clinical convergence.
25. orders/results and reconciliation.
26. referrals/network continuity.
27. billing readiness/RCM/revenue integrity.
28. telehealth as encounter mode.

## 32.4 Network and workforce

29. Grid universal demand/resource participation.
30. eligibility/matching/offer/agreement/reservation/fulfillment.
31. EDU competency evidence.
32. EDU-to-Grid opt-in bridge.
33. work-to-experience/reputation evidence.
34. organization/network relationship growth.

## 32.5 Intelligence and scale

35. Zumi governed tools over deterministic domains.
36. OpenAI primary intelligence integration under Klinikos authority.
37. Memory/Knowledge OS with provenance/authority.
38. Insights/next-best-action projections.
39. multi-location/network/enterprise scaling.
40. agentic execution only behind explicit policy, disclosure, financial, clinical, and founder/human gates.

---

# 33. ACCEPTANCE STANDARD

Klinikos is not converged because the homepage looks right or each module exists separately.

Representative end-to-end journeys must work truthfully, including:

- protected access agreement → Enter Klinikos → Zumi → signup → preserved intent → verification → relevant experience;
- student → evidence → human review → Grid discovery → opportunity → work → experience evidence;
- clinic staffing/capacity need → Grid → eligible result → agreement/reservation → fulfillment → operational/financial consequence;
- patient → intake/consent → appointment → Current Visit → order/result → follow-up → billing;
- care → evidence → coding → charge → claim → external rail → remittance → reconciliation;
- clinic owner → revenue exception → responsible work item → resolution → measured outcome;
- role/context switch → correct data/tools/permissions with no cross-tenant bleed;
- external disconnected state → truthful blocker/manual fallback, never fake success;
- automated outbound → confidentiality classification/recipient/review gate before sensitive disclosure.

---

# 34. PERMANENT CLOSING DOCTRINE

Klinikos should never again fragment into competing current snapshots.

Physician feedback improved Klinikos.

Grid expanded Klinikos.

EDU extended the healthcare lifecycle.

Financial OS created shared financial truth.

Identity and authority matured the trust model.

Zumi Memory created institutional continuity.

OpenAI partnership direction strengthened the intelligence strategy.

Prototype work compressed the business architecture into visible experiences.

All of that is now one product.

> **Chat is where we think. This canon records the current merged state.**

When a conversation changes Klinikos, the accepted decision must merge forward here and its implementation consequence must be identified.
