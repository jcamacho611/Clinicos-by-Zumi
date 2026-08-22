# KLINIKOS — KNOWLEDGE-TO-ARCHITECTURE LEDGER

Version: `2026-08-22.1`  
Status: `AUTHORITATIVE CROSS-DOMAIN ARCHITECTURE LEDGER`

This ledger converts expert observations, design-partner feedback, implementation discoveries, operational failures, billing lessons, integration lessons, security findings, commercial evidence, and user research into reusable Klinikos architecture.

It is **not** a transcript archive and it is **not** implementation truth.

Precedence remains:

1. current code/schema/migrations/tests/exact-head CI/verified runtime evidence for what exists now;
2. `docs/SOURCE_OF_TRUTH.md` for current repository-wide operating law;
3. this ledger for the newest accepted cross-domain translation of expert knowledge into architecture;
4. `docs/KLINIKOS_ECOSYSTEM_CANON.md` and specialist canons for detailed domain law unless superseded by a newer explicit correction;
5. `docs/FEATURE_STATUS.md` for capability status;
6. `docs/EXTERNAL_DEPENDENCY_MATRIX.md` for external connection truth.

A ledger entry does **not** make a feature built, connected, certified, compliant, credentialed, paid, settled, or live.

---

## 1. Permanent doctrine

Klinikos must absorb subject-matter expertise as if those clinicians, billers, operators, IT/interface engineers, practice owners, educators, and end users were part of the product team.

A seemingly small workflow comment may affect:

- Clinic OS;
- Grid;
- EDU;
- Provider;
- Patient;
- Network;
- Klinikos Intelligence / Zumi;
- Billing / RCM / clearinghouse;
- Credentialing;
- Scheduling / capacity;
- security / privacy / consent;
- pricing / entitlements / implementation;
- the canonical reference environment;
- integrations / interoperability;
- data models / events / audit;
- commercial positioning.

The required translation loop is:

`OBSERVATION → SOURCE / CONTEXT → REUSABLE PRIMITIVE → CROSS-DOMAIN CONSEQUENCES → SECURITY / DATA / UX / COMMERCIAL EFFECT → IMPLEMENTATION DEPENDENCY → EVIDENCE / OUTCOME`

No accepted insight should disappear into a chat transcript or one-off customer customization.

---

## 2. One healthcare operating substrate

### Accepted insight

Clinics, Grid, EDU, Provider, Patient, Billing, Network and Intelligence are not independent applications that merely share branding. They are controlled experiences over one governed Klinikos substrate.

### Shared primitives

- identity and identity assurance;
- organization / legal entity / location / department;
- professional identity and profession;
- assignments / relationships / capabilities;
- authorization / purpose / consent;
- credentials / privileges / readiness;
- patient identity / coverage / financial cases;
- scheduling / availability / capacity / resources;
- clinical truth / documents / tasks / orders / results;
- terminology / integrations / events / audit / provenance;
- financial obligations / payment evidence / settlement;
- configuration / entitlements;
- evidence / memory / intelligence.

### Architecture consequence

Prefer shared domain truth, adapters, policy modules and events. Do not create separate identity, credential, finance, audit or patient truth systems inside each engine.

### Commercial consequence

Sell role-, specialty-, organization- and route-specific experiences over the same platform instead of financing customer-specific forks.

---

## 3. Profession and authority are first-class

### Accepted insight

A generic `provider` role is insufficient.

Klinikos must be able to distinguish profession and authority facts such as:

- MD/DO, NP, PA, RN, LPN, MA, PT, OT, SLP, behavioral-health professional, pharmacist, technician, imaging/lab professional, biller, coder, front desk, owner, administrator, student, instructor, preceptor and other governed professions/roles;
- license type and jurisdiction;
- specialty / certification / competency evidence;
- organizational relationship;
- location assignment;
- payer readiness;
- facility or procedure privilege;
- supervision / delegation / cosign requirements;
- malpractice or other required evidence;
- effective / expiration dates;
- restrictions / suspension / revocation.

