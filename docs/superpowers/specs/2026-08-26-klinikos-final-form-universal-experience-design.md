# KLINIKOS FINAL-FORM UNIVERSAL EXPERIENCE & REPOSITORY TRUTH DESIGN

Date: 2026-08-26  
Status: PROPOSED ARCHITECTURAL DESIGN  
Base main at design start: `7cc55fa557075c9515acca8609bd860d52fb803c`  
Repository: `jcamacho611/Clinicos-by-Zumi`

## 0. Why this document exists

Klinikos has outgrown a normal website redesign. The repository already contains substantial Clinic OS, Grid, Network, EDU, Zumi, patient, commercial, identity, legal/access, trust, finance, interoperability, design-system, and Living Home work. The product problem is no longer simply "add more features." The problem is that a very large backend and many valid subsystems must converge into one understandable, truthful, premium experience while repository truth must stop drifting across old docs, open PRs, product copy, and implementation state.

This design therefore defines both:

1. the final-form human experience, from first visit through identity, verification, Grid participation, work, return, and network expansion; and
2. the repository truth system that prevents Klinikos from claiming something is live, complete, verified, integrated, deployed, or authoritative when the evidence does not support that claim.

This document does **not** authorize a big-bang rewrite. It defines the target architecture and the sequence by which the existing product is converged safely.

---

# 1. Current product truth at design start

## 1.1 What Klinikos already is

Current canonical repository truth defines Klinikos as a multi-tenant healthcare operating ecosystem rather than an EHR, CRM, LMS, marketplace, AI assistant, or patient portal in isolation.

The current product architecture already recognizes these major engines:

- Living Home
- Klinikos Intelligence / Zumi
- Clinic OS
- Grid
- EDU
- Care
- Billing / Financial OS
- Insights
- Network / Capacity
- Identity / Organizations / Roles
- Credentials / Eligibility / Trust
- Events / Audit / Provenance
- Patient Portal
- Commercial activation

These engines are intended to interoperate as one ecosystem.

## 1.2 What already exists publicly

The repository already contains public or pre-auth surfaces including:

- `/` — Living Home / public conversation-first entry
- `/access` — protected-entry work
- `/pricing`
- `/start`
- `/grid`
- `/grid/browse`
- public Grid resource/detail/enrollment paths
- `/edu`
- `/portal/login`
- `/login`
- legal/privacy/terms surfaces
- public product/about/capability surfaces

The public product should not be rebuilt as a static product-menu homepage. Existing direction already establishes Living Home as the conversational front door.

## 1.3 What already exists in Grid

Grid already has substantial implementation truth including:

- generalized demand/resource transaction primitives
- universal `I NEED / I HAVE` expression
- public reviewed inventory
- provider/resource/location discovery
- public enrollment flows
- Haversine radius logic
- OpenStreetMap/OpenFreeMap work
- reduced public coordinate precision
- demand → offer → reservation lifecycle
- fulfillment and financial obligation records
- disputes and safety incidents
- real-only inventory requirement
- no fake nearby markers
- transaction and trust/evidence concepts

Therefore the redesign must **reuse and generalize Grid**, not build a second job board, provider directory, student marketplace, patient directory, vendor marketplace, or opportunity system.

## 1.4 What already exists in EDU / Workforce

Klinikos EDU already exists as a first-class public and authenticated product area.

Existing/current direction includes:

- institutional/program/course/cohort concepts
- enrollments
- scenarios
- assignments
- submissions/evidence
- grading/release boundaries
- synthetic training rules
- Workforce configuration direction
- Career Readiness
- five canonical Industry Accelerator pathways: Manufacturing, Construction, Logistics, Healthcare, Business Operations
- instructor-led authority boundaries
- attendance/completion/evidence direction
- Kentucky/SCWDB as one institutional configuration rather than a product fork

The public redesign must present this existing foundation truthfully and visually as part of the same Klinikos ecosystem.

## 1.5 What already exists in Zumi

Klinikos Intelligence / Zumi already has governed architecture around:

- provider-neutral AI gateway concepts
- tenant/RBAC/entitlement admission
- prohibited-capability policy
- sensitive-data / PHI redaction order
- signed conversation continuity
- public and authenticated intent routing
- audit/usage concepts
- memory/knowledge direction
- public buyer-intent routing work

Zumi is not a new chatbot to be added to the redesigned site. Zumi is the experience orchestrator that must increasingly sit over the entire system while remaining non-authoritative.

## 1.6 What already exists in identity / account / access work

The repository has active identity and universal-account work that is not yet equivalent to "fully released universal public membership." Existing branches include additive Person / membership / Account / protected-entry concepts.

Critical current law remains:

- one person should evolve across roles rather than create disconnected accounts;
- clinic/staff authority cannot be widened by public/free-member identity;
- patient sessions remain separately governed;
- organization/tenant context is server-owned;
- identity context does not equal authority;
- protected-entry acceptance does not create role, credential, organization, clinical, Grid, EDU, payment, or tenant authority.

