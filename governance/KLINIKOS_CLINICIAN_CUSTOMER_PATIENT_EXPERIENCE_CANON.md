# KLINIKOS Clinician, Customer & Patient Experience Canon

Status: SOURCE-LOCKED EXPERIENCE AUTHORITY
Date: 2026-08-25

## 1. Purpose

This canon preserves the actual operating intent expressed through clinician/professional feedback and converts it into product acceptance requirements. It also defines the corresponding customer and patient experience so the final platform remains simple even as the backend becomes extremely broad.

The central clinical instruction is:

> **The physician should experience a medical visit, not a software architecture.**

The central staff instruction is:

> **Intake must be fast, accurate and appropriate to the staff member's actual role.**

The central patient instruction is:

> **The patient should understand what they need to do next without learning healthcare software.**

The central customer/owner instruction is:

> **The organization should be able to see what needs attention, who owns it, what is blocked, where money/capacity may be exposed, and what Klinikos can handle.**

---

## 2. Provider experience

The provider experience must be one primary continuous Current Visit, competitive in practical usability with mature ambulatory systems without cloning them.

Target experience:

`PATIENT SNAPSHOT → WHAT CHANGED → STAFF HANDOFF → TODAY → CLINICAL → ASSESSMENT & PLAN → ORDERS & RESULTS → DOCUMENTATION & CODING → CLOSE VISIT`

Important information should stay immediately available instead of forcing the provider to repeatedly leave today's encounter.

### Patient Snapshot

Keep appropriate context "up top" or one interaction away:

- patient identity
- demographics
- photo where appropriate
- case/visit type
- accident/No-Fault context
- location
- provider
- allergies
- current medications
- active problems
- important alerts
- past medical history
- past surgical history
- prior hospitalizations
- prior diagnoses
- prior procedures
- prior ICD/CPT context where useful
- relevant prior encounters
- recent/relevant labs
- relevant imaging
- immunization/preventive information where appropriate
- important directives/documents
- meaningful change since prior visit
- quality-measure context where applicable and validated

Do not convert this into a giant static demographic panel. Rank by relevance and allow progressive disclosure.

### Current encounter

Support:

- chief complaint
- HPI / interval history
- current symptoms
- severity
- laterality
- review of systems
- vitals
- detailed physical examination
- structured findings
- assessment
- plan
- procedures performed
- orders
- referrals
- treatment plan
- follow-up instructions

### Close Visit

Close Visit should not merely show a Sign button. It should surface truthful unresolved work, for example:

- incomplete required documentation
- AI-derived text not reviewed
- coding candidates not reviewed
- unfinished orders
- results requiring acknowledgment
- referrals/follow-up not closed
- No-Fault/case timing issues
- financial/revenue exceptions requiring review

The provider remains final clinical authority for professional decisions/signature.

---

## 3. MA / LPN / RN / staff experience

Do not give intake staff the physician's full workspace.

Support fast intake and handoff:

- reason for visit
- change since last visit
- vitals
- medication reconciliation
- allergy reconciliation
- symptom updates
- BodyMap updates
- delegated questionnaires
- screening/forms
- delegated point-of-care work
- document readiness
- unresolved questions
- relevant handoff notes

Professional scope must be modeled. MA, LPN and RN are not interchangeable authority classes.

The provider should not re-enter work already completed by staff.

---

## 4. No-Fault / injury workflow

No-Fault cannot be reduced to a generic SOAP note.

Model:

- accident date
- accident mechanism
- ER/hospital treatment
- initial baseline
- initial symptoms
- work limitations
- ADL limitations
- functional impairment
- pain location
- pain severity
- laterality
- previous treatment
- surgery
- hospitalization
- therapy progression
- procedure progression
- imaging progression
- related psychological/neurological symptoms where clinically documented
- work status
- longitudinal comparison

### Initial reusable template families

The clinical composition system must be capable of producing at least these starter families without creating separate giant cloned forms:

- initial motor-vehicle-accident assessment
- cervical/neck injury
- thoracic/lumbar/back pain
- shoulder injury
- knee injury
- hip injury
- ankle/foot injury
- headache/dizziness
- upper-extremity/hand symptoms
- fracture/dislocation/post-hospital
- EMG/neurological follow-up
- pain-management/procedure visit
- PT/rehabilitation follow-up
- anxiety/depression/psychological accident-related follow-up
- functional impairment
- appropriate right/left/bilateral variants

Reusable components should include:

- HPI blocks
- ROS sections
- examination components
- BodyMap components
- functional-status questions
- procedure documentation
- assessment/plan blocks
- specialty components