### Authorization consequence

A governed action may depend on:

`IDENTITY + TENANT + LOCATION + ACTIVE ROLE + PROFESSION + CAPABILITY + ASSIGNMENT + PURPOSE + PRIVILEGE + CREDENTIAL STATE + CONSENT + DATE/TIME + POLICY`

Examples include `patient.chart.read`, `note.prepare`, `note.sign`, `order.lab.create`, `result.acknowledge`, `coding.finalize`, `claim.submit`, `credential.review`, and `grid.offer.accept`.

### Grid consequence

Credential upload or self-description never automatically authorizes regulated work. Eligibility is opportunity-specific.

### EDU consequence

Education evidence may support readiness but never silently becomes a license, clinical privilege, payer credential or production authority.

### Security consequence

Server-side authorization is mandatory. UI hiding is usability only.

---

## 4. Practitioner ↔ organization ↔ location is effective-dated

### Accepted insight

A practitioner must not be architected as permanently attached to one `location_id`.

### Target relationship

`Practitioner → many Practitioner/Professional Assignments`

An assignment may carry:

- organization / legal entity;
- department / location;
- specialty / professional role;
- effective dates;
- appointment/service types;
- schedule policy;
- payer readiness;
- privileges;
- telehealth eligibility;
- resource access;
- supervision relationship.

### Cross-domain consequences

This affects scheduling, Grid, credentialing, billing, claims, orders, referrals, provider profiles, enterprise analytics, patient search, telehealth, room utilization and staffing.

---

## 5. Scheduling is eligibility + capacity, not merely a calendar

### Accepted insight

The core scheduling question is:

> Where can this patient receive this service, from an appropriate professional, at an appropriate location, under the applicable payer/case, with the required resources, at an available time?

### Inputs may include

provider, profession, specialty, visit type, location, room/chair/equipment, service capability, age/clinical constraints, payer, financial case, authorization, provider-payer readiness, referral requirements, duration, recurrence, geography and patient preference.

### Grid consequence

The same primitives support:

- need an RN Friday;
- need a procedure room Tuesday;
- need a psychiatrist accepting a payer;
- need a preceptor;
- need diagnostic capacity;
- need treatment-chair capacity.

### Product consequence

The calendar is a projection of eligibility and capacity truth, not the authority itself.

---

## 6. Appointment series are first-class

### Accepted insight

Recurring care or recurring work must not be modeled as unrelated appointments.

### Example series

- PT twice weekly × six weeks;
- serial injections;
- behavioral-health follow-up;
- postoperative sequences;
- recurring wound care;
- recurring treatments;
- clinical-placement hours;
- repeated Grid shifts.

### Required behavior

Support modifying one occurrence, future occurrences, or the whole series, while retaining planned/completed/missed/cancelled/remaining state and applicable authorization use.

### Cross-domain consequence

Series state becomes clinically useful, operationally useful, financially useful, patient-communication useful, EDU useful and Grid useful.

---

## 7. Patient identity is separate from financial identity

### Accepted insight

One person can have multiple coverages and multiple financial cases without duplicating or overwriting the patient.

### Target model

`Patient → many Coverage → many FinancialCase`

Potential cases include commercial, secondary, Medicare, cash, No-Fault accident cases, Workers' Compensation, employer programs, memberships and other governed contexts.

### Consequence

Clinical truth belongs to the patient. Financial/claim rules belong to the applicable case.

---

## 8. Registration must support progressive completion

### Accepted insight

Front desk must be able to create a safe provisional patient from minimum necessary information, then complete the record over time.

### Initial record may include

name, DOB, phone and minimal contact information.

### Progressive completion may include

address, email, preferred language, emergency contact, guarantor, ID, insurance cards, consents, practice policies, financial policy, proxy/caregiver authority, referral information, case documents and other clinically/operationally justified data.

