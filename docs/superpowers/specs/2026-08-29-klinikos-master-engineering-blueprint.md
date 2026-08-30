# KLINIKOS MASTER ENGINEERING BLUEPRINT
**Version:** 2026-08-29  
**Status:** APPROVED — For repo commit to `docs/superpowers/specs/`  
**Supersedes:** All prior ecosystem diagrams and module-level architecture summaries  
**Authority:** This document is the engineering-buildable expression of the Universal Healthcare Universe + Company Constitution architecture. It does not replace the Master Canon — it is the canonical implementation contract the Master Canon generates.

---

## GOVERNING LAWS (Non-Negotiable, Apply Everywhere)

1. **Simple above. Technical below.** Users see "Upload your resume," "Find work," "I need a room," "Who needs attention?" They never see "contextual authority," "evidence ingestion," "resource ontology," "active experience envelope," or "policy orchestration." Those concepts exist in the backend because engineering needs them. Users experience the result.

2. **One Klinikos identity.** One person. One record. No matter how many roles they hold — student, RN, contractor, clinic owner, preceptor, patient — they are the same identity with different verified relationships, different authority levels, and different Klinikos experiences.

3. **EXISTS ≠ DISCOVERABLE ≠ PROMOTED ≠ ELIGIBLE ≠ ENTITLED ≠ AUTHORIZED ≠ VISIBLE DATA ≠ ACTIONABLE NOW.** These eight states are always separate. Collapsing any two is an architecture defect.

4. **Three controls that must never collapse: Promotion, Entitlement, Authority.** Promotion = what Klinikos shows. Entitlement = what the person or org has purchased or earned access to. Authority = what they may actually do given credentials, consent, policy, and verification.

5. **Founder omission does not equal product omission.** A real professional requirement does not disappear because the founder did not know the technical term needed to ask for it. Canon compression must not erase accepted lifecycle architecture.

6. **Reuse → Extend → Generalize → Connect.** Never create a second identity system, patient model, organization model, authorization model, financial ledger, Grid, EDU, Network, Zumi, task system, clinical record, or parallel architecture when a governed substrate already exists.

7. **The complexity belongs to Klinikos, not to the person using it.** Every workflow that is operationally complex must resolve into a plain-language surface. The multi-party placement relationship (student + school + site + preceptor + hours + competencies + agreements + approvals) is one user experience: "Finish your clinical hours."

8. **Context switch is a security event, not a tab click.** Every context switch triggers full recompute of navigation, data scope, authorization, entitlement, Zumi context, tools, notifications, promotions, and audit. Prior-context data must not persist after switch.

9. **Scope classification applies to every capability:**
   - **NOW** — Build this for production release
   - **BUILD-EXPAND** — Architecture supports it; build when first use case is confirmed
   - **LATER** — Intentionally deferred; do not build yet
   - **PARTNER** — Connect to an external partner who owns this domain
   - **CONNECT** — API/integration surface; do not rebuild the capability
   - **NEVER BUILD** — Outside Klinikos's governance boundary; permanently excluded

10. **OpenAI is a governed rail, not a decision-maker.** Zumi understands intent. The policy/authority layer decides permission. OpenAI (and any approved AI provider under the partnership agreement) is the model layer Zumi routes through for inference, generation, and reasoning — governed by the AI service processing policy, with PHI boundaries explicit per screen.

---

## THE FIVE PLANES

---

# PLANE 1 — HEALTHCARE UNIVERSE

Every actor, institution, and participant class Klinikos touches, connects, or orchestrates.

## 1.1 People

| Actor Class | Sub-Types | Klinikos Entry Point |
|---|---|---|
| Patient | Adult self-pay, insured, Medicaid/Medicare, pediatric (guardian-managed), behavioral health, chronic care, caregiver-managed | Patient discovery, referral, or clinic intake |
| Caregiver | Family caregiver, professional caregiver, home health aide | Grid (I AM AVAILABLE), patient record access with consent |
| Student | Pre-licensure nursing, allied health, medical, dental, pharmacy, behavioral health | EDU entry — "I am finishing school" |
| Graduate / Pre-credential | Recently licensed, seeking first placement or employment | Grid + credential verification |
| Licensed Professional | RN, NP, PA, MD, DO, LCSW, LPC, PT, OT, SLP, dental, pharmacy, imaging, behavioral health | Grid (I HAVE services), Clinic OS (I work here) |
| Injector / Esthetician | RN-injector, NP-injector, PA-injector, licensed esthetician, medical esthetician | Grid (I offer services), med-spa provider path |
| Contractor | Independent clinical contractor, locum, per diem, mobile provider | Grid (I HAVE availability), contract relationship |
| Practice Owner | Solo provider, group practice owner, clinic founder | Clinic OS (I run a practice) |
| Clinic Administrator | Practice manager, office manager, billing manager, front desk | Clinic OS (I manage this location) |
| Biller / Coder | Internal or external billing specialist, RCM contractor | Financial OS / RCM workspace |
| Educator / Preceptor | Clinical faculty, adjunct instructor, site preceptor | EDU (I teach / I supervise clinical hours) |
| Expert | Quality consultant, compliance officer, specialty advisor, peer reviewer | Grid Expert path |
| Employer | Clinic as employer, hospital, MSO, staffing agency | Grid (I NEED people), Clinic OS (I employ people) |
| Enterprise / Network Administrator | MSO operator, health system IT, group purchasing org | Enterprise plane |

## 1.2 Organizations

| Organization Class | Sub-Types | Klinikos Role |
|---|---|---|
| Solo / Small Practice | 1–5 providers, single location | Clinic OS primary customer |
| Multi-Location Practice | 5–50+ providers, multiple sites | Clinic OS + Grid + multi-location admin |
| Specialty Clinic | Aesthetics / med spa, behavioral health, physical therapy, dental, imaging, urgent care | Vertical-specific Clinic OS + Grid + Commerce |
| FQHC / Community Health Center | Federally qualified, sliding-scale, grant-funded | Clinic OS + Grid + RCM (complex payer mix) |
| Hospital / Health System | Inpatient + outpatient, employed physicians | Integration + Grid + Enterprise |
| MSO | Management services organization, multi-practice operator | Enterprise plane + Financial OS |
| School / University | Nursing school, allied health program, medical school | EDU — program admin path |
| Workforce Board | Government workforce development board | EDU + Grid distribution |
| Payer | Commercial insurer, Medicaid managed care, Medicare Advantage, TPA | CONNECT — eligibility, claims, ERA rails |
| Clearinghouse | Claim transmission, ERA, status transactions | CONNECT — external rail |
| Lab | Reference lab, point-of-care lab, pathology | CONNECT — order/result integration |
| Imaging Center | Radiology, MRI, ultrasound, nuclear medicine | CONNECT — order/result integration |
| Pharmacy | Retail, specialty, compounding | CONNECT — e-prescribe integration |
| DME / Medical Supply | Durable medical equipment, disposables, supplies | Grid Commerce + CONNECT |
| Supplier / Manufacturer | Injectable products, medical devices, cosmetic supplies | Grid Commerce (approved product listings) |
| Staffing Agency | Healthcare staffing, travel nursing, locum | Grid (I place people) |
| Credentialing Body | State licensing boards, NCLEX, specialty boards, DEA | CONNECT — credential verification |
| Malpractice Carrier | Professional liability insurance provider | CONNECT — coverage verification |
| Government / Regulatory | CMS, state health departments, OSHA, HHS, DEA | CONNECT + compliance evidence |
| Technology Partner | OpenAI (AI rail), other API partners | Integration Hub — governed connection |
| Enterprise Partner | Health systems, payer networks, large employer groups | Enterprise plane |

## 1.3 Physical Assets

| Asset Class | Grid Class | NOW / LATER |
|---|---|---|
| Exam Room | Room listing — bookable by appointment or session | NOW |
| Procedure Room | Room listing — specialized equipment required | NOW |
| Infusion Chair | Room/equipment listing | BUILD-EXPAND |
| Medical Equipment | Equipment listing — owned, available for use | BUILD-EXPAND |
| Facility / Building | Facility listing — multi-room, multi-provider | LATER |
| Inventory / Supplies | Product/supply listing — owned and available | BUILD-EXPAND |
| Injectable Products | Approved product listing — regulated, verified supplier | NOW (med-spa path) |
| Mobile Unit | Grid listing — provider travels to location | BUILD-EXPAND |

---

# PLANE 2 — ECONOMIC & RESOURCE PLANE

Everything that can be needed, supplied, scheduled, allocated, sold, rented, taught, referred, worked, financed, or fulfilled — and the Grid substrate that handles all of it.

## 2.1 Grid Resource Classes

Grid is universal supply/demand/capacity infrastructure. Every resource class below uses the same underlying primitives: a listing (I HAVE), a need (I NEED), a match, an agreement, fulfillment, evidence, and a money event.

| Grid Class | What It Represents | NOW / LATER |
|---|---|---|
| Job / Shift | Employment or per-diem clinical work | NOW |
| Service | Professional service offered by a credentialed provider | NOW |
| Appointment Slot | Bookable time with a provider | NOW |
| Room | Bookable physical space | NOW |
| Approved Product | Injectable or medical product from verified supplier | NOW |
| Supply / Inventory | Medical supplies, consumables | BUILD-EXPAND |
| Equipment | Medical device, machine, tool | BUILD-EXPAND |
| Course / Learning | EDU offering — course, cohort, simulation | NOW |
| Placement | Clinical placement site + preceptor capacity | NOW |
| Preceptor | Supervising clinician available for student oversight | NOW |
| Expert Service | Scoped specialist access — quality, compliance, legal | BUILD-EXPAND |
| Referral Slot | Receiving provider capacity for patient referrals | LATER |
| Organization Capacity | MSO / staffing org offering implementation or management | LATER |
| Professional Service | Billing, coding, credentialing services offered by a firm | BUILD-EXPAND |
| Project / Contract | Scoped engagement — consulting, implementation, audit | LATER |

