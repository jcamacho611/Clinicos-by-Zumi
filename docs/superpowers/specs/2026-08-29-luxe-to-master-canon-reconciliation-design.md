# Klinikos Luxe-to-Master-Canon Reconciliation Design

Date: 2026-08-29
Status: APPROVED DESIGN — CANON RECONCILIATION PENDING IMPLEMENTATION
Repository: `jcamacho611/Clinicos-by-Zumi`
Authority target: `docs/KLINIKOS_MASTER_CANON.md`

## 0. Purpose

Klinikos has accumulated accepted product architecture across the Luxe project history, GitHub specifications, prototypes, uploaded artifacts, clinic/operator discussions, workforce/student work, provider-marketplace work, med-spa commerce work, quality/expert work, and route implementations.

The current Master Canon correctly captures many governing laws, but some accepted lifecycle architecture is compressed so aggressively that later reasoning can omit material product behavior. This design repairs that failure mode.

The goal is not to create another source of truth.

The goal is to reconcile accepted product knowledge upward into the existing Master Canon, then derive machine-readable route/profile/application registries beneath it so accepted paths cannot disappear again.

Permanent rule:

> **ONE KLINIKOS. ONE MASTER CANON. ONE GOVERNING PRODUCT TRUTH.**

Everything else either implements it, specializes it, proves it, or records history.

---

# 1. Authority and evidence model

## 1.1 Supreme authority

`docs/KLINIKOS_MASTER_CANON.md` remains the sole active product, architecture, business, experience, and design authority.

Current verified implementation remains authoritative for what exists today.

Historical Luxe conversations, prompts, prototypes, uploaded files, pitch decks, archived canons, and earlier implementation notes are provenance. They may supply missing accepted decisions but do not become parallel authorities.

## 1.2 Merge-forward method

Every recovered decision must pass:

`SOURCE / PROVENANCE`
→ `DECISION EXTRACTED`
→ `CURRENT CANON COVERAGE`
→ `CURRENT IMPLEMENTATION EVIDENCE`
→ `CLASSIFY: COVERED / PARTIAL / MISSING / CONFLICT / RETIRED`
→ `ACCEPT / MODIFY / REJECT`
→ `MERGE INTO MASTER CANON`
→ `UPDATE ROUTE / PROFILE / APPLICATION REGISTRIES`
→ `UPDATE TEST / IMPLEMENTATION CONSEQUENCES`
→ `SOURCE BECOMES PROVENANCE ONLY`.

No accepted decision may survive only inside a chat transcript after reconciliation.

## 1.3 New anti-compression law

Add a permanent governing law to the Master Canon:

> **Founder omission does not equal product omission, and Canon compression must not erase accepted lifecycle architecture. Every accepted participant journey that materially changes identity, authority, Grid composition, EDU, Clinic OS, financial flow, distribution, experience composition, or network effects must be represented explicitly in the Master Canon or in a Canon-governed registry referenced by it.**

---

# 2. Human-language law

## 2.1 Simple above, technical below

The frontend must never expose internal architecture merely because the backend requires it.

Permanent law:

> **Use plain human language for the user's task. Keep medical-technical, policy-engine, data-model, infrastructure, and authorization terminology underneath unless the user actually needs the precise term.**

Examples:

Backend concept: `contextual professional authority`.
User language: **"Prove you are allowed to do this work."**

Backend concept: `credential evidence ingestion`.
User language: **"Upload your license."**

Backend concept: `eligibility evaluation`.
User language: **"Can I apply for this?"**

Backend concept: `Demand`.
User language: **"I need..."**

Backend concept: `Resource`.
User language: **"I have..."**

Backend concept: `education competency evidence`.
User language: **"Show what you've completed."**

Backend concept: `organization relationship verification`.
User language: **"Show that you work for or run this organization."**

Backend concept: `financial obligation`.
User language: **"Who is owed money, and for what?"**

Backend concept: `Active Experience Envelope`.
User language: never show this term by default. Show **"Here's what needs your attention."**

## 2.2 Plain-language acceptance test

Every ordinary user-facing string should pass:

1. Could a smart 10-year-old understand the basic action?
2. Does the user know what happens next?
3. Does it avoid requiring knowledge of Klinikos architecture?
4. Does it preserve legal/clinical accuracy without jargon dumping?
5. Is the precise technical term available when it materially helps the user?

---

# 3. One person, many evolving contexts

## 3.1 Canonical lifecycle graph

One Person may simultaneously or over time be:

`VISITOR`
→ `MEMBER`
→ `PATIENT / CUSTOMER`
→ `STUDENT / LEARNER`
→ `GRADUATE`
→ `PROFESSIONAL`
→ `EMPLOYEE`
→ `GRID PROFESSIONAL`
→ `PER-DIEM / CONTRACTOR`
→ `EDUCATOR / PRECEPTOR`
→ `INDEPENDENT PRACTITIONER`
→ `OWNER / OPERATOR`
→ `MULTI-LOCATION OWNER`
→ `EMPLOYER`
→ `EXPERT / CONSULTANT`
→ `INSTITUTION / NETWORK PARTICIPANT`.

The arrows are possible transitions, not a mandatory linear sequence.

The same person may hold several relationships at once, for example:

- RN employed W-2 by Organization A;
- 1099 Grid contractor for Organization B where lawful;
- learner in an advanced EDU pathway;
- preceptor for Organization C;
- owner of Organization D.

