# KLINIKOS FINAL-FORM PATH EXECUTION MAP

Date: 2026-08-26  
Status: PROPOSED ARCHITECTURAL COMPANION SPEC  
Parent design: `docs/superpowers/specs/2026-08-26-klinikos-final-form-universal-experience-design.md`  
Repository: `jcamacho611/Clinicos-by-Zumi`

---

# 0. Purpose

This document closes the gap between architectural intent and executable product expectations.

The parent design defines **what Klinikos is becoming**. This execution map defines, for every major system and user path:

- **WHAT exists now**
- **WHY the layer exists**
- **WHERE the behavior belongs**
- **WHEN it activates**
- **HOW the user experiences it**
- **HOW Zumi participates**
- **WHAT backend authority actually decides**
- **WHAT data/evidence is created**
- **WHAT remains free**
- **WHEN commercial value appears**
- **WHAT can fail**
- **WHAT must happen next**
- **WHAT “done” means**

This document does not authorize a big-bang rewrite. Existing authoritative systems remain authoritative unless a later implementation plan explicitly replaces them.

---

# 1. Current repository truth that this map must preserve

At this design checkpoint, current `main` is `c606cffc0610fd5be5c3a5d38a3b8e172512695c`.

The repository already contains material implementations or active work for:

- public Living Home
- authenticated Living Home
- Zumi public and authenticated routing
- Grid public discovery and governed transaction flows
- Grid trust/dispute/safety infrastructure
- Clinic OS operational surfaces
- patient portal surfaces
- EDU and Workforce
- universal identity / Account work
- Universal Entry / protected access
- confidential-access legal work
- interoperability lifecycle truth
- transaction-policy/economic adapters
- universal obligation projection
- Zumi memory/knowledge governance
- Marble / Obsidian theme work
- public Grid reviewed-resource details
- deployment/release proof infrastructure

Important current open work includes active PRs for:

- final-form architecture design
- Universal Entry
- lifelong identity
- universal Account/free-member backend
- Living Home server authority
- Workforce max-upgrade
- Zumi memory governance
- Grid liquidity and public-resource detail
- trust projection
- interoperability lifecycle truth
- universal transaction policy fabric
- generated legal documents
- patient SMS governance
- theme convergence
- release failover

Therefore the final frontend must **compose existing systems**. It must not create replacements merely because the user experience is being redesigned.

---

# 2. The one universal Klinikos lifecycle

Every human-facing path is a specialization of this lifecycle:

`ARRIVE → TRUST → UNDERSTAND → CLAIM → VERIFY → AUTHORIZE → EXPRESS INTENT → CREATE VALUE → ENTER GRID / DOMAIN WORK → CONNECT / TRANSACT / LEARN / OPERATE → RECORD EVIDENCE → RETURN → EXPAND NETWORK`

Not every visitor traverses every stage immediately.

The system progressively activates only what the current goal requires.

---

# 3. Stage-by-stage universal experience

## STAGE 1 — ARRIVE

### WHAT EXISTS NOW

Public `/` already exists as a Living Home / conversation-first surface. Public Zumi and product routing already exist materially. The site also has `/grid`, `/edu`, `/pricing`, `/start`, `/login`, `/portal/login`, legal pages and other public capability routes.

### WHY THIS STAGE EXISTS

The user should understand that Klinikos can help before the product asks them to understand its internal taxonomy.

### WHERE

Primary surface: `/`.

Supporting public surfaces may include `/grid`, `/edu`, public resource pages, approved organization/professional public pages, pricing and enterprise/capability pages.

### WHEN IT ACTIVATES

Always. This is the universal first contact unless a user follows a deep link or referral link.

### WHAT THE USER SEES

- Klinikos identity
- a premium, calm Obsidian / Black Cherry / Warm Ivory / Dusty Rose environment
- Zumi as the primary interaction surface
- a concise statement of what Klinikos enables
- examples of problems Klinikos can solve without forcing persona selection
- public-safe proof from Grid / EDU / enterprise capability where relevant

### WHAT ZUMI DOES

- accepts natural language
- identifies preliminary intent
- explains public-safe value
- routes to safe public content
- proposes the next useful step

### WHAT ZUMI MUST NOT DO

- create verified identity
- create professional authority
- create organization authority
- expose private organization/patient data
- claim a capability is production-live without evidence

### DATA CREATED

Prefer no persistent personal record before consent/account unless operational telemetry is necessary and lawful. Anonymous session continuity may remain ephemeral or privacy-bounded.

### FIRST VALUE MOMENT

The visitor receives a useful answer, preview, match category, resource, program, buyer route or clear next action before unnecessary registration.

### FAILURE STATES

- Zumi unavailable → deterministic public navigation/fallback remains usable
- no matching public Grid inventory → say none currently available; never invent markers/resources
- uncertain intent → ask one clarifying question
- risky clinical request → route safely without pretending diagnosis

### DONE WHEN

A patient, student, worker, clinician, clinic owner, school, workforce buyer, vendor, investor and enterprise buyer can all begin from the same public page in ordinary language.

---

## STAGE 2 — TRUST / LEGAL RELATIONSHIP

### WHAT EXISTS NOW

