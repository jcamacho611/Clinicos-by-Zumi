# KLINIKOS — CLINIC OS CANON

Version: `2026-08-16.1`
Status: `AUTHORITATIVE SPECIALIST CANON`

## 1. Definition

**Clinic OS is the governed operating engine for healthcare organizations inside Klinikos.** It coordinates people, patients/clients, appointments, work, documentation, care operations, revenue readiness, resources, follow-up, and connected network activity.

Clinic OS is broader than an EHR screen and narrower than the whole Klinikos ecosystem.

## 2. Core operational domains

Depending on actual implementation and entitlement, Clinic OS may coordinate:

- organization, location, user, and role setup;
- patient identity, intake, consent, portal, and record-release boundaries;
- scheduling, appointments, capacity, and follow-up;
- encounters and governed documentation;
- forms, documents, signatures, and version/audit history;
- tasks, escalations, care teams, referrals, and handoffs;
- labs, imaging, medications, inventory, and remote monitoring workflows;
- billing, coding, claims readiness, balances, and revenue recovery;
- cases, quality, compliance readiness, and operational insights;
- Grid demand/supply and network routes where authorized.

The presence of an internal workflow does not prove an external lab, payer, clearinghouse, eRx, fax, payment, or messaging connection.

## 3. Operating model

Clinic OS is task- and outcome-first:

`SIGNAL / NEED → OWNER → AUTHORIZED WORK → EVIDENCE → RESOLUTION → AUDIT → NEXT ACTION`

Insights and Zumi may help identify or explain work. Deterministic repositories and authorized humans own clinical, financial, release, credential, and safety state.

## 4. Grid connection

Clinic OS may detect staffing gaps, unused room/capacity, schedule openings, service needs, referral gaps, or unavailable capability. Where policy permits, these become Grid demand or resources through adapters/events rather than duplicate records.

Grid outcomes return as real assignment, booking, follow-up, fulfillment, issue, obligation, and audit state.

## 5. Role views

Owner/administrator, front desk, provider, clinical staff, biller, case manager, quality, and viewer experiences must surface only actions their role and active context can use. UI visibility is not authorization.

## 6. Clinical and record truth

- AI does not diagnose, prescribe, sign, release, or establish clinical authority.
- Draft, reviewed, signed, released, corrected, and addendum states remain distinct.
- Patient visibility is explicitly governed.
- Retention, legal hold, export, correction, archive, and deletion require policy.
- External completion is never inferred from an internal status alone.

## 7. Current truth

Repository evidence supports real PostgreSQL-backed auth/tenant workflows, patients, appointments, encounters, documents/forms, tasks/follow-up, internal lab/imaging/medication readiness, referrals/network, billing/coding readiness, cases, and operational journeys. Specialty breadth and operator UX remain partial. Major regulated external rails remain pending connection.

## 8. Acceptance

Clinic OS capabilities are sellable only at the exact outcome level that works today. The repository does not establish certified-EHR status, a legal HIPAA compliance program, production PHI approval, or live third-party clinical networks.