## 2.2 Universal Grid Primitive (applies to all resource classes)

```
LISTING (I HAVE / I OFFER)
  → identity verified
  → resource class defined
  → requirements specified (credential, license, equipment, location)
  → pricing / rate set
  → availability declared
  → approval gates applied

NEED (I NEED / I AM LOOKING FOR)
  → identity verified
  → need class defined
  → requirements declared
  → eligibility checked

MATCH
  → requirements ↔ qualifications
  → availability ↔ schedule
  → location ↔ travel radius
  → price ↔ budget
  → trust signals weighted

AGREEMENT
  → terms presented in plain language
  → consent captured
  → legal gate applied (jurisdiction, credential validity, org policy)
  → both parties confirmed

WORK / FULFILLMENT / CARE / LEARNING / COMMERCE
  → delivery state tracked
  → obligations created

EVIDENCE
  → completion recorded
  → outcome measured
  → documented

MONEY EVENT
  → obligation calculated
  → payment triggered
  → settlement processed
  → Financial OS records

REPUTATION
  → objective evidence added to both parties' records
  → Zumi updates matching weights
```

---

# PLANE 3 — LIFECYCLE PLANE

Every major composable route. These are not separate systems — they share the same backend domains and intersect at people, organizations, and resources.

## 3.1 Student → Licensed Professional → Career

```
ENTRY: "I am finishing nursing school" / "I want to start my clinical career"

1. Identity claimed (name, email, phone)
2. School relationship verified (student enrollment confirmation)
3. Resume uploaded
   → Career profile drafted (claimed education, experience, skills)
   → Resume text is CLAIMED, not verified — displayed separately from verified credentials
4. Skills, availability, location, graduation date, job preferences added
5. Grid state created: I HAVE (skills, availability) + I NEED (placement, job)
6. Placement matching begins:
   → School/program relationship
   → Site/preceptor availability on Grid
   → Required hours, competencies, agreements
   → Multi-party approval: student + school + site + preceptor + agreements
7. Placement fulfilled → hours logged → competency evidence recorded
8. Graduation → license application (external credentialing body — CONNECT)
9. License received → verified through credentialing rail
10. Grid profile promoted: VERIFIED PROFESSIONAL
11. Job matching begins (same Grid primitives as placement, different class)
12. Employment or contractor relationship established
13. Career continues → see Professional lifecycle below
```

**Key architectural rules:**
- Resume text → career profile → claimed only; never auto-promoted to verified
- Placement is a multi-party relationship object: student + school/program + clinic/site + preceptor + required hours + competencies + agreements + approvals
- Graduation ≠ credential; license ≠ authority to practice unsupervised (jurisdiction-specific)

## 3.2 Licensed Professional → Independent Practice → Employer

```
ENTRY: "I have my license" / "I want to find work" / "I want to run my own practice"

1. Identity claimed
2. License submitted → verified (state board CONNECT)
3. Certifications submitted → verified
4. Malpractice coverage verified
5. Services defined (what I offer, to whom, under what conditions)
6. Availability declared (schedule, travel radius, on-call state)
7. Location preferences set (mobile / at-home / clinic / room preferences)
8. Grid profile: VERIFIED PROVIDER with full service listing
9. Matching and booking:
   → Patient or clinic posts need
   → Provider accepts or declines
   → Agreement confirmed
   → Appointment / engagement scheduled
10. Work delivered:
    → Documentation (SOAP, procedure note, etc.)
    → Safety checks (scope of practice, jurisdiction, consent)
11. Post-visit:
    → Fulfillment evidence recorded
    → Payouts triggered (Financial OS)
    → Objective reputation evidence added
12. Career evolution:
    → Additional certifications → authority expands
    → Clinic relationship → employee or contractor track
    → Practice formation → Clinic OS (I run a practice)
    → Preceptor relationship → EDU (I supervise students)
    → Expert registration → Quality/Expert Grid
```

## 3.3 RN/NP → Injector / Esthetician Path

```
ENTRY: "I am a nurse. I want to offer aesthetic services."

1. RN/NP license verified
2. Injector certification verified (Botox, filler, etc.)
3. Malpractice reviewed for aesthetic procedure coverage
4. Services defined: injectable services, treatment menu, pricing
5. Practice setting declared: mobile / at-home / clinic room / med spa
6. Travel radius set
7. On-call state managed
8. Contractor relationship(s) established (clinic or med spa sponsorship where required)
9. Approval gates: jurisdiction-specific supervision requirements verified
10. Grid listing: VERIFIED INJECTOR — bookable
11. Booking:
    → Patient books service
    → Provider accepts
    → Pre-visit: intake, consent (treatment consent, photo consent, medical history)
    → Visit: documentation, safety check, procedure delivery
    → Post-visit: aftercare instructions, follow-up scheduling
    → Fulfillment evidence recorded
    → Payout processed (Financial OS)
    → Reputation evidence added
```

**Jurisdiction rules:** Supervision requirements for RN injectors vary by state (physician supervision, collaborative agreement, NP independent practice). Klinikos applies jurisdiction-specific rules — NEVER assumes independent practice authority where it does not exist.

## 3.4 Patient → Care → Longitudinal Record

```
ENTRY: "I need to see a doctor" / "Book an appointment" / "I got a referral"

1. Patient identity (name, DOB, contact — minimum necessary)
2. Insurance / eligibility (CONNECT — payer rail)
3. Appointment booked (Grid — appointment slot class)
4. Intake completed:
   → Demographics, medical history, medications, allergies
   → ID + insurance card uploads
   → HIPAA acknowledgement
   → Consent forms (treatment, telehealth if applicable, AI/audio if applicable)
   → Specialty-specific forms (No-Fault, behavioral health, etc.)
5. Current Visit:
   → Check-in
   → Vitals
   → Staff handoff (MA → provider)
   → Clinical change tracking
   → Provider assessment
   → Telehealth (mode within encounter, not a separate system)
   → Orders: lab, imaging, pharmacy, referral, DME
   → Documentation: SOAP, procedure note, operative note
   → Coding: ICD-10, CPT, modifier
   → Billing readiness check
   → Discharge / follow-up instructions
6. Post-visit:
   → Orders fulfilled (results return via CONNECT — lab, imaging, pharmacy)
   → Results reviewed → follow-up obligation created
   → Claim prepared (CMS-1500 / 837P)
   → Claim submitted → clearinghouse (CONNECT)
   → Adjudication → ERA returned
   → Payment posted
   → Patient responsibility calculated
   → Patient balance communication
   → Collections if needed
7. Longitudinal care:
   → Record grows with each encounter
   → Chronic care management
   → Referral network builds
   → Care team expands
```

## 3.5 Clinic → Operating Business → Employer → Network Node

```
ENTRY: "I want to run my practice on Klinikos" / "Set up my clinic"

1. Organization created (name, NPI, tax ID, address, specialty)
2. Locations added
3. Providers added (employment or contractor relationships)
4. Services defined
5. Schedule configured
6. Intake and consent forms configured (clinic-specific, specialty-specific)
7. Billing configuration:
   → Tax ID / EIN
   → NPI (group + individual)
   → Payer enrollments (CONNECT)
   → Fee schedule
   → Clearinghouse connection (CONNECT)
8. Operations running:
   → Patient scheduling
   → Intake workflow
   → Current Visit
   → RCM cycle
9. Grid activity:
   → Rooms listed (I have capacity)
   → Providers listed (I employ / I contract)
   → Products listed (I sell approved products)
   → Staff needs posted (I need a biller, a per-diem RN)
10. Network effects:
    → Referral relationships established
    → Shared patients coordinated
    → Grid supply/demand grows
    → Quality/Expert Grid access earned
11. Expansion paths:
    → Multi-location
    → MSO relationship
    → Enterprise contract
    → Preceptor/placement site (EDU)
```

## 3.6 Med Spa → Product Commerce → Provider Network

```
ENTRY: "I run a med spa" / "I want to sell products through Klinikos"

1. Organization created (med spa, aesthetics clinic, wellness center)
2. License / operator credentials verified (jurisdiction-specific)
3. Services defined: injectable treatments, skincare, laser, wellness
4. Providers added: medical directors, injectors, estheticians, support staff
5. Approved product listings:
   → Supplier verified (FDA-registered, licensed distributor)
   → Product approved for listing
   → Pricing set
   → Inventory tracked
6. Room / treatment chair listings
7. Booking and scheduling
8. Intake + consent (treatment, photo, medical history, AI consent)
9. Visit documentation
10. Retail commerce:
    → Product sold to patient post-visit
    → Inventory decremented
    → Payment processed (Financial OS)
11. Provider network:
    → Injectors booked from Grid
    → Room capacity sold/rented through Grid
    → Approved products listed for other providers to purchase
```

## 3.7 Quality / Expert Path