Do not create duplicate Person records merely because context changes.

## 3.2 Identity versus authority

Preserve the separation:

`IDENTITY`
→ `CLAIM`
→ `VERIFICATION`
→ `RELATIONSHIP`
→ `AUTHORITY`
→ `PERMISSION`.

Plain-language explanation:

- Identity = who you are.
- Claim = what you say about yourself.
- Verification = proof that a claim checks out.
- Relationship = how you are connected to another person or organization.
- Authority = what you are officially allowed to represent or decide.
- Permission = what the system lets you do right now in this context.

Payment, subscription, AI output, résumé content, course completion, or profile creation never independently creates authority.

---

# 4. Profile architecture

The system must not collapse all public and private identity data into one generic profile.

## 4.1 Canonical profile projections

Use one underlying identity graph with distinct projections:

### Private Person Profile

May contain identity/contact information, uploaded evidence, personal history, private preferences, protected documents, and non-public settings.

### Grid Professional Profile

Public or network-visible projection containing only approved, relevant fields such as:

- professional name/display identity;
- profession;
- verified credential dimensions;
- specialty/service classes where permitted;
- location/travel area;
- availability;
- work preferences;
- experience evidence;
- objective fulfillment/reputation signals;
- Grid history appropriate for display;
- service/rate information where lawful and chosen;
- education/competency evidence appropriate for display.

### Learner / Student Profile

Distinct learner-oriented projection that can include:

- school/institution;
- program;
- program year/status;
- expected graduation;
- career goal;
- résumé;
- skills;
- course/scenario history;
- competency evidence;
- clinical hours required/completed;
- placement requirements;
- preceptor/site need;
- availability/geography;
- instructor evaluations where appropriate;
- career interests;
- role preferences;
- portfolio/evidence artifacts.

Do not misrepresent the learner as a licensed professional.

### Organization Profile

May include:

- organization identity;
- locations;
- services/capacity;
- opportunities/jobs;
- hiring needs;
- placement capacity;
- rooms/equipment/resources;
- business services;
- verified organization/authority badges;
- selected public network relationships;
- operating availability.

### Patient / Customer Profile

Private by default and never converted into a public marketplace supply profile.

## 4.2 Résumé as evidence input, not authority

A résumé is a structured career artifact.

Klinikos may:

- upload/store it;
- parse it;
- extract candidate claims;
- build a draft profile from it;
- use it for matching/search;
- help rewrite or improve it without fabrication;
- identify gaps or missing evidence;
- connect résumé information with verified credentials, education and Grid activity.

But:

> **Résumé claim != verified fact.**

The system must distinguish self-reported résumé content from externally verified evidence.

---

# 5. Student / learner / workforce path

This path must be explicit in the Master Canon because it is a central network-growth mechanism.

## 5.1 Entry

Representative user language:

> "I'm finishing nursing school and looking for work."

Klinikos should be able to:

1. understand the learner/work intent;
2. create or resume one identity;
3. ask school/program;
4. verify school affiliation where useful;
5. accept résumé;
6. collect skills, availability, geography, graduation and role preference;
7. create a learner/career profile;
8. generate structured `I HAVE` and `I NEED` state;
9. show relevant Grid opportunities;
10. recommend relevant EDU next steps where legitimate;
11. preserve the person's history as they transition into professional work.

## 5.2 Student verification

Possible evidence routes include:

- school email;
- institution invitation;
- verified roster;
- enrollment record/document;
- student ID/manual review;
- program administrator confirmation.

Student verification proves the education relationship only.

It does not prove licensure or clinical authority.

## 5.3 Placement composition

A clinical placement is not merely "student matched to clinic."

The governed placement relationship may require:

- learner;
- school/program;
- cohort;
- site/organization;
- preceptor/supervisor;
- placement capacity;
- required competencies;
- hours/rotation window;
- health/credential prerequisites;
- affiliation agreement;
- onboarding requirements;
- supervision rules;
- privacy requirements;
- approval states;
- attendance/evidence;
- completion decision.

Canonical path:

`LEARNER INTENT`
→ `PROGRAM CONTEXT`
→ `PLACEMENT REQUIREMENTS`
→ `READINESS EVIDENCE`
→ `GRID PLACEMENT CAPACITY`
→ `ELIGIBLE SITE / PRECEPTOR`
→ `SCHOOL + SITE APPROVAL`
→ `ASSIGNMENT`
→ `HOURS / ATTENDANCE / EVIDENCE`
→ `HUMAN COMPLETION DECISION`
→ `PROFESSIONAL READINESS / NEXT STEP`.

## 5.4 Career/distribution loop

EDU/Student experience may create natural distribution through:

- classmate invites;
- instructor invitations;
- school/program invitations;
- career-center relationships;
- placement-site relationships;
- job alerts;
- employer invitations;
- graduate alumni return loops.

The communication system must distinguish transactional/opportunity/lifecycle/educational/marketing communication and honor applicable consent/preferences.

---

# 6. RN-to-injector / aesthetics progression

This path must be explicitly preserved because it combines EDU, Trust, Grid, Clinic OS, location/capacity, commerce, work and professional development.

## 6.1 Learning-to-opportunity progression

Target progression:

