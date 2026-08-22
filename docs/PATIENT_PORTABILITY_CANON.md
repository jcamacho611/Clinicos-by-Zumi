# Klinikos Patient Portability Canon

Status: `SPECIALIST PRODUCT / SAFETY LAW`
Updated: 2026-08-18 America/New_York

## Product thesis

Patient portability is a first-class Klinikos capability, not an afterthought and not a data-lock-in mechanism.

The long-term product goal is:

`PATIENT IDENTITY → REQUEST / SELF-ACCESS → VERIFIED SCOPE → RELEASE / EXPORT EVIDENCE → PORTABLE PACKAGE → PATIENT OR AUTHORIZED DESTINATION → IMPORT / MATCH REVIEW → PROVENANCE → CONTINUED CARE`

This must remain distinct from ordinary clinic-to-clinic Network access. A Network `RecordRequest` and `AccessGrant` authorize bounded cross-organization read access under Klinikos policy; they do not automatically satisfy a patient's own records-access request or create a downloadable copy.

## Current repository slice

The first native portability slice is deliberately bounded:

- authenticated patient-portal identity only;
- no browser-supplied patient ID or organization ID;
- machine-readable JSON snapshot of information already available through the patient portal;
- attachment response is `private, no-store` and `nosniff`;
- export event is written to the existing patient audit trail;
- the file explicitly says it is **not** the complete medical record and **not** the complete designated record set;
- the snapshot does not expose the patient's portal access-history audit events;
- it does not claim that every underlying document, image, clinical note, result value, billing record, or other designated-record-set item has been included.

Canonical implementation:

- `src/lib/portal/patient-portal-snapshot.ts`
- `src/app/api/portal/records/snapshot/route.ts`
- `src/components/portal/portal-dashboard.tsx`
- `tests/patient-portal-snapshot.test.ts`

This is a useful self-service portability artifact and machine-readable manifest. It is **not** a substitute for a complete records-access / records-transfer workflow.

## Regulatory grounding and boundary

Klinikos does not use this document as a certification or legal conclusion.

The U.S. HHS HIPAA right-of-access guidance states that individuals generally have a right to access PHI about themselves in designated record sets, including medical and billing records and other records used to make decisions about individuals, subject to limited exceptions under 45 CFR 164.524. HHS also states that, when electronic PHI is requested electronically, the requested electronic form and format should be provided when readily producible, or an agreed readable alternative electronic format should be used.

Authoritative references reviewed for this product direction:

- HHS, `Individuals' Right under HIPAA to Access their Health Information 45 CFR § 164.524`
- HHS, `Right to Access and Research` FAQ collection
- 45 CFR § 164.524

Product and legal counsel must review the actual clinic workflow, jurisdiction, patient request mechanics, identity proofing, denials, timing, fees, third-party direction, retention, and delivery methods before Klinikos represents a complete regulated records-access program.

## Non-negotiable laws

1. **PATIENT SELF-ACCESS != NETWORK ACCESS.** A clinic-to-clinic access grant cannot silently become a patient records request or vice versa.
2. **PORTAL SNAPSHOT != COMPLETE RECORD.** Never label the current snapshot as a complete chart, complete designated record set, certified export, CCD/CCDA, FHIR bundle, or interoperability-complete package.
3. **IDENTITY BEFORE EXPORT.** The server derives organization and patient scope from the authenticated portal session. Browser-supplied patient IDs never establish export authority.
4. **RELEASE TRUTH BEFORE PRESENTATION.** The snapshot may include only information already admitted to the patient portal by the governed release path.
5. **NO CACHE BY DEFAULT.** Patient exports are private, no-store responses unless a later approved encrypted storage/download program deliberately changes that behavior.
6. **AUDIT WITHOUT PAYLOAD LEAKAGE.** Record that an export occurred, who initiated it, and the patient/resource identity. Do not copy the exported PHI payload into audit metadata or logs.
7. **NO PHI INFRASTRUCTURE THEATER.** Repository code does not authorize production PHI. The production database, storage, logging, vendor/BAA, access-control, retention, security, and workload posture remain independent gates.
8. **IMPORT IS QUARANTINED UNTIL MATCHED.** Future inbound packages must never auto-merge into a patient chart based only on similar name, date of birth, email, phone, or free-text identity. Deterministic identity evidence plus human review is required where ambiguity exists.
9. **PROVENANCE SURVIVES TRANSFER.** Future imported/exported clinical artifacts must preserve origin, source organization, source identifier where available, timestamps, and transformation history.
10. **AI MAY ASSIST, NEVER AUTHORIZE.** Zumi may explain a request, organize a package, or flag mismatches. AI cannot establish patient identity, legal disclosure authority, release approval, or final patient-record matching.

## Expansion path

### Phase 1 — portal snapshot

Current slice. Gives patients a machine-readable copy of what the portal already exposes, with explicit incompleteness disclosure.

### Phase 2 — complete records-request workflow

Build a separate patient-owned request lifecycle with:

- request scope;
- requested form/format;
- requested date range where applicable;
- patient versus designated recipient;
- delivery preference;
- identity/session evidence;
- staff review queue for records not already self-releasable;
- permitted denial/review state without inventing legal grounds;
- target completion date as workflow state, not a compliance guarantee;
- fulfillment evidence;
- immutable audit trail.

Do not overload the current Network `RecordRequest` model because its semantics are organization-to-organization access.

### Phase 3 — portable package

Once approved PHI storage and complete record-selection rules exist, produce an export package with:

- manifest/version;
- selected source records;
- human-readable representation where applicable;
- structured machine-readable data where readily producible;
- file hashes;
- source/provenance metadata;
- bounded generation timestamp;
- explicit included/excluded scope;
- no hidden internal-only artifacts.

### Phase 4 — patient-directed transfer

Support a patient-directed destination without making email, SMS, or arbitrary third-party upload automatically safe. Delivery mechanisms require their own security, identity, consent/direction, contract, and audit rules.

### Phase 5 — inbound migration and continuity

Create a quarantine/import workspace for people moving from another clinic or system:

`SOURCE PACKAGE → MALWARE / FORMAT CHECK → QUARANTINE → PATIENT MATCH CANDIDATES → DETERMINISTIC IDENTITY EVIDENCE → HUMAN RESOLUTION WHEN AMBIGUOUS → FIELD / DOCUMENT NORMALIZATION → PROVENANCE → CHART IMPORT → AUDIT`

This is the high-value clinic-switching moat: Klinikos should make migration safer and easier without pretending heterogeneous source data is clean or equivalent.

### Phase 6 — standards-based interoperability

FHIR/USCDI/other standardized exchange should be connected when the target customer, certification posture, vendor relationships, and economics justify it. Standards support interoperability; their presence must never be used as a shortcut around identity, authorization, consent, provenance, or production-PHI gates.

## Commercial advantage

Portability should reduce buyer fear rather than create lock-in. A clinic can adopt Klinikos knowing that patient access, migration, provenance, and controlled transfer are designed into the operating system.

The defensible advantage is not trapping data. It is making healthcare data movement **safer, clearer, auditable, and operationally easier** than legacy manual processes while keeping authority with humans and deterministic policy.