```
ENTRY: Problem detected (Zumi, staff report, audit trigger, outcome data)

1. Klinikos detects operational or clinical problem:
   → Zumi identifies pattern (billing error, outcome anomaly, compliance gap)
   → Staff reports issue
   → Audit trigger fires
2. Software handles what it safely can:
   → Automated correction (coding suggestion, duplicate detection, eligibility re-check)
   → Workflow rerouting
3. Staff resolves what they can:
   → Internal escalation
   → Operational fix
4. If expert judgment is needed:
   → Problem classified (compliance, clinical quality, legal, coding, credentialing)
   → Grid Expert search: verified expert matching problem class
   → Scoped access granted (minimum necessary data, time-limited)
   → Expert finding delivered
   → Remediation plan created
   → Evidence of remediation recorded
   → Measured improvement logged
   → Reputation evidence added to expert record
5. Outcome:
   → Problem resolved with documented evidence
   → Prevention rule added (Zumi learns)
   → Case study potential flagged (with consent)
```

## 3.8 Cross-Organizational Healthcare Workflow

Klinikos understands the entire chain even when external systems perform pieces of it.

```
ORDER CREATED (in Klinikos Current Visit)
  → Lab order: transmitted to external lab (CONNECT — HL7/FHIR or direct integration)
  → Result returned: received, parsed, surfaced in Current Visit
  → Follow-up obligation created: Zumi flags provider
  → Follow-up encounter scheduled
  → New encounter generates new claim
  → Claim submitted → clearinghouse (CONNECT)
  → Payer adjudicates → ERA returned
  → Payment posted
  → Patient responsibility calculated
  → Patient balance communication sent
  → If unpaid → collections workflow
  → Operational exception detected (Zumi)
  → RCM workspace flags
  → Staff resolves or escalates to Expert Grid

REFERRAL WORKFLOW:
  → Referral order created in Current Visit
  → Receiving provider capacity checked (Grid — referral slot class, LATER)
  → Referral sent (CONNECT — Direct messaging, fax, or integration)
  → Referral status tracked
  → Results / consult note returned (CONNECT)
  → Longitudinal record updated
```

---

# PLANE 4 — OPERATING INFRASTRUCTURE

The 12 shared backend domains. They share canonical objects. No domain copies data from another — it references the canonical object.

## 4.1 Identity & Trust

**What it owns:** One person record. One organization record. Identity assurance levels. Claimed vs. verified state. Credential storage and verification rail connections. Trust signal aggregation.

**Canonical objects:** Person, Organization, Credential, TrustSignal, IdentityAssuranceLevel

**Connections:** Every other domain references Identity. No domain creates its own person model.

**NOW:** Person, Organization, Credential, basic verification flow  
**BUILD-EXPAND:** Advanced assurance levels, biometric identity  
**CONNECT:** State licensing boards, NCLEX, DEA, NPI registry, malpractice carriers

## 4.2 Experience Engine

**What it owns:** The Active Experience Envelope — continuously recomputed, never set once. Promotion, Entitlement, Authority as three always-separate controls. Screen Experience Contracts — every active route must declare one. Context switch as security event.

**Inputs:** Identity state, relationship state, organization membership, authority level, purpose, current work object, commercial state, risk/policy state, operational state.

**Outputs:** Primary workspace, navigation, allowed secondary capabilities, data projection (minimum necessary), actions, Zumi tools and modes, notifications, promotions, verification requests, blocked states, audit requirements.