`RN / ELIGIBLE LEARNER`
→ `AESTHETICS GOAL`
→ `EDU FUNDAMENTALS`
→ `SIMULATED / APPLIED PRACTICE`
→ `COMPETENCY EVIDENCE`
→ `HUMAN EVALUATOR RELEASE`
→ `PROFESSIONAL READINESS REVIEW`
→ `OPPORTUNITY-SPECIFIC LEGAL / CREDENTIAL / SUPERVISION / FACILITY CHECK`
→ `SUPERVISED / ELIGIBLE GRID OPPORTUNITY`
→ `FULFILLMENT + EXPERIENCE EVIDENCE`
→ `REPUTATION / CONTINUED EDUCATION`
→ `HIGHER-VALUE ELIGIBLE OPPORTUNITY`
→ `INDEPENDENT ELIGIBILITY REVIEW WHERE APPLICABLE`
→ `PRACTICE / CLIENT-BASE / OWNER PATH`.

Training never silently creates professional authority.

## 6.2 Provider onboarding/profile details

The historical provider-network work must be preserved as a governed profile/workflow family, including as applicable:

- résumé;
- professional license;
- certification/training evidence;
- malpractice/professional liability coverage;
- contractor agreement;
- provider approval state;
- service list;
- experience evidence/tier;
- pricing/rate preference;
- availability calendar;
- on-call/available-now state;
- travel radius;
- mobile service area;
- preferred location types;
- clinic chair option;
- rentable room/chair option;
- at-home/mobile option where lawful;
- partner clinic location;
- booking/request flow;
- accept/decline;
- documentation requirements;
- safety checklist;
- scope/supervision checks;
- emergency protocol;
- adverse-event reporting;
- payout/payable tracking;
- objective fulfillment/reputation evidence.

Historical numeric pricing tiers are provenance unless separately approved by the current pricing authority.

## 6.3 Location composition

The same canonical Location may simultaneously be:

- Clinic OS location;
- employee worksite;
- provider schedule location;
- Grid room/chair supply;
- education placement site;
- referral destination;
- service delivery site;
- inventory location;
- billing relationship context.

Do not create duplicate location records for each application.

---

# 7. Grid as one application among many, and one universal exchange substrate

Grid is a flagship application and major acquisition wedge, but not the entire Klinikos product.

## 7.1 Grid's role

Grid is the governed network/application for:

- needs;
- capabilities;
- resources;
- capacity;
- opportunities;
- matching;
- offers;
- agreements;
- reservations/assignments;
- fulfillment;
- transaction evidence;
- network relationships.

It should feel familiar enough to users as a job/opportunity/resource network while remaining much more general underneath.

## 7.2 Canonical resource classes

Grid may govern approved instances of:

- people/professionals;
- jobs/shifts/work opportunities;
- professional/business services;
- rooms/chairs/facilities/space;
- equipment;
- permitted products/supplies;
- organizational capacity;
- education/training capacity;
- clinical placements;
- preceptors;
- availability;
- projects/contracts;
- vendor capacity;
- quality/audit/expert services;
- referrals/consultation/diagnostic capacity where appropriate;
- future approved resource classes.

Do not create separate job-board, provider-directory, student-marketplace, med-spa marketplace, equipment marketplace, room marketplace, or vendor-marketplace kernels.

## 7.3 Shared lifecycle

Resource-specific flows compose from shared primitives:

`DRAFT`
→ `OWNER / AUTHORITY VERIFICATION`
→ `POLICY / ELIGIBILITY REQUIREMENTS`
→ `PUBLISH`
→ `DISCOVER`
→ `HARD ELIGIBILITY`
→ `RANK`
→ `INTEREST / REQUEST`
→ `COMMUNICATION`
→ `OFFER / QUOTE / CART`
→ `AGREEMENT`
→ `RESERVATION / ORDER / ASSIGNMENT`
→ `FULFILLMENT / DELIVERY`
→ `EVIDENCE`
→ `FINANCIAL CONSEQUENCE`
→ `REVIEW / REPUTATION`
→ `RELATIONSHIP / RETURN`.

Not every resource class uses every stage.

---

# 8. Med-spa commerce and resource marketplace

Med-spa commerce is an important proving ground for Grid's generalized commerce model, not an isolated marketplace.

A med spa may simultaneously be:

- clinic/organization;
- seller;
- buyer;
- service provider;
- employer;
- room/equipment owner;
- inventory holder;
- customer-acquisition business;
- education/preceptor site;
- Grid network node.

## 8.1 Sell services

Examples may include policy-approved cash-pay services, packages and memberships.

Flow:

`DISCOVER / LEAD`
→ `SERVICE`
→ `PROVIDER / LOCATION / TIME`
→ `ELIGIBILITY / SAFETY RULES`
→ `BOOKING / DEPOSIT`
→ `INTAKE / CONSENT`
→ `SERVICE / CARE WORKFLOW`
→ `FULFILLMENT`
→ `PAYMENT / PAYABLE`
→ `FOLLOW-UP / REBOOK`.

## 8.2 Sell products

Grid Commerce may support policy-approved products/supplies with:

- seller/business verification;
- product listing;
- description/images;
- inventory quantity;
- price;
- location/shipping/pickup state;
- order/cart/quote;
- payment;
- fulfillment/delivery;
- refund/dispute;
- repeat purchase.

Restricted clinical inventory must remain in Clinic Inventory or a separately lawful regulated commerce flow. Do not treat all inventory as public retail.