The redesign must compose with these rails rather than creating a fourth auth system.

## 1.7 What already exists in legal/protected access

There is current work for:

- Universal Entry Gateway
- layered protected-access acceptance
- advanced confidential-access agreement for investor/partner/demo/data-room access
- generated legal document architecture

Therefore the redesigned first visit cannot simply hard-code a universal NDA modal that conflicts with current legal architecture.

The target should be progressive agreement layering:

- public Terms/Privacy where appropriate
- protected-entry baseline where appropriate
- professional/Grid terms when the user enters that path
- organization/clinic terms when the user represents an organization
- EDU/institutional terms when appropriate
- commerce/seller terms when appropriate
- confidential-access agreement for sensitive investor/partner/demo material

## 1.8 What already exists in visual design

The current authoritative design direction is not the older cyan/teal/gold description still found in some historic docs.

Current approved direction is:

- Obsidian / near-black foundation
- black cherry / oxblood structural surfaces
- warm ivory typography
- dusty rose / muted coral / ember-pink accents
- approved rose imagery / atmosphere
- generous editorial composition
- cinematic but calm
- reduced visual clutter
- real state-driven motion

Approved production assets include:

- `public/klinikos-orbital-k-transparent.png`
- `public/klinikos-wordmark-transparent.png`
- `public/klinikos-rose-wide-transparent.png`
- `public/klinikos-rose-centered-transparent.png`

The full frontend redesign must converge old visual islands onto this newer product language rather than creating another parallel theme.

## 1.9 What is not currently safe to claim

The redesign must not claim merely from code that Klinikos is:

- a certified EHR
- HIPAA certified/compliant as a blanket marketing conclusion
- connected in production to external clinical rails without verified evidence
- performing external payout settlement merely because an internal obligation exists
- externally verifying every license/malpractice status when only internal review exists
- using PHI with external AI unless the exact provider/configuration/contract/deployment permits it
- fully deployed merely because code is merged
- fully verified merely because GitHub reports a PR mergeable

---

# 2. Final product definition

## 2.1 North-star definition

**Klinikos is the healthcare operating network: one persistent identity, one governed intelligence layer, one trust/relationship graph, one opportunity/resource network, and many role-aware experiences.**

The product hierarchy is:

- **Klinikos** — operating ecosystem and brand
- **Zumi / Klinikos Intelligence** — conversational intelligence and orchestration
- **Grid** — network of needs, capabilities, resources, opportunities, capacity, services and relationships
- **Klinikos EDU** — education, simulation, competency and workforce advancement
- **Clinic OS / Care / Billing / Insights / Network** — operating engines for organizations and care work
- **Patient experience** — patient-owned or released access, discovery, requests and relationship workflows

The user does not have to understand this hierarchy in order to use it.

## 2.2 Product experience principle

The customer should never feel that they are choosing among disconnected products.

The customer should feel:

1. Klinikos understands why I am here.
2. Klinikos understands what I need or what I can offer.
3. Klinikos asks only the information required for the next safe step.
4. Klinikos verifies the claims necessary for the authority I am requesting.
5. Klinikos immediately shows relevant value.
6. Klinikos remembers the safe context needed to continue later.
7. Klinikos reveals deeper capabilities only when they become useful.

---

# 3. The universal first-visit journey

## 3.1 Stage A — ARRIVAL

### What the user sees

The user enters `https://klinikos.io`.

The first screen must immediately establish:

- Klinikos brand
- trust
- what Klinikos broadly enables
- Zumi as the primary interaction surface
- a concise invitation to describe the desired outcome

Primary prompt:

> **What needs to happen?**

or a similarly direct form aligned with the approved Living Home canon.

### What the user should NOT see first

Do not lead with:

- a 12-card product catalog
- a persona-selection wizard
- a list of internal engines
- architecture language
- a long pricing wall
- an immediate universal registration form

### Why

The human knows their problem better than the product taxonomy. Klinikos should perform the translation.

### System behavior

Anonymous public Zumi receives only public-safe context and public capability routing.

No user claim creates role or authority at this stage.

### Done when

A new patient, student, clinician, employer, clinic owner, vendor, school administrator, investor, or workforce buyer can each type an ordinary-language request without selecting a product category first.

---

## 3.2 Stage B — BASELINE TRUST / LEGAL RELATIONSHIP

### Current design decision

Do **not** enforce a blanket NDA merely because someone viewed the public home page.

Instead use progressive legal gates.

### Public browsing

Public Terms and Privacy notice remain available and apply according to reviewed product/legal policy.

### Protected interactive access

When the user crosses into a protected experience, use the current Universal Entry / protected-access agreement architecture if and when it is verified and enabled.

### Sensitive investor / partner / demo access

When the user seeks nonpublic investor materials, private architecture, restricted demo material, data-room access, or protected partnership disclosures, use the stronger confidential-access agreement path.

### Evidence expected

For affirmative acceptance store, as appropriate:

- agreement key
- version
- exact content/hash
- acceptance timestamp
- identity or later-bound identity
- acceptance source
- IP/user-agent evidence where counsel-approved and lawful
- revocation/supersession events where relevant

### Done when

Legal acceptance is server-evidenced and cannot be confused with authorization, role, organization ownership, payment, licensure, or clinical authority.

---

# 4. Identity, claims, verification and authority

## 4.1 Core law

Klinikos must separate:

**IDENTITY → CLAIM → VERIFICATION → RELATIONSHIP → AUTHORITY**

A user saying something does not make it verified.

Zumi may understand the claim.

Policy and evidence determine verification/authority.

## 4.2 One-person model

A single person may simultaneously or over time be:

- patient
- caregiver
- student
- professional
- clinician
- employee
- contractor
- educator
- clinic owner
- organization admin
- Grid participant
- investor
- entrepreneur

The system should add relationships and context rather than create disconnected identities for every lifecycle stage.

## 4.3 Email-aware verification

Email classification may include:

- personal consumer
- student
- academic staff
- business
- government
- healthcare organization
- disposable
- unknown

Classification helps choose a verification route. It is not authority itself.

### Business user expectation

If the user claims to represent a clinic, company, vendor, hospital, school, workforce board, government body, or other organization, Klinikos should require organization-domain verification or an approved fallback before granting organization-representation privileges.

A Gmail/Yahoo/Outlook personal address may still create the human's personal identity.

It does not automatically verify the organization.

### Student expectation

If the user claims a school affiliation, request the institution email where available.

Fallback methods may include:

- institution invitation
- verified roster
- enrollment document
- student ID/manual review

The verification method must remain explicit.

### Clinician expectation

Professional email alone is insufficient for regulated clinical authority.

Verification may require appropriate evidence such as:

- license
- NPI where applicable
- registry evidence
- organization affiliation
- credential review

### Government buyer expectation

Prefer recognized government/institutional domain evidence and stronger anti-impersonation controls.

## 4.4 Friction increases with authority

Examples:

- browse public Grid → low/no friction
- save results → account
- contact/post → verified communication channel
- claim student affiliation → school verification
- claim clinician status → credential verification
- represent organization → organization relationship verification
- administer organization → stronger authority verification
- access PHI → relationship + permission + purpose + security
- execute financial action → financial authority

### Done when

No UI or Zumi response can convert a self-reported claim into authoritative role/credential/organization/clinical/payment state.

---

# 5. Zumi as the universal experience orchestrator

## 5.1 What Zumi is

Zumi is the conversational interface over Klinikos.

Zumi should increasingly maintain a safe contextual understanding of:

- who the user is
- what they claim
- what is verified
- what relationship/context is active
- what they need
- what they have
- what they are allowed to do
- what information is missing
- what route is available
- what next step creates value

## 5.2 What Zumi is not

Zumi is not authority for:

- authentication
- tenant access
- RBAC
- clinical decisions
- record release
- professional licensure
- organization ownership
- employment eligibility
- payment
- settlement
- attendance
- course completion
- certificate authority

## 5.3 Runtime shape

User input should conceptually resolve through:

`CONVERSATION → INTENT → IDENTITY/CONTEXT → CLAIMS/VERIFICATION → POLICY/AUTHORITY → ROUTE → ENGINE(S) → REAL DATA/ACTION → RESULT → NEXT STEP`

The proprietary decision/routing machinery stays server-side.

The browser receives minimum-necessary presentation state and permitted actions.

## 5.4 Universal intent vocabulary

Zumi should understand four basic dimensions without forcing the user to say them explicitly:

- **I AM** — identity/context claim
- **I NEED** — demand/problem
- **I HAVE** — supply/capability/resource
- **I WANT TO DO** — desired action/outcome

Examples:

- "I'm graduating nursing school and need work in Brooklyn."
- "I own a PT clinic and need two therapists."
- "I need no-fault physical therapy."
- "I have a treatment room available Tuesdays."
- "I invest in healthcare software."
- "I need AI workforce training for 500 people."

### Done when

The user never has to learn Grid taxonomy before receiving useful routing.

---

# 6. Grid as the universal network graph

## 6.1 Why Grid is central

Grid is not merely a marketplace page. Grid is the system that gives network structure to healthcare supply, demand, capacity, services, opportunity and relationships.

## 6.2 Canonical network categories

Grid must be able to represent governed instances of:

- person/professional
- organization
- job/work opportunity
- service
- space
- equipment
- permitted product/supply
- education/training capacity
- referral/consultation/diagnostic capacity
- availability
- project/contract
- investment/capital opportunity where legally supported
- organization capacity
- other policy-approved resource types

Do not create a separate marketplace engine for every path.

## 6.3 Core object expectations

A Grid resource/demand relationship should be able to capture appropriate subsets of:

- owner
- organization
- resource/demand type
- intent
- visibility
- geography/location
- availability/time window
- requirements
- eligibility rules
- verification state
- capacity
- pricing/rate if relevant
- status
- lifecycle
- privacy classification
- policy restrictions
- fulfillment evidence
- financial obligation where applicable
- trust/dispute/safety state