**NOW:** Experience Envelope canon (merged PR #357), Screen Experience Contract schema (merged PR #357). 12 routes inventoried, 0 contracts authored — production release blocker.

**Priority 1 contracts needed:** `/` (Living Home), `/grid/workspace`, `/clinic`, `/visit`, `/auth`

## 4.3 Zumi / OpenAI Layer

**What it owns:** AI orchestration. Intent understanding. Per-screen mode enforcement. Data governance. AI processing policy.

**Zumi's six modes (defined per screen):**
- READ — Zumi may read structured data for this screen
- INFER — Zumi may derive non-PHI conclusions from patterns
- RECOMMEND — Zumi may surface suggestions to the user
- PREPARE — Zumi may draft content for human review
- EXECUTE — Zumi may take action (with explicit authority and audit)
- FORBIDDEN — Zumi has no access to this data class on this screen

**OpenAI Partnership Position:**
OpenAI is the approved AI provider rail. Zumi routes inference, generation, and reasoning through OpenAI under the AI service processing agreement. OpenAI does not decide permission — the policy/authority layer does. PHI flows only through the healthcare-governed AI rail, never through the general OpenAI endpoint. Authentication secrets and payment secrets never enter AI context. Patient transcripts and messages are not advertising audiences. Future model training requires separate explicit lawful opt-in.

**Canonical flow:**
```
Zumi understands intent
→ Context Engine resolves situation
→ Policy/Authority determines permissible universe
→ Entitlement determines commercially available universe
→ Relevance Engine determines useful universe
→ Experience Composer produces surface
→ OpenAI processes the inference/generation within approved scope
→ Result returned to Zumi
→ Zumi surfaces to user within permitted mode
```

**NOW:** Zumi mode system (merged PR #357), AI service processing policy (legal review required before PHI workflows go live), public Zumi (PHI forbidden)  
**LATER:** Healthcare-governed AI rail for PHI-adjacent Zumi workflows (requires legal/privacy counsel sign-off)

## 4.4 Grid

**What it owns:** Universal supply/demand/capacity exchange. Every resource class uses Grid primitives. Grid is an application AND a substrate.

**Canonical objects:** Listing, Need, Match, Agreement, Fulfillment, Evidence, Transaction, Reputation

**Grid does NOT own:** Credential verification (Identity & Trust), clinical documentation (Care/Current Visit), financial settlement (Financial OS), course content (EDU)

**NOW:** Grid marketplace — Jobs, Services, Appointment Slots, Rooms, Approved Products  
**BUILD-EXPAND:** Equipment, Supplies, Expert Services, Placements, Preceptors  
**LATER:** Referral Slots, Organization Capacity, Project/Contract class  
**CONNECT:** External staffing platforms (inbound referral), government job boards

## 4.5 EDU

**What it owns:** The full learner-to-workforce pipeline. Not just courses.

```
Learner → Program → Learning → Simulation → Evidence → Human Review
→ Placement Readiness → Site/Preceptor (Grid) → Work → Experience
→ Continuing Learning → Advanced Credential → Career Evolution
```

**Canonical objects:** Learner, Program, Course, Simulation, PlacementSite, Preceptor, PlacementRelationship (multi-party), CompetencyEvidence, CEU

**Placement is a multi-party relationship object:**
Student + School/Program + Clinic/Site + Preceptor + Required Hours + Competencies + Agreements + Approvals

**NOW:** Learner profile, program enrollment, course delivery, simulation framework, placement matching  
**BUILD-EXPAND:** Competency assessment automation, CEU tracking, accreditation evidence  
**LATER:** Direct school system integrations, automated placement market  
**CONNECT:** State nursing boards (clinical hour verification), NCLEX prep partners

## 4.6 Care / Current Visit

**What it owns:** The clinical encounter from check-in to billing readiness. Telemedicine is a mode within the encounter, not a separate system.

```
Check-in → Vitals → Staff Handoff → Clinical Assessment
→ [Telehealth mode if needed] → Orders → Documentation
→ Coding → Billing Readiness → Discharge → Follow-up Obligation
```

**Canonical objects:** Encounter, Vitals, StaffHandoff, ClinicalNote, Order, Result, BillingReadinessCheck, FollowUpObligation

**NOW:** Vitals, staff handoff, clinical change (merged PRs #246, #247), encounter documentation, basic coding  
**BUILD-EXPAND:** Order transmission, result ingestion, telemedicine mode  
**CONNECT:** Lab (HL7/FHIR), imaging, pharmacy (e-prescribe), telehealth platform (as mode rail)

## 4.7 Clinic OS

**What it owns:** The clinic as an operating entity. Scheduling, staff coordination, system health, multi-location management, operational request management.

**Canonical objects:** Clinic, Location, StaffAssignment, OperationalRequest, SystemHealthCheck, ScheduleBlock

**The same clinic location is simultaneously:**
- Clinic OS location (operational workspace)
- Worksite (employment/contractor relationship)
- Grid room listing (bookable capacity)
- Placement site (EDU — clinical training)
- Referral destination (Care)
- Inventory location (Commerce)

**NOW:** System Health workspace, scheduling, staff handoff coordination  
**BUILD-EXPAND:** Multi-location unified view, operational analytics, task automation  
**LATER:** MSO / enterprise administration layer

## 4.8 Financial OS / RCM

**What it owns:** The complete revenue cycle. Not a superbill generator — the full end-to-end workflow.

```
Care → Documentation → Evidence → Coding → Charge
→ Billing Readiness → Claim → Clearinghouse (CONNECT) → Payer
→ Acceptance/Rejection → Adjudication → Remittance (ERA)
→ Payment Posting → Reconciliation → Revenue Integrity
```

**Also owns:** Patient invoices, balances, payment plans. Grid transaction settlement (provider payouts). Commerce settlements (product sales). Operational exception management.

**Canonical objects:** Charge, Claim, ERA, PaymentPosting, PatientBalance, ProviderPayout, RevenueExceptionFlag

**CONNECT (external rails — never rebuild):** Eligibility transactions, claim transmission, claim-status transactions, ERA/remittance, payer connectivity, clearinghouse infrastructure

**NOW:** Billing readiness workflow, superbill generation, charge capture, basic coding  
**BUILD-EXPAND:** Full claim lifecycle, ERA ingestion, denial management, revenue integrity  
**CONNECT:** Stedi / Change Healthcare / Availity (clearinghouse), payer direct APIs

## 4.9 Network / Community

**What it owns:** The compounding network effects. Referral relationships between organizations. Trust networks. Professional communities. Reputation propagation.

**NOW:** Basic organization relationship model  
**BUILD-EXPAND:** Referral network, trust signal propagation, professional community  
**LATER:** Network analytics, market intelligence

## 4.10 Insights & Analytics

**What it owns:** Operational metrics. Revenue intelligence. Workforce analytics. Patient outcome trends. Quality signals. Network effect measurement.

**Zumi surfaces insights. Insights owns the data aggregation and computation underneath.**

**NOW:** Basic operational dashboards (Engineering Velocity, Module Readiness, Billing/RCM progress)  
**BUILD-EXPAND:** Provider productivity, revenue cycle analytics, patient outcomes  
**LATER:** Predictive analytics, market intelligence, network effect metrics

## 4.11 Communications

**What it owns:** All patient-facing and provider-facing communications. Appointment reminders. Follow-up messages. Intake/consent delivery. Balance notifications. Clinical communications. PHI-safe messaging rules applied per message type.

**NOW:** PHI-safe messaging framework (knowledge base)  
**BUILD-EXPAND:** Automated reminder engine, recall campaigns, secure patient messaging  
**CONNECT:** SMS gateway, email provider, HIPAA-compliant messaging rail

## 4.12 Evidence, Audit & Memory

**What it owns:** The permanent record of what happened, when, by whom, under what authority, with what outcome. Not just an audit log — the intelligence layer that makes Klinikos smarter over time.

**Feeds:** Zumi (pattern recognition), Insights (analytics), Grid (reputation weights), Quality/Expert (problem detection), Network (trust signals)

**Rules:** Evidence is immutable. Audit records cannot be deleted. Provenance tracked on every clinical and financial record.

---

# PLANE 5 — COMPOUNDING BUSINESS PLANE

The flywheel. Every action a user takes makes Klinikos more valuable.

```
AWARENESS
  → SEO content (problem-focused, not feature-focused)
  → Professional community referrals
  → EDU distribution (students discover Klinikos before they graduate)
  → Grid distribution (free participation is distribution infrastructure)

FREE VALUE
  → Student: free career profile, free placement matching
  → Provider: free Grid listing (basic), free discovery
  → Clinic: free operational analysis ($500 entry product)
  → Patient: free appointment booking

IDENTITY
  → Minimum identity to get value
  → More identity unlocks more capability (progressive verification)

VERIFIED PARTICIPATION
  → Credential verified → more Grid weight
  → Organization verified → Clinic OS unlocks
  → Payment connected → Financial OS unlocks

LIQUIDITY
  → First match creates first transaction
  → First transaction creates first reputation signal
  → Reputation signal improves next match
  → Better match → faster transaction → more liquidity

TRANSACTION / WORK / CARE / LEARNING / COMMERCE
  → Grid transaction → provider payout + platform fee
  → Appointment → encounter → claim → payment
  → Course → placement → employment → transaction
  → Product sale → inventory → reorder → supplier relationship

MEASURABLE OUTCOME
  → Patient outcome evidence
  → Provider reputation evidence
  → Clinic operational improvement evidence
  → Revenue cycle improvement evidence

REVENUE
  → SaaS subscriptions (Clinic OS, Financial OS)
  → Transaction fees (Grid)
  → Commerce margin (approved products)
  → Implementation services (proof sprints, audits)
  → Enterprise contracts (MSO, health system)

RETENTION
  → Clinical records → switching cost
  → Financial OS → switching cost
  → Team relationships → switching cost
  → Evidence history → switching cost
  → Network relationships → switching cost

REPUTATION & REFERRAL
  → Provider reputation grows on Klinikos → doesn't leave
  → Clinic outcome evidence grows on Klinikos → doesn't leave
  → Referral network deepens on Klinikos → doesn't leave

ORGANIZATIONS & SUBSCRIPTIONS
  → Solo provider → practice → multi-location → MSO
  → Student cohort → school partnership → program integration
  → Clinic → employer → Grid supply creator

ENTERPRISE / NETWORK CONTRACTS
  → Health system integration contract
  → MSO operating contract
  → Payer partnership
  → Government program contract

MORE SUPPLY / DEMAND / DATA / EVIDENCE
  → Each new participant makes every match better
  → Each new transaction creates more evidence
  → More evidence → better Zumi intelligence
  → Better intelligence → faster matching → higher conversion

LOWER ACQUISITION COST
  → Network effects bring new participants
  → EDU brings students before they graduate
  → Grid brings providers before they have patients
  → Reputation brings patients before they are booked

HIGHER SWITCHING COST
  → Clinical records, financial history, reputation evidence
  → All irreproducible outside Klinikos

GREATER ENTERPRISE VALUE
  → More participants → more data → better intelligence
  → Better intelligence → better outcomes
  → Better outcomes → more evidence
  → More evidence → more trust
  → More trust → more participants
  → [FLYWHEEL]
```

---

# THE CANONICAL ROUTE REGISTRY (Structured Format)

Each major entry route encoded with full engineering context.

## Route: STUDENT_ENTRY

```yaml
who_enters: Pre-licensure student (nursing, allied health, medical, dental, behavioral health)
why_they_came: Find a clinical placement / start their career
free_value: Career profile creation, Grid I HAVE listing (basic), placement matching visibility
identity_needed: Email + phone (minimum); school relationship verification
proof_needed: School enrollment confirmation; resume (claimed, not verified)
relationship_needed: School/program relationship (multi-party placement object)
grid_state_created:
  i_have: Skills, availability, location preferences, graduation date
  i_need: Clinical placement, eventually employment
profile_type: Learner profile (claimed) → Graduate profile → Verified Professional (after licensure)
objects_touched: Person, Credential (claimed), CareerProfile, PlacementRelationship, Program
money_events: None at entry; placement fee to school (LATER); subscription to EDU (LATER)
failure_states:
  - School cannot be verified → placement matching blocked
  - Resume cannot be parsed → manual profile entry path
  - Placement site has no preceptor capacity → waitlist
legal_gate: School data privacy (FERPA); clinical placement agreement (student + school + site)
implementation_state: NOW — architecture defined; EDU module in active build
next_routes: Placement → Graduation → License → Professional_Entry OR Grid_Employment
```

## Route: PROFESSIONAL_ENTRY

```yaml
who_enters: Licensed clinical professional (RN, NP, PA, MD, PT, OT, etc.)
why_they_came: Find work / offer services / join a clinic
free_value: Verified Grid listing, job matching, basic discovery
identity_needed: Email + phone; NPI (if applicable)
proof_needed: Active license (state board CONNECT); certifications; malpractice coverage
relationship_needed: Employment or contractor relationship with org (optional at entry)
grid_state_created:
  i_have: Verified services, availability, location, credentials
  i_need: Patients, employment, clinic relationships (if seeking work)
profile_type: Verified Professional profile
objects_touched: Person, Credential (verified), GridListing, ServiceMenu, AvailabilityBlock
money_events: Platform fee on Grid transactions; subscription for premium features (LATER)
failure_states:
  - License expired or not found → listing blocked
  - Malpractice coverage gap → service listing blocked
  - Jurisdiction mismatch → scope restricted
legal_gate: State licensing requirements; jurisdiction-specific supervision rules; HIPAA
implementation_state: NOW — Grid provider path in active build
next_routes: Grid_Booking → Independent_Practice → Clinic_Employment → Preceptor → Expert
```

## Route: INJECTOR_ENTRY

```yaml
who_enters: RN, NP, or PA seeking to offer aesthetic injectable services
why_they_came: List injectable services, find bookings, manage their aesthetic practice
free_value: Verified injector listing, patient discovery
identity_needed: Email + phone + NPI
proof_needed: RN/NP/PA license (verified); injector certification(s); malpractice (aesthetic coverage confirmed); collaborative agreement where jurisdiction requires
relationship_needed: Medical director relationship (jurisdiction-specific); clinic/med spa contractor relationship (optional)
grid_state_created:
  i_have: Injectable services, availability, travel radius, on-call state
  i_need: Patients, clinic room bookings
profile_type: Verified Injector profile (subset of Professional profile)
objects_touched: Person, Credential (verified + specialty cert), GridListing, ServiceMenu, ContractorRelationship, JurisdictionRule
money_events: Platform fee on bookings; payout after fulfillment; room rental fee to clinic (Grid)
failure_states:
  - No injector certification → listing blocked
  - Jurisdiction requires physician supervision → blocked until collaborative agreement added
  - Malpractice doesn't cover aesthetics → blocked
legal_gate: State-specific injector scope rules; supervision/collaborative agreement requirements; patient consent (procedure + photo + medical history)
implementation_state: BUILD-EXPAND — architecture defined; injector-specific credential verification path needed
next_routes: Grid_Booking → Fulfillment → Payout → Reputation → Med_Spa_Partnership
```

## Route: CLINIC_ENTRY

```yaml
who_enters: Practice owner or administrator setting up a clinic on Klinikos
why_they_came: Run their practice operations on Klinikos
free_value: Operational analysis ($500 entry product); operational visibility
identity_needed: Email; organization NPI; tax ID/EIN
proof_needed: Organization NPI verification; tax ID; provider licenses (for employed providers)
relationship_needed: Owner/administrator relationship to organization
grid_state_created:
  i_have: Room capacity, provider availability, appointment slots
  i_need: Patients, staff (if hiring), supplies
profile_type: Organization profile → Clinic OS workspace
objects_touched: Organization, Location, Provider (relationships), ServiceMenu, ScheduleBlock, IntakeConfig, BillingConfig
money_events: SaaS subscription (Clinic OS); Grid transaction fees; product commerce (if listing products)
failure_states:
  - NPI not found → manual verification path
  - No payer enrollments → billing limited to self-pay only
  - No providers added → scheduling blocked
legal_gate: BAA (Business Associate Agreement — required for PHI handling); payer enrollment agreements; state licensure (facility)
implementation_state: NOW — Clinic OS in active build; System Health workspace live
next_routes: Patient_Intake → Current_Visit → RCM_Cycle → Grid_Expansion → Multi_Location → MSO
```

## Route: PATIENT_ENTRY

```yaml
who_enters: Patient seeking care (self-directed or referred)
why_they_came: Book an appointment / complete intake / get care
free_value: Appointment booking, intake completion
identity_needed: Name, DOB, contact; insurance (if applicable)
proof_needed: Insurance card (for covered visits); ID (for controlled substance prescribing, LATER)
relationship_needed: Patient → Provider relationship; Patient → Clinic relationship
grid_state_created:
  i_need: Appointment slot with specific provider/specialty/location
profile_type: Patient record (PHI — maximum data governance)
objects_touched: Person (patient record), Appointment, IntakeForm, ConsentRecord, Encounter, Claim, PatientBalance
money_events: Copay / coinsurance collection; self-pay payment; patient balance billing
failure_states:
  - Insurance eligibility check fails → self-pay path offered
  - Intake incomplete → visit blocked until complete
  - Provider not available → waitlist or rescheduling
legal_gate: HIPAA (BAA, minimum necessary, PHI governance); state-specific consent requirements; telehealth consent (if applicable)
implementation_state: NOW — patient path defined; intake/consent engine in active build
next_routes: Intake → Current_Visit → Orders → RCM → Follow_Up → Longitudinal_Care
```

## Route: MED_SPA_ENTRY

```yaml
who_enters: Med spa owner or operator
why_they_came: Run their med spa operations, list products, manage providers and rooms
free_value: Operational analysis; product listing visibility
identity_needed: Organization identity; operator credentials; medical director information
proof_needed: Business license; medical director license; supplier verification (for product listings)
relationship_needed: Owner → Organization; Medical Director → Organization; Supplier → Product approval
grid_state_created:
  i_have: Treatment rooms, provider availability, approved product inventory
  i_need: Patients, injectable providers (if contracting injectors through Grid)
profile_type: Organization profile (med spa type) → Clinic OS + Commerce workspace
objects_touched: Organization, Location, Room, Provider (relationships), ApprovedProduct, Inventory, ServiceMenu
money_events: SaaS subscription; product sales margin; room rental (Grid); provider booking fees
failure_states:
  - Medical director not verified → injectable services blocked
  - Supplier not approved → product listing blocked
  - Room listing without required equipment → booking blocked
legal_gate: State med spa regulations; medical director supervision requirements; product regulatory compliance (FDA); HIPAA (if PHI involved in visits)
implementation_state: BUILD-EXPAND — architecture defined; med spa product commerce path needed
next_routes: Booking → Treatment → Product_Sale → Inventory_Replenishment → Provider_Network_Expansion
```

---

# THE KLINIKOS EXECUTIVE COUNCIL (Permanent Operating Frame)

Every meaningful Klinikos decision is evaluated through all eight lenses simultaneously. This is not a meeting format — it is a decision standard applied to every engineering spec, product decision, business move, and architectural choice.

## Lens 1 — Product / Engineering
What should we build, fix, simplify, automate, refactor, test, document, or delete? What is the highest-leverage next action in the codebase? What creates the most architectural debt if deferred?

## Lens 2 — Security / Healthcare
What could expose data, create inappropriate authority, produce unsafe AI behavior, violate tenant boundaries, violate PHI rules, create misleading clinical or compliance claims, or violate patient safety? What is the minimum necessary data for this function?

## Lens 3 — Business / CFO
How does this generate revenue, reduce burn, increase margins, improve retention, or make Klinikos more fundable? What is the unit economics impact? What are the financial risks?

## Lens 4 — Growth / Sales
Who buys this? What pain does it solve? What proof do they need? What is the offer? What gets them to act? What does the $500 → $1,500 → $3,500 → SaaS progression look like for this buyer?

## Lens 5 — Competitive
What are competitors doing? Where are they vulnerable? What can Klinikos uniquely combine that they cannot? What is the defensible differentiation?

## Lens 6 — Operations
What can be automated? What requires an SOP? Who owns the next action? What is blocking execution? What is the next bottleneck after this one is cleared?

## Lens 7 — Skeptical Investor
What assumption are we making that could be wrong? What is hype versus demonstrated capability? What is the bear case? What kills this company if we are wrong about it?

## Lens 8 — Second Brain (Anti-Forgetting / Anti-Blind-Spot)
What decision should become durable Klinikos architecture or business knowledge rather than disappear into another conversation? What are we overlooking that could kill the company — or the overlooked move that could dramatically increase its value? The Second Brain's job is NOT to agree with us. Its job is to actively search for what we're missing.

**The Master Evaluation Question (apply to every meaningful decision):**

> Analyze this as Klinikos's engineering council, product leadership, security team, healthcare operations team, CFO/MBA team, sales team, and skeptical investor. Challenge assumptions rather than automatically agreeing. Identify defects, security and regulatory risks, architectural debt, unnecessary cost, automation opportunities, competitive advantages, and overlooked revenue. Rank actions by expected enterprise value versus cost, risk, and time. Preserve working architecture rather than rebuilding unnecessarily. Distinguish verified implementation from planned capability. End with the smallest set of actions that most increases revenue, product maturity, defensibility, and probability of reaching venture scale.

---

# CURRENT STATE vs. TARGET STATE

## What Is Live on Main (as of 2026-08-29)

| Domain | Status | Notes |
|---|---|---|
| Identity / Auth | On main | Universal entry router, verification flow |
| Experience Envelope | On main (PR #357 merged) | Machine-readable canon; Screen Experience Contracts schema live |
| Operating Network | On main (PR #357 merged) | Architecture laws; distribution model |
| Zumi Data Governance | On main (PR #357 merged) | AI processing policy — legal review required before PHI workflows |
| Grid (core) | On main | Trust, liquidity, transaction surface |
| Clinic OS | On main | System Health workspace, scheduling, staff handoff |
| Current Visit | On main (PRs #246, #247 merged) | Vitals, staff handoff, clinical change |
| EDU / Workforce | On main | Active build |
| Patient surface | On main | Path defined; not fully contracted per screen |
| Legal OS | On main | global-agreement.ts, AI service processing policy |
| Commerce / Financial OS | On main | grid-economics.ts authoritative fee policy |
| Design system | On main (partial) | PR #240 still draft |
| Living Home | On main | Reference-locked to Obsidian palette |

## Immediate Production Release Blockers

1. **Screen Experience Contracts** — 12 routes inventoried, 0 authored. Priority 1: `/`, `/grid/workspace`, `/clinic`, `/visit`, `/auth`.
2. **GitHub Actions CI** — Blocked by $0 Actions spending limit. Fix: raise spending limit in billing settings. Workflow YAML is correct; no code changes needed.
3. **Legal review** — `ai-service-processing-policy.ts` requires qualified legal/privacy counsel before PHI-adjacent Zumi workflows go live.
4. **PRs #249–252** — Each needs rebase onto current main + CI pass.
5. **PR #240** (Design system) — Needs rebase + CI pass.

## 6-Stage Reconciliation Program

**Stage A — Canon Reconciliation (IN PROGRESS)**
Build the decision ledger. Amend the actual Master Canon. Document inventory → extract unique decisions → merge into Master Canon → verify nothing lost → update references → retire duplicates. Rule: ONE MASTER CANON. Everything else becomes an implementation contract, evidence register, specialist reference, or retired artifact.

**Stage B — Route + Profile Registries**
Encode all exact user journeys as structured route registry entries (format above). Every Student, Placement, Injector, Clinic, Commerce, Expert, Patient, Professional, and Enterprise route. This prevents journey compression from erasing accepted lifecycle architecture.

**Stage C — Regression Laws / Tests**
Automated tests that make the following impossible to merge:
- Unverified professional publishing services
- EDU granting a license
- Resume text becoming verified credential
- Patients becoming public supply (PHI breach)
- Grid collapsing back to staffing only
- Three controls (Promotion, Entitlement, Authority) collapsing into one
- Context switch not triggering full recompute

**Stage D — Full-Stack Data Model Comparison**
Inspect current schema against canonical object model. Identify only the missing structures: Person/Profile/Resume/Placement/Preceptor/Provider/Commerce/Inventory/Expert. Do not rebuild what exists.

**Stage E — Experience Convergence**
Make all applications behave as one operating environment. Plain-language screens. "Simple above" enforced at every surface. Screen Experience Contracts authored and enforced.

**Stage F — Canon-Generated Ecosystem Map**
The final visual is generated from the reconciled architecture, not from conversation memory. The underlying engineering representation (ACTOR → IDENTITY → RELATIONSHIP → AUTHORITY → NEED → MATCH → AGREEMENT → WORK → EVIDENCE → OBLIGATION → MONEY → OUTCOME → REPUTATION → MEMORY → NEXT ACTION) generates each view. Whole-company universe, patient lifecycle, professional lifecycle, student/workforce, clinic, Grid marketplace, med-spa commerce, RCM/claims, enterprise, partner/integration, Zumi/OpenAI, security/trust, money, distribution/network effects, data/evidence.

---

# SCOPE CLASSIFICATION MASTER TABLE

| Capability | Scope | Stage |
|---|---|---|
| Identity, auth, verification | NOW | Stage A-E |
| Grid — Jobs, Services, Rooms, Appointment Slots | NOW | Stage A-E |
| Grid — Approved Products, Equipment, Expert Services | BUILD-EXPAND | Stage D-E |
| Grid — Referral Slots, Organization Capacity | LATER | Stage F |
| Clinic OS — scheduling, staff, system health | NOW | Stage A-E |
| Clinic OS — multi-location unified view | BUILD-EXPAND | Stage D-E |
| Clinic OS — MSO enterprise layer | LATER | Stage F |
| Current Visit — vitals, documentation, coding | NOW | Stage A-E |
| Current Visit — order transmission, result ingestion | BUILD-EXPAND | Stage D-E |
| Telemedicine — as mode within encounter | BUILD-EXPAND | Stage D-E |
| EDU — learner, program, course, simulation | NOW | Stage A-E |
| EDU — placement multi-party relationship | NOW | Stage A-E |
| EDU — CEU, continuing education, accreditation | BUILD-EXPAND | Stage D-E |
| Financial OS — billing readiness, superbill, charge capture | NOW | Stage A-E |
| Financial OS — full claim lifecycle, ERA, denial management | BUILD-EXPAND | Stage D-E |
| Clearinghouse integration | CONNECT | Stage D |
| Payer direct APIs | CONNECT | Stage D |
| Lab / imaging / pharmacy integration | CONNECT | Stage D-E |
| State licensing board credential verification | CONNECT | Stage B-C |
| OpenAI (Zumi general rail) | NOW (non-PHI) | Stage A-E |
| OpenAI (Zumi healthcare PHI rail) | LATER (legal gate) | Stage E-F |
| Quality / Expert Grid | BUILD-EXPAND | Stage D-E |
| Med spa product commerce | BUILD-EXPAND | Stage D-E |
| Injector-specific provider path | BUILD-EXPAND | Stage D-E |
| Patient longitudinal record | BUILD-EXPAND | Stage D-E |
| Network / referral relationships | BUILD-EXPAND | Stage D-E |
| Enterprise / MSO contracts | LATER | Stage F |
| Government program integration | LATER | Stage F |
| Predictive analytics | LATER | Stage F |
| Biometric identity | LATER | Stage F |
| Rebuilding clearinghouse infrastructure | NEVER BUILD | — |
| Rebuilding payer systems | NEVER BUILD | — |
| Rebuilding DEA / licensing board systems | NEVER BUILD | — |

---

*This document is the engineering-buildable expression of the Klinikos Universal Healthcare Universe. It is authored for the repo commit to `docs/superpowers/specs/2026-08-29-klinikos-master-engineering-blueprint.md` alongside the Universal Healthcare Universe + Company Constitution design spec already committed on the `docs/luxe-master-canon-reconciliation-20260829` branch.*

*Every decision in this document has been evaluated through the Klinikos Executive Council 8-lens framework. Every capability has been classified NOW / BUILD-EXPAND / LATER / PARTNER / CONNECT / NEVER BUILD. Every lifecycle has been encoded at full complexity. No journey has been compressed to four words.*

---

# CANON LAYER IMPLEMENTATION COVERAGE

Every layer in `src/lib/governance/canon-layer-registry.ts` terminates here in buildable
meaning. The registry is the machine-checkable index; this section is what an engineer
actually builds against.

The columns are deliberate. A layer that names no owner has nobody to build it. One with
no evidence cannot be proven to work. One with no money path is cost without return. One
with no risk control is an unbounded liability. One with no KPI cannot be measured, so its
failure would be invisible. `tests/canon-synchronization.test.ts` fails the build if any
layer loses one of them, which is what stops a later compression pass from quietly
deleting a requirement.

Terms in **bold** are the canonical anchors. They are load-bearing vocabulary, not
decoration: the same words appear in the Master Canon and the registry so a requirement
can be traced across all three without relying on prose that drifts.

## 1. Authority, anti-compression, truth and merge-forward

`governance-authority`

- **AUTHORITY AND ANTI-COMPRESSION CONTRACT**
- **Canon compression must never erase accepted architecture**

| | |
|---|---|
| Owners | executive-council, architecture |
| Builds into | authority-map, sync-gates, document-retirement |
| Proven by | git-history, canon-diff, verification-report |
| Money path | reduces-rework, protects-speed |
| Risk controls | no-parallel-authority, no-silent-deletion |
| Measured by | authority-conflicts, canon-drift-failures |

## 2. Five-plane ecosystem architecture

`five-planes`

- **PLANE A — HEALTHCARE UNIVERSE**
- **PLANE B — ECONOMIC & RESOURCE UNIVERSE**
- **PLANE C — LIFECYCLE / JOURNEY UNIVERSE**
- **PLANE D — KLINIKOS OPERATING INFRASTRUCTURE**
- **PLANE E — COMPANY COMPOUNDING SYSTEM**

| | |
|---|---|
| Owners | architecture, product |
| Builds into | ecosystem-graph, generated-views, domain-contracts |
| Proven by | graph-tests, route-tests |
| Money path | cross-sell, network-effects |
| Risk controls | no-module-silos |
| Measured by | cross-engine-journeys, connected-node-coverage |

## 3. Actors, organizations, rails, assets and sectors

`healthcare-universe`

- **HEALTHCARE UNIVERSE TAXONOMY**
- **sector strategy state**

| | |
|---|---|
| Owners | product, partnerships |
| Builds into | actor-registry, organization-types, sector-policy |
| Proven by | schema-coverage, integration-register |
| Money path | market-expansion, enterprise-contracts |
| Risk controls | scope-classification, regulated-boundaries |
| Measured by | sector-coverage, activated-sectors |

## 4. Universal economic/resource universe and Grid

`resource-universe-grid`

- **ECONOMIC & RESOURCE UNIVERSE**
- **I NEED / I HAVE**
- **UNIVERSAL GRID TRANSACTION LIFECYCLE**

| | |
|---|---|
| Owners | grid, financial-os |
| Builds into | resource-kernel, demand-kernel, eligibility-engine, transaction-state-machine |
| Proven by | grid-tests, transaction-evidence |
| Money path | subscriptions, lawful-transaction-economics, organization-tools |
| Risk controls | eligibility-before-ranking, marketplace-safety, regulated-fee-gates |
| Measured by | liquidity, match-rate, time-to-fill, fulfillment-rate |

## 5. Universal composable lifecycle grammar

`lifecycle-grammar`

- **CANONICAL LIFECYCLE GRAMMAR**
- **DISCOVER → IDENTIFY → EXPRESS INTENT**

| | |
|---|---|
| Owners | product, architecture |
| Builds into | route-registry, state-machines, unfinished-work |
| Proven by | end-to-end-tests, route-coverage |
| Money path | conversion, retention |
| Risk controls | no-happy-path-only-design |
| Measured by | journey-completion, dropoff-by-state |

## 6. Identity, claims, verification, relationships and authority

`identity-trust-authority`

- **IDENTITY → CLAIM → EVIDENCE → VERIFICATION → RELATIONSHIP → ELIGIBILITY → ENTITLEMENT → AUTHORITY**
- **context switch is a security event**

| | |
|---|---|
| Owners | identity-trust, security |
| Builds into | person-graph, claim-model, verification-model, authority-engine |
| Proven by | negative-authorization-tests, audit-events |
| Money path | trusted-marketplace, enterprise-readiness |
| Risk controls | least-privilege, purpose-of-use, progressive-verification |
| Measured by | verification-conversion, authorization-denials, fraud-rate |

## 7. Living Home, Experience Engine and Screen Contracts

`experience-living-home`

- **LIVING HOME + EXPERIENCE ENGINE**
- **SCREEN CONTRACT**

| | |
|---|---|
| Owners | experience, frontend |
| Builds into | active-experience-envelope, screen-contracts, context-switch |
| Proven by | accessibility-tests, responsive-tests, route-tests |
| Money path | activation, retention, upgrade-conversion |
| Risk controls | minimum-necessary-projection, no-brochure-first |
| Measured by | time-to-first-value, task-completion, return-rate |

## 8. Professional profile, resume evidence and recruiting

`profile-resume-recruiting`

- **RECRUITER / RESUME EVIDENCE PATH**
- **resume → structured career profile**

| | |
|---|---|
| Owners | identity-trust, grid, edu |
| Builds into | resume-parser, career-profile, claim-provenance, matching-inputs |
| Proven by | resume-source, human-confirmation, verification-records |
| Money path | recruiting, grid-pro, employer-tools |
| Risk controls | no-fabricated-credentials, claim-vs-verified-separation |
| Measured by | profile-completion, qualified-match-rate |

## 9. EDU, student, competency, placement and workforce transition

`edu-student-placement`

- **STUDENT → TRAINING → COMPETENCY**
- **PLACEMENT RELATIONSHIP OBJECT**

| | |
|---|---|
| Owners | edu, grid, identity-trust |
| Builds into | programs, cohorts, simulation, competency-evidence, placement-object |
| Proven by | rubrics, human-review, hours-evidence |
| Money path | edu-plus, courses, institution-contracts, workforce-contracts |
| Risk controls | synthetic-data-first, external-credential-separation |
| Measured by | completion, placement-rate, time-to-work |

## 10. Professional progression and injector/aesthetics path

`professional-injector`

- **RN → INJECTOR / AESTHETICS GOVERNED PATH**
- **jurisdiction / scope / supervision / facility / malpractice gates**

| | |
|---|---|
| Owners | grid, identity-trust, clinical-safety |
| Builds into | credential-gates, service-eligibility, availability, contractor-relationships |
| Proven by | license-source, malpractice-evidence, supervision-evidence |
| Money path | professional-tools, lawful-booking-economics |
| Risk controls | scope-of-practice, jurisdiction, facility-policy |
| Measured by | verified-professionals, eligible-services, safe-fulfillment |

## 11. Clinic OS and operating overlay

`clinic-os`

- **CLINIC OS — OPERATING LAYER**
- **ecosystem sensor**

| | |
|---|---|
| Owners | clinic-os, operations |
| Builds into | organization, locations, staff, work-queues, capacity, bridges |
| Proven by | workflow-evidence, owner-outcomes |
| Money path | clinic-saas, implementation, expansion |
| Risk controls | progressive-migration, tenant-separation |
| Measured by | activation, workflow-cycle-time, revenue-recovery |

## 12. Current Visit clinical convergence

`current-visit`

- **CURRENT VISIT — CLINICAL CONVERGENCE**
- **INITIAL → PREVIOUS → TODAY**

| | |
|---|---|
| Owners | care, clinical |
| Builds into | current-visit, staff-handoff, clinical-change, body-map, scribe-review |
| Proven by | signed-records, clinical-provenance, audit |
| Money path | clinic-retention, billing-readiness, software-consolidation |
| Risk controls | human-signature, no-invented-clinical-truth, versioning |
| Measured by | documentation-time, visit-close-rate, billing-ready-rate |

## 13. Patient, caregiver and longitudinal care

`patient-caregiver`

- **PATIENT / CAREGIVER JOURNEY**
- **patient identity remains private**

| | |
|---|---|
| Owners | care, patient-experience |
| Builds into | patient-portal, proxy-access, intake, follow-up |
| Proven by | consent, relationship-evidence, release-audit |
| Money path | clinic-value, patient-payments, retention |
| Risk controls | privacy, proxy-scope, minimum-necessary |
| Measured by | intake-completion, follow-up-completion, no-show-rate |

## 14. Cross-organizational healthcare workflows

`cross-org`

- **CROSS-ORGANIZATIONAL HEALTHCARE LIFECYCLES**
- **closed-loop referral**

| | |
|---|---|
| Owners | network, integration-hub, security |
| Builds into | referrals, consults, orders-results, cross-org-relationship |
| Proven by | transmission-evidence, acceptance, review, closure |
| Money path | network-tools, enterprise, reduced-leakage |
| Risk controls | purpose-of-use, consent, data-minimization |
| Measured by | closed-loop-rate, referral-completion, result-review-time |

## 15. Med Spa clinic + provider network + commerce/resource proof case

`medspa-commerce`

- **MED SPA = CLINIC + PROVIDER NETWORK + COMMERCE / RESOURCE NODE**
- **regulated inventory boundary**

| | |
|---|---|
| Owners | clinic-os, grid, commerce |
| Builds into | lead-crm, services, rooms-chairs, inventory, bookings, payouts |
| Proven by | consent, lot-expiration, fulfillment-evidence |
| Money path | cash-pay, memberships, lawful-commerce, space-capacity |
| Risk controls | scope-of-practice, regulated-inventory, adverse-event-workflow |
| Measured by | lead-to-booking, rebooking, chair-utilization, inventory-waste |

## 16. Quality Guardian, Rules & Evidence and Expert Grid

`quality-expert-grid`

- **QUALITY GUARDIAN → EXPERT GRID**
- **minimum-necessary / time-limited expert access**

| | |
|---|---|
| Owners | quality, grid, zumi |
| Builds into | rules-engine, quality-signals, expert-engagement, evidence-packet |
| Proven by | rule-provenance, human-review, remediation-evidence |
| Money path | expert-services, quality-subscription, revenue-protection |
| Risk controls | human-judgment, minimum-necessary, no-automatic-compliance-claims |
| Measured by | issues-detected, time-to-remediate, repeat-issue-rate |

## 17. Financial OS, billing, claims and revenue integrity

`rcm-financial`

- **REVENUE INTEGRITY STATE MACHINE**
- **PERFORMED → CHARGE EXPECTED → CHARGE PRESENT → CLAIM READY**

| | |
|---|---|
| Owners | financial-os, rcm |
| Builds into | billing-readiness, claims, denials, remittance, reconciliation |
| Proven by | claim-events, payment-evidence, reconciliation |
| Money path | revenue-os, recovered-revenue, implementation |
| Risk controls | financial-state-separation, no-fake-claim-status |
| Measured by | clean-claim-rate, days-to-payment, reconciliation-rate, leakage |

## 18. Payments, obligations, payout, settlement and entitlements

`payments-settlement`

- **PRICE ≠ QUOTE ≠ CHARGE ≠ INVOICE ≠ PAYMENT**
- **payment-driven provisioning**

| | |
|---|---|
| Owners | financial-os, commerce |
| Builds into | offer-registry, payment-evidence, entitlements, payout-settlement |
| Proven by | webhook-evidence, ledger, reconciliation |
| Money path | subscriptions, implementation, usage, lawful-fees |
| Risk controls | server-owned-price, idempotency, regulated-payments |
| Measured by | paid-conversion, failed-payment, settlement-lag, gross-margin |

## 19. Zumi and OpenAI governed intelligence

`zumi-openai`

- **OPENAI / ZUMI GOVERNED INTELLIGENCE**
- **OpenAI intelligence, Klinikos authority**

| | |
|---|---|
| Owners | zumi, ai-platform |
| Builds into | provider-adapter, policy-gate, tool-authority, provenance |
| Proven by | model-telemetry, tool-audit, partner-evidence-register |
| Money path | zumi-plus, automation, usage-margin |
| Risk controls | human-approval, phi-eligibility, provider-abstraction |
| Measured by | task-success, cost-per-task, human-override, latency |

## 20. Data, evidence, memory, knowledge and analytics

`memory-data-evidence`

- **DATA / EVIDENCE / MEMORY / ANALYTICS**
- **provenance**

| | |
|---|---|
| Owners | data, analytics, zumi |
| Builds into | evidence-model, memory-store, analytics-events, knowledge-provenance |
| Proven by | source, effective-date, version, authority-class |
| Money path | insights, retention, enterprise-analytics |
| Risk controls | data-classification, retention, supersession |
| Measured by | evidence-completeness, analytics-coverage, stale-memory-rate |

## 21. Integration Hub, partners and external rails

`integrations-partners`

- **CONNECT → ABSTRACT → CONTROL → INTERNALIZE → REPLACE**
- **PARTNER / EXTERNAL RAILS**

| | |
|---|---|
| Owners | integration-hub, partnerships |
| Builds into | adapters, webhooks, reconciliation-work, connection-state |
| Proven by | sandbox, uat, production-verification, vendor-contract |
| Money path | premium-connections, enterprise, software-consolidation |
| Risk controls | truthful-integration-status, vendor-risk, failure-reconciliation |
| Measured by | connection-success, sync-latency, error-backlog |

## 22. Security, privacy, legal, confidentiality and trust

`security-privacy-legal`

- **SECURITY / PRIVACY / LEGAL / TRUST DEFENSE STACK**
- **browser = experience; server = authority**

| | |
|---|---|
| Owners | security, privacy, legal |
| Builds into | authn, authz, audit, encryption, secrets, incident-response, agreements |
| Proven by | security-tests, audit-log, vendor-evidence, counsel-review |
| Money path | enterprise-trust, risk-reduction |
| Risk controls | least-privilege, minimum-necessary, no-unsupported-compliance-claim |
| Measured by | security-findings, time-to-remediate, audit-coverage |

## 23. Enterprise, multi-location, payer/employer/network operations

`enterprise-network`

- **ENTERPRISE / MULTI-LOCATION / NETWORK**
- **delegated administration**

| | |
|---|---|
| Owners | enterprise, network |
| Builds into | org-hierarchy, sso, delegated-admin, policy, reporting |
| Proven by | tenant-boundary-tests, contract-evidence, procurement-evidence |
| Money path | enterprise-acv, network-expansion |
| Risk controls | tenant-isolation, policy-inheritance, procurement-gates |
| Measured by | locations-per-org, enterprise-acv, net-revenue-retention |

## 24. Research, public health and government

`research-public-health`

- **RESEARCH / PUBLIC HEALTH / GOVERNMENT**
- **government procurement**

| | |
|---|---|
| Owners | enterprise, government, data-governance |
| Builds into | purpose-separation, institutional-reporting, procurement |
| Proven by | contract, approval, data-use-evidence |
| Money path | government-contracts, institutional-contracts |
| Risk controls | research-purpose, data-governance, legal-review |
| Measured by | contracts-won, reporting-compliance, program-outcomes |

## 25. Pharmacy, devices, DME and remote care

`pharmacy-device-remote`

- **PHARMACY / DEVICES / REMOTE CARE**
- **CONNECT external authoritative rails**

| | |
|---|---|
| Owners | care, integration-hub |
| Builds into | orders, device-observations, remote-care, external-adapters |
| Proven by | order-evidence, device-source, external-acknowledgement |
| Money path | clinic-value, premium-integrations |
| Risk controls | clinical-authority, external-truth, device-security |
| Measured by | order-completion, remote-monitoring-adherence |

## 26. Brand, market thesis and positioning

`brand-market-positioning`

- **MARKET / BRAND / CATEGORY POSITIONING**
- **unfinished work falls between systems**

| | |
|---|---|
| Owners | ceo, marketing, product |
| Builds into | website, messaging, demo, proof |
| Proven by | customer-research, conversion-data |
| Money path | demand-generation, sales |
| Risk controls | no-fake-claims, protect-crown-jewels |
| Measured by | qualified-traffic, demo-rate, message-comprehension |

## 27. Market intelligence, competition and ICP

`market-competition-icp`

- **MARKET INTELLIGENCE / COMPETITION / ICP**
- **initiative gate**

| | |
|---|---|
| Owners | strategy, sales, marketing |
| Builds into | research-register, segment-priority, buyer-map |
| Proven by | dated-research, interviews, pipeline-data |
| Money path | higher-win-rate, lower-cac |
| Risk controls | dated-evidence, scenario-labeling |
| Measured by | win-rate, sales-cycle, cac |

## 28. Pricing, offers, monetization and unit economics

`pricing-monetization`

- **PRICING / MONETIZATION / UNIT ECONOMICS**
- **Offer Registry**

| | |
|---|---|
| Owners | cfo, revenue, product |
| Builds into | offer-registry, entitlements, usage-ledger, margin-reporting |
| Proven by | code-owned-prices, payment-evidence, cohort-margin |
| Money path | subscription, implementation, usage, services, enterprise |
| Risk controls | no-universal-clinical-fee, legal-review, server-owned-price |
| Measured by | gross-margin, arpu, attach-rate, payback |

## 29. Sales, pipeline and revenue conversion

`sales-revenue`

- **SALES / PIPELINE / REVENUE SYSTEM**
- **OUTREACH ≠ PIPELINE ≠ CONTRACT ≠ CASH**

| | |
|---|---|
| Owners | cro, sales |
| Builds into | crm, stages, follow-up, proposal, payment |
| Proven by | crm-stage, signed-agreement, payment |
| Money path | new-arr, implementation-revenue |
| Risk controls | truthful-stage, no-fake-traction |
| Measured by | pipeline, win-rate, sales-cycle, cash-collected |

## 30. Acquisition, distribution, attribution and content

`acquisition-distribution`

- **ACQUISITION / DISTRIBUTION / ATTRIBUTION**
- **Grid is Klinikos’s primary network-acquisition wedge**

| | |
|---|---|
| Owners | growth, marketing, grid |
| Builds into | utm-attribution, public-grid, seo, partnership-distribution |
| Proven by | analytics, lead-source, campaign-cost |
| Money path | lower-cac, network-growth |
| Risk controls | truthful-content, privacy-safe-public-discovery |
| Measured by | cac, qualified-leads, organic-share, referral-rate |

## 31. Onboarding, activation, customer success, retention and expansion

`onboarding-retention-cs`

- **ONBOARDING / ACTIVATION / RETENTION / CUSTOMER SUCCESS**
- **Day 0 / Day 1 / Day 3 / Day 7 / Day 14**

| | |
|---|---|
| Owners | customer-success, product-growth |
| Builds into | activation-events, health-score, success-plan, expansion-triggers |
| Proven by | usage, outcomes, support-history |
| Money path | retention, nrr, expansion |
| Risk controls | no-dark-patterns, outcome-truth |
| Measured by | ttfv, activation, logo-retention, nrr |

## 32. Automation, operations and human approval

`automation-ops`

- **ELIMINATE → SIMPLIFY → STANDARDIZE → AUTOMATE → DELEGATE → MEASURE**
- **human approval**

| | |
|---|---|
| Owners | coo, zumi, engineering |
| Builds into | workflows, agents, approval-gates, runbooks |
| Proven by | automation-audit, human-approval, outcome |
| Money path | lower-cogs, higher-capacity |
| Risk controls | consequential-action-gates, rollback |
| Measured by | hours-saved, automation-success, exception-rate |

## 33. Capital, funding, business credit and investor readiness

`capital-credit-investor`

- **CAPITAL / FUNDING / BUSINESS CREDIT / INVESTOR READINESS**
- **customer-funded implementation**

| | |
|---|---|
| Owners | cfo, ceo, capital |
| Builds into | capital-register, data-room, bankability, application-evidence |
| Proven by | actual-applications, bank-records, signed-terms |
| Money path | customer-capital, non-dilutive, debt, equity |
| Risk controls | no-fake-application-facts, cheapest-capital-first |
| Measured by | runway, capital-cost, funding-probability |

## 34. Financial model, cash control and company economics

`financial-model-cfo`

- **CFO / FINANCIAL MODEL / CASH CONTROL**
- **base / upside / downside**

| | |
|---|---|
| Owners | cfo, finance |
| Builds into | 13-week-cash, pnl, unit-economics, scenario-model |
| Proven by | bank, payments, ledger, contracts |
| Money path | cash-discipline, margin, runway |
| Risk controls | actual-vs-scenario, cash-reconciliation |
| Measured by | runway, burn, gross-margin, cash-collected |

## 35. Defensibility, network effects and switching value

`defensibility-network-effects`

- **DEFENSIBILITY / NETWORK EFFECTS**
- **USER VALUE → BEHAVIOR CHANGE → EVIDENCE → ECONOMIC VALUE**

| | |
|---|---|
| Owners | strategy, product, network |
| Builds into | reputation, evidence-history, relationships, workflow-depth, distribution |
| Proven by | cohort-retention, network-density, workflow-outcomes |
| Money path | retention, pricing-power, enterprise-value |
| Risk controls | no-fake-moat, data-rights |
| Measured by | nrr, multi-product-attach, network-density, switching-intent |

## 36. Scale and unicorn-value tests

`scale-unicorn`

- **SCALE / UNICORN TEST**
- **10 / 100 / 1,000 / 10,000 customers/users / 1M users**

| | |
|---|---|
| Owners | executive-council, architecture |
| Builds into | capacity-model, org-design, platform-reliability, market-expansion |
| Proven by | load-tests, financial-model, retention, market-data |
| Money path | enterprise-value, scale-economics |
| Risk controls | premature-scale, capital-efficiency |
| Measured by | arr, gross-margin, nrr, uptime, market-penetration |

## 37. Executive dashboard, priorities and operating cadence

`company-dashboard-cadence`

- **EXECUTIVE DASHBOARD / OPERATING CADENCE**
- **OBSERVE → RESEARCH → VALIDATE → PRIORITIZE**

| | |
|---|---|
| Owners | executive-council, coo |
| Builds into | dashboard, registers, owners, cadence |
| Proven by | source-linked-kpis, decision-log |
| Money path | focus, execution-speed |
| Risk controls | no-100-equal-priorities, owner-accountability |
| Measured by | priority-throughput, blocked-work-age, cash-impact |

## 38. Production, release, SRE, DevSecOps and resilience

`production-release-devsecops`

- **PRODUCTION / RELEASE / DEVSECOPS / RESILIENCE**
- **backup / restore / disaster recovery**

| | |
|---|---|
| Owners | engineering, security, sre |
| Builds into | ci, release-gates, observability, backup-restore, incident-response |
| Proven by | exact-head-ci, deployment, runtime, restore-test |
| Money path | reliability, enterprise-readiness |
| Risk controls | rollback, feature-flags, dependency-security |
| Measured by | deployment-frequency, change-failure-rate, mttr, uptime |

## 39. External service economics and capital-efficient provisioning

`external-service-economics`

- **EXTERNAL-SERVICE ECONOMICS / COST-TO-SERVE**
- **platform infrastructure / customer-owned connections / activate-after-sale**

| | |
|---|---|
| Owners | cfo, integration-hub, product |
| Builds into | vendor-classification, usage-metering, provisioning-state |
| Proven by | vendor-cost, usage-ledger, customer-demand |
| Money path | margin, customer-funded-usage, reduced-burn |
| Risk controls | no-premature-provisioning, vendor-lock-in-review |
| Measured by | cost-to-serve, gross-margin, unused-vendor-spend |

## 40. Support, implementation and service operations

`support-service-operations`

- **SUPPORT / IMPLEMENTATION / SERVICE OPERATIONS**
- **support escalation**

| | |
|---|---|
| Owners | customer-success, implementation, operations |
| Builds into | onboarding-project, support-case, sla, knowledge |
| Proven by | case-history, resolution, customer-outcome |
| Money path | implementation-revenue, retention, services |
| Risk controls | scope-control, minimum-necessary-access |
| Measured by | time-to-resolution, implementation-cycle, csat |

## 41. Enterprise procurement, trust and assurance

`enterprise-procurement-trust`

- **ENTERPRISE PROCUREMENT / TRUST / ASSURANCE**
- **security questionnaire / BAA / DPA / vendor review**

| | |
|---|---|
| Owners | security, enterprise-sales, legal |
| Builds into | trust-center, evidence-room, questionnaires, contracting |
| Proven by | control-evidence, vendor-evidence, runtime-evidence |
| Money path | enterprise-sales, larger-acv |
| Risk controls | no-unsupported-certification, contract-scope |
| Measured by | procurement-cycle, security-review-pass-rate, enterprise-win-rate |

## 42. Marketplace safety, fraud, incidents and disputes

`marketplace-safety-disputes`

- **MARKETPLACE SAFETY / FRAUD / DISPUTES**
- **trust and anti-gaming**

| | |
|---|---|
| Owners | grid, trust-safety, legal |
| Builds into | reporting, disputes, suspension, risk-scoring, appeals |
| Proven by | incident-evidence, decision-provenance |
| Money path | loss-prevention, marketplace-trust |
| Risk controls | anti-fraud, appeal-path, no-pay-to-eligibility |
| Measured by | incident-rate, fraud-loss, resolution-time |

## 43. API, developer and partner ecosystem

`api-developer-ecosystem`

- **API / DEVELOPER / PARTNER ECOSYSTEM**
- **versioned contracts**

| | |
|---|---|
| Owners | platform, integration-hub |
| Builds into | api-contracts, webhooks, partner-auth, developer-docs |
| Proven by | contract-tests, integration-tests, version-history |
| Money path | premium-integrations, ecosystem-distribution |
| Risk controls | scoped-auth, rate-limits, data-minimization |
| Measured by | api-adoption, integration-time, error-rate |