## 8.3 Sell/rent capacity

Examples:

- treatment room;
- med-spa chair;
- exam room;
- procedure room;
- training space;
- equipment;
- unused operating hours.

Require appropriate authority/ownership/permitted-use evidence.

## 8.4 Buy through Grid

The same organization may create demand for:

- professional coverage;
- contractors;
- vendors;
- products/supplies;
- equipment;
- rooms/facilities;
- business services;
- education/training;
- quality/compliance/billing experts.

This two-sided behavior is central to network compounding.

---

# 9. Clinic / first-organization / Nadja depth path

The first independent-practice design path remains a major depth model.

The product goal is not merely "another EHR." It is a simpler continuous day of care and operations.

## 9.1 Clinic activation

Progressive activation may cover:

`ORGANIZATION`
→ `LOCATIONS`
→ `PEOPLE`
→ `ASSIGNMENTS`
→ `SERVICES`
→ `CAPACITY`
→ `CURRENT SYSTEMS`
→ `PATIENT ACCESS`
→ `CARE`
→ `WORKFLOW`
→ `MONEY`
→ `GRID`
→ `NETWORK`.

Do not force one giant onboarding wizard.

## 9.2 Current Visit

Canonical provider journey:

`PATIENT SNAPSHOT`
→ `WHAT CHANGED`
→ `STAFF HANDOFF`
→ `TODAY`
→ `CLINICAL`
→ `ASSESSMENT & PLAN`
→ `ORDERS & RESULTS`
→ `DOCUMENTATION & CODING`
→ `CLOSE VISIT`.

The provider should not reconstruct the visit by hunting through unrelated modules.

## 9.3 Telemedicine

Telemedicine is an encounter mode, not a separate product or second clinical lifecycle.

`SCHEDULE`
→ `INTAKE`
→ `CURRENT VISIT`
→ `TELE-VISIT IF APPLICABLE`
→ `DOCUMENTATION`
→ `ORDERS`
→ `CODING`
→ `BILLING READY`
→ `FOLLOW-UP`.

## 9.4 Clinic as Grid sensor

Clinic OS should be able to create governed Grid intents from real operating state, for example:

- uncovered shift → staffing demand;
- unused room → space supply;
- idle equipment → equipment supply;
- placement capacity → education supply;
- unresolved vendor need → business-service demand;
- expert-quality problem → expert demand;
- service expansion → people/equipment/space/training demand.

Grid results may return to Clinic OS as relationships, assignments, resources and financial consequences.

---

# 10. Quality / audit / expert network — Melissa-style path

Klinikos should not require every clinic to employ every specialist full-time.

A governed expert-services route can allow software automation, internal staff and external expert judgment to compose safely.

## 10.1 Canonical path

`QUALITY / BILLING / COMPLIANCE / OPERATIONAL SIGNAL`
→ `DETERMINISTIC CHECK / EVIDENCE COLLECTION`
→ `ZUMI ORGANIZES AND EXPLAINS`
→ `INTERNAL OWNER / STAFF ACTION WHEN SUFFICIENT`
→ `IF EXPERT JUDGMENT REQUIRED: CREATE GOVERNED GRID EXPERT NEED`
→ `VERIFIED EXPERT MATCH`
→ `SCOPE / AGREEMENT / MINIMUM-NECESSARY ACCESS`
→ `EXPERT REVIEW`
→ `HUMAN FINDING / DECISION`
→ `EVIDENCE PACKET / AUDIT TRAIL`
→ `REMEDIATION WORK`
→ `MEASURE CHANGE`
→ `EXPERT REPUTATION / REPEAT RELATIONSHIP`.

## 10.2 Expert profile types

Possible approved expert classes may include:

- quality;
- clinical operations;
- billing/RCM;
- coding;
- credentialing;
- compliance;
- workflow consulting;
- other approved business/professional services.

Access must remain scoped to the engagement and applicable permissions.

---

# 11. EDU as a full application and workforce engine

EDU is not a course catalog or generic LMS.

## 11.1 Distinct working experiences

EDU composes distinct learner, instructor and institution experiences over the same shared identity/evidence substrate.

### Learner

- next learning step;
- progress;
- assignments/scenarios;
- evidence;
- feedback;
- clinical/placement readiness;
- career path;
- Grid opportunity transition.

### Instructor / Evaluator

- cohort/session;
- attendance;
- submissions;
- rubric;
- feedback;
- release/assessment decisions;
- competency determination.

### Institution

- programs/cohorts;
- instructors;
- learners;
- placement demand;
- site/preceptor capacity;
- agreements;
- reporting/outcomes;
- workforce/employer relationships.

## 11.2 Virtual Clinic Lab

Synthetic/de-identified training environments may simulate:

- scheduling;
- intake;
- documentation;
- patient/case workflows;
- operations;
- referrals;
- billing-readiness concepts;
- communications;
- AI-assisted workflow.

Training simulation never creates live clinical authority.

## 11.3 Workforce compounding

Canonical loop:

`LEARN`
→ `PRACTICE / SIMULATE`
→ `SUBMIT EVIDENCE`
→ `HUMAN REVIEW`
→ `COMPETENCY / COMPLETION EVIDENCE`
→ `EXTERNAL CREDENTIAL / PROFESSIONAL REQUIREMENTS`
→ `GRID PLACEMENT / WORK`
→ `EXPERIENCE EVIDENCE`
→ `REPUTATION / PROFESSIONAL RECORD`
→ `CONTINUING EDU`
→ `MORE OPPORTUNITY`.