## 6.4 User posting experience

The user should not need to fill a marketplace ontology manually.

Example:

> "I have a treatment room open Tuesdays."

Zumi should prepare a structured draft from conversation.

The human confirms the draft.

Only then does Grid persist/publish according to policy.

## 6.5 Matching

Hard eligibility must precede ranking.

Matching may consider:

- intent compatibility
- geography
- time
- availability
- verified requirements
- credentials where applicable
- capacity
- price
- organization relationship

AI may interpret or explain. Deterministic policy owns eligibility.

---

# 7. Universal path system

A Path is not just a URL. A Path is the orchestrated experience from first intent to first value, ongoing work, return and network expansion.

Every path must define:

- entry language
- anonymous experience
- identity requirement
- verification requirement
- agreements required
- Zumi opening
- information collected
- `I NEED`
- `I HAVE`
- Grid objects
- first-value moment
- free capability
- paid capability
- authority boundary
- privacy boundary
- referral loop
- return trigger
- success metric
- abuse risk

The initial path catalog must include the following.

## 7.1 Patient / consumer path

Why they arrive: doctor, dentist, PT, no-fault service, specialist, podiatrist, behavioral health, med-spa or other lawful service discovery.

First experience: public Zumi understands service intent, approximate location, availability and other minimum necessary discovery criteria.

First value: relevant real, reviewed resources/providers/services where available.

Signup trigger: save, contact, request, book, persist preferences, use portal functionality or access protected workflows.

Verification: personal email/phone/passkey or other approved consumer mechanism.

Authority boundary: discovery does not equal clinical recommendation or suitability.

Expansion: provider relationship → patient portal → appointments/forms/messages/payments/released information where authorized.

## 7.2 Caregiver / family path

First value: find services/resources and coordinate allowed non-PHI needs.

Additional authority: patient information requires patient-authorized relationship/consent, not caregiver self-claim.

## 7.3 Student path

Entry examples: "I'm a nursing student looking for work." / "I need clinical placement." / "I graduate in December."

First value: relevant opportunities/training/placements while preparing a profile.

Signup: free individual account.

Verification: institutional email when available; approved fallback otherwise.

Data: resume, program, graduation target, location, availability, skills, certifications, desired role.

Grid: `I HAVE` skills/availability; `I NEED` work/placement/opportunity.

EDU: relevant learning/competency recommendations.

Referral loop: classmates, instructor, school/program administrator, employer.

Monetization: basic student participation should remain free; institutions/employers pay for higher-leverage services.

## 7.4 Job seeker / healthcare worker path

Roles may include RN, LPN, NP, MA, front desk, biller, coder, lab tech, phlebotomist, healthcare IT, Epic/UAT tester, scheduler and care coordinator.

First value: profile + matching opportunities.

Zumi role: resume/profile improvement without fabricating qualifications.

Verification: professional claims may be progressively verified.

Monetization: basic participation free; employer/recruiter/organization monetization later.

## 7.5 Clinician path

Entry possibilities: employee, contractor, independent provider, educator, consultant, clinic owner.

Verification: professional credential evidence appropriate to role.

Grid: availability, services, work, space need, consultation capacity and approved professional opportunities.

Authority: verified professional status does not automatically grant tenant clinical privileges or patient access.

## 7.6 Clinic owner / practice path

Entry: "I run a clinic."

Immediate Zumi objective: understand whether the owner needs staffing, patients, space, providers, referrals, revenue, scheduling, communications, billing, vendors, equipment, training, funding, expansion or full Klinikos operations.

Verification: organization-domain email or stronger approved organization proof before official representation/admin authority.

Free layer: basic organization identity/claim request, selected Grid presence/discovery.

Paid layer: Clinic OS, advanced recruiting/matching, operational automation, revenue tools, multi-location, analytics, enterprise support, paid services.

First value: even before full SaaS conversion, a verified clinic should be able to create useful Grid demand/supply and experience network value.

## 7.7 Clinic staff path

Normally organization invite or verified relationship.

Workspace adapts to actual RBAC and role.

Potential roles include front desk, MA, nurse, provider, biller, coder, practice manager, compliance/quality and other configured roles.

User must not see controls simply because the route exists.

## 7.8 Employer / recruiter path

Entry: "I need three medical assistants."

First value: Zumi structures demand and previews relevant supply/match possibilities.

Verification: organization relationship required to represent employer.

Paid opportunities: recruiting workflow, priority distribution, sponsored opportunity, candidate management, verification services where appropriate, enterprise subscription.

## 7.9 School / university / training organization path

Can grow into institution profile, programs, cohorts, instructors, EDU delivery, student roster, placement/opportunity matching, employer relationships, reporting, certificates/evidence where implemented and governed.

The school becomes both a user and a network-acquisition node.

## 7.10 Workforce board / government program path

Entry: "We need AI training for 500 workers."

Route: Zumi identifies enterprise/workforce intent and routes to Klinikos EDU Workforce.