### UX consequence

The data model must not make front desk hostage to an oversized registration form.

---

## 9. Patient matching / MPI is a product function

### Accepted insight

External data will arrive with imperfect identifiers.

### Required direction

Build toward duplicate detection, identity confidence, candidate matching, merge/review workflow, exception queues, audit and safeguards against unsafe automatic merge.

### Integration consequence

Labs, imaging, HIE/network exchange, historical imports and enterprise expansion depend on this.

---

## 10. Clinical history is evolving state, not a filing cabinet

### Accepted insight

Providers need to understand:

- what was true initially;
- what was true previously;
- what is true today;
- what changed;
- what remains unresolved;
- what improved/worsened;
- what external result arrived;
- what treatment was planned vs completed.

### Moat consequence

This becomes the **Clinical Change Graph**, one of the core defensible Klinikos primitives.

---

## 11. Clinical Change Graph is specialty-agnostic

### Accepted insight

The No-Fault example generalizes to many specialties.

Examples include pain/ROM/function, BP/weight/dyspnea, GI symptoms/pathology, pediatric growth/development, PHQ/GAD trajectories, treatment response, PT strength/ROM and other evidence-linked change.

### Rule

Zumi may summarize or explain change only from structured/source-linked evidence. It may not manufacture change because it sounds clinically plausible.

---

## 12. Body maps are versioned clinical objects

### Required direction

Retain immutable versions containing encounter/date/creator/body region/laterality/symptom/severity/radiation/functional impact/annotations and source observations.

Support `INITIAL → PREVIOUS → TODAY` comparison.

### AI consequence

Statements such as “left shoulder unchanged” must be source-supported.

---

## 13. Templates become a Clinical Composition Engine

### Accepted insight

Do not maintain giant duplicated specialty note templates.

### Reusable components may include

HPI symptom blocks, trauma history, ROS, exam regions, neurologic exam, functional status, ADLs, work status, body maps, procedures, medication monitoring, care plan, assessment, screenings, case history, referral, orders and follow-up.

### Commercial consequence

Customization becomes productized composition rather than bespoke software development.

---

## 14. Configuration Registry governs customization

### Accepted insight

Customer and specialty customization should be versioned data.

### Inheritance direction

`Base Klinikos → Specialty Pack → Organization Override → Location Override`

### Governed configuration may include

templates, clinical components, appointment types, questionnaires, order sets, workflows, permissions, forms, coding-support rules, No-Fault settings, follow-up policies, message templates, feature entitlements and reports.

### Historical integrity

Signed encounters and other durable records retain the exact configuration/template version used at the time.

---

## 15. Specialty packs are products, not forks

Potential packs include Primary Care, No-Fault/MSK, Cardiology, GI, Pediatrics, OB/GYN, Pain, Neurology, Podiatry, Behavioral Health, Rehab/PT, Aesthetics and future governed packs.

A pack is a governed collection of configuration, workflow, terminology, forms, components, reports, validated support and commercial entitlement.

### Pricing consequence

Sell specialty capability without multiplying codebases.

---

## 16. No-Fault is a case operating system

### Accepted insight

No-Fault should be modeled as a financial/clinical case with parties, documents, deadlines, injuries, treatment progression, imaging/EMG, referrals, work/ADL status, billing, denials, appeals, payment and case status.

### Reuse consequence

Build reusable case primitives so Workers' Compensation and other case types can share infrastructure.

### Legal truth rule

Do not hard-code deadlines or legal requirements without current authoritative verification and versioning.

---

## 17. Orders are universal provider-directed actions

### Target concept

Use a canonical typed order/service-request model rather than isolated lab-order logic.

Potential types include lab, imaging, medication, PT/OT, referral, home health, nursing action, procedure, surgery, equipment, diet/home instruction and follow-up testing.