---

# 12. Financial and transaction truth across the ecosystem

A single Financial OS should support different economic relationships without pretending they are the same transaction.

## 12.1 Shared truth primitives

- price;
- quote;
- charge;
- invoice;
- payment intent;
- payment evidence;
- obligation;
- payable;
- payout;
- settlement;
- refund;
- dispute;
- reconciliation;
- entitlement.

## 12.2 Never collapse states

`LISTING != MATCH`

`MATCH != OFFER`

`OFFER != AGREEMENT`

`BOOKING != FULFILLMENT`

`PAYMENT INTENT != PAYMENT`

`PAYMENT != PAYOUT`

`OBLIGATION != SETTLEMENT`.

## 12.3 Economic classes remain distinct

Separate policy/economics for classes such as:

- space/room rental;
- equipment;
- products/supplies;
- education;
- non-clinical business services;
- staffing/professional work;
- regulated clinical care;
- referrals;
- enterprise/institutional contracts.

Do not apply one universal marketplace take rate.

Legal-gated categories fail closed until the applicable policy is approved.

---

# 13. Experience Engine and application composition

Klinikos is one operating environment containing many applications/engines.

Canonical application families include:

- Grid;
- EDU;
- Care;
- Current Visit;
- Clinic OS;
- Financial OS;
- Network;
- Insights;
- Identity & Trust;
- Memory & Knowledge;
- Integration Hub;
- Enterprise / Configuration;
- Zumi / Klinikos Intelligence.

Additional domain experiences such as med-spa commerce or quality/expert operations should compose these shared engines rather than create duplicate kernels.

## 13.1 Experience Engine inputs

The server-side Experience Engine considers:

- identity;
- active relationship/context;
- organization/location;
- role/profession;
- verified claims;
- authority/permissions;
- purpose;
- current work;
- obligations;
- entry intent;
- safety/privacy constraints;
- commercial/entitlement state.

## 13.2 Experience Engine output

The user should receive:

- one clear current context;
- the work that matters;
- approximately a few meaningful attention items;
- one obvious primary next action;
- relevant application tools;
- Zumi as an ambient helper;
- deeper detail only when requested/needed.

The user should not see terms such as `Active Experience Envelope`, `DTO disclosure boundary`, `AuthorityDecision`, or `Grid resource ontology` unless they are in a developer/admin context where those terms are useful.

---

# 14. Distribution and communication loops

Grid, EDU, Clinic OS and Network must create useful distribution events.

Examples:

`CLINIC POSTS JOB`
→ `ELIGIBLE AUDIENCE`
→ `OPPORTUNITY ALERT`
→ `CLICK`
→ `PROTECTED ENTRY / IDENTITY IF NEEDED`
→ `VERIFY`
→ `GRID OPPORTUNITY`
→ `ACTION`.

`SCHOOL INVITES COHORT`
→ `LEARNERS JOIN`
→ `EDU`
→ `PLACEMENT NEED`
→ `GRID`.

`PROFESSIONAL SHARES PROFILE / OPPORTUNITY`
→ `NEW PARTICIPANT`.

`CLINIC LISTS ROOM / EQUIPMENT`
→ `SAVED SEARCH / MATCH ALERT`
→ `NEW BUYER / PROFESSIONAL`.

`MED-SPA PRODUCT / SERVICE RELATIONSHIP`
→ `REORDER / REBOOK / MEMBERSHIP / REFERRAL`.

`QUALITY EXPERT ENGAGEMENT`
→ `REPEAT ORGANIZATION RELATIONSHIP / REFERRAL`.

Communication categories must remain distinct:

- transactional;
- opportunity;
- relationship;
- lifecycle;
- educational;
- reactivation;
- product marketing.

Consent, unsubscribe/preferences and applicable anti-spam requirements remain explicit.

---

# 15. Canon-governed route registry

The current route catalog must be expanded from illustrative paths into a complete Canon-governed route registry.

It remains subordinate to the Master Canon.

## 15.1 Required fields

Each canonical route should be able to encode:

- `route_id`;
- `title`;
- `plain_language_goal`;
- `audience`;
- `from_state`;
- `to_state`;
- `entry_sources`;
- `public_value`;
- `identity_requirement`;
- `verification_requirements`;
- `relationship_requirements`;
- `authority_requirements`;
- `progressive_terms`;
- `primary_application`;
- `supporting_applications`;
- `grid_need_types`;
- `grid_have_types`;
- `profile_projection`;
- `required_objects`;
- `money_events`;
- `failure_states`;
- `commercial_boundary`;
- `legal_gate`;
- `implementation_state`;
- `evidence_paths`;
- `plain_language_steps`;
- `backend_state_machine`;
- `analytics_events`;
- `next_routes`.

## 15.2 Minimum canonical route families

### Universal entry

- protected entry → sign in/create identity → intent → path-aware verification → experience;
- returning user → restore safe context → recompute experience → resume work.

### Student / EDU

- student to career profile;
- student to clinical placement;
- learner to professional readiness;
- RN to injector readiness;
- learner to first job;
- learner to continuing education;
- school to placement network;
- clinic to education partner;
- educator to preceptor opportunity.