The repository already has legal/privacy surfaces, global terms evidence, Universal Entry work, confidential-access agreement work and generated legal-document architecture.

### WHY

Klinikos needs enforceable, evidenced terms without turning the public website into an unusable universal NDA wall.

### WHERE

- public Terms / Privacy
- `/access` or current protected-entry surface
- progressive professional / Grid / clinic / EDU / commerce terms
- restricted investor / partner / demo / data-room access

### WHEN

The agreement required should depend on the action:

- ordinary public browsing → public terms/privacy posture
- entering protected interactive experience → protected-entry agreement when released/enabled
- professional/Grid participation → professional/Grid terms as applicable
- representing an organization → organization/clinic terms
- selling/transacting → commerce/seller terms
- institutional EDU → EDU/institutional terms
- restricted investor/partner material → confidential-access agreement

### USER EXPERIENCE

Agreement should be concise, readable and affirmative. Do not silently rely on browsewrap for high-value protection.

### EVIDENCE

Store or bind:

- agreement key
- version
- hash/exact text evidence
- accepted timestamp
- person/account when known
- later identity binding when anonymous acceptance is allowed
- acceptance source
- lawful network/device evidence when approved

### AUTHORITY LAW

Agreement acceptance does **not** create:

- role
- tenant membership
- credential
- patient access
- Grid eligibility
- payment entitlement
- clinical authority

### DONE WHEN

Every protected path has a clearly defined legal gate and no legal gate accidentally becomes business authority.

---

## STAGE 3 — IDENTITY

### WHAT EXISTS NOW

Current clinic/staff identity exists. Patient sessions remain separately governed. Active PRs add lifelong Person, OrganizationMembership, LocationAssignment and universal Account/free-member concepts.

### WHY

The same human can evolve from student → professional → employee → instructor → clinic owner without creating disconnected accounts.

### WHERE

Identity belongs in the universal identity/Account substrate, not inside every domain feature.

### WHEN

Identity becomes necessary when the user wants persistence: save, contact, post, upload persistent information, receive notifications, join a program, enter portal/workspace or perform governed action.

### USER EXPERIENCE

- minimal signup
- preserve original intent through signup/login
- do not ask irrelevant organization/clinical questions before needed

### BACKEND EXPECTATION

One persistent Person / Account relationship where applicable; current clinic authority remains separate until safely reconciled.

### DONE WHEN

A user authenticates once and resumes the exact path they started without duplicate identity creation.

---

## STAGE 4 — CLAIM

### DEFINITION

A claim is something the user says about themselves or their relationship.

Examples:

- “I am an RN.”
- “I attend SUNY Broome.”
- “I own Jones Medical.”
- “I work for Northwell.”
- “I represent a workforce board.”

### WHY

Zumi must be able to personalize immediately without treating self-report as verified truth.

### WHERE

Claims should be stored/projection-ready in the identity/relationship architecture when persistence is justified.

### WHEN

As soon as the user states a material identity/relationship fact.

### ZUMI ROLE

Capture/interpret the claim and explain what verification would unlock.

### AUTHORITY LAW

`CLAIM ≠ VERIFIED FACT ≠ AUTHORITY`.

### DONE WHEN

No self-reported claim silently creates badges, professional authority, organization control or protected access.

---

## STAGE 5 — VERIFICATION

### WHY

Verification turns the network from self-reported profiles into a trusted healthcare relationship graph.

### VERIFICATION TYPES

- email ownership
- student/institution affiliation
- employee affiliation
- business-domain relationship
- organization administrator/owner authority
- professional credential/license
- government/institution representative
- payment/financial authority
- patient proxy/caregiver authority

### BUSINESS EMAIL EXPECTATION

If business/organization intent is discovered, require organization-domain verification before official representation or admin privileges where a genuine domain exists.

A personal Gmail/Yahoo/Outlook address may still create the human's personal account.

It does not verify the business.

### STUDENT EMAIL EXPECTATION

If student status is claimed, request institutional email when available. Allow approved fallback such as verified roster, institution invitation or enrollment evidence.

### CLINICIAN EXPECTATION

Professional email does not establish regulated authority. Use license/NPI/registry/organization/credential evidence as appropriate.

### GOVERNMENT EXPECTATION

Use recognized agency/institution domain plus stronger anti-impersonation/manual checks as appropriate.

### WHERE

Verification service/repository, organization relationship system, credential system and domain-specific authority checks.

### USER EXPERIENCE

Explain the benefit:

- verify school → unlock verified student participation
- verify business → represent organization and post organization demand
- verify credential → display verified professional fact and unlock governed workflows where policy also permits

### DATA / EVIDENCE

Every verification should have:

- subject
- claim type/value
- method
- evidence reference
- state
- verifier/source
- verified_at
- expiration where applicable
- revocation/dispute history

### DONE WHEN

The UI distinguishes “self-reported,” “email verified,” “affiliation verified,” “credential verified,” and “authorized” instead of using one misleading Verified label.

---

## STAGE 6 — AUTHORITY

### WHY

Healthcare requires more than identity and verification. A verified doctor may still lack access to a specific tenant, location, patient or action.

### AUTHORITY INPUTS MAY INCLUDE