This becomes a versioned clinical composition engine, not customer forks.

---

## 5. Clinical Change and BodyMap

The provider should not need to reread old notes to understand progression.

Support structured:

`INITIAL → PREVIOUS → TODAY`

Examples of meaningful deltas:

- pain change
- ROM change
- body-region change
- new symptom
- resolved symptom only when supported
- imaging arrived
- PT visits progressed
- ADLs changed
- work status changed
- medication changed
- procedure response

AI may explain these deltas. It may not invent them.

BodyMap must be immutable/versioned by encounter. Store body region, laterality, finding/symptom, severity, functional impact, annotations, source, author, encounter, timestamp and amendment/resolution evidence.

---

## 6. Labs, imaging, EMG and consultations

Clinical users requested cross-specialty continuity rather than document chasing.

Support:

- orders
- external transmission status
- collection/performance
- result/report
- impression
- source organization/provider
- review status
- follow-up requirement
- patient notification status where appropriate

Specific use cases include labs, imaging/radiology, EMG/neurodiagnostic testing, specialty consultation reports, pain management, psychiatry, physical therapy and orthopedics.

External organization remains authoritative for its result/report.

---

## 7. Procedures and injections

Support structured procedure evidence for relevant specialties, including injections, shockwave, Botox and other configured procedures.

Potential fields:

- procedure
- indication/rationale
- body location
- laterality
- medication/product
- dose/quantity
- lot/expiration where applicable
- technique
- outcome
- instructions
- supporting documentation
- coding candidates/evidence
- provider signature

Billing must not fabricate clinical justification.

---

## 8. Telemedicine and ambient documentation

Telemedicine is an encounter mode, not another chart.

`APPOINTMENT → READINESS/CONSENT → VIDEO → SAME CURRENT VISIT → DOCUMENTATION → ORDERS → CODING → FOLLOW-UP → CLOSE`

Ambient/dictation target:

`CONSENT → AUDIO/DICTATION → TRANSCRIPT → STRUCTURED EVIDENCE → DRAFT NOTE → MISSING INFORMATION → CODING CANDIDATES → PROVIDER REVIEW → SIGNATURE`

AI must not invent exam findings, diagnoses, laterality, orders, results-reviewed status or final codes.

---

## 9. Customer / owner experience

The organization should increasingly experience Klinikos as a digital operating team.

The owner should be able to ask:

- What needs attention today?
- Who owns it?
- Which patients are not ready?
- Which referrals/results are unfinished?
- Where has legitimate revenue progression stopped?
- Which leads need follow-up?
- Which rooms/provider time are unused?
- Which software/vendors are we paying for that Klinikos can replace or abstract?
- Which Grid opportunities exist?
- What did Zumi handle automatically?
- What requires my approval?

Owner surfaces should emphasize outcomes, exceptions and next actions rather than module counts.

---

## 10. Patient experience

Primary patient question:

> **What do I need to do next?**

Patient interface should support, where applicable:

- next appointment
- appointment request
- intake/forms
- insurance/document upload
- consents
- telehealth
- instructions
- secure messages
- released results
- released records
- balance/payment
- proxy/caregiver
- record request
- reusable intake
- Health Passport

### Patient design rules

- mobile-first for common tasks
- plain language first
- professional detail optional
- never expose raw backend status strings
- no unnecessary repeated questions
- clear waiting/blocked/review states
- released clinical data only according to authorization/release rules
- never expose public patient identity through Grid

---

## 11. Plain-English law

For every user-facing state answer:

1. What is happening?
2. Why does it matter?
3. What can the user do?
4. What happens next?

Examples:

- `Insurance approval is still needed.`
- `This referral still needs follow-up.`
- `This result is waiting for provider review.`
- `Payment is still being verified.`
- `There is not enough structured information yet to show what changed.`

Expert terminology may appear in expandable detail.

---

## 12. Acceptance test

A clinical/customer/patient capability is not complete until:

- the right persona can find it;
- the persona understands it without backend jargon;
- the correct authority controls it;
- real persisted evidence backs the state;
- mobile/desktop/accessibility states work;
- loading/empty/partial/blocked/error/success are intentional;
- audit/provenance exists where consequential;
- Zumi can understand and route it where authorized;
- the next useful action is obvious.

The deepest design principle remains:

> **Provider: one visit. Staff: one handoff. Patient: one next action. Biller: one exception queue. Owner: one operating picture. Zumi: one authorized context. Engineering: many disciplined engines underneath.**