### Discoverability vs authority

Specialty affects defaults and discoverability. Professional privilege, safety and policy determine authorization. These are different concerns.

---

## 18. Authoritative catalogs govern specimen/resource instructions

Specimen, tube, handling, fasting, timing, storage and other authoritative operational requirements must come from approved vendor/knowledge catalogs.

### Permanent principle

**AI explains governed truth; AI does not manufacture governed truth.**

Preserve provenance.

---

## 19. External workflows are multi-step transactions

### Accepted insight

“Sent” is not “completed.”

A diagnostic/order lifecycle may include:

`DRAFT → SIGNED → QUEUED → TRANSMITTED → TRANSPORT ACK → BUSINESS ACCEPTED → ACCESSIONED/SCHEDULED → COLLECTED/PERFORMED → IN PROCESS → PRELIMINARY → FINAL → CORRECTED/AMENDED → PROVIDER REVIEWED → PATIENT NOTIFIED → FINANCIAL RECONCILIATION → CLOSED`

### Reliability rule

Transport acknowledgement and business acceptance remain distinct.

---

## 20. Corrected results reopen governed work

Do not replace result V1 with V2.

Retain versions, mark correction/amendment, reopen clinician review when required, record which version was viewed and tie patient notification/follow-up to the applicable result version.

---

## 21. Mapping and Reconciliation Workbench is a core operations surface

Potential exception classes:

- unknown order code;
- unknown result code;
- unmatched patient;
- unmatched accession;
- unknown provider/location;
- missing charge mapping;
- unexpected result;
- duplicate message;
- corrected result without original;
- result without expected order;
- order without expected result;
- external rejection.

### Product consequence

Integration failures become visible work queues, not buried logs.

---

## 22. Durable integration messaging is mandatory

Use correlation IDs, external identifiers, idempotency, durable outbox/inbox, retries, dead-letter handling and manual reconciliation where appropriate.

A retry must not accidentally create duplicate orders, claims, results, appointments, payments or payouts.

---

## 23. Integration Hub is shared infrastructure

Adapters may connect labs, imaging, clearinghouses, payers, credentialing, pharmacy/eRx, government sources, telehealth, payment providers, communications, identity, future HIE/QHIN/TEFCA partners and Grid partners.

### Boundary rule

Vendor schemas do not define canonical Klinikos domain truth.

---

## 24. Connection state must be truthful

Use explicit lifecycle states such as:

`CANDIDATE → CONTRACTING / BAA/NDA → INTERFACE SPEC → SANDBOX → TECHNICALLY CONNECTED → UAT VALIDATED → PRODUCTION LIVE → MONITORED / SUSPENDED`

An adapter, API key, environment variable or demo does not prove production connectivity.

---

## 25. Clearinghouse is a rail, not the Klinikos architecture

Klinikos owns eligibility/claim workflow, claim truth, rejection state, remittance, denial/reconciliation, evidence and user experience.

A specialized clearinghouse can own commodity external X12 transport first.

### Strategic rule

Buy/connect commodity regulated rails before attempting to own national transport infrastructure unless later economics justify otherwise.

---

## 26. Revenue begins before the claim

### Revenue Integrity Graph

Connect:

`APPOINTMENT → ENCOUNTER → ORDER → PROCEDURE/SERVICE → DOCUMENTATION → DIAGNOSIS → RESULT → EXPECTED CHARGE → CHARGE → CODING → CLAIM → CLEARINGHOUSE RESPONSE → PAYER RESPONSE → REMITTANCE → PATIENT RESPONSIBILITY → PAYMENT → APPEAL → RECONCILIATION`

### Exception examples

ordered/performed/charge-expected but no charge; signed but uncoded; charge but no claim; claim but no acceptance; result without charge mapping; authorization gap; underpayment; unreconciled payment.

### Safety rule

Never infer billability merely because an order exists. Never optimize for unsupported coding/upcoding.