- identity
- active organization
- location
- membership
- role
- profession
- credential status
- capability
- assignment
- purpose of use
- patient relationship/consent
- clinical privilege
- financial authority
- break-glass state where supported

### WHERE

Server-side policy/authorization engines only.

### WHEN

Before every consequential action or data projection.

### ZUMI ROLE

Zumi may explain what is missing. Zumi does not grant authority.

### DONE WHEN

No client flag, payment status, AI output, email classification or self-claim can bypass server-owned authority.

---

## STAGE 7 — INTENT

### UNIVERSAL VOCABULARY

- I AM
- I NEED
- I HAVE
- I WANT TO DO

### WHY

Users speak in goals. Grid and domain engines need structured intent.

### WHERE

Existing Living Home / Zumi server routing should be extended, not replaced by a second client router.

### WHEN

Immediately after/while conversation establishes user goal.

### OUTPUT

A safe path recommendation plus structured draft data for the relevant domain.

### DONE WHEN

The user never needs to manually choose internal product taxonomy before getting routed.

---

## STAGE 8 — GRID / DOMAIN VALUE

### WHY

Grid turns demand/supply into network value. Clinic OS, EDU, Patient and other domains perform specialized work.

### WHERE

- Grid for needs, offers, resources, opportunity, capacity and relationships
- EDU for learning/workforce evidence
- Clinic OS for organization operations
- Patient portal for patient-authorized workflows
- Network for organization relationships
- Commerce for lawful payment/settlement rules

### WHEN

After intent is sufficiently structured and required verification/authority is satisfied.

### DONE WHEN

Every path uses shared infrastructure instead of spawning another isolated marketplace or mini-product.

---

# 4. Front-end surface architecture

## 4.1 Public Living Home

### EXISTS

Material public Living Home and public Zumi already exist.

### WHY

Universal front door and demand-capture engine.

### WHERE

`/` plus approved supporting public routes.

### REBUILD EXPECTATION

- final Black Label visual system
- Zumi primary
- simple hierarchy
- no giant product catalog
- no fake metrics
- public-safe Grid/EDU proof
- preserve intent across signup

### DONE

A first-time visitor understands and acts in <10 seconds without product taxonomy knowledge.

---

## 4.2 Protected Entry

### EXISTS

Active Universal Entry work; enforcement off by default until verified.

### WHY

Protect interactive/proprietary experience while preserving public discovery.

### WHERE

`/access` / current entry route and legal evidence APIs.

### WHEN

Only when user crosses from public discovery into a path requiring protected access.

### DONE

Acceptance is server-evidenced, route continuity preserved, bypass attempts fail closed, and patient public/portal boundaries remain correct.

---

## 4.3 Authenticated Living Home

### EXISTS

Authenticated Living Home and current goal-first/orchestration work already exist; active work moves proprietary routing server-side.

### WHY

One “what needs to happen now?” surface instead of dashboard overload.

### WHERE

Current authenticated home/dashboard route.

### EXPECTATION

Surface only current, role-authorized priorities:

- Grid matches/offers
- pending verifications
- work obligations
- patient/clinical items where authorized
- EDU state
- organization readiness
- revenue/opportunity evidence

### DONE

Returning users land on useful next work, not generic marketing or a 20-card dashboard.

---

## 4.4 Grid public experience

### EXISTS

Public Grid, reviewed real resources, map/location logic, public resource-detail work, privacy-reduced coordinates.

### WHY

Allow value before signup and create shareable acquisition surfaces.

### WHERE

`/grid`, `/grid/browse`, reviewed resource detail routes.

### EXPECTATION

`DISCOVER → UNDERSTAND → AUTHENTICATED GOVERNED REQUEST`.

### DONE

No fake supply; every public listing has real source/review state and consequential action crosses into authenticated policy.

---

## 4.5 Grid authenticated experience

### EXISTS

Demand/offer/reservation/fulfillment/trust/dispute/economic structures already exist materially.

### WHY

Turn expressed needs and capabilities into governed connections and transactions.

### EXPECTATION

User should be able to tell Zumi what they need/have; Zumi prepares a structured draft; user confirms; policy checks; Grid persists; matching operates on real eligibility.

### DONE

No parallel job board/vendor marketplace/space marketplace is necessary for the supported categories.

---

## 4.6 EDU public experience

### EXISTS

Public EDU exists; Workforce proof work exists; five pathways + Career Readiness are canonical.

### WHY

Sell/communicate workforce and education value to institutions and participants.

### EXPECTATION

Visually converge with Klinikos Black Label and prove the platform is already built without claiming branch-only functions are live.

### DONE

A buyer can understand programs, pathways, Zumi, human instructor authority, evidence and reporting from one coherent product surface.

---

## 4.7 EDU authenticated experience

### EXISTS

Programs, cohorts, enrollments, scenarios, assignments, grading, certificates and Workforce evidence architecture materially exist.

### EXPECTATION

Role-specific learner/instructor/program-manager experiences; human authority remains final for attendance/completion.

### DONE

Learner can complete real exercises; instructor can review evidence; program manager can see truthful completion/reporting state.

---

## 4.8 Patient experience

### EXISTS

Patient portal/login and patient-facing work exist; patient authority remains separate from staff authority.

### WHY

Patients need “what’s next for me?” not a miniature EHR.