### Professional

- find extra healthcare work;
- publish professional availability;
- publish professional service;
- higher-value Grid opportunities;
- professional to independent practice;
- provider to clinic owner;
- contractor/mobile/room-based work;
- professional to preceptor/educator;
- professional profile / résumé / credential refresh.

### Clinic / organization

- fill staffing need;
- monetize unused capacity;
- buy product/supply/equipment/service;
- sell approved product/resource/capacity;
- improve operations;
- improve revenue;
- fix referral leakage;
- add service;
- open additional location;
- launch another organization;
- activate Clinic OS;
- first-practice / Current Visit depth path;
- quality issue to expert resolution.

### Patient / customer

- find appropriate care/service entry;
- request/book;
- intake/consent;
- Current Visit/care;
- telemedicine encounter;
- follow-up;
- cash-pay service/product relationship where appropriate.

### Commerce / seller

- list product;
- list equipment;
- list room/space;
- list business service;
- fulfill order;
- fulfill reservation;
- seller payout/reconciliation;
- dispute/refund.

### Enterprise / institution

- buyer discovery → qualification;
- proposal/pilot;
- security/legal/procurement;
- institutional deployment;
- renewal/expansion.

---

# 16. Full-stack architecture consequences

The reconciliation must be translated into implementation primitives instead of remaining narrative only.

## 16.1 Backend/domain layer

Required shared domains/kernels include:

### Identity

`Person`, `Account`, contact methods, identity assurance, active context.

### Organizations

`Organization`, `Location`, `Relationship`, `Membership`, `Assignment`, effective dates.

### Trust / Credentials

`Claim`, `VerificationEvidence`, `Credential`, `License`, `Certification`, coverage/malpractice evidence, `Privilege`, `AuthorityDecision`, expiration/revocation state.

### Career / Profile

Profile projections, résumé/document artifacts, parsed claims, skills, experience, availability, work preference, career goal, visibility policy.

Do not let résumé parsing create verified truth.

### Grid

`Resource`, `Demand`, `Availability`, `Requirement`, `Eligibility`, `Match`, `Opportunity`, `Offer`, `Agreement`, `Reservation`, `Assignment`, `Fulfillment`, `Incident`, `Dispute`, `ReputationEvidence`.

### EDU

`Program`, `Cohort`, `Module`, `Session`, `Enrollment`, `Scenario`, `Assessment`, `Rubric`, `Submission`, `CompetencyEvidence`, `AttendanceEvidence`, `CompletionDecision`, `PlacementRequirement`, `Placement`, `PreceptorRelationship`.

### Clinical

`Patient`, `Encounter`, `CurrentVisit`, `ClinicalEvidence`, `Observation`, `BodyMap`, `Diagnosis`, `Procedure`, `Medication`, `Order`, `Result`, `Referral`, `CarePlan`, `Document`, `FollowUp`.

### Commerce / Inventory

Approved marketplace product/resource representation plus organization inventory state. Public commerce listing is separate from internal regulated inventory truth.

Potential primitives include `CatalogItem`, `InventoryItem`, `InventoryLot`, `StockMovement`, `Order`, `OrderLine`, `Shipment/Fulfillment`, while reusing Grid Resource/Offer/Agreement where appropriate rather than duplicating transaction truth.

### Financial

`Price`, `Quote`, `Charge`, `Invoice`, `PaymentIntent`, `PaymentEvidence`, `FinancialObligation`, `Payable`, `Payout`, `Settlement`, `Refund`, `Reconciliation`, `Entitlement`.

### Quality / Expert

Prefer reuse of Work/Task/Grid/Evidence domains. Add specialist types only when necessary for issue classification, review scope, findings or remediation evidence.

### Communications

Communication intent, recipient, consent/preference state, delivery evidence, reply state, channel/provider abstraction.

### Zumi / Experience

Intent, safe context, plan/draft, tool execution admission, memory/knowledge, active experience composition.

## 16.2 Server-side authority

The server owns consequential decisions including:

- professional eligibility;
- credential validity;
- organization authority;
- PHI access;
- Grid publish permission;
- match eligibility;
- patient/care authorization;
- financial authority;
- legal agreement versions;
- pricing/fee policy;
- entitlement;
- payout/settlement truth.

The browser receives minimum-necessary presentation state and allowed actions.

## 16.3 Frontend composition

Do not structure the product around a giant static dashboard or internal module names.

Each screen should have a Screen Contract covering:

- audience/context;
- user goal;
- primary question;
- visible data;
- hidden/prohibited data;
- authority/eligibility;
- Zumi behavior;
- density;
- navigation/resume behavior;
- commercial state;
- loading/empty/partial/error/blocked state;
- primary action.

## 16.4 APIs / server actions

Prefer task-oriented interfaces such as:

- `createCareerProfileDraftFromResume`;
- `submitStudentAffiliationEvidence`;
- `evaluatePlacementReadiness`;
- `publishProfessionalAvailability`;
- `evaluateOpportunityEligibility`;
- `createGridNeedFromClinicGap`;
- `publishResourceCapacity`;
- `createProductListing`;
- `reserveSpaceCapacity`;
- `acceptWorkOffer`;
- `recordFulfillmentEvidence`;
- `createExpertReviewEngagement`;
- `openCurrentVisit`;
- `closeCurrentVisit`;
- `createFinancialObligationFromFulfillment`;
- `reconcilePaymentEvidence`.