Proof: existing institutional infrastructure, five canonical pathways, Career Readiness, human instructor authority, evidence chain, reporting, accessibility and configuration model.

Verification: institution/government domain and organization relationship as appropriate.

Paid path: enterprise/institutional contract.

## 7.11 Educator / instructor path

May create professional/instructor profile, expertise and availability.

Institutional teaching/grading authority requires approved institution/course relationship, not self-declaration.

Long-term Grid value: institutions may discover instructors and instructors may discover teaching opportunities.

## 7.12 Healthcare vendor path

Examples: billing, lab/imaging, transportation, medical supplies, IT/security, credentialing, legal/accounting, marketing.

Vendor can create company profile and approved service/resource offerings after organization verification.

Organizations can express corresponding needs.

Potential revenue: premium commercial distribution, leads, transactions, integrations, enterprise service discovery.

## 7.13 Space / equipment path

Allow verified/properly governed participants to list approved space/equipment/resource capacity including location, availability, requirements and price where applicable.

Grid manages lifecycle rather than a separate classifieds subsystem.

## 7.14 Investor / capital path

Public entry: investor can state interest and see public-safe company information.

Protected entry: restricted pitch/data-room materials require stronger identity, business-domain proof where appropriate, affirmative confidential-access agreement and explicit access approval.

Future Grid possibility: capital need/capital supply may eventually become a governed class only after legal/commercial review; do not silently turn Grid into an unregulated securities marketplace.

## 7.15 Entrepreneur / founder path

Examples: open med spa, start practice, buy practice, sell practice, launch healthcare company.

Klinikos can progressively connect education, vendors, space, staff, software and organization operating infrastructure.

Commercial opportunities may include implementation, consulting and Clinic OS.

## 7.16 Partner / business-development path

Allow controlled proposal/company/partnership intake.

Zumi can structure the relationship opportunity and route to business-development review.

Sensitive company material remains protected.

## 7.17 Procurement / RFP path

User may upload RFP/RFQ/RFI/proposal/grant materials.

Zumi may extract dates, scope, requirements and questions, but the product should distinguish internal Klinikos Opportunity Engine use from any future external customer feature.

No proposal status becomes "submitted" without actual submission evidence.

## 7.18 Referrer path

Every major identity should be able to invite another participant with context.

Invitation should carry the reason and safe intended path.

Examples: student → classmate; clinic → candidate; patient → family member; provider → colleague; school → employer; vendor → clinic.

Invitation acceptance must not itself grant governed relationships or permissions.

## 7.19 Enterprise buyer path

Examples: hospital, clinic network, university, workforce board, large employer.

Zumi should recognize purchasing intent early and avoid consumer-style onboarding.

Route toward needs assessment, verified organization, demo/configuration, pricing and implementation.

---

# 8. Universal upload experience

Supported conceptual inputs include resume/CV, license/credential, job description, proposal/RFP, business plan, service menu, equipment list, course material, certificate, professional bio and organization profile/document.

After upload, Zumi asks what the user wants done.

Extraction does not silently become authoritative profile truth.

The user reviews/accepts structured claims before persistence.

Sensitive documents receive appropriate privacy/security handling.

---

# 9. Return experience

Returning users should not receive a generic marketing homepage after authentication.

Living Home should project safe, role-aware current state such as new matches, pending verification, unanswered requests, cohort/session reminders, clinic workflow items, Grid offers/reservations, organization readiness and tasks/blockers.

The system should answer: **What needs to happen now?**

---

# 10. Referral and network flywheel

The desired compounding loop is:

- patients attract providers
- providers attract clinics
- clinics attract workers
- workers attract employers
- students attract schools
- schools attract employers
- employers attract candidates
- vendors attract clinics
- clinics attract vendors
- EDU creates learning/competency evidence
- approved evidence can feed opportunity discovery
- opportunities create Grid activity
- Grid activity makes the entire system more useful

Network growth must come from real participant utility, not fake inventory.

---

# 11. Monetization architecture

## 11.1 Free individual participation

Generally free or low-friction: patient discovery, student participation, worker/job-seeker profile, basic professional identity, basic Grid discovery, basic selected postings and referrals/invitations.

Why: these participants create supply, demand and network liquidity.

## 11.2 Organization monetization

Organizations may pay for Clinic OS SaaS, organization administration, recruiting, advanced Grid presence, premium distribution, workflow automation, communications, AI usage beyond included allowance, payments/revenue workflows, EDU institutional delivery, implementation, integrations, analytics, enterprise support and lawful transaction economics where activated through proper commercial authority.

## 11.3 Authority separation

Payment never grants clinical authority, licensure, organization ownership, credential verification, patient access or Grid eligibility.

---

# 12. Front-end reconstruction plan

## 12.1 Goal

The entire customer-facing experience should look and behave like one product.

The rebuild is **not** a single page rewrite. It is convergence of visual shell, navigation, interaction law, Zumi behavior, state truth, responsive behavior and path-specific progressive disclosure.

## 12.2 Public Living Home