### WHERE

Patient portal/public discovery paths.

### EXPECTATION

Prioritize:

- appointments
- forms
- documents
- messages
- instructions
- released results
- payments
- requests
- telehealth entry where actually supported

### DONE

Patient can find the next useful action without being exposed to staff-only complexity.

---

## 4.9 Clinic operational experience

### EXISTS

Clinic OS foundation materially includes Front Desk, patient management, tasks, scheduling, referrals, billing/RCM, Current Visit/clinical work and management/insights surfaces.

### WHY

Operate the organization after the network gets the clinic into Klinikos.

### EXPECTATION

Different roles receive different workspaces:

- front desk → schedule/forms/communications/logistics
- MA → intake/vitals/reconciliation/delegated work
- nurse → role-appropriate clinical work
- provider → changes/exam/plan/signing/results
- coder/biller → documentation/coding/claims
- manager → operations/exceptions/staffing/revenue

### DONE

One generic staff dashboard no longer substitutes for role-specific work.

---

## 4.10 Enterprise/admin

### EXISTS

Administrative, commercial, organization, integration and system-health surfaces materially exist.

### WHY

Large organizations need governance, configuration, audit and management rather than consumer UX.

### EXPECTATION

Denser layout is acceptable, but same design language, state vocabulary and Zumi interaction law must apply.

### DONE

Enterprise users can understand tenant/location/configuration/integration readiness without exposing proprietary or patient detail unnecessarily.

---

# 5. Detailed user paths

Every path below must be implemented through the same universal identity/claim/verification/authority/intent framework.

---

## PATH 1 — PATIENT / CONSUMER

### WHO

A person seeking healthcare or wellness services for themselves.

### WHY THEY ARRIVE

Examples:

- doctor
- dentist
- physical therapy
- no-fault care
- podiatry
- behavioral health
- med-spa service
- specialist
- diagnostic/service resource

### ENTRY

Public `/` or public Grid/service deep link.

### FIRST 30 SECONDS

1. User says what they need.
2. Zumi asks only minimum discovery questions.
3. Real reviewed resources are shown if available.
4. No clinical suitability claim is made.

### SIGNUP TRIGGER

Save/contact/request/book/persistent preferences/portal action.

### VERIFICATION

Personal email/phone/passkey or approved consumer mechanism.

### GRID OBJECTS

`I NEED = service / provider / resource`.

### FIRST VALUE

A real service/provider/resource result or clear next route.

### FREE

Discovery, selected search/browse, basic account, basic requests where commercially appropriate.

### PAID

Possible patient payments only when tied to legitimate provider/service workflow. Do not monetize referral in prohibited ways.

### RETURN

Appointments, request status, forms, messages, payments, released information.

### FAILURE

No inventory → truthful no-match state + save/request/notify option where supported.

### DONE

Patient gets value without understanding Grid or Clinic OS.

---

## PATH 2 — CAREGIVER / FAMILY

### WHO

Person helping another patient.

### FIRST VALUE

Public resource/service discovery and non-PHI coordination.

### CLAIM

“I am helping my mother/father/child/etc.”

### VERIFICATION/AUTHORITY

Caregiver relationship does not grant chart access. Protected information requires patient/legal proxy authorization.

### DONE

Caregiver can help find resources without accidental patient-data access.

---

## PATH 3 — STUDENT

### WHO

Nursing, MA, coding/billing, public health, healthcare IT, allied health, pre-med and other learners.

### ENTRY

“I’m finishing nursing school and need work.”

### FIRST 60 SECONDS

1. Zumi identifies student + career/learning intent.
2. Asks school/program/graduation/desired role/location.
3. Shows public-safe opportunity/EDU preview if available.
4. Offers free account to save and publish availability.

### VERIFICATION

Institution email preferred when available. Approved fallback allowed.

### UPLOAD

Resume/CV/certificate may be parsed into a **draft** profile. User confirms before persistence.

### GRID

`I HAVE = skills + availability + education`.

`I NEED = employment / internship / externship / placement / mentor / training`.

### FREE

Basic profile, discovery, basic posting/matching, referrals.

### PAID

Do not charge for basic job-seeking. Institutional EDU/student premium services may exist later if they create genuine value.

### NETWORK LOOP

Invite classmates, instructor, program administrator, employer.

### RETURN

New opportunities, missing verification, employer interest, EDU recommendations.

### DONE

Student becomes a high-quality network node without a separate student app.

---

## PATH 4 — JOB SEEKER / HEALTHCARE WORKER

### WHO

RN, LPN, NP, MA, biller, coder, front desk, manager, lab tech, phlebotomist, Epic analyst/tester, scheduler, care coordinator and related workers.

### FIRST VALUE

Professional profile + real matching opportunities.

### VERIFICATION

Email may verify communication; professional claims remain separately verifiable.

### ZUMI

Improve resume/profile without inventing qualifications.

### GRID

`I HAVE = skills / availability / service capacity`.

`I NEED = job / contract / project`.

### FREE

Basic participation.

### PAID

Employer/recruiter side, premium commercial tools, optional worker premium only if value clearly exceeds friction.

### DONE

Worker can publish availability and get relevant opportunities without a generic social feed.

---

