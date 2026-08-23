# SCWDB Record Retention & Auditability Gate

Status: **proposal / implementation gate**. This document does not imply award, contract execution, or that Klinikos has been designated a subrecipient. Final obligations must be reconciled against the executed contract, September 4 addenda, SCWDB instructions, and applicable federal/state requirements.

## Why this gate exists

SCWDB's Record Retention Policy 2026-02, effective March 12, 2026, applies to contractors receiving WIOA funds through SCWDB and establishes minimum requirements for financial, programmatic, statistical, participant, and administrative records.

For the Kentucky AI Workforce Readiness Network, attendance, completion, assessment, certificate, reporting, invoicing, curriculum-version, and delivery records are therefore not ordinary SaaS telemetry. They may become grant-monitoring and audit evidence.

No proposal, platform disclosure, implementation plan, or data-retention statement may be finalized until the requirements below have named owners and verified implementation evidence.

## Baseline policy requirements to design for

### Retention period

SCWDB Policy 2026-02 states that WIOA-program records must be retained for a minimum of **three years from the date the final expenditure report is submitted to the awarding agency**.

If litigation, a claim, audit, monitoring review, or investigation begins before the period expires, relevant records must be retained until the matter is resolved and final action is complete.

**Proposal rule:** do not promise a shorter fixed deletion period for contract records merely because a normal product retention setting is shorter.

### Records likely relevant to Klinikos delivery

At minimum, the final contract/data map must classify:

- participant enrollment / approved registration records;
- verified attendance evidence;
- pre/post knowledge-assessment evidence;
- required activity / applied-practice evidence;
- instructor completion decisions and provenance;
- certificates / completion evidence;
- participant feedback and approved employer-relevance feedback;
- curriculum versions and approval history;
- session schedules and delivery records;
- instructor / facilitator assignment and qualification evidence where required;
- invoices and supporting participant-level completion records;
- contract / subcontractor records maintained by Klinikos where applicable;
- monitoring, corrective-action, and audit-support records generated during performance.

The final proposal must not claim that every item above is currently stored by the product. It must distinguish product-backed evidence, contractor administrative records, and records retained by SCWDB or another system of record.

### Electronic record requirements

Electronic records used for contract evidence must be capable of:

- accurately reflecting the original information;
- retrieval for authorized review and reproduction;
- maintaining integrity and security;
- regular backup appropriate to the record class;
- controlled access;
- preservation during an audit / litigation / monitoring hold;
- secure destruction only after the applicable retention obligation has ended.

### Authorized access

The policy contemplates access for authorized oversight entities, including U.S. Department of Labor, DOL OIG, Kentucky workforce authorities, other federal/state oversight agencies, and independent auditors.

**Architecture rule:** auditability does not mean public visibility or unrestricted administrator access. Any production implementation must provide minimum-necessary, authorized retrieval without widening ordinary participant/instructor permissions.

### PII protection

Records containing participant PII require safeguards against unauthorized access, disclosure, or misuse.

Ordinary EDU exercises remain synthetic-only. Contract administration may still require real participant identity, attendance, completion, and reporting data; those records must remain purpose-limited and isolated from clinical patient records.

## Required proposal disclosure

Before signature, the proposal/platform section must state, using verified facts only:

1. which participant and program records Klinikos proposes to maintain;
2. which records remain in SCWDB or another approved system of record;
3. the proposed retention baseline and how contract/addenda requirements override product defaults;
4. how legal/audit holds prevent premature deletion;
5. how records are retrieved for authorized monitoring/audit;
6. access-control roles for participant, instructor, education admin, contract admin, and authorized audit support;
7. backup / integrity approach for retained electronic evidence;
8. secure-disposal process after retention and hold obligations end;
9. how participant PII is minimized and separated from synthetic EDU exercise data;
10. who owns operational responsibility for records requests and audit response.

## Product / engineering acceptance criteria

Before Klinikos represents the workforce-delivery evidence layer as contract-ready, verify:

- [ ] attendance evidence carries actor, timestamp, session, participant, and verification provenance;
- [ ] completion decisions carry human authority and evidence inputs;
- [ ] scored knowledge evidence preserves attempt/provenance and cannot be rewritten into a different historical result without audit evidence;
- [ ] curriculum versions used for delivery remain identifiable after later curriculum changes;
- [ ] invoice-support exports can be reproduced from authoritative evidence without exposing unrelated participant data;
- [ ] access checks prevent one participant from reading another participant's records;
- [ ] ordinary EDU roles cannot reach clinical patient records;
- [ ] retention configuration cannot silently delete contract evidence before the governing retention date;
- [ ] an audit/monitoring hold can block deletion for affected records;
- [ ] exports / audit retrieval are logged or otherwise attributable where technically appropriate;
- [ ] backups and recovery procedures for contract evidence are defined and tested before production reliance;
- [ ] secure deletion occurs only after retention + hold gates permit it.

Items not currently implemented must remain proposal commitments / implementation work, not be described as live controls.

## Data-minimization rule

Retain evidence required to prove service delivery, completion, reporting, invoicing, auditability, and contract compliance. Do **not** use a three-year retention requirement as permission to retain unrelated participant content, sensitive free text, clinical data, or broad behavioral telemetry.

## Contract reconciliation gate

Before final proposal submission and again before launch, reconcile this document against:

- SCWDB Record Retention Policy 2026-02;
- the September 4, 2026 RFP addenda / Q&A;
- executed contract record-retention and audit clauses;
- applicable Reskill DWG / WIOA / 2 CFR Part 200 requirements;
- SCWDB data dictionary / reporting instructions;
- final participant-data transfer and system-of-record responsibilities.

If the executed contract imposes a longer retention period or different record categories, the contract controls.

## Fail-closed rule

If Klinikos cannot support the required retention, audit retrieval, security, or hold behavior for a record class, do not represent that record class as production-ready inside Klinikos. Use an approved manual/system-of-record fallback until the control is implemented and verified.