Must:

- make Zumi the dominant but calm interaction surface
- communicate Klinikos value quickly
- allow public-safe exploration before unnecessary signup
- preserve approved rose/obsidian design world
- offer contextual examples without persona forcing
- surface real public Grid/EDU/enterprise value based on intent
- preserve intent through later signup/authentication

Must not:

- show huge product tile walls
- fake activity
- fake counts
- fake nearby supply
- show confusing multiple chat surfaces
- use generic hero CTAs disconnected from actual flows

## 12.3 Protected entry / signup

Signup/onboarding should progressively reveal only the questions relevant to the user's path.

One generic database identity, multiple contextual path experiences.

Do not create separate disconnected auth stacks for student, clinic owner, vendor, investor, etc.

## 12.4 Authenticated Living Home

The existing goal-first direction remains.

It should progressively surface current priorities, matches, work, required verification, organization issues, patient/clinical work where authorized, revenue opportunities based on real evidence, Grid network activity and EDU state.

## 12.5 Grid

Public and authenticated Grid should feel like part of Living Home and the same design language.

Keep map/resource-ledger utility where appropriate, but avoid exposing internal network mechanics unnecessarily.

## 12.6 EDU

Public EDU, authenticated EDU and evaluator/demo surfaces must visually converge with the current Obsidian/Black Cherry/Rose system.

Do not preserve an older light/gold/teal island if it conflicts with current approved design.

## 12.7 Patient

Patient portal remains separate in authority/session while visually belonging to Klinikos.

The patient should see one next useful action and clear access to the rest of their permitted information.

## 12.8 Clinic operational surfaces

Front Desk, Provider, Billing, Current Visit, Patient Chart and other high-use workspaces should converge onto the same material system without sacrificing information density needed for actual work.

## 12.9 Enterprise/admin

Enterprise and administrator surfaces can be denser, but must use the same typography, surfaces, navigation, state language and Zumi interaction model.

---

# 13. Responsive experience expectations

Every priority journey must be verified at least at 320, 375, 390, 430, 768, 1024, 1280 and 1440+ pixels.

Mobile priority should generally be:

`IDENTITY/CONTEXT → ZUMI/CURRENT STATE → PRIMARY ACTION → RESULT → SECONDARY NAVIGATION`

Composer requirements:

- always reachable
- no overlap with Zumi orb or floating controls
- Enter/Shift+Enter correct
- send control accessible
- safe-area compatible
- stable in half-width and full-width desktop layouts

---

# 14. State truth UX

Every major surface needs explicit loading, empty, partial/bounded, ready, waiting, blocked, review-required, unavailable, error and success states.

Do not convert absence of data into fake zero-performance claims.

Do not convert missing external integration into a dead end if a truthful manual fallback exists.

---

# 15. Repository truth convergence

## 15.1 Problem

The repository currently contains authoritative docs, older wording, historic visual language, open stacked PRs and feature-status documents audited against older SHAs. Without a stricter mechanism, the product can drift between current main, open branch state, deployed state, docs, marketing copy, proposal copy and developer assumptions.

## 15.2 New truth vocabulary

Adopt a repository-wide capability truth vocabulary:

- `PRODUCTION_VERIFIED`
- `DEPLOYED_UNVERIFIED`
- `MERGED_NOT_DEPLOYED`
- `IMPLEMENTED_UNVERIFIED`
- `IN_ACTIVE_DEVELOPMENT`
- `APPROVED_DESIGN`
- `PLANNED`
- `BLOCKED`
- `DEPRECATED`

Compatibility mappings may preserve legacy FEATURE_STATUS labels during migration.

## 15.3 Truth registry

Create a machine-readable truth registry such as `governance/product-truth-registry.json`.

Each material capability should include capability key, human name, domain owner, current truth state, implementation evidence, deployment evidence if any, external dependency state, authoritative source path, public-claim policy, last audited main SHA and last audited date.

## 15.4 Required truth controls

Add automated checks that can progressively detect public copy claiming production when registry state is lower, duplicate capability definitions, old product naming in public copy, invalid Workforce pathway taxonomy, unsafe "verified" wording, client imports of confidential server-only orchestration modules and stale feature-status SHA warnings.

Do not attempt to solve all claim semantics with regex alone. Start with explicit high-value claims and canonical surfaces.

## 15.5 Deployment truth

Keep separate: merged, deployed and production verified.

`/api/health` or equivalent release identity should expose approved non-sensitive release SHA/ref metadata for deployment proof.

---

# 16. Canonical documentation hierarchy after convergence

Recommended hierarchy:

1. runtime + schema + migrations + executed tests
2. deployment evidence
3. `docs/SOURCE_OF_TRUTH.md`
4. `governance/product-truth-registry.json`
5. `docs/FEATURE_STATUS.md` generated or reconciled from registry where possible
6. specialist canons
7. current approved specs/plans
8. roadmap
9. deprecated/historic docs

README should summarize, not become an independent implementation-truth database.

---

# 17. Security and confidentiality design