## PATH 5 — CLINICIAN / REGULATED PROFESSIONAL

### WHO

Physician, NP, PA, RN, LPN, dentist, PT, psychologist, podiatrist, chiropractor, therapist, pharmacist and other regulated professionals.

### CLAIM

Professional identity begins self-reported.

### VERIFICATION

Appropriate license/NPI/registry/organization evidence.

### AUTHORITY

Professional verification does not equal tenant access, patient access or privileges.

### GRID

Can express:

- work availability
- services
- consultation capacity
- teaching availability
- space/resource needs

### CLINIC OS

Only after organization relationship + role/privilege authority.

### DONE

Klinikos can distinguish professional identity, verified credential and actual workflow permission.

---

## PATH 6 — CLINIC OWNER / PRACTICE OWNER

### ENTRY

“I own/run a clinic.”

### IMMEDIATE ZUMI QUESTIONS

What are you trying to improve first?

Possible intents:

- find staff
- find patients
- list unused space/capacity
- referrals
- scheduling
- follow-up
- revenue recovery
- billing
- communications
- vendors
- equipment
- staff training
- AI/workflow automation
- multi-location operations
- full Clinic OS

### IDENTITY

Personal account first.

### ORGANIZATION CLAIM

Resolve/create claimed organization.

### VERIFICATION

Require organization-domain email or approved alternative before official representation. Stronger owner/admin proof for high authority.

### FREE FIRST VALUE

Basic organization presence / selected Grid demand/supply / needs analysis preview.

### COMMERCIAL CONVERSION

Clinic OS, recruiting, automation, premium distribution, implementation, revenue tools, analytics, enterprise support.

### NETWORK EFFECT

Each clinic can add staff demand, services, capacity, providers, referrals, education demand and resources.

### DONE

A clinic can join for network value before full SaaS purchase, then naturally expand into operations.

---

## PATH 7 — CLINIC STAFF

### ENTRY

Usually invite/verified organization relationship.

### ROLE

Front desk, MA, nurse, provider, coder/biller, manager, compliance/quality, other configured roles.

### ZUMI

Context changes by active role/location/authority.

### AUTHORITY

Server-owned RBAC + purpose + relationship.

### FIRST VALUE

Immediate current work, not organization setup.

### DONE

Staff sees only the work they can actually do.

---

## PATH 8 — EMPLOYER / RECRUITER

### ENTRY

“We need three MAs.”

### VERIFICATION

Verified organization relationship before representing employer/posting official demand.

### GRID

Structured job/work demand.

### DATA

Location, schedule, compensation, skills, credentials, start date, employment/contract type.

### FIRST VALUE

Real candidate/supply preview or market availability signal.

### PAID

Recruiting workflow, premium distribution, candidate management, enterprise tools.

### DONE

Employer can create real demand conversationally without a separate job-board product.

---

## PATH 9 — SCHOOL / UNIVERSITY / TRAINING PROGRAM

### ENTRY

Institutional administrator, program director, faculty.

### VERIFICATION

Institution domain + relationship/admin proof.

### CAPABILITIES

- institution profile
- programs
- cohorts
- EDU delivery
- instructors
- student rosters
- employer/clinic opportunities
- completion evidence
- reporting

### NETWORK EFFECT

School brings students; employers bring demand; students bring professional supply.

### PAID

Institutional EDU, workforce programs, analytics/reporting, enterprise support.

### DONE

School operates through EDU + Grid rather than a disconnected LMS.

---

## PATH 10 — WORKFORCE BOARD / GOVERNMENT PROGRAM

### ENTRY

“We need AI workforce training.”

### ROUTE

Public Living Home → Zumi → EDU Workforce buyer path.

### VERIFICATION

Government/institution domain + organization relationship when moving beyond public information.

### FIRST VALUE

Show existing program infrastructure and configurable delivery model.

### CURRENT CANONICAL WORKFORCE SCOPE

Industry Accelerator pathways:

1. Manufacturing
2. Construction
3. Logistics
4. Healthcare
5. Business Operations

Career Readiness is separate.

### AUTHORITY

Human instructor owns official attendance/completion. Zumi is practice/intelligence, not certifying authority.

### PAID

Institutional contract / implementation / participant delivery.

### DONE

Proposal → website → live demo → contracted delivery all feel like one product.

---

## PATH 11 — EDUCATOR / INSTRUCTOR

### ENTRY

“I want to teach / I’m an instructor.”

### VERIFICATION

Institution email / directory / institution relationship / approved professional evidence.

### GRID

`I HAVE = expertise + availability`.

`I NEED = teaching opportunity / institution / cohort`.

### EDU AUTHORITY

Teaching, grading and completion authority only through governed institution/program/course assignment.

### DONE

Instructor marketplace opportunity exists without self-granting classroom authority.

---

## PATH 12 — HEALTHCARE VENDOR / SERVICE COMPANY

### WHO

Billing, labs, imaging, transport, medical supplies, IT/security, credentialing, legal/accounting, marketing, consulting.

### VERIFICATION

Business-domain + organization relationship.

### GRID

`I HAVE = commercial service/capacity`.

Clinics express matching needs.

### PAID

Premium commercial listing/distribution, qualified leads, integrations, lawful transactions.

### DONE