Names are illustrative until matched to current repository conventions.

## 16.5 State/event model

Consequential transitions should emit evidence/audit events with applicable:

- actor;
- person;
- organization;
- location;
- purpose;
- source;
- prior state;
- new state;
- authority decision;
- evidence/provenance;
- idempotency key;
- external correlation;
- timestamp;
- retry/reconciliation state.

---

# 17. Security, privacy, safety and failure architecture

Security cannot appear as a final box on the diagram.

It runs through every route.

Required concerns include:

- authentication;
- MFA where appropriate;
- email/contact verification;
- identity proof;
- professional credential verification;
- organization authority;
- tenant separation;
- patient privacy;
- minimum necessary disclosure;
- RBAC/contextual authorization;
- purpose of use;
- consent;
- credential expiration/revocation;
- suspended users/listings;
- fraud/scams;
- duplicate organizations;
- phishing;
- résumé fabrication;
- fake schools/jobs/clinics;
- disputes/abuse;
- payment fraud;
- audit trail;
- AI boundaries;
- PHI handling;
- vendor/integration outages;
- retry/reconciliation;
- incident response;
- retention/deletion;
- backups/restore.

Failure paths must be visible and actionable.

Examples:

- credential expired → listing/opportunity eligibility restricted + user shown how to update;
- org authority removed → organization actions revoked immediately;
- placement agreement missing → placement blocked with clear owner/next step;
- room double-book race → deterministic conflict; no duplicate reservation;
- payment succeeds after timeout → reconcile from processor evidence;
- fulfillment disputed → freeze relevant settlement if policy requires + dispute workflow;
- AI cannot determine missing fact → ask for evidence, never invent it.

---

# 18. Product truth / implementation state

Every canonical route/application/capability must be labeled from evidence, not aspiration.

Allowed implementation states:

- `LIVE_VERIFIED`;
- `IMPLEMENTED_UNVERIFIED`;
- `PARTIAL`;
- `DESIGNED`;
- `PLANNED`;
- `EXTERNAL_CONNECTION_REQUIRED`;
- `LEGAL_REVIEW_REQUIRED`;
- `NOT_BUILT`;
- `RETIRED`.

The ecosystem diagram must eventually be generated or checked against this registry so visual maps cannot imply everything is live.

---

# 19. Reconciliation ledger

Create a subordinate evidence ledger, not a new product authority, with fields:

- source identifier;
- source date;
- source class;
- extracted decision;
- affected domain;
- current Canon section;
- Canon coverage: complete/partial/missing/conflict;
- implementation evidence;
- accepted resolution;
- target Canon section;
- target registry item;
- implementation consequence;
- current status;
- reviewer/date.

This ledger exists to prove reconciliation completeness and prevent rediscovery loops.

---

# 20. Master ecosystem topology

The reconciled ecosystem should be represented as connected lanes rather than a flat product list.

## 20.1 Acquisition / discovery lane

`SEARCH / EMAIL / SHARE / INVITE / PARTNER / CLINIC / SCHOOL / GRID OBJECT`
→ public-safe value / preview.

## 20.2 Protected entry lane

`ENTER KLINIKOS`
→ protected Terms/Privacy/Confidentiality/IP airlock
→ sign in/create identity
→ restore entry context.

## 20.3 Intent / trust lane

Authenticated Zumi
→ `I AM / I NEED / I HAVE / I WANT TO DO`
→ claims/relationships
→ verification only when consequence requires it.

## 20.4 Application lane

Experience Engine composes:

- Grid;
- EDU;
- Clinic OS;
- Care;
- Current Visit;
- Commerce;
- Quality/Expert;
- Financial OS;
- Network;
- Insights;
- enterprise/configuration.

## 20.5 Execution lane

`WORK / SERVICE / CARE / LEARNING / ORDER / RESERVATION / PLACEMENT / EXPERT REVIEW`
→ fulfillment/evidence.

## 20.6 Financial lane

Quote/price
→ agreement
→ obligation
→ payment evidence
→ payable/payout/settlement
→ reconciliation.

## 20.7 Memory/network lane

Evidence/history
→ reputation/relationship
→ safe memory
→ better next action
→ return/invite/referral/expansion.

---

# 21. Network compounding

The strongest long-term network effect is not one feature. It is the ability for outputs of one domain to become legitimate inputs to another.

Examples:

### Student loop

Student joins
→ school/program verified
→ résumé/profile
→ EDU evidence
→ placement
→ professional readiness
→ Grid work
→ experience
→ continuing EDU
→ better opportunities
→ possible preceptor/owner path.

### Injector loop

RN joins
→ aesthetics learning
→ competency evidence
→ opportunity-specific verification
→ supervised Grid work
→ fulfillment evidence
→ reputation
→ higher-value work
→ independent/owner path
→ creates clinic/provider/resource demand.

### Clinic loop

Clinic operates
→ staffing/resource/quality/revenue gap detected
→ Grid demand
→ relationship/fulfillment
→ operational evidence
→ stronger Network
→ more supply/demand
→ greater Clinic OS value.

### Med-spa commerce loop

Customer/service/product demand
→ Grid/commerce discovery
→ booking/order
→ Clinic OS or commerce fulfillment
→ payment
→ reorder/rebook
→ inventory/capacity signals
→ Grid demand/supply
→ repeat relationship.