---

## 27. Terminology and coding are versioned infrastructure

Build toward effective-dated terminology/release services for ICD-10-CM, CPT, HCPCS, modifiers and other required systems.

Claims for historical DOS must use applicable historical release/rules.

CPT licensing restrictions must be respected.

---

## 28. Coding suggestions carry evidence

Zumi/coding support should return candidate, DOS validity, source evidence, applicable rule version, missing documentation, confidence and review requirement where possible.

Authorized provider/coder review remains the authority.

---

## 29. AI provenance is first-class

Persist appropriate provenance for AI sessions, source/transcript segments, generated artifacts, evidence links, user decisions, model/provider version, workflow version, usage/cost and outcome.

Klinikos should be able to explain what evidence supported a suggestion and what the authorized human changed/accepted/rejected.

---

## 30. AI never becomes the authority layer

Zumi may draft, summarize, compare, explain, surface deltas, identify gaps, prepare communication, suggest codes and coordinate next steps.

Deterministic domains and authorized humans remain authoritative for permissions, credentials, orders, signatures, result acknowledgement, claim state, payment state, legal status, Grid eligibility and other governed actions.

---

## 31. Close Visit is exception resolution, not a sign button

Before closing/signing, Klinikos should surface applicable unresolved conditions such as missing required documentation, unreviewed AI output, unsigned orders, abnormal-result follow-up, coding issues, unresolved follow-up, case timing problems, charge/reconciliation issues and required attestations.

### Product consequence

Clinical safety and revenue integrity meet at the close-visit control point.

---

## 32. Credentialing is operational infrastructure

Distinguish license, NPI, primary-source verification, payer credentialing, payer enrollment, location participation, facility privilege, sanctions/exclusions, malpractice and specialty certification.

### Target readiness relation

`PROFESSIONAL × LOCATION × PAYER × SPECIALTY/SERVICE × EFFECTIVE DATE`

### Scheduling / billing consequence

Scheduling and billing consume credential readiness rather than relying on staff memory.

### Grid consequence

The same governed professional profile/credential state can support Grid opportunity eligibility without duplicating credential truth.

---

## 33. EDU is simulation + competency + workforce infrastructure

Students should be able to learn in synthetic/de-identified Klinikos environments covering registration, intake, scheduling, documentation, results, referrals, billing-readiness, privacy, escalation and Grid workflows.

### Safety boundary

Simulation/EDU roles never silently become production clinical roles.

### Flywheel

`LEARN → SIMULATE → COMPETENCY EVIDENCE → GRADUATION / CREDENTIAL PIPELINE → GRID ELIGIBILITY WHEN GOVERNED → WORK → EXPERIENCE → CONTINUING EDU → PRECEPTOR / EMPLOYER / OWNER`

---

## 34. Grid is universal resource composition

Grid composes demand, participant/resource slots, eligibility, permissions, agreements, financial conditions, booking/reservation, fulfillment and audit.

Examples include staffing, clinical placement, referral capacity, diagnostic capacity, provider/space matching and other policy-governed healthcare resources.

### Clinic connection

Authorized Clinic OS signals such as unused capacity, schedule gaps, staffing shortages and referral backlogs may create Grid demand/supply.

### Privacy rule

Grid receives only the minimum necessary data for the current stage. Public discovery never receives unnecessary PHI.

---

## 35. Provider is a persistent lifecycle experience

Provider/professional experience may eventually include professional identity, credentials, authorized schedules/charts/results/referrals/tasks, EDU, Grid opportunities, availability, earnings, locations, professional relationships and progression toward independent practice/ownership.

The provider remains a Klinikos participant across employer changes where policy permits.

---

## 36. Patient is a persistent network participant

Patient experience may include appointments, forms, documents, messages, released results, payments, referrals, care instructions, telehealth, authorized records, insurance information and appropriate capacity discovery.