Vendors become governed network supply, not spam directory entries.

---

## PATH 13 — SPACE / EQUIPMENT / CAPACITY PROVIDER

### ENTRY

“I have a treatment room/equipment available.”

### ZUMI

Creates structured draft from natural language.

### GRID DATA

Type, location, availability, rate, requirements, credential/insurance conditions, capacity.

### VERIFICATION

Owner/organization relationship where required.

### PAID

Transaction or premium distribution only after lawful commercial policy is activated.

### DONE

Unused healthcare capacity can become discoverable without a separate classifieds product.

---

## PATH 14 — INVESTOR / CAPITAL

### ENTRY

“I invest in healthcare technology.”

### PUBLIC VALUE

Public-safe company information.

### RESTRICTED VALUE

Data room, roadmap, financials, private architecture and sensitive pitch material require stronger business/identity verification + confidential-access agreement + explicit approval.

### GRID FUTURE

Capital supply/demand only after securities/legal review; do not create an unregulated investment marketplace by default.

### DONE

Investor can engage without exposing crown-jewel IP publicly.

---

## PATH 15 — ENTREPRENEUR / FOUNDER

### ENTRY

“I want to open/buy/sell a healthcare business.”

### FIRST VALUE

Zumi identifies needed building blocks:

- education
- clinic software
- vendors
- staff
- space
- equipment
- capital resources
- implementation

### COMMERCIAL

Implementation/consulting/Clinic OS/enterprise services.

### DONE

Entrepreneur uses the same network supply instead of a separate startup portal.

---

## PATH 16 — PARTNER / BUSINESS DEVELOPMENT

### ENTRY

Partnership, integration, distribution, clinic network, strategic relationship.

### UPLOAD

Proposal/company material allowed through governed upload.

### ZUMI

Structures opportunity; does not approve partnership.

### ROUTE

Business-development review.

### PROTECTION

Restricted materials use confidential-access path.

### DONE

High-value partner leads become structured opportunities rather than inbox chaos.

---

## PATH 17 — PROCUREMENT / RFP / GRANT USER

### ENTRY

Upload RFP/RFQ/RFI/grant/proposal request.

### ZUMI

Extract:

- buyer
- deadline
- eligibility
- scope
- mandatory forms
- questions
- pricing structure
- submission route

### TRUTH

Discovered ≠ qualified ≠ submitted ≠ awarded.

### INTERNAL/EXTERNAL DISTINCTION

Internal Klinikos Opportunity Engine may use this first. External customer product should only be marketed once actually implemented.

### DONE

Procurement intake becomes structured without fabricated status.

---

## PATH 18 — REFERRER

### PURPOSE

Turn every useful user into a network acquisition channel.

### EXPERIENCE

Invite with context, not generic “join Klinikos.”

Example:

“I think Klinikos could help your clinic hire nurses.”

### BACKEND

Store invitation intent/context safely.

### AUTHORITY

Invitation acceptance never automatically creates a network relationship, organization membership, chart access or permission.

### DONE

Recipient lands in the intended Zumi path with context preserved.

---

## PATH 19 — ENTERPRISE BUYER

### WHO

Hospital, network, multi-location group, university, workforce system, large employer.

### ENTRY

Needs assessment through Zumi.

### VERIFICATION

Organization domain + representative authority.

### FIRST VALUE

Show relevant operating, EDU, Grid, integration and enterprise capabilities based on actual truth state.

### PAID

Enterprise agreement, implementation, multi-org/location administration, analytics, support, integrations.

### DONE

Enterprise buyer never has to navigate consumer signup just to request a serious evaluation.

---

# 6. Universal upload path

## WHAT

A governed ingestion layer for resumes, licenses, credentials, job descriptions, proposals, RFPs, business plans, service menus, equipment lists, course material, certificates, bios and organization documents.

## WHY

Users already possess structured truth in files. Klinikos should reduce re-entry while preserving accuracy.

## WHEN

Only after user initiates upload and appropriate legal/privacy conditions are met.

## HOW

1. upload
2. security/type/size checks
3. classify document
4. ask user what they want done if intent is unclear
5. extract draft structured facts
6. show extracted draft
7. user corrects/approves
8. persist as claim/evidence according to authority

## SECURITY

- no public bucket exposure
- signed limited URLs
- malware/security scanning path where possible
- retention/deletion rules
- prompt-injection isolation
- no auto-authority from document text

## DONE

Uploads save time without silently creating false credentials/profile facts.

---

# 7. Referral flywheel

Every path should expose an appropriate referral action after first value.

Examples:

- student → classmate
- employee → coworker
- clinic → candidate
- provider → colleague
- patient → family member
- school → employer
- vendor → clinic
- investor → founder

Referral should preserve safe context and track conversion without exposing protected data.

Success metrics:

- referral sent
- referral opened
- meaningful Zumi interaction
- signup
- verification
- first Grid object
- first successful match/interaction

---

# 8. Return-user experience

## PRINCIPLE

Do not show a generic authenticated homepage.

## ZUMI SHOULD SURFACE

Only authorized, useful current state such as:

- new Grid match
- offer/request response
- missing verification
- upcoming EDU session
- open clinic task
- unresolved referral
- patient next step
- unused capacity
- organization setup blocker
- commercial renewal/usage issue