Confidential logic stays server-side by default: intent orchestration, hidden Grid ranking/anti-gaming logic, private economics, policy engines, security prompts, private Zumi system instructions and sensitive verification logic.

Browser gets minimum-necessary DTOs.

Public Grid must not become a PHI marketplace.

Patient demand should remain de-identified/minimum necessary until governed relationship and consent permit more.

Universal upload must include file type/size policy, malware/security scanning path where available, signed/limited storage access, no accidental public storage, extraction safety, prompt-injection handling and explicit retention rules.

Design for fake clinics, fake employers/recruiters, fake clinicians, fake jobs, fake students, spam vendors, impersonation, phishing, duplicate organizations, credential fraud, fake investors, malicious uploads and marketplace manipulation.

Use rate limits, reporting, moderation, verification, audit, risk flags and human review.

---

# 18. Accessibility design

Accessibility is not a final polish step.

Every tranche must preserve semantic headings, keyboard control, visible focus, accessible status announcements, contrast, touch target size, reduced motion, zoom/reflow, understandable form errors, accessible dialogs and caption/transcript support where media is used.

---

# 19. Performance design

Measure and improve LCP, INP, CLS, bundle size, server response time, image loading, database fan-out and AI latency.

Avoid giant client-side router bundles, rendering every path definition to the browser, N+1 reads, AI calls where deterministic routing works, enormous unpaginated admin tables and animation-driven layout instability.

---

# 20. Analytics and network metrics

Track product growth without inappropriate PHI analytics.

Primary funnel:

`VISITOR → MEANINGFUL ZUMI INTERACTION → ACCOUNT → VERIFIED IDENTITY/RELATIONSHIP → FIRST NEED/HAVE → FIRST MATCH → INTERACTION → OUTCOME → RETURN → REFERRAL → ORGANIZATION CONVERSION → REVENUE`

Network health metrics include active needs, active resources/offers, needs with offers, unsupplied needs, time to first match, successful reservations/connections, fulfilled interactions, repeat activity, verified participant density, organization density and cross-domain participation.

Avoid one opaque social/reputation score.

---

# 21. Execution tranches

This architecture must not be implemented as one giant PR.

## Tranche 0 — Truth and concurrency inventory

Work: reconcile latest main, enumerate active PRs, build changed-file/concurrency ownership map, inventory public/authenticated routes, inventory current truth docs and stale SHAs.

Result: a precise build map showing what can be safely changed and what must wait/rebase.

Done when: no front-end file is modified without knowing whether another active PR owns it.

## Tranche 1 — Repository truth registry and canon convergence

Work: create product-truth registry, reconcile README/SOURCE_OF_TRUTH/FEATURE_STATUS hierarchy, mark stale status metadata explicitly, add first truth-regression tests.

Result: one inspectable answer to "is this live, merged, branch-only, planned or blocked?"

Done when: at least all public product capabilities and major external integrations have registry entries and no high-risk public claim lacks a truth state.

## Tranche 2 — Identity / claims / verification architecture reconciliation

Work: reconcile lifelong identity, Account, protected entry and organization relationships against current main; define one projection used by frontend paths; add email-aware verification classification/routing without granting authority.

Result: frontend can ask the right verification question based on claimed path while backend authority remains unchanged.

Done when: business, student and clinician paths can each distinguish self-claim, verified relationship and actual authority.

## Tranche 3 — Universal path/intent engine

Work: formalize path catalog on server; resolve `I AM / I NEED / I HAVE / I WANT TO DO`; expose minimum-necessary path projection; integrate with existing Living Home/Zumi routing rather than creating a second router.

Result: one conversational entry can resolve major participant types.

Done when: representative patient/student/clinic/employer/workforce buyer inputs route correctly without persona menus.

## Tranche 4 — Public Living Home rebuild

Work: fully converge public home to final Obsidian/Black Cherry/Rose system; simplify hierarchy; make Zumi primary interaction; preserve public value before signup; surface safe Grid/EDU/enterprise proof based on intent; responsive/accessibility polish.

Result: public home feels like one premium healthcare network rather than a product catalog.

Done when: all target viewport QA passes and no major CTA is dead/fake.

## Tranche 5 — Progressive signup/onboarding

Work: preserve intent through access/signup/login; ask path-specific questions; business email / school email / professional verification routing; prevent duplicate identities/organizations.

Result: signup becomes continuation of the user's original goal.

Done when: user can begin anonymously, authenticate once, and resume the exact intended path.

## Tranche 6 — Grid path convergence

Work: conversational need/have draft creation; universal profile/resource linking; matching projections; referral-with-context; path-specific result views.

Result: student/work/clinic/vendor/space/service experiences use Grid rather than parallel marketplace subsystems.

## Tranche 7 — EDU / Workforce convergence

Work: reconcile latest Workforce work safely; converge public EDU aesthetics; evaluator demo; evidence-chain UI; institutional buyer path.

Result: proposal → website → product becomes visually and functionally consistent.

## Tranche 8 — Patient / caregiver convergence