The patient experience remains governed, plain-language and separated from clinic administration.

---

## 37. Enterprise Network becomes a command center

Enterprise users need controlled network views over locations, providers, capacity, scheduling, revenue, claims, payer performance, staffing gaps, referral leakage, utilization, credential readiness, quality, integration health and Grid opportunities without opening dozens of clinic dashboards.

Enterprise administrative visibility does not automatically grant clinical chart privilege.

---

## 38. Shared Financial OS closes all money loops

Clinic subscriptions, implementation fees, patient payments, Grid transactions, EDU subscriptions, room rental, deposits, refunds, provider/facility payouts and variable usage should share financial semantics where practical.

Keep separate:

- obligation;
- payment evidence;
- entitlement;
- settlement;
- payout;
- refund;
- dispute;
- reconciliation.

Klinikos should avoid unnecessary custody of funds when specialized payment rails can move money safely.

---

## 39. Pricing follows entitlement + usage + implementation

Packages should represent entitlements, included allowances, specialty packs, integration packs, configuration depth, support and enterprise governance — not separate code forks.

Variable external costs such as AI, communications, verification, eligibility, claims and other paid rails should be bounded, metered, passed through or funded by customer revenue according to current commercial policy.

Historical planning estimates are not cost truth; measure actual vendor bills and usage.

---

## 40. Canonical Reference Environment is the real product with synthetic truth

Build one fully functioning reference environment using synthetic data and real internal engines.

It should demonstrate:

- multiple organizations/locations;
- role/profession-specific experiences;
- specialty composition;
- Clinic OS;
- Grid;
- EDU;
- billing/revenue states;
- Zumi governance;
- audit/security;
- integration states;
- exception/reconciliation queues.

External rails may be simulated only when clearly labeled as simulated/pending.

### Commercial implementation route

`REFERENCE CONFIGURATION → SPECIALTY → ORGANIZATION → LOCATIONS → PROFESSIONALS → ROLES/CAPABILITIES → PAYER/CASE SETTINGS → WORKFLOWS/FORMS → APPROVED INTEGRATIONS → DATA MIGRATION → TRAINING → UAT → GO LIVE → MEASURE → OPTIMIZE`

Clone configuration, not code.

---

## 41. The reference environment must prove forbidden actions

Representative negative demonstrations/tests should include:

- MA cannot sign physician-only documentation;
- biller/coder receives minimum necessary revenue/coding data rather than unrestricted chart access;
- student cannot enter production clinical authority;
- unverified/ineligible Grid participant cannot accept a regulated opportunity;
- wrong-tenant access fails;
- expired applicable credential changes eligibility;
- location-specific privilege is enforced;
- enterprise/configuration administration does not automatically grant chart access.

Security is part of product value and enterprise sales credibility.

---

## 42. Events connect the ecosystem

Examples include appointment cancellation, capacity availability, credential expiry, corrected lab result, claim rejection, EDU competency completion, Grid demand, booking/fulfillment, payment verification and reconciliation.

Events must be minimum necessary and may trigger governed downstream work.

Events are not an uncontrolled PHI bus.

---

## 43. Zumi reasons over structured Klinikos truth

Zumi should be able to answer questions such as:

- why has an MRI not closed?;
- why can a provider not be scheduled at a location?;
- what changed in the patient?;
- where is revenue leaking?;
- what can this professional do in this context?;
- what should this student/professional do next?;

because authoritative Klinikos domains expose evidence and state — not because the model improvises healthcare rules.

---

## 44. Defensible graph architecture

Klinikos should progressively own and connect:

1. **Identity Graph** — who the person/entity is;
2. **Credential / Authority Graph** — what they may do, where, for whom and when;
3. **Clinical Change Graph** — what changed;
4. **Execution Graph** — what was requested, acknowledged, performed, reviewed and completed;
5. **Revenue Integrity Graph** — whether work became financial completion;
6. **Evidence Graph** — why a system/AI conclusion exists;
7. **Configuration Graph** — why one organization/specialty/location behaves differently;
8. **Resource / Grid Graph** — people, space, services, capacity and opportunity;
9. **Learning / Competency Graph** — what someone learned and what evidence exists;
10. **Memory / Knowledge Graph** — what Klinikos learned, from whom, with what authority, and what changed as a result.

These graphs reinforce one another and are more defensible than isolated appointment, note, scribe or marketplace features.

---

## 45. Knowledge capture contract

Every accepted future insight should be recorded with enough metadata to answer:

- What was learned?
- Who/what was the source?
- When was it learned?
- Which domain/problem did it expose?
- What reusable primitive does it imply?
- Which engines are affected?
- What security/privacy consequences exist?
- What data-model/event consequences exist?
- What UX consequences exist?
- What integration consequences exist?
- What revenue/pricing consequences exist?
- Is the recommendation accepted, rejected, superseded or deferred?
- What dependency blocks implementation?
- Which PR/commit implemented it?
- What measured outcome followed?

Suggested ledger fields:

`insight_id`  
`date`  
`source_type`  
`source_reference`  
`domain`  
`problem`  
`observation`  
`architecture_implication`  
`affected_engines`  
`security_implication`  
`data_implication`  
`ux_implication`  
`integration_implication`  
`commercial_implication`  
`decision_status`  
`dependency`  
`implementation_status`  
`pr_or_commit`  
`outcome_reference`  
`last_reviewed`  
`supersedes`

Do not use this ledger as a dumping ground for raw transcripts. Preserve source references and extract structured knowledge.

---

## 46. Implementation doctrine

The cross-domain build order should favor shared primitives before downstream sophistication:

1. current-repo/schema/auth/tenancy/runtime audit;
2. identity / profession / assignment / capability / contextual authorization;
3. organization/location/configuration registry;
4. patient / coverage / financial case / identity matching;
5. scheduling / appointment series / capacity;
6. clinical component/versioning / Current Visit / body map;
7. Clinical Change + Evidence Graph;
8. canonical orders/results + integration outbox/inbox/reconciliation;
9. terminology / coding / Revenue Integrity;
10. claims / clearinghouse / remittance / denial workflow;
11. credential-readiness convergence;
12. Grid convergence;
13. EDU/competency convergence;
14. enterprise/network command center;
15. advanced intelligence/memory and additional regulated rails.

This order is dependency guidance, not an instruction to undo currently working or concurrently approved slices. Preserve current code and introduce shared primitives incrementally.

---

## 47. Required update behavior

When this ledger changes a repository-wide invariant, reconcile `docs/SOURCE_OF_TRUTH.md`.

When it changes a specialist rule, reconcile the relevant specialist canon rather than leaving conflicting generations of architecture.

When code lands, update `docs/FEATURE_STATUS.md` only with evidence.

When an external rail changes, update `docs/EXTERNAL_DEPENDENCY_MATRIX.md` only with verified connection evidence.

When an end-to-end journey is proven, update `docs/MVP_JOURNEYS.md`.

When a recommendation is deferred or rejected, preserve the decision so a future agent does not resurrect it as new truth.

---

## 48. North star

The product should progressively become more powerful while the user experience becomes simpler.

Users should mostly need to understand:

> **WHAT NEEDS ME?**  
> **WHAT CHANGED?**  
> **WHAT SHOULD I DO NEXT?**

Klinikos handles contextual authorization, evidence, orchestration, eligibility, integrations, reconciliation, financial truth and network complexity underneath.

The clinicians taught Klinikos what care teams need. The interface engineer exposed how integrations really fail. Billing consequences exposed where revenue disappears. Multi-location workflow exposed hidden capacity and credential complexity. Specialty workflow exposed why behavior must be composed rather than forked. Those lessons now belong to the architecture, not to one conversation.