## SOURCE LAW

Every message must come from current authoritative records, not remembered AI text.

## DONE

Returning user immediately understands what changed and what to do next.

---

# 9. Notifications

## CHANNELS

- in-app
- email
- SMS where legally/operationally approved
- push later

## EVENTS

- new match
- message
- booking/request
- course/session
- credential expiration
- payment
- task
- referral
- organization verification

## CONSENT

Channel/marketing/clinical communication rules remain separately governed.

## DONE

Notifications correspond to real value and do not become spam or unauthorized PHI disclosure.

---

# 10. Free vs paid economics

## FREE BY DEFAULT

- basic patient discovery
- basic student account
- basic worker/professional profile
- basic Grid discovery
- basic selected need/have posting
- basic referrals

Why: these users create network liquidity.

## ORGANIZATIONS PAY FOR LEVERAGE

Potential monetization:

- Clinic OS
- organization admin
- premium Grid distribution
- recruiting
- lead generation
- automation
- communications
- AI usage beyond allowance
- payments/revenue recovery
- EDU institutional contracts
- implementation
- analytics
- integrations
- enterprise support
- lawful transaction economics

## LAW

Subscription/payment never creates regulated authority.

---

# 11. Pricing / entitlement activation expectations

Commercial claims must distinguish:

- displayed price
- configured product
- eligible checkout
- payment initiated
- payment verified
- entitlement created
- organization provisioned
- activation complete

Never infer payment from redirect/UI state.

A paid buyer path is done only when the actual entitlement and organization/user relationship are server-evidenced and auditable.

---

# 12. Zumi everywhere expectations

## PUBLIC ZUMI

Public-safe routing and explanation.

## PERSONAL ZUMI

Personal goals/preferences/claims with user-controlled memory.

## ORGANIZATION ZUMI

Tenant-authorized operational context.

## CLINICAL ZUMI

Only authorized current clinical data; clinical truth is retrieved from governing domains, not duplicated into memory.

## EDU ZUMI

Practice/simulation support; instructor remains authority.

## GRID ZUMI

Need/have drafting, matching explanation, transaction guidance; deterministic policy owns eligibility.

## ENTERPRISE ZUMI

Readiness, configuration, reporting and operations guidance based on authoritative enterprise state.

## UNIVERSAL LAW

Zumi never bypasses verification, policy, tenant, clinical, payment, education or legal authority.

---

# 13. Memory expectations

Memory layers should distinguish:

- user preference memory
- professional/persona memory
- working/session memory
- episodic interaction memory
- organization-approved knowledge
- outcome evidence

Clinical truth stays in clinical domains.

Every remembered fact needs provenance and appropriate scope.

Users should eventually be able to inspect/forget editable personal memory.

---

# 14. Trust / anti-fraud

Klinikos must plan for:

- fake clinic
- fake clinician
- fake student
- fake employer
- fake job
- fake investor
- spam vendor
- duplicate organization
- credential fraud
- phishing
- malicious upload
- marketplace manipulation

Controls:

- progressive verification
- rate limits
- reporting
- moderation
- trust/safety evidence
- manual review
- audit
- settlement holds where relevant

Do not create an opaque public social trust score.

---

# 15. Front-end truth states

Every major screen must support truthful states:

- loading
- empty
- partial / bounded
- ready
- waiting
- verification required
- review required
- blocked
- unavailable
- degraded
- error
- success

Examples:

- no Grid supply ≠ 0% marketplace success
- integration connected ≠ production verified
- payment initiated ≠ paid
- enrolled ≠ attended ≠ completed
- uploaded license ≠ verified credential
- invitation accepted ≠ governed relationship established

---

# 16. Visual reconstruction expectation

All public and authenticated surfaces should converge toward one Klinikos design language:

- Obsidian / near-black
- Black Cherry / Oxblood structural surfaces
- Warm Ivory typography
- Dusty Rose / muted coral accents
- approved rose imagery
- premium editorial spacing
- calm cinematic motion

Avoid:

- generic SaaS gradients
- old cyan/teal dominance
- random gold
- excessive glass cards
- dashboard clutter
- childish LMS visuals
- multiple inconsistent chat controls

Accessibility outranks decoration.

---

# 17. Responsive acceptance expectations

Every high-value journey must be QA’d at:

- 320
- 375
- 390
- 430
- 768
- 1024
- 1280
- 1440+

Composer must remain usable in:

- mobile portrait
- tablet
- half-width desktop
- full-width desktop

No overlap between Zumi controls, keyboard, send button and navigation.

---

# 18. Repository truth system

## REQUIRED STATES

- PRODUCTION_VERIFIED
- DEPLOYED_UNVERIFIED
- MERGED_NOT_DEPLOYED
- IMPLEMENTED_UNVERIFIED
- IN_ACTIVE_DEVELOPMENT
- APPROVED_DESIGN
- PLANNED
- BLOCKED
- DEPRECATED

## REGISTRY EXPECTATION

Create machine-readable product truth with:

- capability key
- domain
- state
- authoritative source
- implementation evidence
- deployment evidence
- public claim rule
- dependency
- audited SHA/date

## WHY

Docs, code, proposal copy and marketing must stop disagreeing.