Work: discovery → safe request → patient account/portal handoff; preserve patient/staff auth separation; caregiver relationship boundaries.

## Tranche 9 — Clinic / staff / enterprise convergence

Work: owner organization onboarding; staff invitation/context; Living Home role-aware next work; Front Desk/Provider/Billing/Insights visual convergence.

## Tranche 10 — Investor / partner / procurement paths

Work: public-safe investor/partner intake; confidential-access gate for protected materials; proposal/RFP upload path; BD routing.

## Tranche 11 — Return/referral/notification flywheel

Work: contextual return state; invite with intent; safe notifications; network-growth analytics.

## Tranche 12 — Commercial / entitlement convergence

Work: organization paid conversion; premium Grid capability where authorized; EDU contracts; implementation/service offers; usage limits.

Payment remains separate from authority.

## Tranche 13 — Global visual convergence

Audit remaining visible surfaces for old visual islands and converge them without breaking role/clinical density.

## Tranche 14 — Release/red-team

Required execution evidence includes latest-main reconcile, Prisma validate/generate where schema impacted, clean migration proof where applicable, type-check, lint, focused tests, full tests, security/client-boundary tests, build, start/health smoke, browser QA, mobile QA, accessibility QA, performance checks and deployment SHA verification after release.

If hosted CI does not allocate a runner, that is infrastructure-unavailable evidence, not green evidence.

---

# 22. Acceptance journeys

## Journey A — Nursing student seeking work

1. Visitor arrives at `/`.
2. Types: "I'm finishing nursing school and need work in Brooklyn."
3. Zumi identifies student + work intent.
4. Public-safe value preview appears.
5. Signup required to save/post/contact.
6. Intent survives signup.
7. School claimed.
8. School verification requested.
9. Resume uploaded.
10. Extracted profile shown for correction/approval.
11. Grid `I HAVE` skill/availability and `I NEED` work intent created after confirmation.
12. Real opportunities displayed.
13. EDU recommendations may appear.
14. User can invite classmate/professor with context.
15. Returning user sees new matches/actions.

## Journey B — Clinic needs therapists

1. Visitor says: "I own a PT clinic and need two therapists."
2. Zumi identifies clinic/employer demand.
3. Personal identity established.
4. Organization resolved/created as claimed.
5. Business-domain or approved alternative verification required before organization representation.
6. Job need structured.
7. Human confirms requirements.
8. Grid demand created.
9. Eligible real candidates/resources displayed.
10. Paid recruiting/Clinic OS value introduced only when useful.

## Journey C — Patient needs no-fault PT

1. Visitor states need.
2. Zumi asks only necessary discovery questions.
3. Real reviewed resources displayed.
4. No clinical suitability claim.
5. Account required when user requests/saves/contacts.
6. Patient portal relationship activates only when an actual patient/organization relationship exists or the product flow requires it.

## Journey D — Workforce buyer

1. Visitor says: "We need AI training for 500 healthcare workers."
2. Zumi detects institutional/workforce buyer intent.
3. Public EDU proof appears.
4. Exact five pathways and Career Readiness represented truthfully.
5. Existing-platform advantage explained.
6. Organization verification requested when entering buyer workflow.
7. Needs assessment/demo/contact route continues.

## Journey E — Investor

1. Visitor says they want to invest in healthcare technology.
2. Public-safe company information displayed.
3. Restricted materials trigger stronger identity/business verification + confidential-access agreement.
4. No restricted architecture/source/secrets exposed publicly.

## Journey F — Same human changes lifecycle

1. Student becomes professional.
2. Existing identity persists.
3. New professional claim/verification added.
4. Old education relationship remains historical/current as appropriate.
5. No duplicate account created.
6. Authority depends on active verified relationships, not lifecycle label.

---

# 23. Definition of done for every implementation tranche

Every tranche report must include exact base main SHA, feature branch SHA, relevant open PR/concurrency review, what was already correct, what was wrong, what changed, files changed, schema/migration impact, authority impact, user experience before/after, security/privacy impact, revenue impact, network effect, tests run/results, build result, browser/mobile/accessibility evidence where relevant, what remains unverified and next recommended tranche.

No use of "done", "ready", "green", "production-ready" or "live" without corresponding evidence.

---

# 24. Final success condition

Klinikos is successful when one URL can serve radically different participants without exposing internal complexity.

A patient, student, professional, clinic owner, vendor, educator, workforce buyer, investor or enterprise organization should each be able to enter ordinary language and progressively receive the right governed experience.

The frontend should feel smaller than the backend.

The backend should become more connected than the frontend appears.

Grid should make every useful participant improve network liquidity.

Zumi should make the ecosystem understandable without becoming authority.

Identity and verification should make the network trustworthy without destroying acquisition.

EDU should strengthen the workforce network.

Clinic OS should both consume and create network opportunity.

The repository should always be able to answer what is implemented, merged, deployed, verified, blocked or planned.

**One identity. One intelligence layer. One governed network. Many paths. One truthful Klinikos.**