### Quality/expert loop

Operational signal
→ internal resolution attempt
→ expert need when justified
→ verified expert
→ review/finding
→ remediation/evidence
→ clinic outcome
→ expert reputation
→ repeat/referral.

---

# 22. Commercial consequences

Free participation is distribution infrastructure, not proof that everything should be free.

The reconciled architecture supports multiple legitimate monetization families:

- Grid transaction economics where lawful;
- Grid professional/organization advanced tools;
- Clinic OS subscription;
- implementation/professional services;
- revenue/financial workflow;
- EDU individual/pathway/institutional programs;
- Zumi advanced/usage-bound intelligence;
- external-rail usage;
- product/commerce economics where permitted;
- space/equipment/resource economics;
- expert-services engagements;
- enterprise/network contracts.

Paid capability appears at a real value boundary.

Payment never buys legitimacy or regulated authority.

---

# 23. What belongs in the Master Canon versus subordinate registries

## Master Canon must contain

- product definition;
- authority hierarchy;
- anti-compression law;
- plain-language UX law;
- one-person evolving identity law;
- profile projection law;
- canonical student/workforce lifecycle;
- canonical injector/professional progression;
- Grid universal exchange law/resource families;
- med-spa commerce as a Grid/Clinic composition pattern;
- clinic/Nadja depth path;
- EDU workforce role;
- quality/expert path;
- financial truth laws;
- Experience Engine/application composition;
- network compounding laws;
- current-vs-target truth law.

## Route registry should contain

Detailed route-specific states, verification, applications, objects, money events, failures, next paths and implementation evidence.

## Specialist docs may contain

Deep implementation/legal/clinical/security/domain details, provided they elaborate rather than redefine the Master Canon.

---

# 24. Reconciliation acceptance criteria

The canon repair is complete only when all of the following are true:

1. Master Canon explicitly preserves the detailed lifecycle families above.
2. Student/resume/profile/placement architecture is not recoverable only from old prompts.
3. Injector/provider marketplace architecture is not recoverable only from old Luxe files.
4. Grid resource/commerce classes are explicit and cannot be reduced back to staffing.
5. Med-spa products/services/space/equipment paths are represented as compositions of shared Grid/Clinic/Commerce primitives.
6. Nadja/first-clinic Current Visit and telemedicine path remains explicit.
7. Melissa/quality/expert path is explicitly represented as a governed expert-services route.
8. One-person/multiple-relationship lifecycle is explicit.
9. Résumé claims are separated from verified facts.
10. Learner evidence is separated from professional authority.
11. Public/user-facing language avoids backend jargon.
12. Route registry covers the major accepted participant journeys.
13. Current implementation status is evidence-based for every route.
14. Tests protect key laws from regression.
15. The full ecosystem map can be regenerated without omitting these accepted routes.

---

# 25. Recommended implementation decomposition

This design is too large for one unsafe implementation change. Execute as independently reviewable tranches:

### Tranche A — Knowledge reconciliation and Canon repair

- build reconciliation ledger;
- amend Master Canon;
- mark superseded conflicting guidance historical;
- add plain-language and anti-compression laws.

### Tranche B — Canonical route/profile registry

- expand route registry schema;
- add profile projection registry;
- encode Student/Placement/Injector/Commerce/Quality/Nadja routes;
- add implementation/evidence state.

### Tranche C — Truth and regression tests

- test route completeness;
- test one-identity law;
- test professional listing verification gate;
- test student evidence does not grant licensure;
- test résumé claims remain unverified until corroborated;
- test organization authority;
- test public patient privacy;
- test Grid remains generalized beyond staffing;
- test protected-entry ordering;
- test user-facing copy registry avoids prohibited backend jargon where applicable.

### Tranche D — Data-model gaps

Only after comparing existing schema against the reconciled design:

- career/profile/resume gaps;
- placement/preceptor gaps;
- provider availability/travel/service gaps;
- generalized commerce/inventory gaps;
- expert engagement gaps;
- required migrations.

### Tranche E — Experience/application convergence

- Student experience;
- Professional/Grid experience;
- Clinic/Current Visit;
- EDU;
- Commerce/med-spa;
- Quality/expert;
- Financial OS handoffs;
- Experience Engine composition.

### Tranche F — Full ecosystem visual/evidence map

Generate a current-vs-target ecosystem map from Canon + route/profile registries so future diagrams inherit product truth rather than relying on conversation memory.

---

# 26. Final product story

A person should be able to understand Klinikos without understanding its architecture.

They hear about something useful: a job, a service, a room, a product, a placement, a clinic problem, a course, or an expert.

They enter Klinikos, accept the protected access terms, and use one identity.

Klinikos asks what they are trying to do and asks for proof only when a real action needs proof.

Grid helps people and organizations find what they need or offer what they have.

EDU helps people learn and build real evidence.

Clinic OS and Current Visit help clinics run care and operations.

Commerce helps approved sellers move products, services, space, equipment and capacity.

Quality connects routine software checks, clinic staff, and verified experts when expert judgment is truly needed.

Financial OS keeps money states truthful.

Zumi helps the person understand what happens next, while deterministic Klinikos systems remain the authority.

Every legitimate completed action creates history, evidence and relationships that can make the next action easier.

That is how Klinikos grows from useful applications into one connected healthcare operating network.