## DONE

A new engineer can answer “what is live?” without reading chat history.

---

# 19. Where every major authority belongs

| Concern | Authority |
|---|---|
| Authentication | Account/current auth service |
| Person identity | universal identity substrate when merged |
| Organization membership | organization relationship authority |
| Professional credential | credential/verification authority |
| Tenant role/capability | server RBAC/policy |
| Patient access | patient/clinical relationship authority |
| Grid eligibility | Grid policy/eligibility |
| Grid transaction state | Grid demand/offer/reservation/fulfillment stores |
| Attendance | EDU attendance authority |
| Course completion | EDU deterministic evidence + human instructor authority |
| Payment | payment/commerce evidence |
| Subscription | entitlement/commercial authority |
| Legal acceptance | legal acceptance/evidence store |
| External integration status | integration lifecycle evidence |
| Zumi memory | memory/knowledge context only, not domain truth |

No redesign may move these authorities into the browser.

---

# 20. Per-path engineering definition of done

A path is not complete when a page exists.

A path is complete when the full chain works:

`VISIBLE UI → USER ACTION → IDENTITY/CONTEXT → CLAIM/VERIFICATION → AUTHORIZATION → INTENT → DOMAIN ENGINE → REAL DATA → PERSISTENCE/EVENT → TRUTHFUL RESULT → AUDIT/EVIDENCE → NEXT USEFUL ACTION`

For paid paths add:

`→ PAYMENT EVIDENCE → ENTITLEMENT → PROVISIONING → ACCESS`

For external integrations add:

`→ EXTERNAL EXECUTION → RECONCILIATION`

For EDU add:

`→ VERIFIED ATTENDANCE → APPLIED EVIDENCE → KNOWLEDGE → INSTRUCTOR REVIEW → COMPLETION → CERTIFICATE`

For clinical workflows add:

`→ CLINICAL AUTHORITY → SIGNING/REVIEW → AUDIT` as appropriate.

---

# 21. Required implementation order after approval

1. latest-main + open-PR concurrency map
2. repository truth registry
3. identity/claims/verification projection
4. universal path resolver over existing Living Home/Zumi routing
5. public Living Home visual/interaction reconstruction
6. progressive signup/onboarding
7. Grid need/have conversational creation
8. student/worker/professional paths
9. clinic/employer/organization paths
10. EDU/Workforce public + evaluator convergence
11. patient/caregiver convergence
12. investor/partner/procurement paths
13. return/referral/notification flywheel
14. commercial/entitlement convergence
15. global visual/accessibility/performance release gate

No step should duplicate active branch work. Reconcile first.

---

# 22. Required report after every tranche

Every implementation tranche must report:

- exact latest main SHA
- exact feature head SHA
- active overlapping PRs reviewed
- what already existed
- what was stale/wrong
- what changed
- paths affected
- files changed
- schema/migration impact
- authority impact
- privacy/security impact
- user experience before
- user experience after
- revenue impact
- network effect
- tests run
- exact results
- browser/mobile/accessibility evidence
- build/start evidence
- deployment evidence if released
- unverified items
- next safe tranche

Never report “done,” “green,” “live,” “verified,” or “production-ready” without exact evidence.

---

# 23. Final experience test

A user arrives at `klinikos.io` and says:

> “I’m finishing nursing school and need work in Brooklyn.”

Klinikos should progressively:

1. understand student + work intent
2. show useful public-safe value
3. create one account when persistence is needed
4. request school verification
5. accept resume
6. create draft profile facts
7. require user confirmation
8. create Grid availability/work intent
9. show real opportunities
10. suggest relevant EDU
11. support contextual referral
12. return later with new matches/actions

A clinic owner arrives at the same site and says:

> “I need two therapists.”

Klinikos should:

1. identify organization/employer path
2. create/resolve personal identity
3. resolve claimed clinic
4. require business-domain/approved organization verification
5. structure job demand
6. human confirms
7. publish through Grid
8. match real supply
9. introduce recruiting/Clinic OS paid leverage
10. continue into organization operations without creating a second account

A patient arrives and says:

> “I need no-fault physical therapy.”

Klinikos should:

1. ask minimum discovery questions
2. show real approved resources
3. avoid clinical suitability claims
4. require account only when persistence/contact/request requires it
5. enter patient portal only when governed relationship exists

A workforce buyer arrives and says:

> “We need AI training for 500 workers.”

Klinikos should:

1. detect institutional/workforce intent
2. show real EDU proof
3. show five pathways + Career Readiness
4. explain human + Zumi model
5. require organization verification for buyer workflow
6. route to demo/needs assessment/configuration

An investor arrives and says:

> “I want to invest.”

Klinikos should:

1. show public-safe company information
2. detect investor intent
3. require stronger identity/business proof for restricted material
4. require confidential-access agreement
5. expose only approved materials
6. route relationship to BD

Same URL. Same identity architecture. Same Zumi. Same Grid. Different governed path.

---

# 24. Final law

Klinikos must become easier to use as the backend becomes more powerful.

The user should see less complexity while the system gains more verified relationships, more network liquidity, more operating capability and more evidence.

**One identity. One trust graph. One intelligence layer. One Grid. Many paths. One truthful Klinikos.**
